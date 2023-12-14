const apiKey = 'cb8d7db9eab2eeaacf88510e50dd2943';
const weatherInfoElement = document.getElementById('weather-info');

// Xác định vị trí của người dùng
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            getWeatherDataByCoords(latitude, longitude);
        },
        (error) => {
            console.error('Failed to get user location:', error);
        }
    );
} else {
    console.error('Geolocation is not supported by this browser.');
}

// Lấy thông tin thời tiết dựa trên tọa độ
function getWeatherDataByCoords(latitude, longitude) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const weatherData = JSON.parse(xhr.responseText);
            displayWeatherInfo(weatherData);
            changeBackground(weatherData);
        } else {
            console.error('Failed to fetch weather data');
        }
    };
    xhr.send();
}

// Hiển thị thông tin thời tiết
function displayWeatherInfo(data) {
    const temperatureKelvin = data.main.temp;
    const temperatureCelsius = convertKelvinToCelsius(temperatureKelvin);
    const weatherIcon = getWeatherIcon(data.weather[0].icon);
    const thermometerIcon = './images/nhietke.png'; 

    const weatherHtml = `<div><i class="fa fa-thermometer-three-quarters" aria-hidden="true" style="font-size:60px; margin: 15px"></i>
                        <p style="float:right"> ${temperatureCelsius} °C</p></div>
                        <div style="float:left">
                        <img src="${weatherIcon}" alt="Weather Icon" ></div>`;

    weatherInfoElement.innerHTML = weatherHtml;
}

// Hàm lấy đường dẫn ảnh biểu tượng thời tiết dựa trên mã icon
function getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/w/${iconCode}.png`;
}

// Hàm chuyển đổi từ Kelvin sang Celsius
function convertKelvinToCelsius(kelvin) {
    return (kelvin - 273.15).toFixed(2);
}

// Thay đổi nền dựa trên thông tin thời tiết
function changeBackground(weatherData) {
    const header = document.querySelector('.header');
    const weatherType = weatherData.weather[0].main.toLowerCase();

    switch (weatherType) {
        case 'clear':
            header.style.background = 'url("./images/clear.jpg")';
            break;
        case 'clouds':
            header.style.background = 'url("./images/cloud.jpg")';
            break;
        case 'rain':
            header.style.background = 'url("./images/rain.jpg")';
            break;
        case 'sun':
            header.style.background = 'url("./images/sun.jpg")';
            break;
        default:
            header.style.background = 'url("./images/sương.jpg")';
    }

    header.style.backgroundSize = 'cover';
    header.style.backgroundRepeat = 'no-repeat';
    header.style.backgroundAttachment = 'fixed';
}
