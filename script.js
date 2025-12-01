

// ELEMENTS
const locationButton = document.getElementById("locationButton");
const locationPanel = document.getElementById("locationPanel");
const locationText = document.getElementById("locationText");
const newLocationInput = document.getElementById("newLocation");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const suggestionsContainer = document.getElementById("suggestions");
const recentContainer = document.getElementById("recentLocations");
const overlay = document.getElementById("overlay");
const noDataBox = document.getElementById("noData");

const RECENT_KEY = "recentLocations";


// ------------------------------------------------------
// 🔥 LOAD RECENT LOCATIONS
// ------------------------------------------------------
function loadRecentLocations() {
  const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  recentContainer.innerHTML = "";

  if (recent.length === 0) return;

  const title = document.createElement("p");
  title.className = "font-semibold mb-2 text-orange-600";
  title.innerText = "Recent Locations";
  recentContainer.appendChild(title);

  recent.forEach((loc) => {
    const div = document.createElement("div");
    div.className =
      "px-3 py-2 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 font-semibold";
    div.innerText = loc;
    div.onclick = () => selectLocation(loc);
    recentContainer.appendChild(div);
  });
}


// 🍊 Load Saved Location (FIRST priority)
function loadSavedLocation() {
  const saved = localStorage.getItem("user_location");

  if (saved) {
    locationText.innerText = saved;
    updateRestaurantList(saved);
  }
}

// ------------------------------------------------------
// 🔥 SAVE RECENT LOCATIONS
// ------------------------------------------------------
function addToRecent(location) {
  let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  recent = recent.filter((l) => l !== location);
  recent.unshift(location);
  if (recent.length > 5) recent.pop();
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}


// ------------------------------------------------------
// 🔥 SELECT LOCATION
// ------------------------------------------------------
function selectLocation(loc) {
  const pureLocation = loc.split(",")[0];

  locationText.innerText = pureLocation;
  addToRecent(pureLocation);

  closeLocationPanel();

  updateRestaurantList(pureLocation);
}


function updateRestaurantList(selectedLocation) {
  const restaurants = window.restaurantData || [];

  // Make location clean
  const location = selectedLocation.toLowerCase().trim();

  // Filter restaurants for the exact location
  let filtered = restaurants.filter((r) =>
    r.city.toLowerCase() === location
  );


  // If still no results → show "No service" (except for Koodankulam)
  if (filtered.length === 0 && location !== "koodankulam") {
    noDataBox.innerHTML = `
      <div class="text-center py-4">
        <h2 class="text-lg font-bold">Not Available in ${selectedLocation}</h2>
        <p class="text-sm mt-1">Food Express is coming soon to your area.</p>
        <p class="text-xs text-gray-500 mt-1">Showing restaurants from Koodankulam.</p>
      </div>
    `;

    // Show only Koodankulam restaurants, not all
    filtered = restaurants.filter((r) =>
      r.city.toLowerCase() === "koodankulam"
    );
  } else {
    noDataBox.innerHTML = "";
  }

  renderRestaurants(filtered);
}



