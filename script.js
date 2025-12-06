const panel = document.getElementById("locationPanel");
const overlay = document.getElementById("overlay");
const locationButton = document.getElementById("locationButton");

// OPEN PANEL
locationButton.addEventListener("click", () => {
  panel.style.transform = "translateX(0%)";
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "auto";

  // Swiggy freeze background scroll
  document.body.style.overflow = "hidden";
});

// CLOSE PANEL FROM OVERLAY TAP
overlay.addEventListener("click", () => {
  closeLocationPanel();
});

function closeLocationPanel() {
  panel.style.transform = "translateX(100%)";
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";

  // Unfreeze body scroll
  document.body.style.overflow = "auto";
}


// AUTO-DETECT LOCATION
window.onload = () => {
  const saved = localStorage.getItem("userLocation");
  if (saved) {
    document.getElementById("locationText").innerText = saved;
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, setDefault);
  } else {
    setDefault();
  }
};

function setDefault() {
  document.getElementById("locationText").innerText = "Select Location";
}

// Reverse Geo Lookup using OpenStreetMap
function showPosition(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    .then(res => res.json())
    .then(data => {
      const place =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.state ||
        "Select Location";

      document.getElementById("locationText").innerText = place;
      localStorage.setItem("userLocation", place);
    })
    .catch(() => setDefault());
}

// Listen for iframe message to hide overlay
window.addEventListener("message", (e) => {
  if (e.data === "closeLocationPanel") {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  }
});

