import SakuraFlower from "./SakuraFlower";

// ฉากหลังฟ้า เมฆ ภูเขา และกลุ่มดอกซากุระนิ่งๆ วางไว้บนสุดของหน้า เป็นของตกแต่งทั้งหมด
export default function WalletDetailScene() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 200"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-52 w-full sm:h-64 lg:h-80 xl:h-"
    >
      <defs>
        <linearGradient id="walletDetailSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FC6F5" />
          <stop offset=".5" stopColor="#C3DEF8" />
          <stop offset="1" stopColor="#E9EAF8" />
        </linearGradient>
        <linearGradient id="walletDetailMountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9B93DD" />
          <stop offset="1" stopColor="#C7C2EE" />
        </linearGradient>
      </defs>
      <rect width="480" height="200" fill="url(#walletDetailSky)" />

      {/* เนินหลัง */}
      <path
        d="M0 110C70 85 120 100 190 80S300 55 380 78 460 100 480 85V200H0Z"
        fill="#AEB4E8"
        opacity="0.55"
      />
      {/* ภูเขาหน้า ขยับขึ้น 30 หน่วยให้ยอดพ้นขอบบนของการ์ดต้นทุนพอร์ต */}
      <g transform="translate(0, -35)">
        <path
          d="M120 130L190 55Q215 30 240 55L300 130Z"
          fill="url(#walletDetailMountain)"
          opacity="0.75"
        />{" "}
        <path
          d="M190 55Q215 30 240 55L250 66L242 63L236 70L227 64L218 72L209 65L202 71L195 64L186 67Z"
          fill="#fff"
          opacity="0.9"
        />
      </g>

      {/* เมฆ */}
      <path
        d="M330 55c-10 0-16-6-16-13 0-7 6-11 13-11 .7-9 9-15 18-15s16 6 17 13c8 0 13 6 13 13s-6 13-14 13z"
        fill="#fff"
        opacity="0.9"
      />
      <path
        d="M420 80c-8 0-13-5-13-11 0-6 5-9 11-9 .5-7 7-12 14-12s13 5 14 11c6 0 10 5 10 10s-5 11-11 11z"
        fill="#fff"
        opacity="0.7"
      />

      {/* เมฆฝั่งซ้าย ให้สมดุลกับฝั่งขวาที่มีเมฆ+แมว+เหรียญ */}
      <path
        d="M80 72c-10 0-16-6-16-13 0-7 6-11 13-11 .7-9 9-15 18-15s16 6 17 13c8 0 13 6 13 13s-6 13-14 13z"
        fill="#fff"
        opacity="0.8"
      />

      {/* กลุ่มดอกซากุระนิ่งๆ ไว้มุมบนซ้าย ห่างจากตำแหน่งแมวที่อยู่ขวา กันทับกัน */}
      <SakuraFlower x={38} y={28} scale={1} rotation={10} color="#FFD3E2" />
      <SakuraFlower x={56} y={18} scale={0.75} rotation={-25} color="#FFFFFF" />
      <SakuraFlower x={66} y={38} scale={0.6} rotation={40} color="#FFB3CD" />
      <SakuraFlower x={24} y={46} scale={0.65} rotation={-10} color="#FFC9DC" />
    </svg>
  );
}
