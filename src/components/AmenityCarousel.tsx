import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

export interface AmenityCarouselProps {
  images: string[];
  bookingPath: string;
  bookingLabel: string;
  sectionTitle: string;
}

function clampIndex(idx: number, len: number): number {
  if (len <= 0) return 0;
  return ((idx % len) + len) % len;
}

const carouselStyles = `
  @keyframes progress-fill {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  .progress-bar-fill {
    transform-origin: left;
    animation: progress-fill 3s linear forwards;
  }
  .carousel-slide {
    position: absolute;
    inset: 0;
    will-change: opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .carousel-slide.active   { opacity: 1; z-index: 2; }
  .carousel-slide.inactive { opacity: 0; z-index: 1; }
`;

export default function AmenityCarousel({
  images,
  bookingPath,
  bookingLabel,
  sectionTitle,
}: AmenityCarouselProps) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const imagesCount = safeImages.length;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [animKey, setAnimKey] = useState<number>(0); // resets progress animation
  /** Browser timers are numeric IDs; Node typings can widen to `Timeout`. */
  const timerRef = useRef<number | null>(null);

  const pause = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    pause();
    if (imagesCount <= 1) return;

    // Reset the countdown fill so it starts from zero after resume.
    setAnimKey((k) => k + 1);

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => clampIndex(prev + 1, imagesCount));
      setAnimKey((k) => k + 1);
    }, 3000);
  }, [imagesCount, pause]);

  useEffect(() => {
    start();
    return () => pause();
  }, [start, pause]);

  const handleDotClick = (idx: number) => {
    setCurrentIndex(clampIndex(idx, imagesCount));
    setAnimKey((k) => k + 1);
    start(); // reset interval so it doesn't fire immediately
  };

  const isReady = imagesCount > 0;

  return (
    <section className="py-24 bg-white">
      <style>{carouselStyles}</style>

      <div className="max-w-7xl mx-auto px-4">
        {/* Decorative gold rule */}
        <div className="flex items-center gap-6 mb-12 justify-center">
          <span className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-amber-400/60" />
          <h2 className="text-4xl font-serif text-center tracking-wide">
            {sectionTitle}
          </h2>
          <span className="flex-1 max-w-[120px] h-px bg-gradient-to-l from-transparent to-amber-400/60" />
        </div>

        <div
          className="amenity-carousel relative overflow-hidden rounded-2xl shadow-2xl shadow-black/20 h-[420px] md:h-[560px]"
        >
          {/* Slides — crossfade */}
          {isReady &&
            safeImages.map((src, idx) => {
              const isActive = idx === currentIndex;

              return (
                <div
                  key={`${src}-${idx}`}
                  className={`carousel-slide ${isActive ? "active" : "inactive"}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    decoding="async"
                    loading={idx === 0 ? "eager" : "lazy"}
                    fetchPriority={idx === 0 ? "high" : undefined}
                    onError={(e) => {
                      // If a specific image path fails, try the next one.
                      const target = e.currentTarget;
                      const triesRaw = target.dataset.errorTries;
                      const tries = Number(triesRaw ?? "0");

                      if (imagesCount <= 1) return;
                      if (tries >= imagesCount - 1) return;

                      const nextIndex = clampIndex(idx + tries + 1, imagesCount);
                      target.dataset.errorTries = String(tries + 1);
                      target.src = safeImages[nextIndex];
                    }}
                  />
                </div>
              );
            })}

          {/* Bottom vignette */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />

          {/* Frosted-glass CTA + progress dots */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-5 pb-6 px-4">
            <Link
              to={bookingPath}
              className="
                group relative overflow-hidden
                px-8 py-4 rounded-full
                text-sm font-medium tracking-[0.12em] uppercase
                text-white
                border border-white/30
                backdrop-blur-sm bg-white/10
                transition-all duration-300
                hover:bg-white hover:text-gray-900 hover:border-white
                hover:shadow-lg hover:shadow-black/30
              "
            >
              {bookingLabel}
            </Link>

            {/* Progress-bar dots */}
            <div className="flex items-center justify-center gap-2">
              {safeImages.map((_, idx) => {
                const isActive = idx === currentIndex;

                return (
                  <button
                    key={`indicator-${idx}`}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => handleDotClick(idx)}
                    className="focus:outline-none"
                  >
                    {isActive ? (
                      <span className="relative w-4 h-2 rounded-full bg-gray-300/60 overflow-hidden block transition-all duration-300 ease-in-out">
                        <span
                          key={animKey}
                          className="progress-bar-fill absolute inset-0 bg-gray-800 rounded-full"
                        />
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300 block transition-all duration-300 ease-in-out" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

