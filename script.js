let allCars = [];

document.addEventListener("DOMContentLoaded", async () => {
  await getUserProfile();

  const page = detectPage();

  if (page === "index") await initIndexPage();

  if (page === "filter") await initFilterPage();
  if (page === "account") initAccountPage();
  if (page === "carpage") await getCarDetails();
  if (page === "addcar") initAddCarForm();

  attachAccountLinks();
});

function detectPage() {
  if (document.getElementById("car-cont")) return "index";
  if (document.getElementById("carsContainer")) return "filter";
  if (document.getElementById("accountContent")) return "account";
  if (document.getElementById("car-details-container")) return "carpage";
  if (document.getElementById("carForm")) return "addcar";
  return "other";
}

async function initIndexPage() {
  const cars = await fetchAllCars();
  if (cars) createCarCards(cars);
}

async function fetchAllCars() {
  try {
    const res = await fetch("https://rentcar.stepprojects.ge/api/Car");
    return await res.json();
  } catch (e) {
    console.error("fetchAllCars:", e);
  }
}

function createCarCards(cars) {
  const container = document.getElementById("car-cont");
  if (!container) return;
  container.innerHTML = "";

  cars.forEach((car) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = carCardHTML(car);
    container.appendChild(card);
  });
}

function carCardHTML(car) {
  return `
    <div class="car-card">
        <div class="car-card-header">
            <div class="car-card-title">
                <h3>${car.brand}</h3>
                <p>${car.model} / ${car.year}</p>
            </div>
            <i class="fa-solid fa-heart heart-btn" onclick="toggleFavorite(${car.id}, this)"></i>
        </div>
        <div class="img-cont">
            <img src="${car.imageUrl1 || "https://placehold.co/300x200?text=No+Image"}"
                 alt="${car.model}" class="car-img">
        </div>
        <div class="car-card-specs">
            <div class="spec-item"><span>⛽ ${car.fuelCapacity}L</span></div>
            <div class="spec-item"><span>⚙️ ${car.transmission}</span></div>
            <div class="spec-item"><span>👥 ${car.capacity} ადგილი</span></div>
        </div>
        <div class="car-card-footer">
            <div class="price-box">
                <span class="price-val">₾${car.price}/</span>
                <span class="price-unit">დღეში</span>
            </div>
            <button class="btn-rent" onclick="window.location.href='carpage.html?id=${car.id}'">
                იქირავე
            </button>
        </div>
    </div>`;
}

//  FILTER PAGE

async function initFilterPage() {
  try {
    const res = await fetch("https://rentcar.stepprojects.ge/api/Car");
    allCars = await res.json();
  } catch (e) {
    console.error("initFilterPage fetch:", e);
    allCars = [];
  }

  renderFilterCards(getRandomCars(allCars, 200));

  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) filterBtn.addEventListener("click", applyFilter);
}

function applyFilter() {
  const search = (document.getElementById("searchInput")?.value || "")
    .trim()
    .toLowerCase();
  const city = (document.getElementById("city")?.value || "")
    .trim()
    .toLowerCase();
  const minPrice = parseFloat(document.getElementById("minPrice")?.value) || 0;
  const maxPrice =
    parseFloat(document.getElementById("maxPrice")?.value) || Infinity;
  const capacity =
    document.querySelector("input[name='capacity']:checked")?.value || "";

  const filtered = allCars.filter((car) => {
    const ms =
      !search ||
      (car.brand || "").toLowerCase().includes(search) ||
      (car.model || "").toLowerCase().includes(search);
    const mc = !city || (car.city || "").toLowerCase().includes(city);
    const mn = car.price >= minPrice;
    const mx = car.price <= maxPrice;
    const mk = !capacity || car.capacity == capacity;
    return ms && mc && mn && mx && mk;
  });

  renderFilterCards(filtered);
}

