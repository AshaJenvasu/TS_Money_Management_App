import React from "react";

export function SvgSprites() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <defs>
        <symbol id="i-mail" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5.5" width="18" height="13" rx="2.8" />
            <path d="M4 8.2l8 5.4 8-5.4" />
          </g>
        </symbol>
        <symbol id="i-lock" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="10.5" width="14" height="10" rx="2.8" />
            <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" />
          </g>
          <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
        </symbol>
        <symbol id="i-eye" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="2.8" />
          </g>
        </symbol>
        <symbol id="i-eye-off" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.6 6a8.6 8.6 0 012.4-.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.6 3.4M6.3 7.6A15.8 15.8 0 002.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8" />
            <path d="M9.9 9.9a2.8 2.8 0 003.9 3.9" />
            <path d="M4 4l16 16" />
          </g>
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12h15M13.5 6.5L19 12l-5.5 5.5" />
          </g>
        </symbol>
        <symbol id="i-user-plus" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="10" cy="8" r="3.4" />
            <path d="M3.5 20c.5-3.8 3.1-5.8 6.5-5.8s6 2 6.5 5.8" />
            <path d="M19 8v6M16 11h6" />
          </g>
        </symbol>
        <symbol id="i-cat" viewBox="0 0 32 32">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 13V5l6.5 4.2c2.1-.5 4.9-.5 7 0L26 5v8c1.6 2.2 1.8 4.6 1 6.6C25.4 24 21.5 26.5 16 26.5S6.6 24 5 19.6c-.8-2-.6-4.4 1-6.6z" />
            <path d="M11.5 17.5v.1M20.5 17.5v.1" strokeWidth="2.6" />
            <path d="M14.6 21.2l1.4 1 1.4-1" />
            <path d="M2.5 19.5l4-1M2.8 23l3.8-1.5M29.5 19.5l-4-1M29.2 23l-3.8-1.5" />
          </g>
        </symbol>
        <symbol id="a-logo" viewBox="0 0 48 56">
          <path
            d="M24 2C12.4 2 4 10.6 4 21.4 4 34 24 54 24 54s20-20 20-32.6C44 10.6 35.6 2 24 2z"
            fill="#fff"
          />
          <path
            d="M11 33 L20.4 17.5 Q24 12.5 27.6 17.5 L37 33Z"
            fill="#5568E0"
          />
          <path
            d="M20.4 17.5 Q24 12.5 27.6 17.5 L29.6 20.8 L27 19.6 L24.8 22 L22.6 19.6 L20 20.8 L22 17.5Z"
            fill="#fff"
          />
          <circle cx="33" cy="14.5" r="2.6" fill="#F0669A" />
          <path
            d="M11 33h26"
            stroke="#5568E0"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
