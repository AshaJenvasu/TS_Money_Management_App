import { ReactLenis } from "lenis/react";

export function SmoothScroll() {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
      }}
    />
  );
}
