import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

type ConfigRow = {
  id: string;
  party_date: string;
  party_time: string;
  address: string;
  rsvp_deadline: string;
  clothing_size: string;
  shoe_size: string;
  diaper_size: string;
  pix_key: string;
  main_photo_url: string | null;
  display_mode?: string | null;
};

type PhotoRow = {
  id: string;
  url: string;
  caption: string;
  month: string | null;
  storage_path: string | null;
  sort_order: number;
};

type RsvpRow = {
  id: string;
  name: string;
  is_attending: boolean;
  adults: number;
  children: number;
  children_ages: string | null;
  created_at: string;
};

let ai: GoogleGenAI | null = null;
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;
const GEMINI_CAPTION_MODEL = process.env.GEMINI_CAPTION_MODEL || "gemini-2.5-flash";

type AuthenticatedRequest = Request & {
  supabaseUser?: {
    id: string;
    email?: string;
  };
};

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase environment variables are missing. Define SUPABASE_URL or VITE_SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, or SUPABASE_ANON_KEY.",
      );
    }

    supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabase;
}

function getSupabaseAuthClient(accessToken: string): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase auth environment variables are missing. Define SUPABASE_URL or VITE_SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, or SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase admin environment variables are missing. Define SUPABASE_URL or VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdmin;
}

function isDataUrl(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("data:"));
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid base64 image payload.");
  }

  const [, mimeType, base64Data] = match;
  const extension = mimeType.split("/")[1] || "jpg";
  return {
    mimeType,
    extension,
    buffer: Buffer.from(base64Data, "base64"),
  };
}

function normalizePublicUrl(publicUrl: string) {
  return publicUrl.replace(/([^:]\/)\/+/g, "$1");
}

async function uploadDataUrlImage(dataUrl: string, folder: "main" | "gallery") {
  const { mimeType, extension, buffer } = parseDataUrl(dataUrl);
  const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const client = getSupabaseClient();

  const { error } = await client.storage
    .from("party-photos")
    .upload(objectPath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = client.storage.from("party-photos").getPublicUrl(objectPath);
  return {
    path: objectPath,
    publicUrl: normalizePublicUrl(data.publicUrl),
  };
}

async function removeStoredPhoto(storagePath: string | null) {
  if (!storagePath) {
    return;
  }

  const { error } = await getSupabaseClient().storage.from("party-photos").remove([storagePath]);
  if (error) {
    console.error("Failed to remove storage object:", error.message);
  }
}

async function replaceStoredPhoto(existingStoragePath: string | null, nextUrl: string | undefined) {
  if (!nextUrl || !isDataUrl(nextUrl)) {
    return {
      publicUrl: nextUrl,
      storagePath: existingStoragePath,
    };
  }

  const uploaded = await uploadDataUrlImage(nextUrl, "gallery");
  await removeStoredPhoto(existingStoragePath);
  return {
    publicUrl: uploaded.publicUrl,
    storagePath: uploaded.path,
  };
}

async function fetchConfig() {
  const client = getSupabaseClient();
  const [{ data: configRow, error: configError }, { data: photoRows, error: photoError }] = await Promise.all([
    client.from("party_config").select("*").eq("id", "primary").maybeSingle<ConfigRow>(),
    client.from("party_photos").select("*").order("sort_order", { ascending: true }).returns<PhotoRow[]>(),
  ]);

  if (configError) {
    throw new Error(configError.message);
  }
  if (photoError) {
    throw new Error(photoError.message);
  }
  if (!configRow) {
    throw new Error("party_config row 'primary' was not found.");
  }

  return {
    partyDate: configRow.party_date,
    partyTime: configRow.party_time,
    address: configRow.address,
    rsvpDeadline: configRow.rsvp_deadline,
    clothingSize: configRow.clothing_size,
    shoeSize: configRow.shoe_size,
    diaperSize: configRow.diaper_size,
    pixKey: configRow.pix_key,
    mainPhoto: configRow.main_photo_url || undefined,
    displayMode: (configRow.display_mode || "full") as "full" | "minimal",
    photos: (photoRows || []).map((photo) => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      month: photo.month || undefined,
    })),
  };
}

async function fetchRsvps() {
  const { data, error } = await getSupabaseClient()
    .from("party_rsvps")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<RsvpRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((rsvp) => ({
    id: rsvp.id,
    name: rsvp.name,
    isAttending: rsvp.is_attending,
    adults: rsvp.adults,
    children: rsvp.children,
    childrenAges: rsvp.children_ages || "",
    createdAt: rsvp.created_at,
  }));
}

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

async function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!accessToken) {
      return res.status(401).json({ error: "Autenticação obrigatória." });
    }

    const authClient = getSupabaseAuthClient(accessToken);
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    req.supabaseUser = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Não foi possível validar a autenticação." });
  }
}

