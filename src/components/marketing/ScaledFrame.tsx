"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shows a live page at its real size, scaled to fit the space it sits in.
 * Used for the laptop and phone on the landing page, so they show the app itself.
 */
export default function ScaledFrame({
  src,
  width,
  height,
  title,
}: {
  src: string;
  width: number;
  height: number;
  title: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={box} style={{ position: "relative", width: "100%", height: height * scale, overflow: "hidden" }}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
