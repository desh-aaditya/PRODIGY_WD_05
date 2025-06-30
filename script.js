const API_KEY = 'Your_key';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const weatherContainer = document.getElementById('weatherContainer');

const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const weatherMain = document.getElementById('weatherMain');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const uvIndex = document.getElementById('uvIndex');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');

searchBtn.addEventListener('click', handleSearch);
currentLocationBtn.addEventListener('click', getCurrentLocation);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    getCurrentLocation();
});

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

function showLoading() {
    hideAllSections();
    loadingSpinner.classList.remove('hidden');
}

function showError(message) {
    hideAllSections();
    errorMessage.querySelector('p').textContent = message;
    errorMessage.classList.remove('hidden');
}

function showWeather() {
    hideAllSections();
    weatherContainer.classList.remove('hidden');
}

function hideAllSections() {
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherContainer.classList.add('hidden');
}

async function handleSearch() {
    const location = locationInput.value.trim();
    if (!location) {
        showError('Please enter a city name');
        return;
    }
    await getWeatherByCity(location);
}

async function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser');
        return;
    }

    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await getWeatherByCoords(latitude, longitude);
        },
        (error) => {
            let errorMsg = 'Unable to get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Location access denied by user.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
                default:
                    errorMsg += 'An unknown error occurred.';
                    break;
            }
            showError(errorMsg);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

async function getWeatherByCity(city) {
    showLoading();
    
    try {
        const response = await fetch(
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
            } else {
                throw new Error(`Weather data unavailable (${response.status})`);
            }
        }
        
        const data = await response.json();
        await displayWeatherData(data);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message || 'Failed to fetch weather data. Please try again.');
    }
}

async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
            } else {
                throw new Error(`Weather data unavailable (${response.status})`);
            }
        }
        
        const data = await response.json();
        await displayWeatherData(data);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message || 'Failed to fetch weather data. Please try again.');
    }
}

async function getUVIndex(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            return data.value;
        }
    } catch (error) {
        console.error('Error fetching UV index:', error);
    }
    return 'N/A';
}

async function displayWeatherData(data) {
    try {
        const uvIndexValue = await getUVIndex(data.coord.lat, data.coord.lon);
        
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temperature.textContent = Math.round(data.main.temp);
        
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = data.weather[0].description;
        
        weatherMain.textContent = data.weather[0].main;
        weatherDescription.textContent = data.weather[0].description;
        
        feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${data.wind.speed} m/s`;
        pressure.textContent = `${data.main.pressure} hPa`;
        visibility.textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
        uvIndex.textContent = uvIndexValue;
        
        const sunriseTime = new Date(data.sys.sunrise * 1000);
        const sunsetTime = new Date(data.sys.sunset * 1000);
        sunrise.textContent = sunriseTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        sunset.textContent = sunsetTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        locationInput.value = '';
        showWeather();
        
    } catch (error) {
        console.error('Error displaying weather data:', error);
        showError('Error displaying weather data. Please try again.');
    }
}

function validateApiKey() {
    if (API_KEY === 'YOUR_API_KEY' || !API_KEY) {
        showError('Please add your OpenWeatherMap API key to the JavaScript file. Get one free at openweathermap.org/api');
        return false;
    }
    return true;
}

if (!validateApiKey()) {
    currentLocationBtn.disabled = true;
    searchBtn.disabled = true;
}
