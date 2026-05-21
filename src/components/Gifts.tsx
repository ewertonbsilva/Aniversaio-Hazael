import { useState } from "react";

interface GiftsProps {
  clothingSize: string;
  shoeSize: string;
  diaperSize: string;
  pixKey: string;
}

interface Cota {
  id: string;
  title: string;
  amount: string | null; // null means "any value"
  purpose: string;
  icon: string;
  character: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export default function Gifts({ clothingSize, shoeSize, diaperSize, pixKey }: GiftsProps) {
  const [selectedCota, setSelectedCota] = useState<Cota | null>(null);
  const [copied, setCopied] = useState(false);

  const cotas: Cota[] = [
    {
      id: "pernalonga",
      title: "🥕 Cota do Pernalonga",
      amount: "R$ 40,00",
      purpose: "Nos ajuda na compra de brinquedos educativos e estimulantes para o Hazael.",
      icon: "🥕",
      character: "Pernalonga Baby",
      bgClass: "bg-sky-50",
      borderClass: "border-sky-200",
      textClass: "text-sky-800"
    },
    {
      id: "piupiu",
      title: "🐥 Cota do Piu-Piu",
      amount: "R$ 75,00",
      purpose: "Uma forcinha no estoque de fraldas para garantir noites e dias tranquilos.",
      icon: "🐥",
      character: "Piu-Piu Baby",
      bgClass: "bg-yellow-50",
      borderClass: "border-yellow-200",
      textClass: "text-yellow-800"
    },
    {
      id: "patolino",
      title: "🦆 Cota do Patolino",
      amount: "R$ 110,00",
      purpose: "Destinado às primeiras roupinhas de guri crescido para vestir nosso meninão.",
      icon: "🦆",
      character: "Patolino Baby",
      bgClass: "bg-teal-50",
      borderClass: "border-teal-200",
      textClass: "text-teal-800"
    },
    {
      id: "taz",
      title: "🌪️ Cota do Taz",
      amount: "Qualquer valor",
      purpose: "Qualquer quantia livre para alimentar o cofrinho das próximas aventuras do Hazael.",
      icon: "🌪️",
      character: "Taz Baby",
      bgClass: "bg-orange-50",
      borderClass: "border-orange-200",
      textClass: "text-orange-800"
    }
  ];

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="gifts-section" className="w-full max-w-md mx-auto space-y-6">
      {/* Sizes Grid */}
      <div className="bg-white border-4 border-[#FEF08A] rounded-[40px] p-6 sm:p-8">
        <h4 className="font-fredoka font-black text-sm uppercase tracking-wider text-[#854D0E] text-center mb-5">
          🎁 Dicas de Presentes & Vestimentas
        </h4>
        <div className="flex justify-around text-center gap-3">
          <div className="bg-[#FEF08A]/20 p-3 sm:p-4 rounded-2xl w-24 sm:w-28 flex flex-col items-center justify-center border border-[#FEF08A]/40">
            <span className="text-2xl mb-1">👕</span>
            <span className="font-bold text-[#854D0E] uppercase tracking-tight text-[9px]">Roupas</span>
            <span className="font-fredoka font-black text-sm text-[#854D0E] mt-1">{clothingSize || "1 ou 2"}</span>
          </div>
          <div className="bg-[#FEF08A]/20 p-3 sm:p-4 rounded-2xl w-24 sm:w-28 flex flex-col items-center justify-center border border-[#FEF08A]/40">
            <span className="text-2xl mb-1">👟</span>
            <span className="font-bold text-[#854D0E] uppercase tracking-tight text-[9px]">Calçados</span>
            <span className="font-fredoka font-black text-sm text-[#854D0E] mt-1">{shoeSize || "19"}</span>
          </div>
          <div className="bg-[#FEF08A]/20 p-3 sm:p-4 rounded-2xl w-24 sm:w-28 flex flex-col items-center justify-center border border-[#FEF08A]/40">
            <span className="text-2xl mb-1">👶</span>
            <span className="font-bold text-[#854D0E] uppercase tracking-tight text-[9px]">Fraldas</span>
            <span className="font-fredoka font-black text-sm text-[#854D0E] mt-1">{diaperSize || "XG"}</span>
          </div>
        </div>
      </div>

      {/* Virtual Gifts / Cotas */}
      <div className="bg-[#FEF08A] rounded-[40px] border-4 border-white p-6 sm:p-8 flex flex-col shadow-md">
        <div className="text-center mb-5">
          <span className="text-3xl mb-1.5 block select-none">🛒</span>
          <h4 className="font-fredoka font-black text-sm uppercase tracking-widest text-[#854D0E] leading-tight">
            Cotas Virtuais da Turma
          </h4>
          <p className="text-[10px] text-[#854D0E] leading-tight opacity-80 mt-1 max-w-[280px] mx-auto">
            Contribua de forma divertida para o aniversário do nosso pequeno via PIX
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {cotas.map((cota) => (
            <div
              key={cota.id}
              className="bg-white/80 border-none rounded-3xl p-4 flex items-center justify-between gap-3 shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-3xl select-none pt-0.5">{cota.icon}</span>
                <div className="min-w-0">
                  <h5 className="font-fredoka font-black text-sm text-[#854D0E] truncate">{cota.title}</h5>
                  <p className="text-[10px] text-[#854D0E]/80 font-sans line-clamp-1 leading-normal">
                    {cota.purpose}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-black text-[#854D0E] font-sans">{cota.amount}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCota(cota)}
                  className="bg-[#EA580C] hover:bg-[#d94e08] text-white text-[9px] font-black uppercase font-sans py-1.5 px-3.5 rounded-xl cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal / Dialog for chosen Cota */}
      {selectedCota && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="pix-modal">
          <div className="bg-white rounded-[40px] border-4 border-[#FEF08A] p-6 max-w-sm w-full shadow-2xl relative animate-float">
            
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedCota(null);
                setCopied(false);
              }}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer font-bold text-xs"
            >
              ✕
            </button>

            <div className="text-center font-sans">
              <span className="text-5xl block mb-2">{selectedCota.icon}</span>
              <h4 className="font-fredoka font-black text-lg text-[#854D0E] mb-0.5">
                {selectedCota.title}
              </h4>
              <p className="text-[10px] uppercase font-bold tracking-wider text-orange-650 mb-2">
                Cota do {selectedCota.character}
              </p>

              <div className="bg-[#FEF08A]/10 border border-[#FEF08A]/30 rounded-2xl p-3.5 mb-4 text-xs text-[#854D0E] leading-normal text-left">
                {selectedCota.purpose}
                {selectedCota.amount !== "Qualquer valor" && (
                  <p className="mt-2 font-bold text-center text-sm text-[#854D0E]">
                    Sugestão de valor: {selectedCota.amount}
                  </p>
                )}
              </div>

              {/* QR Code Graphic Representation */}
              <div className="bg-[#FEF08A]/10 p-4 rounded-3xl max-w-[180px] mx-auto border-2 border-dashed border-[#FEF08A]/30 mb-4 flex flex-col items-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-gray-100">
                  {/* Generated QR representation using CSS/canvas/svg */}
                  <svg className="w-32 h-32 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="5" y="5" width="15" height="15" fill="white" />
                    <rect x="9" y="9" width="7" height="7" />
                    
                    <rect x="75" y="0" width="25" height="25" />
                    <rect x="80" y="5" width="15" height="15" fill="white" />
                    <rect x="84" y="9" width="7" height="7" />

                    <rect x="0" y="75" width="25" height="25" />
                    <rect x="5" y="80" width="15" height="15" fill="white" />
                    <rect x="9" y="84" width="7" height="7" />

                    {/* Simulating random QR codes pixels */}
                    <rect x="35" y="5" width="5" height="15" />
                    <rect x="45" y="0" width="10" height="5" />
                    <rect x="60" y="10" width="5" height="20" />
                    <rect x="35" y="30" width="20" height="5" />
                    <rect x="10" y="35" width="15" height="10" />
                    <rect x="5" y="50" width="20" height="5" />
                    
                    <rect x="30" y="45" width="15" height="5" />
                    <rect x="50" y="40" width="10" height="15" />
                    <rect x="65" y="45" width="25" height="10" />
                    <rect x="80" y="30" width="15" height="5" />
                    <rect x="75" y="60" width="5" height="10" />

                    <rect x="35" y="65" width="25" height="5" />
                    <rect x="30" y="75" width="5" height="15" />
                    <rect x="45" y="80" width="10" height="10" />
                    <rect x="60" y="75" width="15" height="5" />
                    <rect x="65" y="85" width="30" height="5" />
                    <rect x="80" y="70" width="10" height="10" />
                  </svg>
                </div>
                <span className="text-[9px] text-[#854D0E] font-bold mt-2 tracking-wider">QR CODE DE PAGAMENTO PIX</span>
              </div>

              {/* PIX string display */}
              <div className="bg-gray-100 rounded-2xl p-2.5 flex items-center justify-between text-[11px] gap-2 text-left mb-4">
                <div className="truncate text-gray-700 font-mono select-all">
                  <strong>Chave PIX:</strong> {pixKey}
                </div>
                <button
                  onClick={handleCopyPix}
                  className={`py-1.5 px-3 rounded-xl font-bold font-sans tracking-wide uppercase shrink-0 transition-colors text-[10px] cursor-pointer ${
                    copied 
                      ? "bg-emerald-500 text-white" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed font-sans max-w-[250px] mx-auto">
                💡 <strong>Como pagar:</strong> Abra o aplicativo do seu banco, selecione <strong>Área PIX</strong> e escaneie o código acima ou faça um Pix usando a <strong>Chave Pix Copiada</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
