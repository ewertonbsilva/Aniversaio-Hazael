import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { PartyConfig, RsvpEntry, PhotoItem } from "../types";

interface AdminPanelProps {
  config: PartyConfig;
  rsvps: RsvpEntry[];
  onRefreshData: () => void;
  onClose: () => void;
}

export default function AdminPanel({ config, rsvps, onRefreshData, onClose }: AdminPanelProps) {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "edit-party" | "edit-gifts">("dashboard");

  // Form states - Tab 2 (Party Info)
  const [partyDate, setPartyDate] = useState(config.partyDate || "");
  const [partyTime, setPartyTime] = useState(config.partyTime || "");
  const [address, setAddress] = useState(config.address || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(config.rsvpDeadline || "");
  const [mainPhoto, setMainPhoto] = useState(config.mainPhoto || "");
  const [savePartyLoading, setSavePartyLoading] = useState(false);
  const [savePartySuccess, setSavePartySuccess] = useState(false);

  // Form states - Tab 3 (Gifts & PIX & Photos)
  const [pixKey, setPixKey] = useState(config.pixKey || "");
  const [clothingSize, setClothingSize] = useState(config.clothingSize || "");
  const [shoeSize, setShoeSize] = useState(config.shoeSize || "");
  const [diaperSize, setDiaperSize] = useState(config.diaperSize || "");
  const [saveGiftsLoading, setSaveGiftsLoading] = useState(false);
  const [saveGiftsSuccess, setSaveGiftsSuccess] = useState(false);

  // Manual RSVP Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualIsAttending, setManualIsAttending] = useState(true);
  const [manualAdults, setManualAdults] = useState("1");
  const [manualChildren, setManualChildren] = useState("0");
  const [manualChildrenAges, setManualChildrenAges] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  // Photo uploads
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Geral");
  const [isAiGeneratingCaption, setIsAiGeneratingCaption] = useState(false);

  // Refresh local states when config prop changes
  useEffect(() => {
    if (config) {
      setPartyDate(config.partyDate || "");
      setPartyTime(config.partyTime || "");
      setAddress(config.address || "");
      setRsvpDeadline(config.rsvpDeadline || "");
      setMainPhoto(config.mainPhoto || "");
      setPixKey(config.pixKey || "");
      setClothingSize(config.clothingSize || "");
      setShoeSize(config.shoeSize || "");
      setDiaperSize(config.diaperSize || "");
    }
  }, [config]);

  // Login handler
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim() === "admin" && password === "hazael1ano") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Usuário ou senha inválidos.");
    }
  };

  // Save Tab 2 (Party Details)
  const savePartyDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSavePartyLoading(true);
    setSavePartySuccess(false);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyDate,
          partyTime,
          address,
          rsvpDeadline,
          mainPhoto
        })
      });
      if (!response.ok) throw new Error("Erro ao salvar dados");
      onRefreshData();
      setSavePartySuccess(true);
      setTimeout(() => setSavePartySuccess(false), 3000);
    } catch (err) {
      alert("Não foi possível salvar as alterações da festa.");
    } finally {
      setSavePartyLoading(false);
    }
  };

  // Save Tab 3 (Gifts, PIX, Sizes)
  const saveGiftsDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSaveGiftsLoading(true);
    setSaveGiftsSuccess(false);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKey,
          clothingSize,
          shoeSize,
          diaperSize
        })
      });
      if (!response.ok) throw new Error("Erro ao salvar dados");
      onRefreshData();
      setSaveGiftsSuccess(true);
      setTimeout(() => setSaveGiftsSuccess(false), 3000);
    } catch (err) {
      alert("Não foi possível salvar as configurações de presentes.");
    } finally {
      setSaveGiftsLoading(false);
    }
  };

  // Delete RSVP
  const handleDeleteRsvp = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover a presença de ${name}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/rsvps/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar");
      onRefreshData();
    } catch (err) {
      alert("Erro ao remover presença.");
    }
  };

  // File to base64 reader helper
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("A foto escolhida é muito pesada! Escolha uma foto menor que 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Main profile photo loader helper
  const handleMainPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("A foto escolhida é muito pesada! Escolha uma foto menor que 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Post Photo
  const handlePhotoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!previewBase64) {
      alert("Por favor, selecione uma foto primeiro.");
      return;
    }
    setPhotoUploadLoading(true);
    try {
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: previewBase64,
          caption: newPhotoCaption.trim() || "Sorriso do Hazael!",
          month: selectedMonth
        })
      });
      if (!response.ok) throw new Error("Erro ao enviar foto");
      setPreviewBase64(null);
      setNewPhotoCaption("");
      setSelectedMonth("Geral");
      onRefreshData();
      alert("Foto adicionada ao mural com sucesso!");
    } catch (err) {
      alert("Erro ao enviar foto. Tente uma imagem mais leve.");
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  // Generate Caption with Gemini AI
  const handleGenerateAiCaption = async () => {
    if (!previewBase64) {
      alert("Selecione ou arraste uma foto primeiro para que a inteligência artificial possa analisá-la!");
      return;
    }
    setIsAiGeneratingCaption(true);
    try {
      const response = await fetch("/api/photos/ai-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: previewBase64,
          month: selectedMonth
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro desconhecido ao gerar legenda.");
      }
      setNewPhotoCaption(data.caption);
    } catch (error: any) {
      console.error("Erro ao gerar legenda:", error);
      alert(error.message || "Não foi possível gerar a legenda automática.");
    } finally {
      setIsAiGeneratingCaption(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm("Deseja mesmo apagar essa foto do mural de fotos?")) {
      return;
    }
    try {
      const response = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar");
      onRefreshData();
    } catch (err) {
      alert("Erro ao apagar foto.");
    }
  };

  // Manual RSVP submits (For WhatsApp confirmations)
  const handleManualRsvp = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setManualError("Nome completo é obrigatório");
      return;
    }
    setManualLoading(true);
    setManualError("");
    try {
      const response = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          isAttending: manualIsAttending,
          adults: manualIsAttending ? manualAdults : "0",
          children: manualIsAttending ? manualChildren : "0",
          childrenAges: manualIsAttending ? manualChildrenAges : ""
        })
      });
      if (!response.ok) throw new Error("Incapaz de registrar");
      onRefreshData();
      setManualName("");
      setManualChildrenAges("");
      setShowManualModal(false);
    } catch (err) {
      setManualError("Ocorreu um erro ao salvar o registro no banco.");
    } finally {
      setManualLoading(false);
    }
  };

  // Metrics Calc
  const confirmedRsvps = rsvps.filter(r => r.isAttending);
  const totalAdultos = confirmedRsvps.reduce((acc, curr) => acc + curr.adults, 0);
  const totalCriancas = confirmedRsvps.reduce((acc, curr) => acc + curr.children, 0);
  const totalGeral = totalAdultos + totalCriancas;

  // --- LOGIN SCREEN RENDER ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4 z-50 overflow-y-auto font-sans" id="admin-login-screen">
        <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-xl border border-gray-100 text-center relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-xs font-bold font-sans uppercase bg-gray-100 hover:bg-gray-200 text-gray-500 py-1.5 px-3 rounded-full cursor-pointer"
          >
            Fechar
          </button>

          <span className="text-5xl block mb-2 select-none">🐈🔍</span>
          <h2 className="font-fredoka text-xl text-gray-800 leading-tight">
            Frajola Detetive
          </h2>
          <p className="text-xs text-gray-400 font-sans tracking-wide uppercase mt-1 mb-6">
            Área Restrita dos Papais
          </p>

          {loginError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-xs font-bold text-rose-600 mb-4">
              ⚠ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Usuário
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex ewerton"
                className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold py-3 rounded-xl transition-all font-fredoka text-sm shadow-md cursor-pointer mt-2"
            >
              🔓 Entrar no Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- INTERNAL WORKBENCH RENDER ---
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col font-sans overflow-hidden" id="admin-workbench">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 py-3.5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🧸</span>
          <div>
            <h1 className="font-fredoka text-base text-gray-900 leading-none">
              Painel do Hazael Oliveira
            </h1>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-sans">
              Configurações & Presenças
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl cursor-pointer"
        >
          Voltar para o Convite →
        </button>
      </header>

      {/* Tabs list */}
      <nav className="bg-white border-b border-gray-200 flex shrink-0">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
            activeTab === "dashboard"
              ? "border-amber-400 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          📊 Painel de Convidados
        </button>

        <button
          onClick={() => setActiveTab("edit-party")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
            activeTab === "edit-party"
              ? "border-amber-400 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          📅 Info da Festa
        </button>

        <button
          onClick={() => setActiveTab("edit-gifts")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
            activeTab === "edit-gifts"
              ? "border-amber-400 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          🎁 Fotos & PIX
        </button>
      </nav>

      {/* Workbench Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        
        {/* TAB 1: DASHBOARD DE PRESENÇA */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 max-w-4xl mx-auto" id="presence-dashboard">
            {/* Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-sky-700 block tracking-wide">👨‍👩‍👦 Adultos</span>
                <span className="text-2xl font-bold text-sky-950 font-fredoka mt-1 block">{totalAdultos}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wide">👶 Crianças</span>
                <span className="text-2xl font-bold text-emerald-950 font-fredoka mt-1 block">{totalCriancas}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wide">🎈 Total Geral</span>
                <span className="text-2xl font-bold text-amber-950 font-fredoka mt-1 block">{totalGeral}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-2xl border border-gray-200">
              <div className="font-bold text-gray-800">
                Lista de Presença Confiados ({rsvps.length} registros)
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex-1 sm:flex-none bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ➕ Presença Manual (WhatsApp)
                </button>
                
                <a
                  href="/api/rsvps/export"
                  download
                  className="flex-1 sm:flex-none border border-amber-300 bg-amber-400 hover:bg-amber-500 text-amber-950 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  📊 Exportar XLSX/CSV
                </a>
              </div>
            </div>

            {/* List Table wrapper */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold select-none uppercase tracking-wider">
                      <th className="py-3 px-4">Convidado</th>
                      <th className="py-3 px-4">Vai à festa?</th>
                      <th className="py-3 px-4 text-center">Adultos</th>
                      <th className="py-3 px-4 text-center">Crianças</th>
                      <th className="py-3 px-4">Idades das Crianças</th>
                      <th className="py-3 px-4 text-right">Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-sans">
                    {rsvps.length > 0 ? (
                      rsvps.map((rsvp) => (
                        <tr key={rsvp.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-gray-900 leading-tight">
                            {rsvp.name}
                            <span className="block text-[9px] text-gray-400 font-normal mt-0.5 font-mono">
                              Cadastro: {new Date(rsvp.createdAt).toLocaleString("pt-BR", { timeZone: "America/Rio_Branco" })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {rsvp.isAttending ? (
                              <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full py-0.5 px-2.5 font-bold uppercase text-[9px]">
                                Sim 🎉
                              </span>
                            ) : (
                              <span className="bg-rose-100 border border-rose-200 text-rose-800 rounded-full py-0.5 px-2.5 font-bold uppercase text-[9px]">
                                Não 💔
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center text-sm font-semibold">{rsvp.adults}</td>
                          <td className="py-3.5 px-4 text-center text-sm font-semibold">{rsvp.children}</td>
                          <td className="py-3.5 px-4 max-w-[140px] truncate italic text-gray-500" title={rsvp.childrenAges}>
                            {rsvp.childrenAges || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRsvp(rsvp.id, rsvp.name)}
                              className="text-rose-600 hover:text-red-900 bg-rose-50 hover:bg-rose-100 py-1.5 px-3 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 font-normal text-xs">
                          Nenhum convidado cadastrado até agora. Compartilhe o link do convite! 😊
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDITAR INFORMAÇÕES DA FESTA */}
        {activeTab === "edit-party" && (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-gray-200 shadow-sm" id="edit-party-form">
            <h3 className="font-fredoka text-xl text-gray-800 mb-1">
              📅 Detalhes do Evento
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Todos os campos dinâmicos abaixo atualizam instantaneamente a página inicial de convite do Hazael.
            </p>

            {savePartySuccess && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl text-xs font-bold border border-emerald-100 mb-4 animate-bounce">
                🎉 Alterações salvas com sucesso no banco de dados!
              </div>
            )}

            <form onSubmit={savePartyDetails} className="space-y-4">
              {/* EDIT FOTO PRINCIPAL DO CONVITE */}
              <div className="border border-amber-100 p-4 rounded-2xl bg-amber-50/20 flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase self-start">Foto de Capa Principal</span>
                <div className="w-28 h-28 rounded-full border-4 border-amber-100 outline outline-4 outline-white shadow-md overflow-hidden bg-white">
                  <img
                    src={mainPhoto || "/src/assets/images/baby_hazael_portrait_1779399080097.png"}
                    alt="Foto de Capa do Hazael"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer select-none text-center">
                  📸 Selecionar Nova Foto Principal
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleMainPhotoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[9px] text-gray-400 text-center leading-none">A foto de rosto ideal possui formato quadrado (1:1).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Data da Festa *
                </label>
                <input
                  type="date"
                  required
                  value={partyDate}
                  onChange={(e) => setPartyDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Horário de Início *
                </label>
                <input
                  type="time"
                  required
                  value={partyTime}
                  onChange={(e) => setPartyTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Prazo de RSVP (Confirmação) *
                </label>
                <input
                  type="date"
                  required
                  value={rsvpDeadline}
                  onChange={(e) => setRsvpDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Endereço do Local *
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={savePartyLoading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 py-3 rounded-xl font-fredoka font-bold text-sm shadow-md transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                {savePartyLoading ? "Salvando mudanças..." : "💾 Salvar Alterações"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: GERENCIAR FOTOS, PRESENTES & PIX */}
        {activeTab === "edit-gifts" && (
          <div className="max-w-2xl mx-auto space-y-6" id="edit-gifts-form">
            
            {/* Sizes & PIX settings */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-fredoka text-xl text-gray-800 mb-1">
                🎁 Presentes & Preferências
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Configure a chave PIX dos papais (para as cotas virtuais) e tamanhos de fraldas/roupas do Hazael.
              </p>

              {saveGiftsSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl text-xs font-bold border border-emerald-100 mb-4">
                  🎉 Estampas, tamanhos e PIX salvos no banco!
                </div>
              )}

              <form onSubmit={saveGiftsDetails} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Roupa
                    </label>
                    <input
                      type="text"
                      required
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      placeholder="Ex: 1 ou 2"
                      className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Sapato
                    </label>
                    <input
                      type="text"
                      required
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      placeholder="Ex: 19"
                      className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Fralda
                    </label>
                    <input
                      type="text"
                      required
                      value={diaperSize}
                      onChange={(e) => setDiaperSize(e.target.value)}
                      placeholder="Ex: XG"
                      className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Chave PIX Recebedores (E-mail, Celular, etc.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Chave PIX para transferência"
                    className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saveGiftsLoading}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 py-3 rounded-xl font-fredoka font-bold text-sm shadow-md transition-colors disabled:opacity-50 cursor-pointer text-center"
                >
                  {saveGiftsLoading ? "Salvando mudanças..." : "💾 Salvar Configurações"}
                </button>
              </form>
            </div>

            {/* Photos timeline configurations */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-fredoka text-xl text-gray-800 mb-1">
                📸 Mural de Fotos do Hazael
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Adicione fotos do crescimento do Hazael no carrossel de fotos do crescimento. As imagens carregadas em JPG/PNG serão otimizadas.
              </p>

              {/* Photo Upload Form */}
              <form onSubmit={handlePhotoUpload} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                <span className="font-bold text-slate-800 text-xs block uppercase">Upload de Fotos</span>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-white transition-colors">
                      <span className="text-2xl block mb-1">📤</span>
                      <span className="text-[10px] font-bold font-sans text-gray-500 block uppercase">Selecionar Imagem</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {previewBase64 ? (
                    <div className="border border-slate-200 p-1 bg-white rounded-xl shadow-xs h-24 overflow-hidden relative">
                      <img
                        src={previewBase64}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewBase64(null)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full text-[9px] font-bold w-5 h-5 flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 font-sans italic text-center p-4">
                      Nenhuma imagem carregada
                    </div>
                  )}
                </div>

                {/* Dropdown for Month Selection & AI Captions Trigger */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      🗓 Selecionar Período / Mês
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-gray-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-xs font-semibold"
                    >
                      <option value="Geral">Mural Geral / Outro</option>
                      <option value="Recém-nascido">Recém-nascido</option>
                      <option value="1º mês">1º mês</option>
                      <option value="2º mês">2º mês</option>
                      <option value="3º mês">3º mês</option>
                      <option value="4º mês">4º mês</option>
                      <option value="5º mês">5º mês</option>
                      <option value="6º mês">6º mês</option>
                      <option value="7º mês">7º mês</option>
                      <option value="8º mês">8º mês</option>
                      <option value="9º mês">9º mês</option>
                      <option value="10º mês">10º mês</option>
                      <option value="11º mês">11º mês</option>
                      <option value="12º mês (1 ano)">12º mês (1 ano)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      🤖 Gerar Inteligente
                    </label>
                    <button
                      type="button"
                      disabled={isAiGeneratingCaption || !previewBase64}
                      onClick={handleGenerateAiCaption}
                      className="w-full shrink-0 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-amber-950 py-2.5 px-3 rounded-xl font-bold text-[11px] uppercase cursor-pointer disabled:opacity-40 transition-all border-none font-sans shadow-sm"
                    >
                      {isAiGeneratingCaption ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-3.5 w-3.5 text-amber-950" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 00 5.373 5.373 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          IA Analisando...
                        </span>
                      ) : (
                        <>✨ Gerar Legenda com IA</>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Legenda da Imagem
                  </label>
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="Ex: 5 Meses - Aprendendo a engatinhar!"
                    className="w-full bg-white border border-slate-200 text-gray-800 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    💡 Selecione a foto, escolha o período acima e clique em <strong>✨ Gerar Legenda com IA</strong> para criar uma legenda fofa automaticamente!
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={photoUploadLoading || !previewBase64}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 px-4 rounded-xl font-bold font-sans text-xs uppercase tracking-wide disabled:opacity-40 cursor-pointer"
                >
                  {photoUploadLoading ? "Fazendo Upload..." : "📤 Adicionar Foto ao Mural"}
                </button>
              </form>

              {/* Photos grid list with delete buttons */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 text-xs block uppercase">Fotos no Mural ({config.photos?.length || 0})</span>
                <div className="grid grid-cols-2 gap-3">
                  {config.photos && config.photos.length > 0 ? (
                    config.photos.map((pic) => (
                      <div key={pic.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between relative group">
                        <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-slate-200 relative">
                          <img
                            src={pic.url}
                            alt={pic.caption}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[8.5px] uppercase font-black tracking-wider shadow-sm border border-white">
                            {pic.month || "Geral"}
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-700 leading-tight truncate mt-2 font-sans">
                          {pic.caption}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(pic.id)}
                          className="mt-2 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          🗑 Apagar Foto
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 italic text-gray-400 text-xs">
                      Mural de fotos vazio. Carregue uma acima!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Manual RSVP modal rendering */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="manual-rsvp-modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl relative">
            <button
              onClick={() => {
                setShowManualModal(false);
                setManualError("");
              }}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 font-bold cursor-pointer text-xs"
            >
              ✕
            </button>

            <h3 className="font-fredoka text-lg text-emerald-800 mb-1">
              ➕ Presença Manual
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-normal font-sans">
              Registre a confirmação de convidados que responderam pelo WhatsApp para alimentar as métricas do painel!
            </p>

            {manualError && (
              <div className="bg-rose-50 text-rose-600 p-2 text-xs font-semibold rounded-xl mb-3 border border-rose-100">
                ⚠ {manualError}
              </div>
            )}

            <form onSubmit={handleManualRsvp} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1">
                  Nome do Convidado *
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nome do Convidado"
                  className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1">
                  Confirmou que vai?
                </label>
                <div className="grid grid-cols-2 gap-2 font-sans font-bold">
                  <button
                    type="button"
                    onClick={() => setManualIsAttending(true)}
                    className={`py-2 rounded-xl border border-dashed transition-all flex items-center justify-center gap-1 ${
                      manualIsAttending === true
                        ? "bg-emerald-500 text-white border-solid border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>💚</span> Sim, vai
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualIsAttending(false)}
                    className={`py-2 rounded-xl border border-dashed transition-all flex items-center justify-center gap-1 ${
                      manualIsAttending === false
                        ? "bg-rose-500 text-white border-solid border-rose-600 shadow-xs"
                        : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>💔</span> Não vai
                  </button>
                </div>
              </div>

              {manualIsAttending && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 leading-none uppercase text-[9px]">
                        Adultos
                      </label>
                      <select
                        value={manualAdults}
                        onChange={(e) => setManualAdults(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none text-xs font-semibold"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-500 mb-1 leading-none uppercase text-[9px]">
                        Crianças
                      </label>
                      <select
                        value={manualChildren}
                        onChange={(e) => setManualChildren(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none text-xs font-semibold"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                  </div>

                  {parseInt(manualChildren, 10) > 0 && (
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 leading-none uppercase text-[9px]">
                        Idades das Crianças
                      </label>
                      <input
                        type="text"
                        value={manualChildrenAges}
                        onChange={(e) => setManualChildrenAges(e.target.value)}
                        placeholder="Ex: Lucas 3 anos, Beatriz 5 anos"
                        className="w-full bg-white border border-slate-200 text-gray-800 rounded-lg py-1.5 px-2 focus:outline-none font-medium"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={manualLoading}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-xl font-bold font-fredoka text-xs uppercase cursor-pointer text-center"
              >
                {manualLoading ? "Salvando..." : "💚 Gravar Presença"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
