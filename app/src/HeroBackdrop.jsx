import { useEffect, useRef } from "react";

/** Uses the same optimized video and poster as the welcome screen. */
export default function HeroBackdrop() {
  const videoRef = useRef(null);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = true;
      if (motion.matches) video.pause();
      else video.play().catch(() => {});
    };
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <video ref={videoRef} src={`${import.meta.env.BASE_URL}welcome-abstract-loop.mp4`} poster={`${import.meta.env.BASE_URL}welcome-abstract-poster.png`} muted loop playsInline preload="auto" tabIndex={-1} />
    </div>
  );
}
