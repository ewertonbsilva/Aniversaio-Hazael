import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { PartyConfig, PhotoItem, RsvpEntry } from "../types";
import { supabase } from "../lib/supabase";

interface AdminPanelProps {
  config: PartyConfig;
  rsvps: RsvpEntry[];
  onRefreshData: () => void;
  onClose: () => void;
}

type AdminTab = "dashboard" | "edit-party" | "edit-gifts";

const MONTH_OPTIONS = [
  "Geral",
  "Recém-nascido",
  "1º mês",
  "2º mês",
  "3º mês",
  "4º mês",
  "5º mês",
  "6º mês",
  "7º mês",
  "8º mês",
  "9º mês",
  "10º mês",
  "11º mês",
  "12º mês (1 ano)",
];

function getAuthHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPanel({ config, rsvps, onRefreshData, onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const [partyDate, setPartyDate] = useState(config.partyDate || "");
  const [partyTime, setPartyTime] = useState(config.partyTime || "");
  const [address, setAddress] = useState(config.address || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(config.rsvpDeadline || "");
  const [mainPhoto, setMainPhoto] = useState(config.mainPhoto || "");
  const [savePartyLoading, setSavePartyLoading] = useState(false);
  const [savePartySuccess, setSavePartySuccess] = useState(false);

  const [pixKey, setPixKey] = useState(config.pixKey || "");
  const [clothingSize, setClothingSize] = useState(config.clothingSize || "");
  const [shoeSize, setShoeSize] = useState(config.shoeSize || "");
  const [diaperSize, setDiaperSize] = useState(config.diaperSize || "");
  const [saveGiftsLoading, setSaveGiftsLoading] = useState(false);
  const [saveGiftsSuccess, setSaveGiftsSuccess] = useState(false);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualIsAttending, setManualIsAttending] = useState(true);
  const [manualAdults, setManualAdults] = useState("1");
  const [manualChildren, setManualChildren] = useState("0");
  const [manualChildrenAges, setManualChildrenAges] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Geral");
  const [isAiGeneratingCaption, setIsAiGeneratingCaption] = useState(false);

  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [editingMonth, setEditingMonth] = useState("Geral");
  const [editingPreviewBase64, setEditingPreviewBase64] = useState<string | null>(null);
  const [photoEditLoading, setPhotoEditLoading] = useState(false);

  useEffect(() => {
    setPartyDate(config.partyDate || "");
    setPartyTime(config.partyTime || "");
    setAddress(config.address || "");
    setRsvpDeadline(config.rsvpDeadline || "");
    setMainPhoto(config.mainPhoto || "");
    setPixKey(config.pixKey || "");
    setClothingSize(config.clothingSize || "");
    setShoeSize(config.shoeSize || "");
    setDiaperSize(config.diaperSize || "");
  }, [config]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const token = data.session?.access_token ?? null;
      setAccessToken(token);
      setIsAuthenticated(Boolean(token));
      setAuthLoading(false);
    }

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const token = session?.access_token ?? null;
      setAccessToken(token);
      setIsAuthenticated(Boolean(token));
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setAuthLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      setLoginError("Não foi possível autenticar com o Supabase. Verifique e-mail e senha.");
      setAuthLoading(false);
      return;
    }

    setAccessToken(data.session.access_token);
    setIsAuthenticated(true);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAccessToken(null);
    setPassword("");
  };

  const handleImageFile = (file: File | undefined, setter: (value: string | null) => void) => {
    if (!file) {
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("A foto escolhida é muito pesada. Escolha uma imagem menor que 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageFile(e.target.files?.[0], setPreviewBase64);
  };

  const handleEditPhotoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageFile(e.target.files?.[0], setEditingPreviewBase64);
  };

  const handleMainPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageFile(e.target.files?.[0], setMainPhoto);
  };

  const authorizedFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
    fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(accessToken),
        ...(init.headers || {}),
      },
    });

  const savePartyDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSavePartyLoading(true);
    setSavePartySuccess(false);
    try {
      const response = await authorizedFetch("/api/config", {
        method: "POST",
        body: JSON.stringify({ partyDate, partyTime, address, rsvpDeadline, mainPhoto }),
      });
      if (!response.ok) throw new Error();
      await onRefreshData();
      setSavePartySuccess(true);
      setTimeout(() => setSavePartySuccess(false), 3000);
    } catch {
      alert("Não foi possível salvar as alterações da festa.");
    } finally {
      setSavePartyLoading(false);
    }
  };

  const saveGiftsDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSaveGiftsLoading(true);
    setSaveGiftsSuccess(false);
    try {
      const response = await authorizedFetch("/api/config", {
        method: "POST",
        body: JSON.stringify({ pixKey, clothingSize, shoeSize, diaperSize }),
      });
      if (!response.ok) throw new Error();
      await onRefreshData();
      setSaveGiftsSuccess(true);
      setTimeout(() => setSaveGiftsSuccess(false), 3000);
    } catch {
      alert("Não foi possível salvar as configurações de presentes.");
    } finally {
      setSaveGiftsLoading(false);
    }
  };

  const handleDeleteRsvp = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover a presença de ${name}?`)) {
      return;
    }
    try {
      const response = await authorizedFetch(`/api/rsvps/${id}`, { method: "DELETE", headers: getAuthHeaders(accessToken) });
      if (!response.ok) throw new Error();
      await onRefreshData();
    } catch {
      alert("Erro ao remover presença.");
    }
  };

  const handlePhotoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!previewBase64) {
      alert("Selecione uma foto antes de enviar.");
      return;
    }

    setPhotoUploadLoading(true);
    try {
      const response = await authorizedFetch("/api/photos", {
        method: "POST",
        body: JSON.stringify({
          url: previewBase64,
          caption: newPhotoCaption.trim() || "Sorriso do Hazael!",
          month: selectedMonth,
        }),
      });
      if (!response.ok) throw new Error();

      setPreviewBase64(null);
      setNewPhotoCaption("");
      setSelectedMonth("Geral");
      await onRefreshData();
      alert("Foto adicionada ao mural com sucesso.");
    } catch {
      alert("Erro ao enviar foto. Tente novamente com uma imagem mais leve.");
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  const handleGenerateAiCaption = async () => {
    if (!previewBase64) {
      alert("Selecione uma foto primeiro para gerar a legenda.");
      return;
    }

    setIsAiGeneratingCaption(true);
    try {
      const response = await authorizedFetch("/api/photos/ai-caption", {
        method: "POST",
        body: JSON.stringify({ url: previewBase64, month: selectedMonth }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar legenda.");
      }
      setNewPhotoCaption(data.caption);
    } catch (error: any) {
      alert(error.message || "Não foi possível gerar a legenda automática.");
    } finally {
      setIsAiGeneratingCaption(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm("Deseja mesmo apagar essa foto do mural?")) {
      return;
    }
    try {
      const response = await authorizedFetch(`/api/photos/${id}`, { method: "DELETE", headers: getAuthHeaders(accessToken) });
      if (!response.ok) throw new Error();
      await onRefreshData();
    } catch {
      alert("Erro ao apagar foto.");
    }
  };

  const handleExportRsvps = async () => {
    try {
      const response = await fetch("/api/rsvps/export", {
        headers: getAuthHeaders(accessToken),
      });
      if (!response.ok) {
        throw new Error();
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "convidados_hazael.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Não foi possível exportar o CSV agora.");
    }
  };

  const startPhotoEdit = (photo: PhotoItem) => {
    setEditingPhotoId(photo.id);
    setEditingCaption(photo.caption);
    setEditingMonth(photo.month || "Geral");
    setEditingPreviewBase64(null);
  };

  const cancelPhotoEdit = () => {
    setEditingPhotoId(null);
    setEditingCaption("");
    setEditingMonth("Geral");
    setEditingPreviewBase64(null);
  };

  const handleSavePhotoEdit = async (photoId: string) => {
    setPhotoEditLoading(true);
    try {
      const response = await authorizedFetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        body: JSON.stringify({
          caption: editingCaption.trim(),
          month: editingMonth,
          url: editingPreviewBase64 || undefined,
        }),
      });
      if (!response.ok) throw new Error();
      await onRefreshData();
      cancelPhotoEdit();
    } catch {
      alert("Não foi possível salvar a edição da foto.");
    } finally {
      setPhotoEditLoading(false);
    }
  };

  const handleManualRsvp = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setManualError("Nome completo é obrigatório.");
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
          childrenAges: manualIsAttending ? manualChildrenAges : "",
        }),
      });
      if (!response.ok) throw new Error();
      await onRefreshData();
      setManualName("");
      setManualAdults("1");
      setManualChildren("0");
      setManualChildrenAges("");
      setShowManualModal(false);
    } catch {
      setManualError("Ocorreu um erro ao salvar o registro no banco.");
    } finally {
      setManualLoading(false);
    }
  };

  const confirmedRsvps = rsvps.filter((r) => r.isAttending);
  const totalAdultos = confirmedRsvps.reduce((acc, curr) => acc + curr.adults, 0);
  const totalCriancas = confirmedRsvps.reduce((acc, curr) => acc + curr.children, 0);
  const totalGeral = totalAdultos + totalCriancas;

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
          <p className="font-fredoka text-lg text-slate-700">Validando acesso ao painel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-xl border border-gray-100 text-center relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-xs font-bold uppercase bg-gray-100 hover:bg-gray-200 text-gray-500 py-1.5 px-3 rounded-full cursor-pointer"
          >
            Fechar
          </button>

          <span className="text-5xl block mb-2 select-none">🔐</span>
          <h2 className="font-fredoka text-xl text-gray-800 leading-tight">Painel dos Pais</h2>
          <p className="text-xs text-gray-400 tracking-wide uppercase mt-1 mb-6">
            Acesso autenticado com Supabase
          </p>

          {loginError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-xs font-bold text-rose-600 mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full bg-slate-50 border border-slate-200 text-gray-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-yellow-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Senha</label>
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
              Entrar com Supabase
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col overflow-hidden" id="admin-workbench">
      <header className="bg-white border-b border-gray-200 py-3.5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🧸</span>
          <div>
            <h1 className="font-fredoka text-base text-gray-900 leading-none">Painel do Hazael Oliveira</h1>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Configurações e confirmações
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-4 rounded-xl cursor-pointer"
          >
            Sair
          </button>
          <button
            onClick={onClose}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl cursor-pointer"
          >
            Voltar para o convite
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 flex shrink-0">
        {[
          { id: "dashboard", label: "Painel de convidados" },
          { id: "edit-party", label: "Info da festa" },
          { id: "edit-gifts", label: "Fotos e PIX" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
              activeTab === tab.id
                ? "border-amber-400 text-amber-700 bg-amber-50/20"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-sky-700 block tracking-wide">Adultos</span>
                <span className="text-2xl font-bold text-sky-950 font-fredoka mt-1 block">{totalAdultos}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wide">Crianças</span>
                <span className="text-2xl font-bold text-emerald-950 font-fredoka mt-1 block">{totalCriancas}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wide">Total geral</span>
                <span className="text-2xl font-bold text-amber-950 font-fredoka mt-1 block">{totalGeral}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-2xl border border-gray-200">
              <div className="font-bold text-gray-800">Lista de presença ({rsvps.length} registros)</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex-1 sm:flex-none bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl font-bold cursor-pointer"
                >
                  Presença manual
                </button>
                <button
                  type="button"
                  onClick={handleExportRsvps}
                  className="flex-1 sm:flex-none border border-amber-300 bg-amber-400 hover:bg-amber-500 text-amber-950 py-2 px-4 rounded-xl font-bold cursor-pointer text-center"
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Convidado</th>
                      <th className="py-3 px-4">Vai?</th>
                      <th className="py-3 px-4 text-center">Adultos</th>
                      <th className="py-3 px-4 text-center">Crianças</th>
                      <th className="py-3 px-4">Idades</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {rsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{rsvp.name}</td>
                        <td className="py-3.5 px-4">{rsvp.isAttending ? "Sim" : "Não"}</td>
                        <td className="py-3.5 px-4 text-center">{rsvp.adults}</td>
                        <td className="py-3.5 px-4 text-center">{rsvp.children}</td>
                        <td className="py-3.5 px-4">{rsvp.childrenAges || "-"}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteRsvp(rsvp.id, rsvp.name)}
                            className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rsvps.length === 0 && (
                      <tr>
                        <td className="py-6 px-4 text-center text-gray-400 italic" colSpan={6}>
                          Nenhuma confirmação registrada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "edit-party" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-fredoka text-xl text-gray-800 mb-5">Informações da festa</h3>
              <form onSubmit={savePartyDetails} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data</label>
                    <input type="date" value={partyDate} onChange={(e) => setPartyDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hora</label>
                    <input type="text" value={partyTime} onChange={(e) => setPartyTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Endereço</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prazo RSVP</label>
                  <input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                </div>

                <div className="grid md:grid-cols-[1fr_180px] gap-4 items-center">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Foto principal</label>
                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Trocar foto principal</span>
                      <input type="file" accept="image/png, image/jpeg" onChange={handleMainPhotoChange} className="hidden" />
                    </label>
                  </div>
                  <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {mainPhoto ? <img src={mainPhoto} alt="Prévia da foto principal" className="w-full h-full object-cover" /> : null}
                  </div>
                </div>

                <button type="submit" disabled={savePartyLoading} className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 py-3 rounded-xl font-fredoka font-bold text-sm shadow-md disabled:opacity-50 cursor-pointer">
                  {savePartyLoading ? "Salvando..." : savePartySuccess ? "Salvo com sucesso" : "Salvar informações"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "edit-gifts" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-fredoka text-xl text-gray-800 mb-5">Presentes e PIX</h3>
              <form onSubmit={saveGiftsDetails} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Roupa</label>
                    <input type="text" value={clothingSize} onChange={(e) => setClothingSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sapato</label>
                    <input type="text" value={shoeSize} onChange={(e) => setShoeSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fralda</label>
                    <input type="text" value={diaperSize} onChange={(e) => setDiaperSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chave PIX</label>
                  <input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold" />
                </div>

                <button type="submit" disabled={saveGiftsLoading} className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 py-3 rounded-xl font-fredoka font-bold text-sm shadow-md disabled:opacity-50 cursor-pointer">
                  {saveGiftsLoading ? "Salvando..." : saveGiftsSuccess ? "Salvo com sucesso" : "Salvar configurações"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-fredoka text-xl text-gray-800 mb-1">Mural de fotos do Hazael</h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Adicione fotos, gere legenda com IA e edite as fotos já publicadas.
              </p>

              <form onSubmit={handlePhotoUpload} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                <span className="font-bold text-slate-800 text-xs block uppercase">Nova foto</span>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-white transition-colors">
                    <span className="text-2xl block mb-1">📤</span>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Selecionar imagem</span>
                    <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
                  </label>

                  {previewBase64 ? (
                    <div className="border border-slate-200 p-1 bg-white rounded-xl h-24 overflow-hidden relative">
                      <img src={previewBase64} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => setPreviewBase64(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full text-[9px] font-bold w-5 h-5 flex items-center justify-center cursor-pointer">
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 italic text-center p-4">Nenhuma imagem carregada</div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Período / mês</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-white border border-slate-200 text-gray-800 rounded-xl py-2 px-3 text-xs font-semibold">
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Legenda com IA</label>
                    <button
                      type="button"
                      disabled={isAiGeneratingCaption || !previewBase64}
                      onClick={handleGenerateAiCaption}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 py-2.5 px-3 rounded-xl font-bold text-[11px] uppercase cursor-pointer disabled:opacity-40"
                    >
                      {isAiGeneratingCaption ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-3.5 w-3.5 text-amber-950" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a8 8 0 00-8 8zm2 5.291A7.962 7.962 0 014 12H2c0 2.719 1.08 5.327 3 7.229l1-1.938z" />
                          </svg>
                          IA analisando...
                        </span>
                      ) : (
                        <>Gerar legenda</>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Legenda da imagem</label>
                  <input type="text" value={newPhotoCaption} onChange={(e) => setNewPhotoCaption(e.target.value)} placeholder="Ex: 5 meses descobrindo o mundo" className="w-full bg-white border border-slate-200 text-gray-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold" />
                </div>

                <button type="submit" disabled={photoUploadLoading || !previewBase64} className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase disabled:opacity-40 cursor-pointer">
                  {photoUploadLoading ? "Fazendo upload..." : "Adicionar foto ao mural"}
                </button>
              </form>

              <div className="space-y-3">
                <span className="font-bold text-slate-800 text-xs block uppercase">Fotos no mural ({config.photos?.length || 0})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {config.photos && config.photos.length > 0 ? (
                    config.photos.map((photo) => (
                      <div key={photo.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
                        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-slate-200 relative">
                          <img src={editingPhotoId === photo.id && editingPreviewBase64 ? editingPreviewBase64 : photo.url} alt={photo.caption} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-1 bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[8.5px] uppercase font-black tracking-wider shadow-sm border border-white">
                            {photo.month || "Geral"}
                          </div>
                        </div>

                        {editingPhotoId === photo.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Legenda</label>
                              <input value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Período</label>
                              <select value={editingMonth} onChange={(e) => setEditingMonth(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold">
                                {MONTH_OPTIONS.map((month) => (
                                  <option key={month} value={month}>
                                    {month}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <label className="block border border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer bg-white hover:bg-slate-50">
                              <span className="text-[10px] font-bold uppercase text-slate-600">Substituir imagem</span>
                              <input type="file" accept="image/png, image/jpeg" onChange={handleEditPhotoFileChange} className="hidden" />
                            </label>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleSavePhotoEdit(photo.id)} disabled={photoEditLoading} className="flex-1 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg cursor-pointer disabled:opacity-50">
                                Salvar edição
                              </button>
                              <button type="button" onClick={cancelPhotoEdit} className="flex-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg cursor-pointer">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] font-semibold text-gray-700 leading-tight">{photo.caption}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => startPhotoEdit(photo)} className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold py-1.5 px-3 rounded-lg cursor-pointer">
                                Editar foto
                              </button>
                              <button type="button" onClick={() => handleDeletePhoto(photo.id)} className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1.5 px-3 rounded-lg cursor-pointer">
                                Apagar foto
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 italic text-gray-400 text-xs">Mural de fotos vazio.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl relative">
            <button onClick={() => setShowManualModal(false)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 font-bold cursor-pointer text-xs">
              ×
            </button>

            <h3 className="font-fredoka text-lg text-emerald-800 mb-1">Presença manual</h3>
            <p className="text-xs text-gray-500 mb-4 leading-normal">Registre confirmações recebidas pelo WhatsApp.</p>

            {manualError && <div className="bg-rose-50 text-rose-600 p-2 text-xs font-semibold rounded-xl mb-3 border border-rose-100">{manualError}</div>}

            <form onSubmit={handleManualRsvp} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1">Nome do convidado</label>
                <input type="text" required value={manualName} onChange={(e) => setManualName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold" />
              </div>

              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1">Confirmou que vai?</label>
                <div className="grid grid-cols-2 gap-2 font-bold">
                  <button type="button" onClick={() => setManualIsAttending(true)} className={`py-2 rounded-xl border transition-all ${manualIsAttending ? "bg-emerald-500 text-white border-emerald-600" : "bg-slate-50 text-gray-700 border-slate-200"}`}>
                    Sim
                  </button>
                  <button type="button" onClick={() => setManualIsAttending(false)} className={`py-2 rounded-xl border transition-all ${!manualIsAttending ? "bg-rose-500 text-white border-rose-600" : "bg-slate-50 text-gray-700 border-slate-200"}`}>
                    Não
                  </button>
                </div>
              </div>

              {manualIsAttending && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 uppercase text-[9px]">Adultos</label>
                      <select value={manualAdults} onChange={(e) => setManualAdults(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold">
                        {["1", "2", "3", "4", "5"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 uppercase text-[9px]">Crianças</label>
                      <select value={manualChildren} onChange={(e) => setManualChildren(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold">
                        {["0", "1", "2", "3", "4"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {parseInt(manualChildren, 10) > 0 && (
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 uppercase text-[9px]">Idades das crianças</label>
                      <input value={manualChildrenAges} onChange={(e) => setManualChildrenAges(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 font-medium" />
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={manualLoading} className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-xl font-bold font-fredoka text-xs uppercase cursor-pointer">
                {manualLoading ? "Salvando..." : "Gravar presença"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
