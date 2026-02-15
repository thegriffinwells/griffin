"use client";

import { useEffect, useState } from "react";

function getTempColor(temp) {
  if (temp <= 10) return "#a8d8ea";
  if (temp <= 25) return "#88c4e0";
  if (temp <= 32) return "#6cb4d8";
  if (temp <= 45) return "#b8c9e0";
  if (temp <= 55) return "#c9cba3";
  if (temp <= 65) return "#ffe1a8";
  if (temp <= 75) return "#ffbe76";
  if (temp <= 85) return "#ff9f43";
  if (temp <= 95) return "#ee5a24";
  return "#ea2027";
}

function getVibeText(feelsLike) {
  if (feelsLike <= 0) return "Brutally cold. Stay inside.";
  if (feelsLike <= 15) return "Bitter cold. Bundle up completely.";
  if (feelsLike <= 25) return "Freezing. Heavy coat weather.";
  if (feelsLike <= 32) return "Below freezing. Layer up.";
  if (feelsLike <= 40) return "Cold. You'll want a real coat.";
  if (feelsLike <= 50) return "Chilly. Jacket weather.";
  if (feelsLike <= 60) return "Cool. A light layer will do.";
  if (feelsLike <= 70) return "Nice out. Enjoy it.";
  if (feelsLike <= 80) return "Warm. T-shirt weather.";
  if (feelsLike <= 90) return "Hot. Keep cool out there.";
  if (feelsLike <= 100) return "Sweltering. Find some shade.";
  return "Dangerously hot. Stay inside.";
}

export default function Weather({ feelsLike, actual, condition, wind, humidity }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(null);

  useEffect(() => {
    setMounted(true);
    setNow(
      new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, []);

  const bgColor = getTempColor(feelsLike);
  const vibe = getVibeText(feelsLike);
  const diff = feelsLike - actual;
  const diffText =
    diff === 0
      ? "Same as actual"
      : diff > 0
        ? `${Math.abs(diff)}° warmer than actual`
        : `${Math.abs(diff)}° colder than actual`;

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background: ${bgColor};
          color: #1a1a2e;
          min-height: 100vh;
          transition: background 0.6s ease;
        }

        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .location {
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          opacity: 0.6;
          margin-bottom: 0.5rem;
        }

        .condition-icon {
          font-size: 4rem;
          margin-bottom: 0.5rem;
          line-height: 1;
        }

        .condition-label {
          font-size: 1.1rem;
          font-weight: 400;
          opacity: 0.7;
          margin-bottom: 2rem;
        }

        .feels-label {
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          opacity: 0.5;
          margin-bottom: 0.25rem;
        }

        .temp {
          font-size: clamp(8rem, 25vw, 14rem);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 0.25rem;
        }

        .temp-unit {
          font-size: 0.3em;
          font-weight: 300;
          vertical-align: super;
          opacity: 0.5;
        }

        .diff {
          font-size: 1rem;
          opacity: 0.5;
          margin-bottom: 1.5rem;
        }

        .vibe {
          font-size: 1.25rem;
          font-weight: 400;
          opacity: 0.8;
          max-width: 400px;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 2.5rem;
        }

        .details {
          display: flex;
          gap: 2.5rem;
          opacity: 0.5;
          font-size: 0.85rem;
        }

        .detail {
          text-align: center;
        }

        .detail-value {
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0.15rem;
        }

        .detail-label {
          font-weight: 400;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .timestamp {
          position: fixed;
          bottom: 1.5rem;
          font-size: 0.75rem;
          opacity: 0.35;
        }
      `}</style>

      <div className="container">
        <div className="location">Brooklyn, NY</div>
        <div className="condition-icon">{condition.icon}</div>
        <div className="condition-label">{condition.label}</div>

        <div className="feels-label">Feels Like</div>
        <div className="temp">
          {feelsLike}
          <span className="temp-unit">°F</span>
        </div>
        <div className="diff">{diffText}</div>

        <div className="vibe">{vibe}</div>

        <div className="details">
          <div className="detail">
            <div className="detail-value">{actual}°</div>
            <div className="detail-label">Actual</div>
          </div>
          <div className="detail">
            <div className="detail-value">{wind} mph</div>
            <div className="detail-label">Wind</div>
          </div>
          <div className="detail">
            <div className="detail-value">{humidity}%</div>
            <div className="detail-label">Humidity</div>
          </div>
        </div>

        {mounted && now && <div className="timestamp">{now}</div>}
      </div>
    </>
  );
}
