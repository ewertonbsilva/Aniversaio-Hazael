import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, Settings } from "lucide-react";
import { PartyConfig } from "../types";
import Countdown from "./Countdown";
import Gallery from "./Gallery";
import AdminPanel from "./AdminPanel";
import babyLooneyTunesVideo from "../../Baby-Looney-Tunes.mp4";

interface MinimalPageProps {
  config: PartyConfig;
  rsvps: any[];
  onRefreshData: () => void;
}

export default function MinimalPage({ config, rsvps, onRefreshData }: MinimalPageProps) {
  const [videoMuted, setVideoMuted] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoMutedRef = useRef(true);
  const audioInteractionHandledRef = useRef(false);

  useEffect(() => {
    videoMutedRef.current = videoMuted;
  }, [videoMuted]);

  const setVideoAudioMutedState = async (muted: boolean) => {
    const videoElement = backgroundVideoRef.current;
    videoMutedRef.current = muted;
    setVideoMuted(muted);

    if (!videoElement) {
      return;
    }

    videoElement.muted = muted;

    if (!muted) {
      try {
        await videoElement.play();
      } catch (error) {
        console.error("Nao foi possivel ativar o audio do video:", error);
      }
    }
  };

  useEffect(() => {
    const activateVideoAudioOnFirstInteraction = async () => {
      const videoElement = backgroundVideoRef.current;
      if (!videoElement || audioInteractionHandledRef.current || !videoMutedRef.current) {
        return;
      }

      audioInteractionHandledRef.current = true;
      await setVideoAudioMutedState(false);
    };

    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "touchstart"];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, activateVideoAudioOnFirstInteraction, { once: true });
    });

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, activateVideoAudioOnFirstInteraction);
      });
    };
  }, []);

  const toggleVideoAudio = async () => {
    audioInteractionHandledRef.current = true;
    await setVideoAudioMutedState(!videoMutedRef.current);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-gray-800 font-sans relative pb-12 select-none overflow-x-hidden" id="guest-root">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          ref={backgroundVideoRef}
          autoPlay
          loop
          muted={videoMuted}
          playsInline
          className="h-full w-full object-cover"
        >
          <source src={babyLooneyTunesVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(253,252,248,0.16)_0%,rgba(253,252,248,0.58)_38%,rgba(253,252,248,0.88)_100%)]" />
      </div>

      <div className="fixed bottom-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleVideoAudio}
          className={`group flex items-center gap-3 rounded-full border px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.24em] shadow-[0_16px_45px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
            videoMuted
              ? "border-white/80 bg-white/88 text-sky-900"
              : "border-amber-200/90 bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-200 text-amber-950"
          }`}
          aria-label={videoMuted ? "Ativar som do video" : "Desativar som do video"}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
              videoMuted
                ? "border-sky-100 bg-sky-50 text-sky-700"
                : "border-amber-100 bg-white/80 text-amber-700"
            }`}
          >
            {videoMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-bold tracking-[0.28em] opacity-65">
              Baby Looney Tunes
            </span>
            <span className="mt-1 tracking-[0.18em]">
              {videoMuted ? "Ativar som" : "Som ligado"}
            </span>
          </span>
        </button>
      </div>

      {/* BACKGROUND FLOATING ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <span className="absolute top-[10%] left-[5%] text-2xl animate-float opacity-45">🎈</span>
        <span className="absolute top-[25%] right-[5%] text-3xl animate-float-delayed opacity-35">☁️</span>
        <span className="absolute top-[42%] left-[4%] text-xl animate-float opacity-30">⭐</span>
        <span className="absolute top-[60%] right-[6%] text-2xl animate-float-delayed opacity-45">🥕</span>
        <span className="absolute top-[75%] left-[5%] text-3xl animate-float opacity-40">🍼</span>
        <span className="absolute top-[90%] right-[8%] text-2xl animate-float-delayed opacity-40">🎈</span>
      </div>

      <div className="w-full max-w-md mx-auto px-4 py-6 relative z-10 flex flex-col gap-6 items-center">
        {/* CRONOMETRO SECTION */}
        <section id="countdown-section" className="w-full bg-[#E0F2FE] rounded-[48px] border-8 border-white shadow-xl relative flex flex-col items-center p-6 overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/40 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-20 -right-10 w-32 h-32 bg-[#FEF08A]/50 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 text-center mb-6">
            <p className="text-[#0369A1] font-bold tracking-widest text-xs uppercase mb-1.5">Hazael Oliveira Silva</p>
            <h1 className="text-3xl font-fredoka font-black text-[#0369A1] leading-tight drop-shadow-xs">
              O que é que há,<br />velhinho? 🥕✨
            </h1>
          </div>

          <div className="relative w-52 h-52 mb-6 select-none z-10">
            <div className="absolute inset-0 bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden border-4 border-[#BAE6FD]">
              <img
                src={config.mainPhoto || config.photos?.[0]?.url || "/src/assets/images/baby_hazael_portrait_1779399080097.png"}
                alt="Nosso Baby Hazael"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[#FEF08A] rounded-full flex items-center justify-center border-4 border-white shadow-lg text-2xl animate-float">
              🎂
            </div>
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-[#FFEDD5] rounded-full flex items-center justify-center border-4 border-white shadow-lg text-xl animate-float-delayed">
              ✨
            </div>
          </div>

          <div className="w-full z-10">
            <Countdown
              targetDate={config.partyDate || "2026-07-25"}
              targetTime={config.partyTime || "18:00"}
            />
          </div>

          <div className="mt-6 text-center z-10">
            <p className="text-[#0369A1] italic text-xs font-semibold max-w-[280px] mx-auto leading-relaxed">
              "Segurem os corações, a fofura de 1 aninho está prestes a começar!"
            </p>
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section id="photos-section" className="bg-white border-4 border-white rounded-[40px] p-6 sm:p-8 shadow-md w-full">
          <Gallery photos={config.photos || []} />
        </section>

        {/* FOOTER */}
        <footer className="bg-white rounded-[40px] border-4 border-[#BAE6FD] p-8 text-center space-y-6 relative overflow-hidden shadow-md w-full">
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-sky-300 via-yellow-250 to-orange-200 opacity-80" />

          <div className="text-4xl select-none animate-float tracking-widest">
            🐣🐰🦁🦆🌈
          </div>

          <div className="space-y-2 relative z-10">
            <h3 className="font-fredoka font-black text-base text-sky-800 uppercase tracking-widest">
              Muito obrigado por fazer parte!
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto font-sans font-medium">
              Estamos ansiosos para comemorar, sorrir, registrar memórias e abraçar cada um de vocês. Venham de coração aberto brincar conosco de montão!
            </p>
            <p className="font-fredoka font-black text-amber-700 text-base pt-2">
              Com muito amor,<br />
              <span className="text-sm font-sans font-bold text-gray-800">Ewerton, Raiane e Hazael 🥕</span>
            </p>
          </div>

          <div className="pt-4 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-gray-400 font-sans font-semibold border-t border-gray-150">
            <span>© 2026 - Primeiro Aninho do Hazael Oliveira</span>

            <button
              onClick={() => setShowAdmin(true)}
              className="text-gray-500 hover:text-gray-800 font-bold py-2 px-4 bg-slate-100 rounded-full flex items-center gap-1.5 cursor-pointer select-none transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Painel de Controle dos Pais
            </button>
          </div>
        </footer>
      </div>

      {showAdmin && (
        <AdminPanel
          config={config}
          rsvps={rsvps}
          onRefreshData={onRefreshData}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
