import "./decorAnimations.css";

// แมวแอบมองพร้อมโบกอุ้งเท้าทักทาย อยู่เหนือขอบบนของ hero card ฝั่งขวา
export default function PeekingCat() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 84"
      className="pointer-events-none absolute bottom-[calc(100%-14px)] right-6 z-10 w-28"
    >
      <path
        d="M24 38L26 6l24 18zM96 38L94 6 70 24z"
        fill="#FFF5EA"
        stroke="#EADBC9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M30 32l2-15 12 9zM90 32l-2-15-12 9z" fill="#FFB3CD" />
      <ellipse
        cx="60"
        cy="48"
        rx="42"
        ry="30"
        fill="#FFF5EA"
        stroke="#EADBC9"
        strokeWidth="1.5"
      />
      <path d="M24 38c2-12 14-18 26-16-3 12-12 21-26 22z" fill="#C98F5B" />
      <path
        d="M40 46q6-8 12 0M68 46q6-8 12 0"
        fill="none"
        stroke="#3A2B45"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <ellipse cx="34" cy="56" rx="6.5" ry="4" fill="#FFB3CD" opacity="0.85" />
      <ellipse cx="86" cy="56" rx="6.5" ry="4" fill="#FFB3CD" opacity="0.85" />
      <path d="M57 53h6l-3 3.6z" fill="#F0669A" />
      <path
        d="M54 61q3 4 6 0q3 4 6 0"
        fill="none"
        stroke="#3A2B45"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className="cat-wave">
        <circle
          cx="108"
          cy="28"
          r="11"
          fill="#FFF5EA"
          stroke="#EADBC9"
          strokeWidth="1.5"
        />
        <ellipse cx="108" cy="32" rx="4.2" ry="3.4" fill="#FFB3CD" />
        <circle cx="102.5" cy="24" r="1.8" fill="#FFB3CD" />
        <circle cx="108" cy="21.5" r="1.8" fill="#FFB3CD" />
        <circle cx="113.5" cy="24" r="1.8" fill="#FFB3CD" />
      </g>
    </svg>
  );
}
