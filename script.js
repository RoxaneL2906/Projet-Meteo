// Récupère la météo par les coordonnées
async function getCurrentWeatherbyCoordinates(latitude, longitude) {
  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code`
  )
    .then((response) => response.json())
    .then((weather) => {
      // Affiche la température
      setTemperature(
        weather.current.temperature_2m,
        weather.current_units.temperature_2m
      );
      // Affiche l'image du .json
      setWeatherImage(weather.current.weather_code, weather.current.is_day);

      // Affiche le background en fonction de la météo -> Weather background
      setWeatherBackground(
        weather.current.weather_code,
        weather.current.is_day
      );
    });
}

// Récupère les coordonnées par le nom de la ville
function getCoordinatesByCityName(city) {
  return fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=fr&format=json`
  )
    .then((response) => response.json())
    .then((cityApi) => {
      // Renvoie un tableau de villes (sous forme de menu déroulant) après une recherche par nom
      // Sélectionne le premier résultat par défaut
      if (cityApi.results.length > 0) {
        const citySelect = document.getElementById("cities");
        citySelect.innerHTML = "";
        cityApi.results.forEach((city) => {
          citySelect.innerHTML += `<option value="${city.name};${city.latitude};${city.longitude}">${city.name}, ${city.country}, ${city.admin1}</option>`;
        });

        const city = cityApi.results[0];
        setPosition(city.latitude, city.longitude);
        setCityName(city.name);
        getCurrentWeatherbyCoordinates(city.latitude, city.longitude);
      }
    });
}

// Récupère le nom de la ville par ses coordonnées pour l'afficher
function getCityNameByCoordinates(latitude, longitude) {
  return fetch(
    `http://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
  )
    .then((response) => response.json())
    .then((cityApi) => { 
      if (!cityApi.error) {
        const city =
        cityApi.address.village || cityApi.address.town || cityApi.address.city;
        setSearchText(city);
        setCityName(city);
      } else {
        // Si pas de ville trouvée par coordonnées
        setSearchText('');
        setCityName('Pas de ville');
      }
    });
}

// Pour faire fonctionner l'icone de recherche ET "enter" sur l'input
function initSearch() {
  const searchIcon = document.getElementById("search-icon");
  searchIcon.addEventListener("click", searchByName);
  const searchForm = document.getElementById("search-form");
  searchForm.addEventListener("submit", searchByName);
  const lalonForm = document.getElementById("lalon-form");
  lalonForm.addEventListener("submit", searchByLalon);
  const cityList = document.getElementById("cities");
  // Mets à jour la page quand on choisit une ville du menu déroulant 
  cityList.addEventListener("change", (event) => {
    const name = event.target.value.split(";")[0];
    const latitude = event.target.value.split(";")[1];
    const longitude = event.target.value.split(";")[2];
    getCurrentWeatherbyCoordinates(latitude, longitude);
    setCityName(name);
    setPosition(latitude, longitude);
  });
}

function searchByName(event) {
  // Empêche de recharger la page quand on sumbit grace au preventDefault
  event.preventDefault();
  const searchCity = document.getElementById("search-city");

  if (searchCity.value) {
    getCoordinatesByCityName(searchCity.value);
  }
}

function searchByLalon(event) {
  // Empêche de recharger la page quand on sumbit grace au preventDefault
  event.preventDefault();
  const latitude = document.getElementById("latitude");
  const longitude = document.getElementById("longitude");

  if (latitude.value && longitude.value) {
    getCityNameByCoordinates(latitude.value, longitude.value);
    getCurrentWeatherbyCoordinates(latitude.value, longitude.value);
  }
}

// Geolocalisation
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
  } else {
    errorLocation();
  }
}

function successLocation(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

// Si geolocalisation activée, possibilité de rechercher météo locale
  const geolocalisation = document.getElementById("geolocalisation");
  geolocalisation.innerHTML =
    '<p>Chez moi ?</p><i class="fa-solid fa-magnifying-glass"></i>';
  geolocalisation.addEventListener("click", getLocation);

// Vide le select quand on cherche par geolocalisation 
  const citySelect = document.getElementById("cities");
  citySelect.innerHTML = "";

  clearSearchText();
  setPosition(latitude, longitude);

  getCityNameByCoordinates(latitude, longitude);
  getCurrentWeatherbyCoordinates(latitude, longitude);
}

// Erreur si notre geolocalisation n'est pas activée/trouvée 
function errorLocation() {
  const geolocalisation = document.getElementById("geolocalisation");
  geolocalisation.innerHTML = "<p>La position n'est pas disponible.</p>";
}

// Weather background
function setWeatherBackground(weatherCode, isDay) {
  document.body.classList.forEach((cl) => {
    document.body.classList.remove(cl);
  });

  // Cf -> .json
  if (isDay) {
    if (weatherCode > 90) {
      document.body.classList.add("thunderstorm");
    } else if (weatherCode > 2) {
      document.body.classList.add("rain");
    }
  } else {
    document.body.classList.add("night");
  }
}

// Formulaires
function setSearchText(city) {
  const searchCity = document.getElementById("search-city");
  searchCity.value = city;
}

function clearSearchText() {
  const searchCity = document.getElementById("search-city");
  searchCity.value = "";
}

function setPosition(latitude, longitude) {
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");
  latitudeInput.value = latitude;
  longitudeInput.value = longitude;
}

// Affichage après recherche
function setCityName(name) {
  const cityElement = document.getElementById("city");
  cityElement.innerText = name;
}

// Appel du fichier .json pour trouver la bonne icone
function setWeatherImage(weatherCode, isDay) {
  fetch("./weather.json")
    .then((response) => response.json())
    .then((weathers) => {
      const weather = weathers[weatherCode];

      const weatherImg = document.getElementById("weather");
      weatherImg.setAttribute(
        "src",
        isDay ? weather.day.image : weather.night.image
      );
    });
}

function setTemperature(value, unit) {
  const temperature = document.getElementById("temperature");
  temperature.innerText = value + unit;
}

initSearch();
getLocation();