function renderFilterCards(cars) {
  const container = document.getElementById("carsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!cars.length) {
    container.innerHTML = "<p>მანქანები ვერ მოიძებნა</p>";
    return;
  }

  cars.forEach((car) => {
    const img =
      car.imageUrl1 &&
      (car.imageUrl1.startsWith("http") || car.imageUrl1.startsWith("data:"))
        ? car.imageUrl1
        : "https://placehold.co/300x200?text=No+Image";

    container.innerHTML += `
        <div class="car-card">
            <div class="car-card-header">
                <h3>${car.brand || "Unknown"} ${car.model || ""}</h3>
                <p>${car.year || ""}</p>
            </div>
            <img src="${img}" class="car-img">
            <div class="car-card-specs">
                <span>⛽ ${car.fuelCapacity || 0}L</span>
                <span>⚙️ ${car.transmission || "N/A"}</span>
                <span>👥 ${car.capacity || 0} ადგილი</span>
            </div>
            <div class="car-card-footer">
                <p class="price">${car.price || 0}₾ / დღეში</p>
                <button class="btn-rent"
                    onclick="window.location.href='carpage.html?id=${car.id}'">
                    იქირავე
                </button>
            </div>
        </div>`;
  });
}

function getRandomCars(array, count) {
  return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
}

function initAccountPage() {
  getUserProfile();
  attachAccountLinks();
}

function attachAccountLinks() {
  const favLink = document.getElementById("favoriteCarsLink");
  const rentedLink = document.getElementById("rentedCarsLink");
  const myAdsLink = document.getElementById("myAdsLink");

  if (favLink)
    favLink.addEventListener("click", (e) => {
      e.preventDefault();
      getFavoriteCars();
    });
  if (rentedLink)
    rentedLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadRentedCars();
    });
  if (myAdsLink)
    myAdsLink.addEventListener("click", (e) => {
      e.preventDefault();
      getMyCars();
    });
}

