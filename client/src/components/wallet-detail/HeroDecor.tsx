// เหรียญบาทและ swoosh สีขาว ตกแต่งมุม hero card เท่านั้น ไม่ใช่ข้อมูล
export default function HeroDecor() {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 100"
        className="pointer-events-none absolute -bottom-1 -right-2 w-52 opacity-[0.14]"
      >
        <path d="M0 100L72 24Q100 -4 128 24L200 100Z" fill="#fff" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="pointer-events-none absolute right-5 top-4 size-11 rotate-12 drop-shadow-[0_4px_6px_rgba(31,42,92,0.35)]"
      >
        <circle cx="16" cy="16" r="14" fill="#FFD66B" />
        <circle
          cx="16"
          cy="16"
          r="10.5"
          fill="none"
          stroke="#F2B233"
          strokeWidth="2"
        />
        <text
          x="16"
          y="21.6"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#D98E12"
        >
          ฿
        </text>
      </svg>
    </>
  );
}
