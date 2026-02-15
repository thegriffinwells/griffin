import Weather from "./weather";

export const dynamic = "force-dynamic";

const WEATHER_CODES = {
  0: { label: "Clear", icon: "☀️" },
  1: { label: "Mostly Clear", icon: "🌤" },
  2: { label: "Partly Cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫" },
  48: { label: "Icy Fog", icon: "🌫" },
  51: { label: "Light Drizzle", icon: "🌦" },
  53: { label: "Drizzle", icon: "🌦" },
  55: { label: "Heavy Drizzle", icon: "🌧" },
  61: { label: "Light Rain", icon: "🌧" },
  63: { label: "Rain", icon: "🌧" },
  65: { label: "Heavy Rain", icon: "🌧" },
  66: { label: "Freezing Rain", icon: "🌨" },
  67: { label: "Heavy Freezing Rain", icon: "🌨" },
  71: { label: "Light Snow", icon: "❄️" },
  73: { label: "Snow", icon: "🌨" },
  75: { label: "Heavy Snow", icon: "🌨" },
  77: { label: "Snow Grains", icon: "🌨" },
  80: { label: "Light Showers", icon: "🌦" },
  81: { label: "Showers", icon: "🌧" },
  82: { label: "Heavy Showers", icon: "🌧" },
  85: { label: "Snow Showers", icon: "🌨" },
  86: { label: "Heavy Snow Showers", icon: "🌨" },
  95: { label: "Thunderstorm", icon: "⛈" },
  96: { label: "Thunderstorm w/ Hail", icon: "⛈" },
  99: { label: "Thunderstorm w/ Heavy Hail", icon: "⛈" },
};

async function getWeather() {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=apparent_temperature,temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York",
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch weather data");
  }

  return res.json();
}

export default async function Home() {
  const data = await getWeather();
  const current = data.current;

  const feelsLike = Math.round(current.apparent_temperature);
  const actual = Math.round(current.temperature_2m);
  const weatherCode = current.weather_code;
  const wind = Math.round(current.wind_speed_10m);
  const humidity = current.relative_humidity_2m;

  const condition = WEATHER_CODES[weatherCode] || {
    label: "Unknown",
    icon: "🌡",
  };

  return <Weather
    feelsLike={feelsLike}
    actual={actual}
    condition={condition}
    wind={wind}
    humidity={humidity}
  />;
}
