const regionSelect = document.getElementById("regionSelect");
const backgroundScroller = document.getElementById("backgroundScroller");

const currentTime = document.getElementById("currentTime");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const windSpeed = document.getElementById("windSpeed");
const windDirection = document.getElementById("windDirection");
const summaryText = document.getElementById("summaryText");
const tempMin = document.getElementById("tempMin");
const tempMax = document.getElementById("tempMax");
const precipAmount = document.getElementById("precipAmount");
const sunriseInfo = document.getElementById("sunriseInfo"); // 일출/일몰 표시 요소

const summaryMap = {
  clearsky_day: "맑음",
  clearsky_night: "맑은 밤",
  partlycloudy_day: "부분 흐림",
  partlycloudy_night: "부분 흐림",
  fair_day: "대체로 맑음",
  fair_night: "대체로 맑은 밤",
  cloudy: "흐림",
  rain: "비",
  lightrain: "약한비",
  rainshowers_day: "낮동안 소나기",
  lightrainshowers_day: "낮동안 가벼운 소나기",
  heavyrainshowers_day: "낮 동안 강한 소나기",
  lightrainshowers_night: "밤 동안 가벼운 소나기",
  heavyrain: "호우",
  snow: "눈",
  fog: "안개"
};

let forecastData = [];
let currentIndex = 0;
let sunrise = null;
let sunset = null;

regionSelect.addEventListener("change", () => {
  fetchForecast();
  backgroundScroller.scrollTo({ left: 0, behavior: "auto" }); // 지역 변경 시 스크롤 초기화
});

async function fetchForecast() {
  const [lat, lon] = regionSelect.value.split(",");
  const forecastUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  const today = new Date().toISOString().split("T")[0];
  //const sunriseUrl = `https://api.met.no/weatherapi/sunrise/2.0.json?lat=${lat}&lon=${lon}&date=${today}&offset=+09:00`;

  try {
    const [forecastRes] = await Promise.all([
      //const [forecastRes, sunriseRes] = await Promise.all([
      fetch(forecastUrl),
      //fetch(sunriseUrl)
    ]);
    const forecastJson = await forecastRes.json();
    //const sunriseJson = await sunriseRes.json();

    const now = new Date();
    forecastData = forecastJson.properties.timeseries
      .map(item => ({ ...item, localTime: new Date(item.time) }))
      .filter(item => {
        const diffHours = (item.localTime - now) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 36;
      });

    //const sunInfo = sunriseJson.location.time[0];
    //sunrise = new Date(sunInfo.sunrise.time);
    //sunset = new Date(sunInfo.sunset.time);

    renderSlides(forecastData);
    updateWeather(0);
  } catch (e) {
    alert("날씨 정보를 불러오지 못했습니다.");
    console.error(e);
  }
}

function renderSlides(data) {
  backgroundScroller.innerHTML = "";
  data.forEach(d => {
    const symbol = d.data.next_1_hours?.summary?.symbol_code || "clearsky_day";
    const slide = document.createElement("div");
    slide.className = "background-slide";
    slide.style.backgroundImage = `url('https://leesw931.github.io/getWeatherV2/assets/backgrounds/${symbol}.jpg')`;
    backgroundScroller.appendChild(slide);
  });
}

function updateWeather(index) {
  const item = forecastData[index];
  const time = item.localTime;
  const now = new Date();

  let timeLabel = "";
  if (time.toDateString() === now.toDateString()) {
    timeLabel = `오늘 ${time.getHours().toString().padStart(2, "0")}:00`;
  } else {
    const month = time.getMonth() + 1;
    const date = time.getDate();
    const hour = time.getHours().toString().padStart(2, "0");
    timeLabel = `${month}월 ${date}일 ${hour}:00`;
  }
  currentTime.textContent = timeLabel;

  const temp = Math.round(item.data.instant.details.air_temperature);
  temperature.textContent = `${temp}°`;
  feelsLike.textContent = `체감 ${temp}°`;

  windSpeed.textContent = `${item.data.instant.details.wind_speed} m/s`;
  windDirection.textContent = directionText(item.data.instant.details.wind_from_direction);

  const symbol = item.data.next_1_hours?.summary?.symbol_code || "clearsky_day";
  summaryText.textContent = summaryMap[symbol] || symbol;

  const precip = item.data.next_1_hours?.details?.precipitation_amount || 0;
  precipAmount.textContent = `${precip}`;

  const temps = forecastData.map(d => d.data.instant.details.air_temperature);
  tempMin.textContent = Math.min(...temps);
  tempMax.textContent = Math.max(...temps);

  // 🌅 일출/일몰 표시: 한 시간 전부터 노출
  const oneHourBefore = new Date(time.getTime() + 60 * 60 * 1000);
  if (sunrise && sunset && oneHourBefore >= sunrise && oneHourBefore <= new Date(sunrise.getTime() + 3600000)) {
    sunriseInfo.textContent = `일출: ${sunrise.getHours().toString().padStart(2, "0")}:${sunrise.getMinutes().toString().padStart(2, "0")}`;
  } else if (sunrise && sunset && oneHourBefore >= sunset && oneHourBefore <= new Date(sunset.getTime() + 3600000)) {
    sunriseInfo.textContent = `일몰: ${sunset.getHours().toString().padStart(2, "0")}:${sunset.getMinutes().toString().padStart(2, "0")}`;
  } else {
    sunriseInfo.textContent = "";
  }
}

function directionText(deg) {
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  return dirs[Math.round(deg / 45) % 8] + "풍";
}

backgroundScroller.addEventListener("scroll", () => {
  const scrollX = backgroundScroller.scrollLeft;
  const width = backgroundScroller.clientWidth;
  const newIndex = Math.round(scrollX / width);
  if (newIndex !== currentIndex) {
    currentIndex = newIndex;
    updateWeather(currentIndex);
  }
});

fetchForecast();
