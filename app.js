// ===== ELEMENTS =====
const dateTimeEl = document.getElementById("date-time");
const locationEl = document.getElementById("location");
const tempEl = document.getElementById("temp");
const hiLoEl = document.getElementById("hi-lo");
const weatherIconEl = document.getElementById("weather-icon");
const forecastEl = document.getElementById("forecast");
const searchInputEl = document.getElementById("search-input");
const slider = document.querySelector(".panel-slider");
const starEl = document.querySelector(".search-star");

// ===== API KEY =====
const API_KEY = "f225bdb454a834269a58158a86ba27ce";

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit"
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
  dateTimeEl.textContent = `${date} - ${time}`;
}
updateClock();
setInterval(updateClock, 60000);

// ===== FAVORITES =====
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
renderFavorites();

// ===== HELPER: UPDATE STAR ICON =====
function updateStar(cityName) {
  const starFilled = "./image/star-yellow.png";
  const starOutline = "./image/star.png";
  starEl.src = favorites.includes(cityName) ? starFilled : starOutline;
}

// ===== CURRENT WEATHER =====
async function getCurrentWeather(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error("Weather error");
    const data = await res.json();

    locationEl.textContent = `${data.name}, ${data.sys.country}`;
    tempEl.textContent = `${Math.round(data.main.temp)}°`;
    hiLoEl.textContent = `H: ${Math.round(data.main.temp_max)}° | L: ${Math.round(data.main.temp_min)}°`;
    weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Update star
    updateStar(data.name);

  } catch (err) {
    locationEl.textContent = "Weather unavailable";
    tempEl.textContent = "--°";
    hiLoEl.textContent = "";
    console.error(err);
  }
}

// ===== FIVE DAY FORECAST (CLICKABLE) =====
async function getForecast(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error("Forecast error");
    const data = await res.json();
    forecastEl.innerHTML = "";

    const daily = {};
    data.list.forEach(item => {
      const day = item.dt_txt.split(" ")[0];
      if (!daily[day]) daily[day] = [];
      daily[day].push(item);
    });

    // Weekday labels
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    Object.keys(daily).slice(0, 5).forEach(day => {
      const temps = daily[day].map(i => i.main.temp);
      const icon = daily[day][0].weather[0].icon;
      const d = new Date(day);
      const weekday = weekdays[d.getDay()];

      forecastEl.innerHTML += `
        <div class="forecast-day" 
             onclick="setDayWeather('${icon}', ${Math.round(Math.max(...temps))}, ${Math.round(Math.min(...temps))})">
          <div class="forecast-date">${weekday}</div>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png">
          <div class="forecast-temp">${Math.round(Math.max(...temps))}° | ${Math.round(Math.min(...temps))}°</div>
        </div>
      `;
    });

  } catch (err) {
    forecastEl.innerHTML = "<p>Forecast unavailable</p>";
    console.error(err);
  }
}

// ===== SWITCH MAIN WEATHER FROM FORECAST =====
function setDayWeather(icon, high, low) {
  weatherIconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  hiLoEl.textContent = `H: ${high}° | L: ${low}°`;
}

// ===== SEARCH =====
async function searchCity(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const data = await res.json();
    if (!data[0]) return alert("City not found");

    getCurrentWeather(data[0].lat, data[0].lon);
    getForecast(data[0].lat, data[0].lon);
  } catch (err) {
    console.error(err);
  }
}

searchInputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") searchCity(searchInputEl.value.trim());
});

// ===== NIGHT MODE =====
slider.addEventListener("input", () => {
  document.body.classList.toggle("night-mode", slider.value < 50);
});

// ===== STAR CLICK =====
starEl.addEventListener("click", () => {
  const city = locationEl.textContent.split(",")[0];
  if (!city || city === "--") return;

  const starFilled = "./image/star-yellow.png";
  const starOutline = "./image/star.png";

  if (favorites.includes(city)) {
    favorites = favorites.filter(c => c !== city);
    starEl.src = starOutline;
  } else {
    favorites.push(city);
    starEl.src = starFilled;
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
});

// ===== RENDER FAVORITES IN lil-pan =====
function renderFavorites() {
  const lilPan = document.querySelector(".lil-pan");
  let list = lilPan.querySelector(".favorites-list");

  if (!list) {
    list = document.createElement("div");
    list.className = "favorites-list";
    lilPan.appendChild(list);
  }

  list.innerHTML = favorites.length
    ? favorites.map(city => `<div class="fav-city" onclick="searchCity('${city}')">⭐ ${city}</div>`).join("")
    : "<div class='fav-city'>No favorites</div>";
}

// ===== DEFAULT CITY =====
getCurrentWeather(37.9577, -121.2908);
getForecast(37.9577, -121.2908);
