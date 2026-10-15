export function DashboardMascot() {
  return (
    <div className="pointer-events-none relative mx-auto flex h-28 items-end justify-center">
      {/* Floating Coin */}
      {/* <div className="absolute right-10 top-1 animate-bounce text-3xl">🪙</div> */}

      {/* Cat */}
      <svg
        viewBox="0 0 160 120"
        className="h-24 w-32 overflow-visible"
        aria-label="Cute cat mascot waving"
        role="img"
      >
        {/* Tail */}
        <path
          d="M112 91 Q145 92 137 65"
          fill="none"
          stroke="#F5A66A"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Body */}
        <ellipse cx="80" cy="87" rx="39" ry="28" fill="#FFF5E8" />
        <ellipse cx="80" cy="94" rx="20" ry="17" fill="#F5D7B8" />

        {/* Ears */}
        <path d="M43 43 L38 14 L65 31Z" fill="#FFF5E8" />
        <path d="M95 31 L122 14 L117 44Z" fill="#FFF5E8" />
        <path d="M45 34 L43 22 L57 32Z" fill="#F3A5B9" />
        <path d="M103 32 L117 22 L115 35Z" fill="#F3A5B9" />

        {/* Face */}
        <ellipse cx="80" cy="53" rx="42" ry="35" fill="#FFF5E8" />

        {/* Eyes */}
        <ellipse cx="65" cy="51" rx="3.5" ry="5" fill="#51445D" />
        <ellipse cx="94" cy="51" rx="3.5" ry="5" fill="#51445D" />

        {/* Nose and mouth */}
        <path
          d="M76 60 Q80 64 84 60"
          fill="none"
          stroke="#D98291"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M80 61 V65 Q75 70 72 66 M80 65 Q85 70 88 66"
          fill="none"
          stroke="#51445D"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Cheeks */}
        <ellipse cx="55" cy="61" rx="8" ry="4" fill="#F6B6C6" opacity=".8" />
        <ellipse cx="105" cy="61" rx="8" ry="4" fill="#F6B6C6" opacity=".8" />

        {/* Waving paw */}
        <g
          className="dashboard-cat-wave"
          style={{ transformOrigin: "108px 75px" }}
        >
          <path
            d="M105 79 Q119 65 116 45"
            fill="none"
            stroke="#FFF5E8"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <ellipse cx="116" cy="43" rx="9" ry="10" fill="#FFF5E8" />
          <path
            d="M112 39 L114 35 M118 39 L120 35"
            stroke="#F3A5B9"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Paws */}
        <ellipse cx="57" cy="105" rx="12" ry="7" fill="#FFF5E8" />
        <ellipse cx="100" cy="105" rx="12" ry="7" fill="#FFF5E8" />
      </svg>
    </div>
  );
}
