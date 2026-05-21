import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // "YYYY-MM-DD"
  targetTime: string; // "HH:MM"
}

export default function Countdown({ targetDate, targetTime }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetStr = `${targetDate}T${targetTime}:00`;
      const target = new Date(targetStr).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  const padZero = (num: number) => String(num).padStart(2, "0");

  if (timeLeft.isOver) {
    return (
      <div className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-md border-2 border-dashed border-sky-300 py-6 max-w-sm mx-auto animate-bounce mt-4" id="countdown-finished">
        <span className="text-2xl font-fredoka font-black text-[#0369A1] text-center">🎉 A festa começou! 🧸🎈</span>
        <span className="text-xs text-[#0369A1]/80 font-sans mt-2 text-center">Já estamos comemorando o primeiro aninho do Hazael!</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto bg-white/60 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-xs mt-4" id="countdown-timer">
      <p className="text-[#0369A1] font-bold text-xs uppercase tracking-widest mb-3 font-sans opacity-80 text-center">
        ⏱️ Faltam apenas...
      </p>
      
      <div className="flex justify-center items-center gap-4 text-center">
        {/* Days */}
        <div className="flex flex-col">
          <span className="text-3xl font-black font-fredoka text-[#0369A1]">
            {padZero(timeLeft.days)}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#0369A1]/60 font-sans">Dias</span>
        </div>

        <span className="text-2xl font-black text-[#0369A1]/35 select-none">:</span>

        {/* Hours */}
        <div className="flex flex-col">
          <span className="text-3xl font-black font-fredoka text-[#0369A1]">
            {padZero(timeLeft.hours)}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#0369A1]/60 font-sans">Horas</span>
        </div>

        <span className="text-2xl font-black text-[#0369A1]/35 select-none">:</span>

        {/* Minutes */}
        <div className="flex flex-col">
          <span className="text-3xl font-black font-fredoka text-[#0369A1]">
            {padZero(timeLeft.minutes)}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#0369A1]/60 font-sans">Mins</span>
        </div>

        <span className="text-2xl font-black text-[#0369A1]/35 select-none">:</span>

        {/* Seconds */}
        <div className="flex flex-col">
          <span className="text-3xl font-black font-fredoka text-[#0369A1] animate-pulse">
            {padZero(timeLeft.seconds)}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#0369A1]/60 font-sans">Segs</span>
        </div>
      </div>
      
      <p className="text-xs font-medium text-center text-[#0369A1]/70 italic mt-3.5 font-sans">
        "Segurem os corações, a fofura está prestes a começar!" 🍼✨
      </p>
    </div>
  );
}
