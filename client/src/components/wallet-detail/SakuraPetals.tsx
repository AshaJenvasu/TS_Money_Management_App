import type { CSSProperties } from "react";
import "./decorAnimations.css";

// ค่ากลีบซากุระร่วง กำหนดไว้ตายตัวแทนการสุ่มทุกครั้งที่ render
const PETALS = [
  {
    left: "4%",
    size: 11,
    duration: "7s",
    delay: "-2s",
    drift: "26px",
    rotation: "420deg",
    color: "#FFC6DA",
  },
  {
    left: "14%",
    size: 15,
    duration: "8.5s",
    delay: "-6s",
    drift: "-18px",
    rotation: "-540deg",
    color: "#FFE3EC",
  },
  {
    left: "26%",
    size: 10,
    duration: "6.5s",
    delay: "-3s",
    drift: "32px",
    rotation: "300deg",
    color: "#FFFFFF",
  },
  {
    left: "38%",
    size: 17,
    duration: "9.5s",
    delay: "-1s",
    drift: "-24px",
    rotation: "-420deg",
    color: "#FFD9E6",
  },
  {
    left: "52%",
    size: 12,
    duration: "7.5s",
    delay: "-5s",
    drift: "20px",
    rotation: "480deg",
    color: "#FFC6DA",
  },
  {
    left: "64%",
    size: 16,
    duration: "9s",
    delay: "-4s",
    drift: "-30px",
    rotation: "-360deg",
    color: "#FFFFFF",
  },
  {
    left: "76%",
    size: 11,
    duration: "7.2s",
    delay: "-7s",
    drift: "22px",
    rotation: "390deg",
    color: "#FFE3EC",
  },
  {
    left: "86%",
    size: 14,
    duration: "8s",
    delay: "-2.5s",
    drift: "-16px",
    rotation: "-480deg",
    color: "#FFD9E6",
  },
  {
    left: "94%",
    size: 10,
    duration: "6.8s",
    delay: "-6.5s",
    drift: "18px",
    rotation: "330deg",
    color: "#FFC6DA",
  },
] as const;

// กลีบซากุระร่วง วนลูปไม่รู้จบ อยู่หน้าฉากฟ้าแต่หลังปุ่ม/การ์ดต่างๆ
export default function SakuraPetals() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden"
    >
      {PETALS.map((petal, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className="sakura-petal"
          style={
            {
              left: petal.left,
              width: petal.size,
              height: petal.size,
              color: petal.color,
              animationDuration: petal.duration,
              animationDelay: petal.delay,
              "--sakura-drift": petal.drift,
              "--sakura-rotation": petal.rotation,
            } as CSSProperties
          }
        >
          <path
            d="M10 2C15 5 17 11 12 17.5L10 15.5 8 17.5C3 11 5 5 10 2z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}
