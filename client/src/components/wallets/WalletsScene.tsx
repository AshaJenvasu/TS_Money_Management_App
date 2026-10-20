interface WalletsSceneProps {
  className?: string;
}

// วาดฉากภูเขาและต้นซากุระสำหรับหน้า Wallets
export function WalletsScene({ className = "" }: WalletsSceneProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMin slice"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wallets-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8DFFA" />
            <stop offset="100%" stopColor="#F0E6FA" />
          </linearGradient>
          <linearGradient id="wallets-mountain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B4D8EE" />
            <stop offset="100%" stopColor="#D5C9F0" />
          </linearGradient>
        </defs>

        <rect width="480" height="300" fill="url(#wallets-sky)" />

        {/* วาดภูเขาซ้อนชั้นให้ฉากดูนุ่มนวล */}
        <path
          d="M0 175 L70 105 L115 150 L190 75 L285 175 L355 105 L480 185 V300 H0 Z"
          fill="#D9D7F4"
          opacity="0.8"
        />
        <path
          d="M0 215 L95 145 L160 205 L270 120 L365 210 L430 155 L480 190 V300 H0 Z"
          fill="url(#wallets-mountain)"
        />
        <path
          d="M0 245 Q100 190 190 240 T360 225 T480 245 V300 H0 Z"
          fill="#C7D8EC"
          opacity="0.85"
        />

        {/* เพิ่มกิ่งซากุระประดับมุมขวาบน */}
        <g stroke="#997CA8" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M500 -12 Q435 20 405 62 T350 105" />
          <path d="M445 23 Q438 4 425 -2" />
          <path d="M405 62 Q420 60 431 46" />
          <path d="M380 82 Q360 65 358 48" />
        </g>

        {/* วาดดอกซากุระด้วยกลีบสีชมพู */}
        {[
          [425, 14],
          [402, 43],
          [438, 52],
          [377, 65],
          [357, 92],
          [392, 91],
          [452, 28],
        ].map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            {Array.from({ length: 5 }, (_, petal) => (
              <ellipse
                className="wallets-petal"
                key={petal}
                cx="0"
                cy="-6"
                rx="4.5"
                ry="7"
                fill={index % 2 === 0 ? "#F5BFD9" : "#F9D6E8"}
                transform={`rotate(${petal * 72})`}
              />
            ))}
            <circle r="3" fill="#F6D58D" />
          </g>
        ))}
        {/* เพิ่มกลีบซากุระที่ลอยลงมาตามลม */}
        {[
          { x: 55, delay: "0s", duration: "9s", drift: "24px" },
          { x: 145, delay: "-4s", duration: "12s", drift: "-18px" },
          { x: 250, delay: "-7s", duration: "10s", drift: "20px" },
          { x: 325, delay: "-2s", duration: "11s", drift: "-26px" },
          { x: 455, delay: "-5s", duration: "13s", drift: "16px" },
        ].map((petal, index) => (
          <ellipse
            key={`falling-petal-${index}`}
            cx={petal.x}
            cy="-12"
            rx="4"
            ry="7"
            fill={index % 2 === 0 ? "#F5BFD9" : "#F9D6E8"}
            opacity="0.85"
            style={
              {
                transformBox: "view-box",
                transformOrigin: `${petal.x}px -12px`,
                animation: `wallets-petal-fall ${petal.duration} ${petal.delay} linear infinite`,
                "--petal-drift": petal.drift,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  );
}
