import { useEffect, useState } from "react";

const PETALS = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 13) % 100}%`,
  duration: `${11 + (i % 5) * 1.7}s`,
  delay: `${-i * 2.3}s`,
  drift: `${((i % 3) - 1) * 45}px`,
  size: 10 + (i % 3) * 4,
}));

function SakuraPetal({ color = "currentColor" }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill={color} aria-hidden="true">
      <path d="M10 2C15 5 17 11 12 17.5L10 15.5 8 17.5C3 11 5 5 10 2Z" />
    </svg>
  );
}

export function DashboardScene() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <>
      <svg
        className="pointer-events-none absolute left-0 top-0 -z-10 h-[360px] w-full"
        viewBox="0 0 480 360"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6DB6F2" />
            <stop offset="40%" stopColor="#AAD6F8" />
            <stop offset="72%" stopColor="#DCEAFA" />
            <stop offset="100%" stopColor="#E3D9F6" />
          </linearGradient>
          <linearGradient id="scene-mountain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8AA5E8" />
            <stop offset="100%" stopColor="#BACAF1" />
          </linearGradient>
          <linearGradient id="scene-lake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9EC6EA" />
            <stop offset="100%" stopColor="#E3D9F6" />
          </linearGradient>
        </defs>

        <rect width="480" height="360" fill="url(#scene-sky)" />
        <circle cx="400" cy="70" r="85" fill="#FFF" opacity=".22" />

        <g fill="#FFF" opacity=".8">
          <path d="M12 116c-3-18 17-26 31-17 10-22 39-19 45 2 18-2 27 12 21 25H23c-7 0-11-4-11-10Z" />
          <path
            d="M314 148c-2-12 12-20 23-12 7-15 27-14 32 1 13-2 21 8 16 18h-62c-6 0-9-3-9-7Z"
            opacity=".7"
          />
        </g>

        <path
          d="M0 214 48 184 96 206 150 178 214 212 280 188 346 214 412 190 480 208V260H0Z"
          fill="#9FB8E2"
          opacity=".7"
        />
        <path
          d="M140 232 214 150Q240 124 266 150L340 232Z"
          fill="url(#scene-mountain)"
        />
        <path
          d="M214 150Q240 124 266 150L280 164 270 161 262 170 251 162 240 172 229 163 220 171 211 162 200 164Z"
          fill="#FFF"
        />
        <path
          d="M0 228Q60 206 130 222T260 224T400 220T480 226V360H0Z"
          fill="url(#scene-lake)"
        />

        <g fill="none" stroke="#8A5A6B" strokeLinecap="round" strokeWidth="5">
          <path d="M492 30C460 44 424 34 392 8" />
          <path d="M440 36C444 54 458 64 478 68" strokeWidth="3" />
        </g>

        <g fill="#FFC6DA">
          {Array.from({ length: 15 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${405 + (i % 5) * 15} ${15 + Math.floor(i / 5) * 16}) rotate(${i * 29}) scale(.65)`}
            >
              <path d="M0 0C-5-4-5-10-1-12 0-11 1-11 2-12 6-10 5-4 0 0Z" />
            </g>
          ))}
        </g>
      </svg>

      {!reducedMotion && (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-0 h-[560px] overflow-hidden">
          {PETALS.map((petal) => (
            <div
              key={petal.id}
              className="dashboard-petal absolute -top-6"
              style={{
                left: petal.left,
                width: petal.size,
                height: petal.size,
                animationDuration: petal.duration,
                animationDelay: petal.delay,
                ["--petal-drift" as string]: petal.drift,
              }}
            >
              <SakuraPetal color="#FFC6DA" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