// ------------------------------------------------------
// 🔥 LOCATION SEARCH (Nominatim + Recent)
// ------------------------------------------------------
newLocationInput.addEventListener("input", () => {
  const query = newLocationInput.value.trim();
  suggestionsContainer.innerHTML = "";

  if (query.length < 1) return;

  // Show recent matches first
  const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  recent.forEach((loc) => {
    if (loc.toLowerCase().includes(query.toLowerCase())) {
      const div = document.createElement("div");
      div.className =
        "px-3 py-2 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 font-semibold";
      div.innerHTML = loc.replace(
        new RegExp(query, "gi"),
        (m) => `<span class='bg-yellow-200'>${m}</span>`
      );
      div.onclick = () => selectLocation(loc);
      suggestionsContainer.appendChild(div);
    }
  });

  // API search Tamil Nadu places
  fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=10`
  )
    .then((res) => res.json())
    .then((data) => {
      const valid = data.filter((place) => {
        const state = place.address.state || "";
        const type = place.type || "";
        return (
          state.includes("Tamil Nadu") &&
          ["district", "city", "town", "village"].includes(type)
        );
      });

      valid.forEach((place) => {
        const div = document.createElement("div");
        div.className =
          "px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-orange-100 font-medium";
        div.innerHTML = place.display_name.replace(
          new RegExp(query, "gi"),
          (m) => `<span class='bg-yellow-200'>${m}</span>`
        );
        div.onclick = () => selectLocation(place.display_name);
        suggestionsContainer.appendChild(div);
      });

      if (recent.length === 0 && valid.length === 0) {
        const div = document.createElement("div");
        div.className =
          "px-3 py-2 bg-red-50 rounded-lg text-red-600 font-semibold";
        div.innerText = "No results found";
        suggestionsContainer.appendChild(div);
      }
    });
});


// ------------------------------------------------------
// 🔥 CURRENT LOCATION
// ------------------------------------------------------
function detectCurrentLocation() {
  if (!navigator.geolocation) {
    alert("GPS not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
    );

    const data = await res.json();

    document.getElementById("locationText").textContent =
        data.address.village ||
        data.address.town ||
        data.address.city ||
        data.address.county ||
        "Location";
});

}


// 🍊 Update Detected Location
function setDetectedLocation(city, region) {
  let loc = normalizeLocation(city);

  // Outside Tamil Nadu → Force Koodankulam
  if (!region || region !== "Tamil Nadu") {
    loc = "Koodankulam";
  }

  // Save + Show
  localStorage.setItem("user_location", loc);
  locationText.innerText = loc;

  updateRestaurantList(loc);
}



// ------------------------------------------------------
// 🔥 OPEN / CLOSE PANEL
// ------------------------------------------------------
locationButton.addEventListener("click", () => {
  locationPanel.style.transform = "translateX(0%)";
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "auto";
  loadRecentLocations();
});

function closeLocationPanel() {
  locationPanel.style.transform = "translateX(100%)";
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}

currentLocationBtn.addEventListener("click", detectCurrentLocation);


// ------------------------------------------------------
// ⚡ AUTO DETECT LOCATION ON PAGE LOAD (IP + GPS)
// ------------------------------------------------------

// 1) Show saved location immediately
const savedAutoLocation = localStorage.getItem("user_location");
if (savedAutoLocation) {
  locationText.innerText = savedAutoLocation;
} else {
  locationText.innerText = "Detecting...";
}

// 2) Fallback (use if IP/GPS fail or outside Tamil Nadu)
function fallbackToKoodankulam() {
  const fallback = "Koodankulam";
  locationText.innerText = fallback;
  localStorage.setItem("user_location", fallback);
  updateRestaurantList(fallback);
}

// 2) Update location with strict Koodankulam rule
function setDetectedLocation(city, region) {

  // Convert Tamil to English
  const tamilToEnglish = {
    "கூடங்குளம்": "Koodankulam"
  };

  // If city is Tamil → convert
  if (tamilToEnglish[city]) {
    city = tamilToEnglish[city];
  }

  let loc = city || "Koodankulam";

  // If outside Tamil Nadu → fallback
  if (!region || region !== "Tamil Nadu") loc = "Koodankulam";

  // If location is Koodankulam → normal
  if (loc.toLowerCase() === "koodankulam") {
    locationText.innerText = "Koodankulam";   // force English
    localStorage.setItem("user_location", "Koodankulam");
    updateRestaurantList("Koodankulam");
  } else {
    // Any other location → fallback handled by updateRestaurantList()
    locationText.innerText = loc;
    localStorage.setItem("user_location", loc);
    updateRestaurantList(loc);
  }
}


// 3) Detect using IP (super fast)
async function autoDetectIP() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const ipCity = data.city || "";
    const ipRegion = data.region || "";

    // Always pass through strict rule
    setDetectedLocation(ipCity, ipRegion);

  } catch (e) {
    fallbackToKoodankulam();
  }
}


// 3) GPS (0.5–1.5 sec, more accurate)
// 🍊 GPS Auto Detect (Runs on load)
function autoDetectGPS() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ta,en&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
      );
      const data = await res.json();

      const gpsCity =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.display_name;

      const gpsRegion = data.address.state || "";

      setDetectedLocation(gpsCity, gpsRegion);
    },
    () => console.log("GPS blocked"),
    { timeout: 2000 }
  );
}



function tryGPSFirst() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ta,en&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();

          const gpsCity =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.display_name;

          const gpsRegion = data.address.state || "";

          setDetectedLocation(gpsCity, gpsRegion);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      },
      () => {
        resolve(false); // GPS failed/blocked
      },
      {
        enableHighAccuracy: false,
        timeout: 1500,
        maximumAge: 300000,
      }
    );
  });
}

// 🍊 Run on page start
window.onload = () => {
  loadSavedLocation();  // show saved instantly (no Chennai)
  autoDetectGPS();      // then update with real GPS
};



window.addEventListener("load", async () => {
  const saved = localStorage.getItem("user_location");

  if (saved) {
    // Always use saved value unless user manually changes
    locationText.innerText = saved;
    updateRestaurantList(saved);
    return; // IMPORTANT: Stop here! Do NOT auto-detect again
  }

  // If no saved location → Detect
  locationText.innerText = "Detecting…";

  const gpsWorked = await tryGPSFirst();

  if (!gpsWorked) {
    await autoDetectIP();
  }
});







async function detectLocation() {
  try {
    // 1) Try GPS first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          // GPS SUCCESS → Reverse API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ta,en&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();

          const gpsCity =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.display_name;

          const gpsRegion = data.address.state || "";

          setDetectedLocation(gpsCity, gpsRegion);
        },

        // GPS BLOCKED → use IP
        async () => {
          console.log("GPS blocked, using IP");
          await autoDetectIP();
        },

        {
          enableHighAccuracy: false,
          timeout: 1500,
          maximumAge: 300000,
        }
      );
    } else {
      // No GPS on device → fallback to IP
      await autoDetectIP();
    }
  } catch (e) {
    fallbackToKoodankulam();
  }
}








async function detectIP() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const city = data.city || "Koodankulam";
    const region = data.region || "Tamil Nadu";
    setDetectedLocation(city, region);
  } catch {
    fallbackToKoodankulam();
  }
}

function fallbackToKoodankulam() {
  locationText.innerText = "Koodankulam";
  localStorage.setItem("user_location", "Koodankulam");
  updateRestaurantList("Koodankulam");
}



/* -----------------------
   Food Express 🔍 Smart Search Overlay (Zomato/Swiggy style, no recents)
------------------------*/
const searchBox = document.getElementById("searchBox");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");

// Results container
const resultsContainer = document.getElementById("resultsContainer");
resultsContainer.className = "p-4 space-y-2 overflow-y-auto max-h-[80vh]";

// 🍴 Mock dataset (replace with Firestore later)
const data = [
  { name: "Chicken Biryani", category: "Dish", price: 180, img: "https://source.unsplash.com/80x80/?chicken-biryani" },
  { name: "Paneer Butter Masala", category: "Dish", price: 160, img: "https://source.unsplash.com/80x80/?paneer-butter-masala" },
  { name: "Margherita Pizza", category: "Dish", price: 220, img: "https://source.unsplash.com/80x80/?pizza" },
  { name: "Domino’s Pizza", category: "Restaurant", price: 250, img: "https://source.unsplash.com/80x80/?dominos" },
  { name: "Starbucks", category: "Restaurant", price: 150, img: "https://source.unsplash.com/80x80/?coffee-shop" },
  { name: "Burger King", category: "Restaurant", price: 180, img: "https://source.unsplash.com/80x80/?burger" },
  { name: "Idli & Dosa Corner", category: "Restaurant", price: 120, img: "https://source.unsplash.com/80x80/?idli-dosa" },
];


// 🟠 Open overlay
searchBox.addEventListener("focus", openSearchOverlay);
searchBox.addEventListener("click", openSearchOverlay);

function openSearchOverlay() {
  searchOverlay.classList.remove("hidden");
  requestAnimationFrame(() => searchOverlay.classList.remove("translate-y-full"));
  setTimeout(() => searchInput.focus(), 300);
    showTrending(); // show by default
}
searchInput.focus();
  showShimmer(); // show shimmer immediately on open


// 🟠 Close overlay
closeSearch.addEventListener("click", closeSearchOverlay);
function closeSearchOverlay() {
  searchOverlay.classList.add("translate-y-full");
  setTimeout(() => searchOverlay.classList.add("hidden"), 300);
}

// 🟠 Handle input typing
let typingTimeout;

searchInput.addEventListener("input", (e) => {
  const term = e.target.value.trim().toLowerCase();
  clearTimeout(typingTimeout);

  if (term === "") {
    resultsContainer.innerHTML = `<p class="text-gray-400 text-sm text-center py-8">Start typing to search...</p>`;
    return;
  }

  // Show shimmer instantly
  showShimmer();

  // Simulate small network delay
  typingTimeout = setTimeout(() => {
    const results = data.filter((item) => item.name.toLowerCase().includes(term));
    renderResults(results, term);
  }, 600);
});


// 🟠 Render live results (Zomato-style cards)
function renderResults(results, term) {
  fadeOut(resultsContainer, () => {
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <p class="text-gray-400 text-sm text-center py-8">
          No matches for "${term}"
        </p>`;
      return;
    }

    resultsContainer.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 py-4">
        ${results
          .map(
            (r) => `
            <div 
              class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 hover:shadow-md transition cursor-pointer"
              onclick="selectResult('${r.name}')"
            >
              <img src="${r.img}" alt="${r.name}" 
                class="w-16 h-16 rounded-xl object-cover" />
              <div class="flex-1">
                <p class="font-medium text-gray-800">${r.name}</p>
                <p class="text-xs text-gray-500">${r.category}</p>
                <p class="text-orange-500 text-sm font-semibold mt-1">₹${r.price}</p>
              </div>
              <button 
                class="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-orange-600 transition"
                onclick='openFoodSheet(${JSON.stringify(r)})'>
                 Add
              </button>

            </div>
          `
          )
          .join("")}
      </div>`;
  });
}


// =========================
// 🍲 Swiggy/Zomato Bottom Sheet Preview
// =========================
const foodSheet = document.getElementById("foodSheet");
const foodSheetInner = document.getElementById("foodSheetInner");
const foodSheetContent = document.getElementById("foodSheetContent");
let activeItem = null;

window.selectResult = (term) => {
  const item = data.find((d) => d.name === term);
  if (!item) return;
  openFoodSheet(item);
};

// 🟠 Open food bottom sheet
function openFoodSheet(item) {
  activeItem = item;
  const fixedPrice = item.price;
  const rating = (Math.random() * 1.2 + 3.8).toFixed(1);
  const reviews = Math.floor(Math.random() * 600 + 100);

  foodSheetContent.innerHTML = `
    <img src="${item.img}" alt="${item.name}" class="w-28 h-28 mx-auto rounded-2xl object-cover shadow-md" />
    <div>
      <h3 class="text-xl font-semibold text-gray-800">${item.name}</h3>
      <p class="text-sm text-gray-500">${item.category}</p>
      <div class="flex items-center justify-center gap-2 mt-1">
        <span class="text-yellow-500">⭐</span>
        <span class="text-gray-700 font-medium">${rating}</span>
        <span class="text-gray-400 text-sm">(${reviews})</span>
      </div>
        <p class="text-orange-500 font-bold text-lg mt-1">₹${fixedPrice}</p>
    </div>

    <div class="flex items-center justify-center gap-4 mt-4">
      <button id="decQty" class="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-700">−</button>
      <span id="foodQty" class="text-lg font-semibold text-gray-700">1</span>
      <button id="incQty" class="w-9 h-9 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-orange-600">+</button>
    </div>

    <button id="addToCart" class="mt-5 w-full bg-orange-500 text-white font-semibold py-3 rounded-full shadow-md hover:bg-orange-600 transition">Add to Cart</button>
    <button id="viewDetails" class="mt-2 w-full text-orange-500 font-medium hover:text-orange-600">View Details ➜</button>
  `;

  foodSheet.classList.remove("hidden");
  requestAnimationFrame(() => foodSheetInner.classList.remove("translate-y-full"));

  // Quantity logic
  let qty = 1;
  const qtyDisplay = document.getElementById("foodQty");
  document.getElementById("incQty").onclick = () => (qtyDisplay.textContent = ++qty);
  document.getElementById("decQty").onclick = () => {
    if (qty > 1) qtyDisplay.textContent = --qty;
  };

// ✅ Add to cart with animation + global cart update
document.getElementById("addToCart").onclick = () => {
  const price = item.price; // use fixed price
  flyToCart(foodSheetContent.querySelector("img"));
  for (let i = 0; i < qty; i++) {
    handleAddToCart(
      document.getElementById("addToCart"),
      item.name,
      price,
      item.img
    );
  }
  showToast(`${qty} × ${item.name} added to cart 🛒`);
  closeFoodSheet(); // optional: auto-close after adding
};



  // View details
  document.getElementById("viewDetails").onclick = () => {
    closeFoodSheet();
    closeSearchOverlay();
    window.location.href = `/food.html?item=${encodeURIComponent(item.name)}`;
  };
}

// 🟠 Close food sheet
foodSheet.addEventListener("click", (e) => {
  if (e.target === foodSheet) closeFoodSheet();
});
function closeFoodSheet() {
  foodSheetInner.classList.add("translate-y-full");
  setTimeout(() => foodSheet.classList.add("hidden"), 300);
}

// 🟠 Toast
function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className =
    "fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-sm px-4 py-2 rounded-full shadow-lg opacity-0 transition-opacity z-[70]";
  document.body.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = "1"));
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 1800);
}

// 🟠 Fly-to-cart animation
function flyToCart(imgSrc) {
  const cartIcon = document.querySelector("#cartIcon");
  if (!cartIcon) return;
  const img = document.createElement("img");
  img.src = imgSrc;
  img.className = "fly-img";
  document.body.appendChild(img);

  const { left, top } = cartIcon.getBoundingClientRect();
  img.style.cssText = `
    position: fixed; width: 80px; height: 80px; border-radius: 50%;
    object-fit: cover; top: ${window.innerHeight - 200}px; left: 50%;
    transform: translateX(-50%); z-index: 999;
    transition: all 0.8s cubic-bezier(.25,.8,.25,1);
  `;
  requestAnimationFrame(() => {
    img.style.top = `${top + window.scrollY}px`;
    img.style.left = `${left}px`;
    img.style.width = "20px";
    img.style.height = "20px";
    img.style.opacity = "0.2";
  });
  setTimeout(() => img.remove(), 900);
  cartIcon.classList.add("animate-bump");
  setTimeout(() => cartIcon.classList.remove("animate-bump"), 300);
}

// 🟠 Zomato-style food card shimmer
function showShimmer() {
  resultsContainer.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 py-4 shimmer-wrapper opacity-100 transition-opacity duration-300">
      ${Array(6)
        .fill(0)
        .map(
          () => `
          <div class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div class="w-16 h-16 rounded-xl shimmer-box"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-3/4 rounded shimmer-box"></div>
              <div class="h-3 w-1/2 rounded shimmer-box"></div>
              <div class="h-3 w-1/3 rounded shimmer-box"></div>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}



