export function LoginScene() {
  return (
    <svg
      className="login-scene"
      viewBox="0 0 480 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lg-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A3782" />
          <stop offset=".45" stopColor="#4558AD" />
          <stop offset="1" stopColor="#34418C" />
        </linearGradient>
        <linearGradient id="lg-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#78C2F4" />
          <stop offset=".7" stopColor="#C9E7FB" />
          <stop offset="1" stopColor="#EAF5FD" />
        </linearGradient>
        <linearGradient id="lg-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DDB483" />
          <stop offset=".06" stopColor="#C99A68" />
          <stop offset="1" stopColor="#9F7048" />
        </linearGradient>
        <linearGradient id="lg-fuji" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7C8FD8" />
          <stop offset="1" stopColor="#A9B8EA" />
        </linearGradient>
        <clipPath id="lg-win">
          <rect x="20" y="92" width="214" height="204" rx="9" />
        </clipPath>
        <filter id="lg-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width="480" height="800" fill="url(#lg-wall)" />
      <ellipse
        cx="130"
        cy="200"
        rx="200"
        ry="150"
        fill="#9CC8FF"
        opacity=".16"
        filter="url(#lg-blur)"
      />
      <rect x="12" y="84" width="230" height="222" rx="14" fill="#1E2A66" />
      <g clipPath="url(#lg-win)">
        <rect x="20" y="92" width="214" height="204" fill="url(#lg-glass)" />
        <path
          d="M36 272 L96 208 Q118 186 140 208 L200 272Z"
          fill="url(#lg-fuji)"
        />
        <path
          d="M96 208 Q118 186 140 208 L154 222 L145 219 L138 227 L129 220 L120 229 L111 221 L102 228 L94 220 L82 222Z"
          fill="#fff"
        />
        <g fill="#5F72C6">
          <rect x="150" y="242" width="14" height="40" />
          <rect x="166" y="254" width="12" height="30" />
          <rect x="180" y="234" width="16" height="48" />
          <rect x="198" y="256" width="14" height="28" />
        </g>
      </g>
      <g>
        <rect x="262" y="84" width="132" height="96" rx="5" fill="#1E2A66" />
        <rect x="268" y="90" width="120" height="84" rx="2" fill="#BFE0FA" />
        <path
          d="M268 150 L316 116 Q328 108 340 116 L388 150 V174 H268Z"
          fill="#8D9FE0"
        />
        <path
          d="M316 116 Q328 108 340 116 L344 120 L336 118 L330 124 L323 118 L318 122Z"
          fill="#fff"
        />
        <rect x="410" y="90" width="48" height="84" rx="3" fill="#FBF8F1" />
        <rect x="410" y="90" width="48" height="6" fill="#E5566F" />
        <text
          x="434"
          y="134"
          textAnchor="middle"
          fontSize="34"
          fill="#1E2A66"
          fontFamily="Yomogi, serif"
        >
          夢
        </text>
        <text
          x="434"
          y="166"
          textAnchor="middle"
          fontSize="28"
          fill="#5568E0"
          fontFamily="Yomogi, serif"
        >
          旅
        </text>
      </g>
      <path d="M0 308 H480 V800 H0Z" fill="url(#lg-desk)" />
      <path d="M0 308 H480" stroke="#F0CFA3" strokeWidth="3" opacity=".9" />
    </svg>
  );
}