function requireCronAuth(req: Request, res: Response, next: NextFunction) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!cronSecret) {
    return res.status(500).json({ error: "CRON_SECRET nao configurado." });
  }

  if (authorization !== cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Requisicao de cron nao autorizada." });
  }

  next();
}

app.get("/api/config", async (_req, res) => {
  try {
    const config = await fetchConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/config", requireAdminAuth, async (req, res) => {
  try {
    const payload = { ...req.body };
    const currentConfig = await fetchConfig();
    let mainPhotoUrl = payload.mainPhoto;

    if (isDataUrl(payload.mainPhoto)) {
      const uploaded = await uploadDataUrlImage(payload.mainPhoto, "main");
      mainPhotoUrl = uploaded.publicUrl;
    }

    const updatePayload = {
      id: "primary",
      party_date: payload.partyDate ?? currentConfig.partyDate,
      party_time: payload.partyTime ?? currentConfig.partyTime,
      address: payload.address ?? currentConfig.address,
      rsvp_deadline: payload.rsvpDeadline ?? currentConfig.rsvpDeadline,
      clothing_size: payload.clothingSize ?? currentConfig.clothingSize,
      shoe_size: payload.shoeSize ?? currentConfig.shoeSize,
      diaper_size: payload.diaperSize ?? currentConfig.diaperSize,
      pix_key: payload.pixKey ?? currentConfig.pixKey,
      main_photo_url: mainPhotoUrl ?? currentConfig.mainPhoto ?? null,
      display_mode: payload.displayMode ?? currentConfig.displayMode ?? "full",
    };

    const { error } = await getSupabaseClient().from("party_config").upsert(updatePayload, { onConflict: "id" });
    if (error) {
      throw new Error(error.message);
    }

    res.json({ success: true, config: await fetchConfig() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/rsvps", async (_req, res) => {
  try {
    res.json(await fetchRsvps());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/rsvps", async (req, res) => {
  try {
    const { name, isAttending, adults, children, childrenAges } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nome completo é obrigatório." });
    }

    const insertPayload = {
      name: String(name).trim(),
      is_attending: Boolean(isAttending),
      adults: Boolean(isAttending) ? parseInt(adults || "1", 10) : 0,
      children: Boolean(isAttending) ? parseInt(children || "0", 10) : 0,
      children_ages: Boolean(isAttending) ? String(childrenAges || "").trim() : "",
    };

    const { data, error } = await getSupabaseClient()
      .from("party_rsvps")
      .insert(insertPayload)
      .select("*")
      .single<RsvpRow>();

    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json({
      success: true,
      rsvp: {
        id: data.id,
        name: data.name,
        isAttending: data.is_attending,
        adults: data.adults,
        children: data.children,
        childrenAges: data.children_ages || "",
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/rsvps/:id", requireAdminAuth, async (req, res) => {
  try {
    const { error, count } = await getSupabaseClient()
      .from("party_rsvps")
      .delete({ count: "exact" })
      .eq("id", req.params.id);

    if (error) {
      throw new Error(error.message);
    }
    if (!count) {
      return res.status(404).json({ error: "Presença não encontrada." });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/photos", requireAdminAuth, async (req, res) => {
  try {
    const { url, caption, month } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL ou conteúdo da imagem em base64 é necessário." });
    }

    let publicUrl = String(url);
    let storagePath: string | null = null;
    if (isDataUrl(publicUrl)) {
      const uploaded = await uploadDataUrlImage(publicUrl, "gallery");
      publicUrl = uploaded.publicUrl;
      storagePath = uploaded.path;
    }

    const { data: latestPhoto } = await getSupabaseClient()
      .from("party_photos")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number }>();

    const { data, error } = await getSupabaseClient()
      .from("party_photos")
      .insert({
        url: publicUrl,
        caption: String(caption || "").trim() || "Nova foto do Hazael!",
        month: month || "Geral",
        storage_path: storagePath,
        sort_order: (latestPhoto?.sort_order || 0) + 1,
      })
      .select("*")
      .single<PhotoRow>();

    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json({
      success: true,
      photo: {
        id: data.id,
        url: data.url,
        caption: data.caption,
        month: data.month || undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/photos/ai-caption", requireAdminAuth, async (req, res) => {
  const { url, month } = req.body;

  if (!url) {
    return res.status(400).json({ error: "O conteúdo da imagem em base64 é necessário." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "O serviço de Inteligência Artificial do Google Gemini não está configurado. Cadastre a GEMINI_API_KEY.",
    });
  }

  try {
    const aiClient = getGeminiClient();
    const { mimeType, buffer } = parseDataUrl(url);

    const promptText = `Você é um assistente simpático especializado em criar legendas curtas, fofas, afetivas e altamente personalizadas para as fotos do mural de crescimento do bebê Hazael Oliveira Silva (que está completando 1 aninho).
O usuário selecionou uma foto e associou ao período/mês de crescimento: "${month || "Geral"}".

Analise a imagem anexada e escreva uma legenda calorosa em formato de frase curta sob a perspectiva do olhar orgulhoso e bobo dos pais.

REGRAS:
- Retorne apenas a legenda gerada em texto puro.
- O texto deve ter no máximo 120 caracteres.
- Se o período for diferente de "Geral", faça referência carinhosa a essa fase.
- Escreva em português do Brasil e use emojis leves quando fizer sentido.`;

    const response = await aiClient.models.generateContent({
      model: GEMINI_CAPTION_MODEL,
      contents: [
        {
          inlineData: {
            mimeType,
            data: buffer.toString("base64"),
          },
        },
        promptText,
      ],
    });

    res.json({
      success: true,
      caption: response.text ? response.text.trim() : "Sorriso inesquecível do nosso Baby Hazael! ✨",
    });
  } catch (error: any) {
    res.status(500).json({ error: `Erro ao consultar a IA da Google (${GEMINI_CAPTION_MODEL}): ${error.message}` });
  }
});

app.get("/api/cron/heartbeat", requireCronAuth, async (_req, res) => {
  try {
    const client = getSupabaseAdminClient();
    const payload = {
      id: "vercel-daily-heartbeat",
      source: "vercel_cron",
      last_run_at: new Date().toISOString(),
      payload: {
        status: "ok",
        trigger: "daily-heartbeat",
      },
    };

    const { error } = await client.schema("internal").from("project_heartbeat").upsert(payload, {
      onConflict: "id",
    });

    if (error) {
      throw new Error(error.message);
    }

    res.json({ success: true, heartbeat: payload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/photos/:id", requireAdminAuth, async (req, res) => {
  try {
    const { caption, month, url } = req.body;
    const client = getSupabaseClient();
    const { data: currentPhoto, error: selectError } = await client
      .from("party_photos")
      .select("id, url, caption, month, storage_path")
      .eq("id", req.params.id)
      .maybeSingle<{ id: string; url: string; caption: string; month: string | null; storage_path: string | null }>();

    if (selectError) {
      throw new Error(selectError.message);
    }
    if (!currentPhoto) {
      return res.status(404).json({ error: "Foto não encontrada." });
    }

    const replacedPhoto = await replaceStoredPhoto(currentPhoto.storage_path, url);
    const { data, error } = await client
      .from("party_photos")
      .update({
        caption: String(caption || currentPhoto.caption).trim() || currentPhoto.caption,
        month: String(month || currentPhoto.month || "Geral"),
        url: replacedPhoto.publicUrl || currentPhoto.url,
        storage_path: replacedPhoto.storagePath,
      })
      .eq("id", req.params.id)
      .select("*")
      .single<PhotoRow>();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      photo: {
        id: data.id,
        url: data.url,
        caption: data.caption,
        month: data.month || undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/photos/:id", requireAdminAuth, async (req, res) => {
  try {
    const { data: photo, error: selectError } = await getSupabaseClient()
      .from("party_photos")
      .select("id, storage_path")
      .eq("id", req.params.id)
      .maybeSingle<{ id: string; storage_path: string | null }>();

    if (selectError) {
      throw new Error(selectError.message);
    }
    if (!photo) {
      return res.status(404).json({ error: "Foto não encontrada." });
    }

    const { error: deleteError } = await getSupabaseClient().from("party_photos").delete().eq("id", req.params.id);
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await removeStoredPhoto(photo.storage_path);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/rsvps/export", requireAdminAuth, async (_req, res) => {
  try {
    const rsvps = await fetchRsvps();
    const csvHeaders = "Nome,Confirmou presenca?,Adultos,Criancas,Idades das Criancas,Data de Confirmacao\n";
    const csvRows = rsvps
      .map((r) => {
        const escapedName = `"${r.name.replace(/"/g, '""')}"`;
        const yesNo = r.isAttending ? "Sim" : "Não";
        const escapedAges = `"${(r.childrenAges || "").replace(/"/g, '""')}"`;
        const dateFormatted = new Date(r.createdAt).toLocaleString("pt-BR", { timeZone: "America/Rio_Branco" });
        return `${escapedName},${yesNo},${r.adults},${r.children},${escapedAges},"${dateFormatted}"`;
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=convidados_hazael.csv");
    res.send("\uFEFF" + csvHeaders + csvRows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

const isVercel = Boolean(process.env.VERCEL);
const isDirectExecution = process.argv[1] && process.argv[1].includes("server");

if (!isVercel && isDirectExecution) {
  startServer();
}
