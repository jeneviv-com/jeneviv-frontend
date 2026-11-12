import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Lays children out at their real size, then scales them down to the width
 * available. Used so the laptop shows the dashboard at true proportions
 * instead of a cramped hand-made miniature.
 */
export default function ScaledFrame({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}
