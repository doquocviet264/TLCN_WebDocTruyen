import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MangaSlider (fixed-height version)
 * ------------------------------------------------------
 * Fix: parent track now has an explicit height so absolutely‑positioned
 * slides are visible. No external libs required. Tailwind only.
 */

export type SliderItem = {
  id: string;
  /** background banner image */
  bg: string;
  /** main link for this slide */
  href: string;
  ariaLabel: string;
  /** three foreground images */
  leftImg: string;
  midImg: string;
  rightImg: string;
  /** small tag like: Truyện <span>NHẬT BẢN</span> */
  tagTop: string; // e.g. "Truyện"
  tagBottom: string; // e.g. "NHẬT BẢN"
  /** optional extra class to style per slide (dc-comics, marvel...) */
  className?: string;
};

export type MangaSliderProps = {
  slides?: SliderItem[];
  /** autoplay interval in ms (0 to disable) */
  autoplayMs?: number;
  /** transition duration (ms) */
  durationMs?: number;
  /** enable swipe on touch devices */
  swipe?: boolean;
  /** pause autoplay when mouse is over slider */
  pauseOnHover?: boolean;
  /** className for outer section */
  className?: string;
};

const DEFAULT_SLIDES: SliderItem[] = [
  {
    id: "manga",
    bg: "https://hangtruyen.org/images/home/bg-slide1.png",
    href: "/the-loai/manga",
    ariaLabel: "Nhật Bản",
    leftImg: "https://hangtruyen.org/images/home/mb-11.png",
    midImg: "https://hangtruyen.org/images/home/mb-12.png",
    rightImg: "https://hangtruyen.org/images/home/mb-13.png",
    tagTop: "Truyện",
    tagBottom: "Nhật Bản",
    className: "jp-comics",
  },
  {
    id: "dc",
    bg: "https://hangtruyen.org/images/home/bg-slide2.png",
    href: "/the-loai/dc-comics",
    ariaLabel: "DC Comics",
    leftImg: "https://hangtruyen.org/images/home/mb-21.png",
    midImg: "https://hangtruyen.org/images/home/mb-22.png",
    rightImg: "https://hangtruyen.org/images/home/mb-23.png",
    tagTop: "Truyện",
    tagBottom: "DC COMICS",
    className: "dc-comics",
  },
  {
    id: "kor",
    bg: "https://hangtruyen.org/images/home/bg-slide3.png",
    href: "/the-loai/manhwa",
    ariaLabel: "Hàn Quốc",
    leftImg: "https://hangtruyen.org/images/home/mb-31.png",
    midImg: "https://hangtruyen.org/images/home/mb-32.png",
    rightImg: "https://hangtruyen.org/images/home/mb-33.png",
    tagTop: "Truyện",
    tagBottom: "Hàn Quốc",
    className: "kor-comics",
  },
  {
    id: "marvel",
    bg: "https://hangtruyen.org/images/home/bg-slide4.png",
    href: "/the-loai/marvel-comics",
    ariaLabel: "Marvel Comics",
    leftImg: "https://hangtruyen.org/images/home/mb-41.png",
    midImg: "https://hangtruyen.org/images/home/mb-42.png",
    rightImg: "https://hangtruyen.org/images/home/mb-43.png",
    tagTop: "Truyện",
    tagBottom: "MARVEL COMICS",
    className: "marvel-comics",
  },
  {
    id: "china",
    bg: "https://hangtruyen.org/images/home/bg-slide5.png",
    href: "/the-loai/manhua",
    ariaLabel: "Trung Quốc",
    leftImg: "https://hangtruyen.org/images/home/mb-51.png",
    midImg: "https://hangtruyen.org/images/home/mb-52.png",
    rightImg: "https://hangtruyen.org/images/home/mb-53.png",
    tagTop: "Truyện",
    tagBottom: "TRUNG QUỐC",
    className: "chi-comics",
  },
];

