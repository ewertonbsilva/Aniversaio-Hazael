import { useState, FormEvent } from "react";

interface RsvpFormProps {
  rsvpDeadline: string; // YYYY-MM-DD
  onSuccess: () => void;
}

export default function RsvpForm({ rsvpDeadline, onSuccess }: RsvpFormProps) {
  const [name, setName] = useState("");
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [childrenAges, setChildrenAges] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Check if deadline is passed
  const isDeadlinePassed = () => {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    return today > rsvpDeadline;
  };

  const getFormattedDeadline = () => {
    if (!rsvpDeadline) return "";
    const [year, month, day] = rsvpDeadline.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor, preencha o seu nome completo.");
      return;
    }
    if (isAttending === null) {
      setError("Por favor, confirme se você conseguirá ir.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          isAttending,
          adults: isAttending ? adults : "0",
          children: isAttending ? children : "0",
          childrenAges: isAttending ? childrenAges : "",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar presença");
      }

      setSubmitted(true);
      onSuccess();
    } catch (err) {
      setError("Ops! Ocorreu um erro ao enviar sua resposta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (isDeadlinePassed()) {
    return (
      <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl p-6 text-center max-w-sm mx-auto shadow-md" id="rsvp-expired">
        <span className="text-4xl text-center block mb-2">🐥⏳</span>
        <h3 className="font-fredoka text-lg text-pastel-orange-dark mb-1">
          RSVP Encerrado!
        </h3>
        <p className="text-xs text-gray-500 font-sans leading-relaxed">
          O prazo para confirmação de presença encerrou no dia <strong className="text-orange-600">{getFormattedDeadline()}</strong>. 
          Caso precise informar alguma alteração, por favor entre em contato direto com os papais!
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 text-center max-w-sm mx-auto shadow-md animate-float" id="rsvp-thank-you">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-300">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="font-fredoka text-xl text-emerald-700 mb-2">
          {isAttending ? "Uhul! Confirmado! 🎉" : "Obrigado por nos avisar! ❤️"}
        </h3>
        <p className="text-xs text-gray-600 font-sans leading-relaxed">
          {isAttending 
            ? "Ficamos extremamente felizes! Preparamos tudo com muito docinho e carinho para vocês. Nos vemos no dia 25 de Julho!" 
            : "Ficaremos com saudades de você nessa data importante, mas agradecemos muito por nos avisar com carinho!"
          }
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setName("");
            setIsAttending(null);
            setAdults("1");
            setChildren("0");
            setChildrenAges("");
          }}
          className="mt-4 text-[10px] text-amber-600 hover:underline font-bold font-sans tracking-wide uppercase"
        >
          Confirmar outro convidado
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#FFEDD5] border-4 border-white rounded-[40px] p-6 sm:p-8 shadow-md" id="rsvp-form-container">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-fredoka font-black text-xl text-[#9A3412] leading-tight flex items-center gap-1.5">
            🎈 Confirmação de Presença
          </h3>
          <p className="text-[10px] bg-white/50 px-3 py-1 rounded-full font-bold text-[#9A3412] uppercase tracking-wide inline-block mt-1.5">
            Até {getFormattedDeadline()}
          </p>
        </div>
        <div className="text-3xl animate-float-delayed select-none">🍰🍿</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
        {error && (
          <div className="bg-red-50 text-red-600 p-2.5 rounded-2xl text-xs font-semibold border border-red-100">
            ⚠ {error}
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="block text-[10px] font-bold text-[#9A3412] uppercase ml-2 mb-1.5 tracking-wider">
            Nome Completo do Convidado Principal
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite seu nome completo"
            className="w-full bg-white/80 border-none rounded-2xl p-3 px-4 text-sm focus:ring-2 focus:ring-[#FB923C] text-gray-800 placeholder-gray-400 font-medium transition-all"
          />
        </div>

        {/* Atendimento */}
        <div>
          <label className="block text-[10px] font-bold text-[#9A3412] uppercase ml-2 mb-1.5 tracking-wider">
            Você conseguirá ir? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsAttending(true)}
              className={`py-3 px-3 rounded-2xl border-none text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                isAttending === true
                  ? "bg-[#EA580C] text-white"
                  : "bg-white/80 text-[#9A3412] hover:bg-white"
              }`}
            >
              <span>💚</span> Sim, irei!
            </button>
            <button
              type="button"
              onClick={() => setIsAttending(false)}
              className={`py-3 px-3 rounded-2xl border-none text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                isAttending === false
                  ? "bg-rose-600 text-white"
                  : "bg-white/80 text-[#9A3412] hover:bg-white"
              }`}
            >
              <span>💔</span> Não poderei
            </button>
          </div>
        </div>

        {isAttending === true && (
          <div className="space-y-4 p-4 bg-white/50 backdrop-blur-xs rounded-3xl border border-white/50">
            {/* Adultos e crianças */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#9A3412] uppercase ml-2 mb-1">
                  Adultos
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="w-full bg-white/80 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-[#FB923C] font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="1">1 Adulto</option>
                  <option value="2">2 Adultos</option>
                  <option value="3">3 Adultos</option>
                  <option value="4">4 Adultos</option>
                  <option value="5">5+ Adultos</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#9A3412] uppercase ml-2 mb-1">
                  Crianças
                </label>
                <select
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="w-full bg-white/80 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-[#FB923C] font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="0">0 Crianças</option>
                  <option value="1">1 Criança</option>
                  <option value="2">2 Crianças</option>
                  <option value="3">3 Crianças</option>
                  <option value="4">4+ Crianças</option>
                </select>
              </div>
            </div>

            {/* Idade e nome das crianças */}
            {parseInt(children, 10) > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-[#9A3412] uppercase ml-2 mb-1">
                  Nome e idades das crianças
                </label>
                <textarea
                  value={childrenAges}
                  onChange={(e) => setChildrenAges(e.target.value)}
                  placeholder="Ex: Lucas 3 anos, Beatriz 5 anos"
                  rows={2}
                  className="w-full bg-white/80 border-none rounded-2xl p-3 text-xs text-gray-800 placeholder-gray-400 font-medium focus:ring-2 focus:ring-[#FB923C]"
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#EA580C] hover:bg-[#d94e08] text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 uppercase tracking-widest font-fredoka flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>Confirmar Presença</>
          )}
        </button>
      </form>
    </div>
  );
}
