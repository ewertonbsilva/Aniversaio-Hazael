import { useEffect, useRef, useState } from "react";
import { Sparkles, MapPin, Calendar, Clock, Heart, Sliders, Settings, Volume2, VolumeX } from "lucide-react";
import { PartyConfig, RsvpEntry } from "./types";
import Countdown from "./components/Countdown";
import RsvpForm from "./components/RsvpForm";
import Gifts from "./components/Gifts";
import Gallery from "./components/Gallery";
import AdminPanel from "./components/AdminPanel";
import babyLooneyTunesVideo from "../Baby-Looney-Tunes.mp4";

export default function App() {
  const [config, setConfig] = useState<PartyConfig | null>(null);
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoMutedRef = useRef(true);
  const audioInteractionHandledRef = useRef(false);

  // Fetch all database records
  const loadData = async () => {
    try {
      const [configRes, rsvpsRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/rsvps")
      ]);
      if (configRes.ok && rsvpsRes.ok) {
        const configData = await configRes.json();
        const rsvpsData = await rsvpsRes.json();
        setConfig(configData);
        setRsvps(rsvpsData);
      }
    } catch (err) {
      console.error("Erro ao comunicar com o servidor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    document.title = "Aniversário do Hazael";
  }, []);

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

  // Helper inside PT-BR for party date
  const formatPartyDateLong = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    // Since we are setting for July 25, 2026, let's render it styled
    const dateObj = new Date(year, month - 1, day);
    const weekdays = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro"
    ];
    return `${weekdays[dateObj.getDay()]}, ${day} de ${months[dateObj.getMonth()]} de ${year}`;
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" id="app-loading">
        <div className="relative flex flex-col items-center">
          {/* Pulsing loading cloud */}
          <div className="w-24 h-16 bg-sky-100 rounded-full blur-xs animate-bounce opacity-80" />
          <p className="font-fredoka text-amber-600 mt-4 animate-pulse">Carregando fofura... 🍼💛</p>
        </div>
      </div>
    );
  }

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

      {/* CORE WRAPPER CONTROLLING THE MOBILE CONTAINER FLOW */}
      <div className="w-full max-w-md mx-auto px-4 py-6 relative z-10 flex flex-col gap-6 items-center">
        
        {/* ==========================================================
            SEÇÃO HERO CARD DO BEBÊ
            ========================================================== */}
        <section id="home-section" className="w-full bg-[#E0F2FE] rounded-[48px] border-8 border-white shadow-xl relative flex flex-col items-center p-6 overflow-hidden shrink-0">
          {/* Ambient glowing blobs */}
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

          {/* Countdown timer component in hero card */}
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

        {/* ==========================================================
            CONTEÚDOS E SEÇÕES INTERATIVAS EM FORMULÁRIO VERTICAL ÚNICO
            ========================================================== */}
        <div className="w-full flex flex-col gap-6">
          
          {/* ==========================================================
              SEÇÃO: ONDE E QUANDO (A FESTA - TURQUESA)
              ========================================================== */}
          <section id="location-section" className="bg-[#CCFBF1] rounded-[40px] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border-4 border-white shadow-md text-[#134E4A]">
            <div className="flex justify-between items-start gap-2 mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-fredoka font-black text-[#134E4A] leading-tight">
                  📅 Onde e Quando?
                </h3>
                <p className="text-[10px] uppercase font-bold text-[#134E4A]/70 tracking-wider">
                  Reserve esta data maravilhosa para comemorarmos juntos!
                </p>
              </div>
              <span className="text-4xl animate-sway">🕒</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-lg sm:text-xl font-black text-[#134E4A] font-fredoka">
                  {formatPartyDateLong(config.partyDate)}
                </p>
                <p className="text-sm font-bold text-[#134E4A]/80 mt-0.5">
                  Às {config.partyTime || "18:00"}h — Pontualidade do Piu-Piu!
                </p>
              </div>

              <div className="bg-white/55 rounded-3xl p-4 border border-white/60">
                <p className="text-[10px] text-[#134E4A]/80 font-bold uppercase tracking-wider mb-1">Local do Encontro</p>
                <p className="text-xs sm:text-sm font-bold text-[#134E4A]">
                  {config.address || "R. Major Martins, 208 - Parque dos Sabiás, Rio Branco - AC"}
                </p>
              </div>

              <div className="bg-white/85 border border-[#BAE6FD]/40 p-4 rounded-3xl text-xs text-[#134E4A]/90 leading-relaxed font-semibold">
                <span className="font-fredoka font-black text-[#EA580C] text-sm block mb-1">
                  🐥 Recado Importante:
                </span>
                <blockquote>
                  "Eu acho que vi um... convidado super pontual!" Nosso parabéns tem hora marcada para que todos possam aproveitar as brincadeiras e os docinhos do início ao fim. Contamos com a sua presença pontual para não perder nenhum clique especial!
                </blockquote>
              </div>

              {/* GPS routing links */}
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-50 text-[#134E4A] text-xs font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-xs border border-white hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer uppercase tracking-wider text-center"
                >
                  📍 Google Maps
                </a>
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(config.address)}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-50 text-[#134E4A] text-xs font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-xs border border-white hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer uppercase tracking-wider text-center"
                >
                  🚗 Waze Rotas
                </a>
              </div>
            </div>
          </section>

          {/* ==========================================================
              SEÇÃO: CONFIRMAÇÃO DE PRESENÇA (RSVP - LARANJA)
              ========================================================== */}
          <section id="rsvp-section" className="bg-[#FFEDD5] rounded-[40px] border-4 border-white shadow-md p-0.5 overflow-hidden">
            <RsvpForm 
              rsvpDeadline={config.rsvpDeadline || "2026-07-01"} 
              onSuccess={loadData} 
            />
          </section>

          {/* ==========================================================
              SEÇÃO: PREFERÊNCIAS DE TAMANHO & PRESENTES (AMARELO)
              ========================================================== */}
          <section id="sizes-section" className="order-2 w-full">
            <Gifts
              clothingSize="2 anos"
              shoeSize="22"
              toySuggestion="Interativos"
              giftNote="Uma dica carinhosa: amamos looks mais moderninhos, com cores neutras e estampas nao muito chamativas."
              pixKey={config.pixKey || "ewerton.bezerra.silva@gmail.com"}
            />
          </section>

          {/* ==========================================================
              SEÇÃO: MURAL DE FOTOS / GALERIA DE FOTOS
              ========================================================== */}
          <section id="photos-section" className="order-1 bg-white border-4 border-white rounded-[40px] p-6 sm:p-8 shadow-md">
            <Gallery photos={config.photos || []} />
          </section>

          {/* ==========================================================
              SEÇÃO: RODAPÉ DE AGRADECIMENTO
              ========================================================== */}
          <footer className="order-3 bg-white rounded-[40px] border-4 border-[#BAE6FD] p-8 text-center space-y-6 relative overflow-hidden shadow-md">
            {/* Custom bottom decorative color strip */}
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-sky-300 via-yellow-250 to-orange-200 opacity-80" />

            {/* Mascot emojis line */}
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
              
              {/* Parent admin trigger button */}
              <button
                onClick={() => setShowAdmin(true)}
                className="text-gray-500 hover:text-gray-800 font-bold py-2 px-4 bg-slate-100 rounded-full flex items-center gap-1.5 cursor-pointer select-none transition-colors"
                id="admin-trigger-button"
              >
                <Settings className="w-3.5 h-3.5" /> Painel de Controle dos Pais
              </button>
            </div>
          </footer>

        </div>

      </div>

      {/* RENDER THE SECURE PARENT DASHBOARD AS OVERLAY WRAPPER */}
      {showAdmin && (
        <AdminPanel
          config={config}
          rsvps={rsvps}
          onRefreshData={loadData}
          onClose={() => setShowAdmin(false)}
        />
      )}

    </div>
  );
}
