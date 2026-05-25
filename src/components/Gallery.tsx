import { TouchEvent, useRef, useState } from "react";
import { PhotoItem } from "../types";

interface GalleryProps {
  photos: PhotoItem[];
}

export default function Gallery({ photos }: GalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] ?? null : null;

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  const openPhoto = (photoIndex: number) => {
    setActivePhotoIndex(photoIndex);
  };

  const closePhoto = () => {
    setActivePhotoIndex(null);
  };

  const showPreviousPhoto = () => {
    if (!photos.length) return;
    setActivePhotoIndex((currentIndex) => {
      if (currentIndex === null) return 0;
      return (currentIndex - 1 + photos.length) % photos.length;
    });
  };

  const showNextPhoto = () => {
    if (!photos.length) return;
    setActivePhotoIndex((currentIndex) => {
      if (currentIndex === null) return 0;
      return (currentIndex + 1) % photos.length;
    });
  };

  const handleLightboxTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleLightboxTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const touchStartX = touchStartXRef.current;
    const touchEndX = event.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;

    if (touchStartX === null || touchEndX === null) {
      return;
    }

    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) < 40) {
      return;
    }

    if (swipeDistance < 0) {
      showNextPhoto();
      return;
    }

    showPreviousPhoto();
  };

  return (
    <div className="w-full relative py-2" id="gallery-component">
      <div className="absolute top-0 left-0 right-0 h-1 border-b-2 border-dashed border-[#FEF08A] flex justify-between px-10 pointer-events-none select-none z-10">
        <span className="text-xl -mt-3.5 transform rotate-3 select-none">👕</span>
        <span className="text-xl -mt-4 transform -rotate-6 select-none">🌼</span>
        <span className="text-xl -mt-3.5 transform rotate-12 select-none">🧦</span>
        <span className="text-xl -mt-4 transform -rotate-6 select-none">🧸</span>
        <span className="text-xl -mt-3 transform rotate-6 select-none">🎈</span>
      </div>

      <div className="flex items-center justify-between gap-1 mb-4 pt-4">
        <div>
          <h4 className="font-fredoka font-black text-lg text-[#854D0E] leading-tight">
            📸 12 Meses de Amor & Descobertas
          </h4>
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider font-sans mt-0.5">
            Acompanhe o crescimento do nosso garoto!
          </p>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={scrollLeft}
            type="button"
            className="w-8 h-8 bg-[#FEF08A]/30 hover:bg-[#FEF08A] text-[#854D0E] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer font-black border border-white"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            type="button"
            className="w-8 h-8 bg-[#FEF08A]/30 hover:bg-[#FEF08A] text-[#854D0E] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer font-black border border-white"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex overflow-x-auto gap-4 py-3 px-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {photos && photos.length > 0 ? (
          photos.map((photo, index) => (
            <div
              key={photo.id}
              className="flex-none w-[240px] snap-center bg-white rounded-3xl p-3 shadow-md border-4 border-[#FEF08A]/40 transform hover:-rotate-1 transition-all"
            >
              <div
                onClick={() => openPhoto(index)}
                className="w-full h-48 bg-gray-50 rounded-2xl overflow-hidden relative cursor-pointer border border-[#FEF08A]/30"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-[#FEF08A] rounded-full py-0.5 px-2.5 text-[9px] uppercase tracking-wider font-black text-[#854D0E] shadow-sm border border-white">
                  {photo.month || `Mes ${index + 1}`}
                </div>
              </div>

              <p className="font-sans text-xs font-semibold text-[#854D0E] line-clamp-2 leading-relaxed text-center mt-2.5">
                {photo.caption}
              </p>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-10 bg-white rounded-[32px] border-4 border-dashed border-[#FEF08A]">
            <span className="text-4xl block mb-2">📸</span>
            <span className="text-xs text-[#854D0E] font-bold">Nenhuma foto adicionada ainda.</span>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {(photos || []).map((_, idx) => (
          <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#FEF08A]" />
        ))}
      </div>

      {activePhoto && (
        <div
          onClick={closePhoto}
          className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in"
          id="lightbox"
        >
          <div
            className="max-w-md w-full flex flex-col gap-3 relative"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <button
              onClick={closePhoto}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            >
              ×
            </button>
            <button
              type="button"
              onClick={showPreviousPhoto}
              className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white shadow-lg transition-colors hover:bg-white/35"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNextPhoto}
              className="absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white shadow-lg transition-colors hover:bg-white/35"
            >
              ›
            </button>
            <div className="bg-white rounded-[40px] p-4 overflow-hidden shadow-2xl border-4 border-[#FEF08A]">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[65vh] object-contain rounded-3xl"
              />
              <p className="p-4 text-center text-sm font-fredoka font-black text-[#854D0E]">
                {activePhoto.caption}
              </p>
              <p className="pb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                Deslize para trocar de foto
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
