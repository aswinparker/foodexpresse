const TN_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivagangai", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar"
];
/* location.js — final optimized version (NO duplicate back event, smooth animations) */

const panel = document.getElementById("locationPanel");
const overlay = document.getElementById("panelOverlay");
const backBtn = document.getElementById("backBtn");
const locInput = document.getElementById("locInput");
const suggestionsBox = document.getElementById("suggestionsBox");
const detectBtn = document.getElementById("detectLocationBtn");
const recentListEl = document.getElementById("recentList");
const searchBox = document.querySelector('.search-box');

/* ================================
   PANEL ENTER / LEAVE ANIMATION
================================ */
function setEnter() {
  panel.classList.remove("leave");
  void panel.offsetWidth;     // restart animation
  panel.classList.add("enter");
  overlay.classList.add("active");
}

function setLeave() {
  panel.classList.remove("enter");
  panel.classList.add("leave");
  overlay.classList.remove("active");
}

/* ================================
   SHIMMER SKELETON
================================ */
function showSkeleton() {
  suggestionsBox.innerHTML = `
    <div class="skeleton-wrap">
      <div class="skel-row"><div class="skel-avatar shimmer"></div><div class="skel-lines">
        <div class="shimmer"></div><div class="shimmer short"></div>
      </div></div>
      <div class="skel-row"><div class="skel-avatar shimmer"></div><div class="skel-lines">
        <div class="shimmer"></div><div class="shimmer short"></div>
      </div></div>
    </div>
  `;
}
/* ================================
   OPEN PANEL — SHOW SHIMMER PLACEHOLDER
================================ */
window.addEventListener("message", (e) => {
  if (e.data === "openPanel") {
    setEnter();

    // shimmer-style placeholder message
    suggestionsBox.innerHTML = `
      <div class="placeholder-shimmer">
        <div class="shimmer-line"></div>
        <div class="shimmer-line short"></div>
      </div>
    `;
  }

  if (e.data === "closePanel") setLeave();
});





/* ============== SELECT LOCATION ============== */
function selectLocation(name) {
  localStorage.setItem("userLocation", name);

  // Save to RECENT
  let recent = JSON.parse(localStorage.getItem("recentLocations") || "[]");
  recent = [name, ...recent.filter(x => x !== name)].slice(0, 6);
  localStorage.setItem("recentLocations", JSON.stringify(recent));

  parent.postMessage("closeLocationPanel", "*");
}


/* ================================
   BACK BUTTON (NO DUPLICATE)
   → ALWAYS REDIRECT TO index.html
================================ */
backBtn.addEventListener("click", () => {
  parent.postMessage("closeLocationPanel", "*");
  parent.postMessage("redirectToHome", "*");
  setLeave();
});



/* ================================
   OVERLAY CLOSE
================================ */
overlay.addEventListener("click", () => {
  parent.postMessage("closeLocationPanel", "*");
  setLeave();
});

/* ================================
   PANEL cleanup after animation
================================ */
panel.addEventListener("animationend", (e) => {
  if (e.animationName === "panelOut") {
    panel.classList.remove("leave");
  }
});

/* ============== SEARCH ONLY TN DISTRICTS (LIMIT 5) ============== */
locInput.addEventListener("input", () => {
  const q = locInput.value.trim().toLowerCase();
  suggestionsBox.innerHTML = "";
  if (!q) return;

  showSkeleton();

  setTimeout(() => {
    suggestionsBox.innerHTML = "";

    const filtered = TN_DISTRICTS.filter(d =>
      d.toLowerCase().includes(q)
    ).slice(0, 5); // only show max 5 matches

    if (!filtered.length) {
      suggestionsBox.innerHTML = `<div class="no-results">No matching districts</div>`;
      return;
    }

    filtered.forEach(dist => {
      const li = document.createElement("li");
      li.textContent = dist;
      li.onclick = () => selectLocation(dist);
      suggestionsBox.appendChild(li);
    });
  }, 450);
});


/* ================================
   RECENT LOCATIONS
================================ */
function loadRecent() {
  const arr = JSON.parse(localStorage.getItem("recentLocations") || "[]");
  recentListEl.innerHTML = "";

  if (!arr.length) {
    recentListEl.innerHTML = `<div class="recent-empty">No recent locations</div>`;
    return;
  }

  arr.forEach(loc => {
    const div = document.createElement("div");
    div.className = "recent-item";
    div.textContent = loc;
    div.onclick = () => selectLocation(loc);
    recentListEl.appendChild(div);
  });
}
loadRecent();


/* ============== SEARCH ONLY TN DISTRICTS (LIMIT 5) ============== */
locInput.addEventListener("input", () => {
  const q = locInput.value.trim().toLowerCase();
  suggestionsBox.innerHTML = "";
  if (!q) return;

  showSkeleton();

  setTimeout(() => {
    suggestionsBox.innerHTML = "";

    const filtered = TN_DISTRICTS.filter(d =>
      d.toLowerCase().includes(q)
    ).slice(0, 5); // show only first 5 matches

    if (!filtered.length) {
      suggestionsBox.innerHTML = `<div class="no-results">No matching districts</div>`;
      return;
    }

    filtered.forEach(dist => {
      const li = document.createElement("li");
      li.textContent = dist;
      li.onclick = () => selectLocation(dist);
      suggestionsBox.appendChild(li);
    });
  }, 450);
});



/* ================================
   DETECT LOCATION BUTTON — WORLDWIDE + SHIMMER + REDIRECT
================================ */
detectBtn.addEventListener("click", () => {
  const currentText = document.getElementById("currentLocationText");

  // Show shimmer while detecting
  currentText.innerHTML = `<span class="shimmer shimmer-text" style="display:inline-block;width:80px;height:16px;"></span>`;

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    currentText.innerText = "";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;

      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(r => r.json())
        .then(data => {
          const detected = data.address?.city ||
                           data.address?.town ||
                           data.address?.village ||
                           data.address?.county ||
                           data.address?.state ||
                           "Unknown";

          currentText.innerText = detected;
          localStorage.setItem("userLocation", detected);

          // Update recent locations
          let recent = JSON.parse(localStorage.getItem("recentLocations") || "[]");
          recent = [detected, ...recent.filter(x => x !== detected)].slice(0, 6);
          localStorage.setItem("recentLocations", JSON.stringify(recent));
          loadRecent();

          // Optional: send message to parent iframe (if using iframe)
          parent.postMessage({ action: "updateTopLocation", location: detected }, "*");

          // Close panel
          setLeave();

          // Redirect to index.html after short delay to allow animation
          setTimeout(() => {
            window.location.href = "index.html";
          }, 300); // 300ms delay for smooth exit animation
        })
        .catch(() => {
          currentText.innerText = "";
          alert("Failed to detect location");
        });
    },
    () => {
      alert("Location permission denied");
      currentText.innerText = "";
    }
  );
});