export default function MangaSlider({
  slides = DEFAULT_SLIDES,
  autoplayMs = 5000,
  durationMs = 600,
  swipe = true,
  pauseOnHover = true,
  className = "",

}: MangaSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slidesCount = slides.length;
  const idBase = "splide06"; // keep similar to original for aria-controls
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const go = (next: number) => {
    const normalized = ((next % slidesCount) + slidesCount) % slidesCount;
    setIndex(normalized);
  };

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // autoplay
  useEffect(() => {
    if (autoplayMs <= 0) return;
    if (paused) return;
    timerRef.current && window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      next();
    }, autoplayMs) as unknown as number;
    return () => {
      timerRef.current && window.clearInterval(timerRef.current);
    };
  }, [index, paused, autoplayMs]);

  // keyboard navigation when focused
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  // swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (!swipe) return;
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipe) return;
    touchEndX.current = e.changedTouches[0].clientX;
    if (touchStartX.current == null || touchEndX.current == null) return;
    const delta = touchEndX.current - touchStartX.current;
    const threshold = 40; // px
    if (Math.abs(delta) > threshold) {
      if (delta < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const live = useMemo(() => (paused ? "off" : "polite"), [paused]);

  // Fixed height for the whole slider so absolute slides are visible
  const HEIGHT_CLASSES = "h-[220px] sm:h-[260px] md:h-[320px] lg:h-[380px] xl:h-[420px] 2xl:h-[460px]";

  return (
    <main id="manga-slider" className={`container mx-auto ${className}`}>
      <div
        ref={containerRef}
        tabIndex={0}
        role="group"
        aria-label="Banner"
        aria-roledescription="carousel"
        className="relative select-none"
        onMouseEnter={() => pauseOnHover && setPaused(true)}
        onMouseLeave={() => pauseOnHover && setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Track (fixed-height wrapper so slides are visible) */}
        <div
          id={`${idBase}-track`}
          className={`relative overflow-hidden ${HEIGHT_CLASSES}`}
          aria-live={live as "off" | "polite"}
          aria-atomic="true"
        >
          {/* Slides */}
          <ul
            id={`${idBase}-list`}
            className="list-none m-0 p-0 relative h-full"
            role="presentation"
          >
            {slides.map((s, i) => {
              const isActive = i === index;
              return (
                <li
                  key={s.id}
                  id={`${idBase}-slide${String(i + 1).padStart(2, "0")}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${slidesCount}`}
                  aria-hidden={!isActive}
                  className={[
                    "absolute inset-0 w-full h-full",
                    "transition-opacity",
                    `duration-[${durationMs}ms]`,
                    isActive ? "opacity-100 z-20" : "opacity-0 z-10",
                    s.className || "",
                  ].join(" ")}
                >
                  {/* One slide content */}
                  <div className="relative w-full h-full overflow-hidden rounded-2xl">
                    {/* Background */}
                    <img
                      src={s.bg}
                      alt="banner"
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />

                    {/* Foreground cluster */}
                    <div className="relative z-10 h-full grid grid-cols-3 p-2 md:p-4">
                      {/* Left */}
                      <div className="flex items-end justify-start">
                        <a href={s.href} aria-label={s.ariaLabel} tabIndex={isActive ? 0 : -1}>
                          <img
                            src={s.leftImg}
                            alt=""
                            className="max-h-full object-contain drop-shadow-xl scale-125"
                            draggable={false}
                          />
                        </a>
                      </div>

                      {/* Mid */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="sm-tag text-2xl md:text-sm font-semibold uppercase tracking-wide mb-2 text-white/90">
                          {s.tagTop}
                          <span className="ml-2 text-sky-300">{s.tagBottom}</span>
                        </div>
                        <a href={s.href} aria-label={s.ariaLabel} tabIndex={isActive ? 0 : -1}>
                          <img
                            src={s.midImg}
                            alt=""
                            className="max-h-full object-contain drop-shadow-xl scale-110"
                            draggable={false}
                          />
                        </a>
                      </div>

                      {/* Right */}
                      <div className="flex items-start justify-end">
                        <a href={s.href} aria-label={s.ariaLabel} tabIndex={isActive ? 0 : -1}>
                          <img
                            src={s.rightImg}
                            alt=""
                            className="max-h-full object-contain drop-shadow-xl scale-125"
                            draggable={false}
                          />
                        </a>
                      </div>
                    </div>

                    {/* Subtle overlay to improve text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/10 z-20" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Arrows */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 md:px-4 z-40">
          <button
            className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-full bg-black/40 hover:bg-black/60 text-white shadow border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="Previous slide"
            aria-controls={`${idBase}-track`}
            onClick={prev}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-full bg-black/40 hover:bg-black/60 text-white shadow border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="Next slide"
            aria-controls={`${idBase}-track`}
            onClick={next}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`h-2.5 w-2.5 rounded-full border border-white/10 ${
                i === index ? "bg-black/95" : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-controls={`${idBase}-track`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
