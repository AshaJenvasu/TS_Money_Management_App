import React from "react";

export function SvgSprites() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <symbol id="i-user" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.5 20c.6-4 3.6-6 7.5-6s6.9 2 7.5 6" />
          </g>
        </symbol>
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
        <symbol id="i-sparkle" viewBox="0 0 24 24">
          <path
            d="M12 2.5c.7 5 2.6 7 7.5 7.8-4.9.8-6.8 2.8-7.5 7.7-.7-4.9-2.6-6.9-7.5-7.7C9.4 9.5 11.3 7.5 12 2.5z"
            fill="currentColor"
          />
          <path
            d="M19 15.5c.3 2 1 2.8 3 3.1-2 .3-2.7 1.1-3 3.1-.3-2-1-2.8-3-3.1 2-.3 2.7-1.1 3-3.1z"
            fill="currentColor"
            opacity=".7"
          />
        </symbol>
        <symbol id="i-alert" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5" />
          </g>
          <circle cx="12" cy="16.3" r="1" fill="currentColor" />
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
        <symbol id="a-sakura" viewBox="-12 -12 24 24">
          <g fill="currentColor">
            <path d="M0 0C-4-3.5-4.2-9.5-1.3-11 0-10.2.6-10.2 1.3-11 4.2-9.5 4-3.5 0 0z" />
            <path
              transform="rotate(72)"
              d="M0 0C-4-3.5-4.2-9.5-1.3-11 0-10.2.6-10.2 1.3-11 4.2-9.5 4-3.5 0 0z"
            />
            <path
              transform="rotate(144)"
              d="M0 0C-4-3.5-4.2-9.5-1.3-11 0-10.2.6-10.2 1.3-11 4.2-9.5 4-3.5 0 0z"
            />
            <path
              transform="rotate(216)"
              d="M0 0C-4-3.5-4.2-9.5-1.3-11 0-10.2.6-10.2 1.3-11 4.2-9.5 4-3.5 0 0z"
            />
            <path
              transform="rotate(288)"
              d="M0 0C-4-3.5-4.2-9.5-1.3-11 0-10.2.6-10.2 1.3-11 4.2-9.5 4-3.5 0 0z"
            />
          </g>
          <circle r="1.7" fill="#F0669A" />
        </symbol>
        <symbol id="a-petal" viewBox="0 0 20 20">
          <path
            d="M10 2C15 5 17 11 12 17.5L10 15.5 8 17.5C3 11 5 5 10 2z"
            fill="currentColor"
          />
        </symbol>
        <symbol id="a-cloud" viewBox="0 0 40 32">
          <path
            d="M9 30C3 30 0 26 0 22c0-5 4-8 9-8 .5-6 6-10 12-10 6 0 10 4 11 8 5 0 8 4 8 9 0 5-4 9-9 9z"
            fill="#fff"
          />
        </symbol>
      </defs>
    </svg>
  );
}