// Favorite
async function getFavoriteCars() {
  const token = localStorage.getItem("token");
  const phoneNumber = localStorage.getItem("phoneNumber");
  const container = document.getElementById("accountContent");
  if (!token || !phoneNumber || !container) return;

  container.innerHTML = "<p>იტვირთება...</p>";

  try {
    const res = await fetch(
      `https://rentcar.stepprojects.ge/api/Users/${phoneNumber}/favorite-cars`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error("favorites fetch failed: " + res.status);
    const favorites = await res.json();
    renderFavorites(favorites, container);
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>შეცდომა საყვარელი მანქანების ჩატვირთვისას</p>";
  }
}

function renderFavorites(favorites, container) {
  container.innerHTML = "<h3>თქვენი რჩეული მანქანები</h3>";

  if (!favorites?.length) {
    container.innerHTML += "<p>თქვენ არ გაქვთ რჩეული მანქანები</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "cars-grid";

  favorites.forEach((car) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = carCardHTML(car);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

async function toggleFavorite(carId, iconElement) {
  const token = localStorage.getItem("token");
  const phoneNumber = localStorage.getItem("phoneNumber");

  if (!token || !phoneNumber) {
    alert("გთხოვთ გაიაროთ ავტორიზაცია");
    return;
  }

  try {
    const res = await fetch(
      `https://rentcar.stepprojects.ge/api/Users/${phoneNumber}/favorites/${carId}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return;

    iconElement.classList.toggle("active");

    if (document.getElementById("accountContent")) {
      if (!iconElement.classList.contains("active")) {
        const card = iconElement.closest(".card");
        if (card) {
          card.style.transition = "0.3s";
          card.style.opacity = "0";
          card.style.transform = "scale(0.8)";
          setTimeout(() => card.remove(), 300);
        }
      }
    } else {
      iconElement.style.color = iconElement.classList.contains("active")
        ? "red"
        : "gray";
    }
  } catch (e) {
    console.error(e);
  }
}

// Rented Cars
async function loadRentedCars() {
  const container = document.getElementById("accountContent");
  const rentedCars = JSON.parse(localStorage.getItem("rentedCars") || "[]");

  if (!container) return;

  if (!rentedCars.length) {
    container.innerHTML = "<h3>ნაქირავები მანქანები არ არის</h3>";
    return;
  }

  container.innerHTML = "<h2>ნაქირავები მანქანები</h2>";

  for (const rented of rentedCars) {
    try {
      const res = await fetch(
        `https://rentcar.stepprojects.ge/api/Car/${rented.id}`,
      );
      const car = await res.json();
      container.innerHTML += `
            <div class="rented-car-card">
                <img src="${car.imageUrl1 || ""}">
                <div class="car-info">
                    <h3>${car.brand} ${car.model}</h3>
                    <p>დღეები: ${rented.days}</p>
                    <p>ფასი დღეში: ₾${car.price}</p>
                    <p class="total-price">ჯამი: ₾${car.price * rented.days}</p>
                </div>
            </div>`;
    } catch (e) {
      console.error("rented car load error:", e);
    }
  }
}

async function getMyCars() {
  const phoneNumber = localStorage.getItem("phoneNumber");
  const container = document.getElementById("accountContent");
  if (!phoneNumber || !container) return;

  const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
  const myCars = localCars.filter(
    (car) => car.ownerPhoneNumber === phoneNumber,
  );

  container.innerHTML = "<h2>თქვენი განთავსებები</h2>";

  if (!myCars.length) {
    container.innerHTML += "<p>განთავსებები არ არის</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "cars-grid";

  myCars.forEach((car) => {
    grid.innerHTML += `
        <div class="rented-car-card">
            <img src="${car.imageUrl1}" alt="car">
            <div class="car-info">
                <h3>${car.brand} ${car.model}</h3>
                <p>ფასი: ₾${car.price}</p>
                <p>ლოკაცია: ${car.city || "თბილისი"}</p>
                <button onclick="deleteLocalCar('${car.id}')" 
                        style="background:red;color:white;border:none;padding:5px 10px;cursor:pointer;border-radius:4px">
                    წაშლა
                </button>
            </div>
        </div>`;
  });

  container.appendChild(grid);
}

function deleteLocalCar(id) {
  const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
  const updated = localCars.filter((car) => car.id !== id);
  localStorage.setItem("localCars", JSON.stringify(updated));
  getMyCars();
}

//  CAR DETAIL PAGE

async function getCarDetails() {
  const container = document.getElementById("car-details-container");
  if (!container) return;

  const carId = new URLSearchParams(window.location.search).get("id");
  if (!carId) {
    window.location.href = "index.html";
    return;
  }

  if (String(carId).startsWith("local_")) {
    const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
    const car = localCars.find((c) => String(c.id) === String(carId));

    if (car) {
      renderCarFullInfo(car);
    } else {
      container.innerHTML = "<h2>მანქანა ვერ მოიძებნა</h2>";
    }
    return;
  }

  try {
    const res = await fetch(`https://rentcar.stepprojects.ge/api/Car/${carId}`);
    if (!res.ok) throw new Error("not found");
    renderCarFullInfo(await res.json());
  } catch (e) {
    container.innerHTML = "<h2>მანქანა ვერ მოიძებნა</h2>";
  }
}

function renderCarFullInfo(car) {
  const container = document.getElementById("car-details-container");
  if (!container) return;

  const images = [car.imageUrl1, car.imageUrl2, car.imageUrl3].filter(
    (u) => u && u.length > 5,
  );

  container.innerHTML = `
    <div class="details-grid">
        <div class="details-images">
            <div class="main-img-cont">
                <img src="${images[0]}" id="current-main-img" alt="${car.model}">
            </div>
            <div class="thumbnails-cont">
                ${images
                  .map(
                    (img, i) => `
                    <div class="thumb-item ${i === 0 ? "active" : ""}"
                         onclick="window.changeImg('${img}', this)">
                        <img src="${img}" alt="car ${i}">
                    </div>`,
                  )
                  .join("")}
            </div>
        </div>
        <div class="details-info">
            <div class="title-location">
                <h1>${car.brand} ${car.model}</h1>
                <p class="location-text">
                    <i class="fa-solid fa-location-dot"></i> ${car.city || "Tbilisi"}
                </p>
            </div>
            <p class="car-desc">${car.description || "ინფორმაცია არ არის მოცემული"}</p>
            <div class="specs-grid">
                <div class="spec-item"><span>⚙️ გადაცემა:</span> <strong>${car.transmission}</strong></div>
                <div class="spec-item"><span>👥 ტევადობა:</span> <strong>${car.capacity} ადგილი</strong></div>
                <div class="spec-item"><span>⛽ ავზი:</span> <strong>${car.fuelCapacity}L</strong></div>
            </div>
            <div class="booking-card">
                <label>ქირაობის დღეები</label>
                <input type="number" id="rentDays" min="1" max="30" value="1"
                       oninput="window.updatePrice(${car.price})">
                <div class="total-section">
                    <div class="price-info">
                        <span>ჯამური ფასი:</span>
                        <div class="final-price">₾<span id="totalPrice">${car.price}</span></div>
                    </div>
                    <button class="btn-confirm" onclick="window.bookCar('${car.id}')">
                        დაჯავშნა
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="map-section">
        <h3>მდებარეობა რუკაზე</h3>
        <div id="carMap"></div>
    </div>`;

  initMap(car.latitude, car.longitude);
}

function initMap(lat, lng) {
  if (typeof L === "undefined") return;
  const map = L.map("carMap").setView([lat || 41.7151, lng || 44.8271], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  L.marker([lat || 41.7151, lng || 44.8271])
    .addTo(map)
    .bindPopup("მანქანა იმყოფება აქ")
    .openPopup();
}

window.changeImg = (url, el) => {
  document.getElementById("current-main-img").src = url;
  document
    .querySelectorAll(".thumb-item")
    .forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
};

window.updatePrice = (price) => {
  const days = document.getElementById("rentDays")?.value || 1;
  const el = document.getElementById("totalPrice");
  if (el) el.innerText = days * price;
};

window.bookCar = (id) => {
  const phoneNumber = localStorage.getItem("phoneNumber");

  if (String(id).startsWith("local_")) {
    const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
    const car = localCars.find((c) => String(c.id) === String(id));
    if (car && car.ownerPhoneNumber === phoneNumber) {
      alert("თქვენ ვერ დაიქირავებთ საკუთარ მანქანას!");
      return;
    }
  }

  const days = parseInt(document.getElementById("rentDays")?.value) || 1;
  const rentedCars = JSON.parse(localStorage.getItem("rentedCars") || "[]");

  if (rentedCars.some((c) => c.id === id)) {
    alert("ეს მანქანა უკვე დაქირავებულია!");
    return;
  }

  rentedCars.push({ id, days });

  localStorage.setItem("rentedCars", JSON.stringify(rentedCars));
  addNotification(`🚗 თქვენ დაიქირავეთ მანქანა ${days} დღით`);
  window.location.href = "rent-page.html";
  alert("მანქანა წარმატებით დაემატა ნაქირავებში!");
};

//  ADD CAR PAGE

function initAddCarForm() {
  const form = document.getElementById("carForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const phoneNumber = localStorage.getItem("phoneNumber");

    const file1 = document.getElementById("file1")?.files[0];
    const file2 = document.getElementById("file2")?.files[0];
    const file3 = document.getElementById("file3")?.files[0];

    async function compressImage(file, quality = 0.4, maxWidth = 600) {
      if (!file) return "";
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            canvas
              .getContext("2d")
              .drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    const [img1, img2, img3] = await Promise.all([
      compressImage(file1),
      compressImage(file2),
      compressImage(file3),
    ]);

    const newCar = {
      id: "local_" + Date.now(),
      brand: document.getElementById("brand").value.trim(),
      model: document.getElementById("model").value.trim(),
      year: parseInt(document.getElementById("year").value) || 0,
      price: parseFloat(document.getElementById("price").value) || 0,
      capacity: parseInt(document.getElementById("capacity").value) || 0,
      fuelCapacity: parseInt(document.getElementById("fuel").value) || 0,
      transmission: document.getElementById("transmission").value,
      city: document.getElementById("city").value.trim(),
      imageUrl1: img1 || "https://placehold.co/800x500?text=No+Image",
      imageUrl2: img2 || "",
      imageUrl3: img3 || "",
      ownerPhoneNumber: phoneNumber,
    };

    try {
      const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
      localCars.push(newCar);
      localStorage.setItem("localCars", JSON.stringify(localCars));
      addNotification(`✅ თქვენი მანქანა წარმატებით განთავსდა`);
      alert("მანქანა წარმატებით დაემატა!");
      window.location.href = "index.html";
    } catch (err) {
      if (err.name === "QuotaExceededError") {
        localStorage.removeItem("localCars");
        const localCars = [];
        localCars.push(newCar);
        localStorage.setItem("localCars", JSON.stringify(localCars));
        alert("მანქანა დაემატა! (ძველი მანქანები წაიშალა მეხსიერების გამო)");
        window.location.href = "index.html";
      }
    }
  });
}

async function initIndexPage() {
  const serverCars = (await fetchAllCars()) || [];
  const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
  const fakeCars = generateRandomCars(30);

  createCarCards([...serverCars, ...localCars, ...fakeCars]);
}

async function initFilterPage() {
  try {
    const res = await fetch("https://rentcar.stepprojects.ge/api/Car");
    const serverCars = await res.json();
    const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
    const fakeCars = generateRandomCars(50);

    allCars = [...serverCars, ...localCars, ...fakeCars];
  } catch (e) {
    const localCars = JSON.parse(localStorage.getItem("localCars") || "[]");
    const fakeCars = generateRandomCars(50);
    allCars = [...localCars, ...fakeCars];
  }

  renderFilterCards(allCars);

  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) filterBtn.addEventListener("click", applyFilter);
}

//  REGISTRATION

const regBtn = document.getElementById("register");
const loginBtn = document.querySelector(".login-link");

if (regBtn)
  regBtn.addEventListener(
    "click",
    () => (window.location.href = "registration.html"),
  );
if (loginBtn)
  loginBtn.addEventListener(
    "click",
    () => (window.location.href = "login.html"),
  );

const registerForm = document.getElementById("registrationForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(registerForm);
    await sendInfo({
      phoneNumber: fd.get("phoneNumber"),
      password: fd.get("password"),
      email: fd.get("email"),
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      role: "user",
    });
  });
}

async function sendInfo(data) {
  try {
    const res = await fetch(
      "https://rentcar.stepprojects.ge/api/Users/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    const result = await res.json();

    if (res.ok) {
      alert("რეგისტრაცია წარმატებით დასრულდა!");
      window.location.href = "login.html";
    } else {
      alert("შეცდომა: " + (result.message || "სცადეთ თავიდან"));
    }

    return result;
  } catch (e) {
    console.error(e);
  }
}

//  LOGIN

const signForm = document.getElementById("loginForm");
if (signForm) {
  signForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(signForm);
    await loginInfo({
      phoneNumber: fd.get("phoneNumber"),
      password: fd.get("password"),
    });
  });
}

async function loginInfo(loginData) {
  try {
    const res = await fetch("https://rentcar.stepprojects.ge/api/Users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(loginData),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("phoneNumber", data.phoneNumber);
      localStorage.setItem("userId", data.id);
      window.location.href = "index.html";
    }
    return data;
  } catch (e) {
    console.error(e);
  }
}

//  USER PROFILE
async function getUserProfile() {
  const token = localStorage.getItem("token");
  const phoneNumber = localStorage.getItem("phoneNumber");
  if (!token || !phoneNumber) return;

  try {
    const res = await fetch(
      `https://rentcar.stepprojects.ge/api/Users/${phoneNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return;
    const user = await res.json();

    if (regBtn) regBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "none";

    const authBlock = document.getElementById("authBlock");
    if (authBlock) {
      authBlock.innerHTML = `
<div class="user-profile">
    <i class="fa-solid fa-circle-plus" style="cursor:pointer"
       onclick="window.location.href='add-car.html'"></i>
    <span style="position:relative;cursor:pointer;" id="bellBtn">
        <i class="fa-solid fa-bell"></i>
    </span>
    <i class="fa-solid fa-gear" style="cursor:pointer"
       onclick="window.location.href='account.html'"></i>
    <button class="logout-btn">გამოსვლა</button>
</div>

<div id="messagesPanel">
    <div style="padding:16px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:bold;font-size:16px;">შეტყობინებები</span>
        <span onclick="clearNotifications()" 
              style="font-size:12px;color:gray;cursor:pointer;">წაშლა ყველა</span>
    </div>
    <div id="messagesList" style="max-height:400px;overflow-y:auto;"></div>
</div>`;

      document
        .getElementById("bellBtn")
        .addEventListener("click", toggleMessages);
      updateBellBadge();

      document.querySelector(".logout-btn").addEventListener("click", () => {
        logOut();
        window.location.href = "index.html";
      });
    }

    const initialsEl = document.getElementById("initials");
    if (initialsEl)
      initialsEl.textContent = user.firstName[0] + user.lastName[0];

    const fullNameEl = document.getElementById("fullName");
    if (fullNameEl)
      fullNameEl.textContent = `${user.firstName} ${user.lastName}`;
  } catch (e) {
    console.error("getUserProfile:", e);
  }
}

function logOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("phoneNumber");
  localStorage.removeItem("userId");
}

//MODEL DROPDOWN

const MODELS = {
  Lamborghini: ["Aventador", "Huracán", "Urus", "Sian", "Sian FKP 37"],
  Ferrari: ["488", "F8", "Roma", "Portofino", "SF90"],
  Porsche: ["911", "Cayenne", "Panamera", "Taycan", "Macan"],
  Mercedes: ["w211", "w212", "w213", "w214", "w215", "CLS"],
  BMW: ["e39", "e46", "f30", "f32", "m8", "m3", "m4"],
};

window.updateModels = () => {
  const brand = document.getElementById("brand")?.value;
  const modelSel = document.getElementById("model");
  if (!modelSel) return;

  modelSel.innerHTML =
    '<option value="" disabled selected>აირჩიეთ მოდელი</option>';
  (MODELS[brand] || []).forEach((m) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = m;
    modelSel.appendChild(opt);
  });
};

//random cars

function generateRandomCars(count = 50) {
  const brands = {
    Toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prius"],
    BMW: ["X5", "X6", "M3", "M5", "7 Series"],
    Mercedes: ["C-Class", "E-Class", "S-Class", "GLE", "AMG GT", "w211"],
    Audi: ["A4", "A6", "Q5", "Q7", "R8"],
    Hyundai: ["Tucson", "Santa Fe", "Sonata", "Elantra", "Kona"],
    Kia: ["Sportage", "Sorento", "Stinger", "Telluride", "K5"],
    Ford: ["Mustang", "F-150", "Explorer", "Focus", "Bronco"],
    Chevrolet: ["Camaro", "Corvette", "Tahoe", "Silverado", "Malibu"],
    Nissan: ["GTR", "Patrol", "Qashqai", "X-Trail", "Juke"],
    Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg", "Polo"],
    Lamborghini: ["Aventador", "Huracán", "Urus"],
    Ferrari: ["488", "F8", "Roma", "Portofino", "SF90"],
    Porsche: ["911", "Cayenne", "Panamera", "Taycan", "Macan"],
  };

  const transmissions = ["Automatic", "Manual"];
  const cities = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი"];
  const images = [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=600",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=600",
    "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=600",
    "https://images.unsplash.com/photo-1536700503658-1da2a4d00787?w=600",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600",
  ];

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const brandKeys = Object.keys(brands);

  const cars = [];

  for (let i = 0; i < count; i++) {
    const brand = pick(brandKeys);
    const model = pick(brands[brand]);

    cars.push({
      id: "fake_" + Date.now() + "_" + i,
      brand,
      model,
      year: rand(2015, 2024),
      price: rand(50, 500),
      capacity: pick([2, 4, 5, 7]),
      fuelCapacity: pick([40, 50, 60, 70, 80]),
      transmission: pick(transmissions),
      city: pick(cities),
      imageUrl1: pick(images),
      imageUrl2: "",
      imageUrl3: "",
      ownerPhoneNumber: "system",
    });
  }

  return cars;
}

//მესიჯები
function addNotification(message) {
  const notifications = JSON.parse(
    localStorage.getItem("notifications") || "[]",
  );
  notifications.unshift({
    id: Date.now(),
    message,
    read: false,
    time: new Date().toLocaleString("ka-GE"),
  });
  localStorage.setItem("notifications", JSON.stringify(notifications));
  updateBellBadge();
}
function updateBellBadge() {
  const bell = document.getElementById("bellBtn");
  const notifications = JSON.parse(
    localStorage.getItem("notifications") || "[]",
  );
  const unread = notifications.filter((n) => !n.read).length;

  const oldBadge = document.getElementById("bellBadge");
  if (oldBadge) oldBadge.remove();

  if (unread > 0 && bell) {
    const badge = document.createElement("span");
    badge.id = "bellBadge";
    badge.textContent = unread;
    badge.style.cssText = `
            position:absolute;
            top:-6px;
            right:-6px;
            background:red;
            color:white;
            border-radius:50%;
            font-size:10px;
            width:16px;
            height:16px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight:bold;
        `;
    bell.style.position = "relative";
    bell.appendChild(badge);
  }
}

function toggleMessages() {
  const panel = document.getElementById("messagesPanel");
  if (!panel) return;

  if (panel.style.display === "none") {
    panel.style.display = "block";
    renderNotifications();
  } else {
    panel.style.display = "none";
  }
}

function renderNotifications() {
  const list = document.getElementById("messagesList");
  const notifications = JSON.parse(
    localStorage.getItem("notifications") || "[]",
  );

  notifications.forEach((n) => (n.read = true));
  localStorage.setItem("notifications", JSON.stringify(notifications));
  updateBellBadge();

  if (!notifications.length) {
    list.innerHTML =
      '<p style="text-align:center;color:gray;padding:20px;">შეტყობინება არ არის</p>';
    return;
  }

  list.innerHTML = notifications
    .map(
      (n) => `
    <div style="
        padding:12px 16px;
        border-bottom:1px solid #f0f0f0;
        display:flex;
        flex-direction:column;
        gap:4px;
    ">
        <div style="font-size:14px;">${n.message}</div>
        <div style="font-size:11px;color:gray;">${n.time}</div>
    </div>`,
    )
    .join("");
}

function clearNotifications() {
  localStorage.removeItem("notifications");
  renderNotifications();
  updateBellBadge();
}

document.addEventListener("click", (e) => {
  const panel = document.getElementById("messagesPanel");
  const bell = document.getElementById("bellBtn");
  if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
    panel.style.display = "none";
  }
});

//search btn

const filterBox = document.querySelector(".filter-box");
const filterToggleBtn = document.getElementById("filterToggleBtn");

if (filterToggleBtn)
  filterToggleBtn.addEventListener("click", () => {
    filterBox.style.display === "flex"
      ? (filterBox.style.display = "none")
      : (filterBox.style.display = "flex");
  });
