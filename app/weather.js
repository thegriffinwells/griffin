"use client";

import { useEffect, useMemo, useState } from "react";

const WEATHER_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mostly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "🌧️"],
  85: ["Snow showers", "🌨️"],
  86: ["Snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm", "⛈️"],
  99: ["Thunderstorm", "⛈️"],
};

const STORAGE_KEY = "weather-2026-notes";
const DEFAULT_LOCATION = { name: "New York", admin1: "NY", country: "US", lat: 40.7128, lon: -74.006 };

const fmtDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

const monthName = (index) => new Date(2026, index, 1).toLocaleString(undefined, { month: "long" });
const dayName = (value) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function readLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function iconFor(code) {
  return WEATHER_CODES[code] || ["Weather", "🌤️"];
}

function daysRemainingIn2026() {
  const end = new Date(2027, 0, 1).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

async function geocodeCity(query) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  const data = await res.json();
  const hit = data?.results?.[0];
  if (!hit) throw new Error("No matching city found.");
  return { name: hit.name, admin1: hit.admin1, country: hit.country, lat: hit.latitude, lon: hit.longitude };
}

async function getWeather(location) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", location.lat);
  url.searchParams.set("longitude", location.lon);
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load weather.");
  return res.json();
}

export default function WeatherTracker() {
  const [query, setQuery] = useState("New York");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [logDate, setLogDate] = useState("");
  const [logMood, setLogMood] = useState("☀️");
  const [logTemp, setLogTemp] = useState("");
  const [logNote, setLogNote] = useState("");
  const [now, setNow] = useState("");

  useEffect(() => {
    setLogDate(new Date().toISOString().slice(0, 10));
    setNow(fmtDate(new Date()));
    setLogs(readLogs());
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getWeather(location)
      .then((data) => mounted && setWeather(data))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [location]);

  const current = weather?.current;
  const daily = weather?.daily;
  const currentCode = current?.weather_code ?? 2;
  const [condition, icon] = iconFor(currentCode);
  const yearPct = useMemo(() => {
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2027, 0, 1).getTime();
    return clamp(((Date.now() - start) / (end - start)) * 100, 0, 100);
  }, [weather]);
  const remainingDays = daysRemainingIn2026();
  const monthCards = useMemo(() => {
    const m = new Date().getMonth();
    return Array.from({ length: 12 - m }, (_, i) => {
      const idx = m + i;
      return { name: monthName(idx), range: `${idx + 1}/2026` };
    });
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    try {
      setError("");
      setLoading(true);
      const found = await geocodeCity(query.trim());
      setLocation(found);
    } catch (err) {
      setError(err.message || "Could not find that city.");
      setLoading(false);
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setError("");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ name: "My location", admin1: "", country: "", lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        setError(err.message || "Could not get your location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function exportNotes() {
    const blob = new Blob([JSON.stringify({ location, logs }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weather-2026-notes.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveNote() {
    if (!logNote.trim() && !logTemp.trim()) {
      setError("Add a note or temperature before saving.");
      return;
    }
    const next = [
      { date: logDate || new Date().toISOString().slice(0, 10), mood: logMood, temp: logTemp, note: logNote, createdAt: new Date().toISOString() },
      ...logs,
    ];
    setLogs(next);
    saveLogs(next);
    setLogTemp("");
    setLogNote("");
    setError("");
  }

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; }
        body {
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #10203a;
          background:
            radial-gradient(circle at top left, rgba(79, 140, 255, 0.16), transparent 28%),
            radial-gradient(circle at top right, rgba(124, 92, 255, 0.15), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
          padding: 28px;
        }
        a { color: inherit; }
        input, button, select, textarea {
          font: inherit;
          border: 1px solid rgba(16, 32, 58, 0.1);
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.84);
          color: #10203a;
          outline: none;
        }
        button {
          cursor: pointer;
          border: 0;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #4f8cff, #7c5cff);
          box-shadow: 0 16px 30px rgba(79,140,255,.22);
        }
        button.secondary {
          color: #10203a;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(16,32,58,0.12);
          box-shadow: none;
        }
        .shell { max-width: 1180px; margin: 0 auto; }
        header { display:flex; justify-content:space-between; align-items:end; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
        h1 { margin: 0; font-size: clamp(30px, 4vw, 52px); letter-spacing: -0.04em; }
        .subtle { color: #5f6b7a; margin-top: 10px; max-width: 62ch; line-height: 1.5; }
        .topbar {
          display:grid; grid-template-columns: 1.2fr 0.7fr 0.7fr auto; gap: 12px; margin-bottom: 18px;
        }
        .grid { display:grid; grid-template-columns: 1.15fr 0.85fr; gap: 18px; align-items:start; }
        .stack { display:grid; gap: 18px; }
        .card {
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.7);
          backdrop-filter: blur(18px);
          border-radius: 24px;
          box-shadow: 0 18px 50px rgba(16, 32, 58, 0.12);
          overflow: hidden;
        }
        .inner { padding: 22px; }
        .hero {
          background:
            radial-gradient(circle at 18% 20%, rgba(255,255,255,.8), transparent 22%),
            linear-gradient(135deg, rgba(79,140,255,0.18), rgba(124,92,255,0.18));
        }
        .hero-top { display:flex; justify-content:space-between; gap: 16px; align-items:start; flex-wrap: wrap; }
        .location { font-size: 18px; color: #5f6b7a; }
        .bigtemp { font-size: clamp(54px, 7vw, 92px); line-height: .95; margin: 10px 0 6px; letter-spacing: -0.08em; }
        .condition { font-size: 22px; font-weight: 700; }
        .meta { display:flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        .pill {
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.68);
          border: 1px solid rgba(16,32,58,0.08);
          font-size: 14px;
        }
        .forecast { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .day {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(16,32,58,0.08);
          border-radius: 18px;
          padding: 14px;
          min-height: 114px;
        }
        .dow { font-size: 13px; color: #5f6b7a; text-transform: uppercase; letter-spacing: .08em; }
        .icon { font-size: 26px; margin: 14px 0 12px; }
        .temps { font-size: 16px; font-weight: 700; }
        .range { color: #5f6b7a; font-size: 13px; margin-top: 2px; }
        .section-title { display:flex; justify-content:space-between; align-items:end; gap: 12px; margin-bottom: 14px; }
        .section-title h2 { margin: 0; font-size: 18px; letter-spacing: -0.02em; }
        .section-title .hint { color: #5f6b7a; font-size: 13px; }
        .progress { height: 12px; border-radius: 999px; background: rgba(16,32,58,0.08); overflow: hidden; }
        .bar { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #4f8cff, #7c5cff); transition: width .35s ease; }
        .footer-note { color: #5f6b7a; font-size: 13px; margin-top: 10px; }
        .log-form { display:grid; gap: 10px; }
        .log-form .row { display:grid; grid-template-columns: 1fr 0.8fr 0.8fr; gap: 10px; }
        .logs { display:grid; gap: 10px; margin-top: 14px; }
        .log {
          display:grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items:center;
          padding: 14px 15px; background: rgba(255,255,255,0.8); border: 1px solid rgba(16,32,58,0.08); border-radius: 18px;
        }
        .emoji { font-size: 22px; }
        .date { font-weight: 700; }
        .note { color: #5f6b7a; font-size: 14px; margin-top: 3px; white-space: pre-wrap; }
        .vals { color: #5f6b7a; font-size: 13px; text-align:right; }
        .year-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .month { padding: 14px; border-radius: 18px; background: rgba(255,255,255,0.76); border: 1px solid rgba(16,32,58,0.08); }
        .month .name { font-weight: 700; margin-bottom: 6px; }
        .month .days { color: #5f6b7a; font-size: 13px; line-height: 1.45; }
        .error { color: #a43c3c; font-size: 14px; margin-top: 10px; }
        @media (max-width: 980px) {
          .grid { grid-template-columns: 1fr; }
          .topbar { grid-template-columns: 1fr 1fr; }
          .forecast { grid-template-columns: repeat(2, 1fr); }
          .year-grid { grid-template-columns: repeat(2, 1fr); }
          .log-form .row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          body { padding: 16px; }
          .topbar, .forecast, .year-grid { grid-template-columns: 1fr; }
          .log { grid-template-columns: auto 1fr; }
          .vals { grid-column: 1 / -1; text-align:left; }
        }
      `}</style>

      <div className="shell">
        <header>
          <div>
            <h1>Weather 2026</h1>
            <div className="subtle">A simple, aesthetic weather tracker for the rest of 2026. Search a city, use your location, save weather notes, and keep a clean year view.</div>
          </div>
          <div className="pill">{now || "Today"}</div>
        </header>

        <div className="topbar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city, e.g. New York" />
          <button onClick={handleSearch}>Track weather</button>
          <button className="secondary" onClick={useMyLocation}>Use my location</button>
          <button className="secondary" onClick={exportNotes}>Export notes</button>
        </div>

        <div className="grid">
          <div className="stack">
            <section className="card hero">
              <div className="inner">
                {loading && !weather ? (
                  <div className="footer-note">Loading weather...</div>
                ) : null}
                <div className="hero-top">
                  <div>
                    <div className="location">{[location.name, location.admin1, location.country].filter(Boolean).join(", ")}</div>
                    <div className="bigtemp">{Math.round(current?.temperature_2m ?? 0)}°</div>
                    <div className="condition">{condition}</div>
                    <div className="meta">
                      <div className="pill">Feels like {Math.round(current?.apparent_temperature ?? 0)}°</div>
                      <div className="pill">Humidity {Math.round(current?.relative_humidity_2m ?? 0)}%</div>
                      <div className="pill">Wind {Math.round(current?.wind_speed_10m ?? 0)} mph</div>
                      <div className="pill">Open-Meteo</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 180 }}>
                    <div style={{ fontSize: 54, lineHeight: 1 }}>{icon}</div>
                    <div className="pill" style={{ display: "inline-block", marginTop: 10 }}>{now || fmtDate(new Date())}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="inner">
                <div className="section-title">
                  <h2>Next 4 days</h2>
                  <div className="hint">A quick glance at the forecast</div>
                </div>
                <div className="forecast">
                  {(daily?.time || []).slice(0, 4).map((t, i) => {
                    const [txt, ic] = iconFor(daily?.weather_code?.[i]);
                    return (
                      <div className="day" key={t}>
                        <div className="dow">{dayName(t)}</div>
                        <div className="icon">{ic}</div>
                        <div className="temps">{Math.round(daily?.temperature_2m_max?.[i] ?? 0)}° / {Math.round(daily?.temperature_2m_min?.[i] ?? 0)}°</div>
                        <div className="range">{txt}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className="stack">
            <section className="card">
              <div className="inner">
                <div className="section-title">
                  <h2>Rest of 2026</h2>
                  <div className="hint">{remainingDays} days left</div>
                </div>
                <div className="progress"><div className="bar" style={{ width: `${yearPct}%` }} /></div>
                <div className="footer-note">{yearPct.toFixed(1)}% of 2026 has passed. The tracker is ready for the remaining {remainingDays} days.</div>
              </div>
            </section>

            <section className="card">
              <div className="inner">
                <div className="section-title">
                  <h2>Log a weather note</h2>
                  <div className="hint">Saved in your browser</div>
                </div>
                <div className="log-form">
                  <div className="row">
                    <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                    <select value={logMood} onChange={(e) => setLogMood(e.target.value)}>
                      <option value="☀️">☀️ Sunny</option>
                      <option value="⛅">⛅ Mixed</option>
                      <option value="🌧️">🌧️ Rainy</option>
                      <option value="❄️">❄️ Cold</option>
                      <option value="🌫️">🌫️ Foggy</option>
                    </select>
                    <input type="number" placeholder="Temp °F" value={logTemp} onChange={(e) => setLogTemp(e.target.value)} />
                  </div>
                  <textarea rows={3} placeholder="Short note: a cool breeze, sudden rain, perfect sunset..." value={logNote} onChange={(e) => setLogNote(e.target.value)} />
                  <button onClick={saveNote}>Save note</button>
                </div>
                <div className="footer-note">Tip: use this as a simple daily weather journal for the rest of the year.</div>
                {error ? <div className="error">{error}</div> : null}
              </div>
            </section>
          </div>
        </div>

        <section className="card" style={{ marginTop: 18 }}>
          <div className="inner">
            <div className="section-title">
              <h2>Recent entries</h2>
              <div className="hint">Your saved weather log</div>
            </div>
            <div className="logs">
              {(logs || []).length ? logs.slice(0, 6).map((log, index) => (
                <div className="log" key={`${log.date}-${index}`}>
                  <div className="emoji">{log.mood || "☀️"}</div>
                  <div>
                    <div className="date">{log.date}</div>
                    <div className="note">{log.note || ""}</div>
                  </div>
                  <div className="vals">{log.temp ? `${log.temp}°` : ""}</div>
                </div>
              )) : <div className="footer-note">No saved notes yet. Add the first entry above.</div>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 18 }}>
          <div className="inner">
            <div className="section-title">
              <h2>Months left in 2026</h2>
              <div className="hint">A visual year tracker</div>
            </div>
            <div className="year-grid">
              {monthCards.map((month) => (
                <div className="month" key={month.name}>
                  <div className="name">{month.name}</div>
                  <div className="days">{month.range}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