// 🟠 Handle input typing with shimmer + fade transition
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.trim().toLowerCase();

   if (term === "") {
    showTrending(); // show “Trending Near You”
    return;
  }

  // Show shimmer first
  showShimmer();

  // Simulate loading delay for visual effect
  setTimeout(() => {
    const results = data.filter((item) => item.name.toLowerCase().includes(term));
    fadeOut(resultsContainer, () => renderResults(results, term)); // fade out shimmer → show results
  }, 600);
});

// 🟠 Smooth fade-out before showing results
function fadeOut(element, callback) {
  element.style.opacity = "1";
  element.style.transition = "opacity 0.25s ease";
  element.style.opacity = "0";

  setTimeout(() => {
    callback();
    fadeIn(element);
  }, 250);
}

// 🟠 Smooth fade-in for new results
function fadeIn(element) {
  element.style.opacity = "0";
  requestAnimationFrame(() => {
    element.style.transition = "opacity 0.3s ease";
    element.style.opacity = "1";
  });
}













// ------------------------------------------------------
// 🌟 SAMPLE RESTAURANT DATA FOR KOODANKULAM
// ------------------------------------------------------
window.restaurantData = [
  {
    id: 1,
    name: "Koodankulam Tiffin Center",
    city: "Koodankulam",
    cuisine: "South Indian",
    rating: 4.5,
    deliveryTime: "30-40 mins",
  },
  {
    id: 2,
    name: "Seaside Veg Restaurant",
    city: "Koodankulam",
    cuisine: "Vegetarian",
    rating: 4.2,
    deliveryTime: "25-35 mins",
  },
  {
    id: 3,
    name: "Spice Villa",
    city: "Koodankulam",
    cuisine: "Indian, Chinese",
    rating: 4.7,
    deliveryTime: "35-45 mins",
  },
  {
    id: 4,
    name: "Ocean Breeze Cafe",
    city: "Koodankulam",
    cuisine: "Cafe, Beverages",
    rating: 4.3,
    deliveryTime: "20-30 mins",
  },
  {
    id: 5,
    name: "Coastal Biryani House",
    city: "Koodankulam",
    cuisine: "Biryani, North Indian",
    rating: 4.6,
    deliveryTime: "40-50 mins",
  },
];

// ------------------------------------------------------
// 🌟 RENDER FUNCTION
// ------------------------------------------------------
function renderRestaurants(restaurants) {
  const container = document.getElementById("restaurantList");
  if (!container) return;

  container.innerHTML = "";

  restaurants.forEach((r) => {
    const div = document.createElement("div");
    div.className =
      "p-4 mb-3 bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer";
    div.innerHTML = `
      <h3 class="font-bold text-lg">${r.name}</h3>
      <p class="text-sm text-gray-500">${r.cuisine}</p>
      <p class="text-sm text-gray-500">Rating: ${r.rating} ⭐</p>
      <p class="text-sm text-gray-500">Delivery: ${r.deliveryTime}</p>
    `;
    container.appendChild(div);
  });
}


