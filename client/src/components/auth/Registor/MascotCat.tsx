import React from "react";

export function MascotCat() {
  return (
    <svg className="mascot" viewBox="0 0 160 140" aria-hidden="true">
      {/* อุ้งมือโบก */}
      <g className="paw">
        <circle
          cx="138"
          cy="66"
          r="13"
          fill="#FFF5EA"
          stroke="#EADBC9"
          strokeWidth="1.5"
        />
        <ellipse cx="138" cy="70" rx="5" ry="4" fill="#FFB3CD" />
      </g>

      {/* ลำตัว */}
      <ellipse
        cx="80"
        cy="132"
        rx="54"
        ry="28"
        fill="#FFF5EA"
        stroke="#EADBC9"
        strokeWidth="1.5"
      />

      {/* หูแมวซ้าย */}
      <path
        d="M 42 62 L 32 30 C 30 22 42 28 54 42 Z"
        fill="#FFF5EA"
        stroke="#EADBC9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M 43 56 L 36 34 C 35 29 42 32 50 42 Z" fill="#FFC6DA" />

      {/* หูแมวขวา */}
      <path
        d="M 118 62 L 128 30 C 130 22 118 28 106 42 Z"
        fill="#FFF5EA"
        stroke="#EADBC9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M 117 56 L 124 34 C 125 29 118 32 110 42 Z" fill="#FFC6DA" />

      {/* หัวน้องแมว */}
      <ellipse
        cx="80"
        cy="78"
        rx="46"
        ry="38"
        fill="#FFF5EA"
        stroke="#EADBC9"
        strokeWidth="1.5"
      />

      {/* ตาแมวซ้าย/ขวา */}
      <ellipse cx="58" cy="76" rx="5.5" ry="7.5" fill="#3A2B45" />
      <circle cx="56.5" cy="73.5" r="2" fill="#FFFFFF" />
      <ellipse cx="102" cy="76" rx="5.5" ry="7.5" fill="#3A2B45" />
      <circle cx="100.5" cy="73.5" r="2" fill="#FFFFFF" />

      {/* แก้มอมชมพู */}
      <ellipse cx="48" cy="84" rx="6" ry="3.5" fill="#FFB3CD" opacity="0.65" />
      <ellipse cx="112" cy="84" rx="6" ry="3.5" fill="#FFB3CD" opacity="0.65" />

      {/* จมูกและปากแมว */}
      <path d="M 80 82 L 78 80 L 82 80 Z" fill="#F0669A" />
      <path
        d="M 74 86 Q 77 90 80 86 Q 83 90 86 86"
        fill="none"
        stroke="#3A2B45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* หนวดแมว */}
      <path
        d="M 32 78 L 44 80 M 30 85 L 43 85"
        stroke="#EADBC9"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M 128 78 L 116 80 M 130 85 L 117 85"
        stroke="#EADBC9"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* ดอกซากุระติดหัว */}
      <use
        href="#a-sakura"
        x="98"
        y="28"
        width="22"
        height="22"
        color="#FFC6DA"
      />
    </svg>
  );
}
