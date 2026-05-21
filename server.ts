import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure DB directory and file exist
function initializeDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      config: {
        partyDate: "2026-07-25",
        partyTime: "18:00",
        address: "R. Major Martins, 208 - Parque dos Sabiás, Rio Branco - AC, 69903-007",
        rsvpDeadline: "2026-07-01",
        clothingSize: "1 ou 2",
        shoeSize: "19",
        diaperSize: "XG",
        pixKey: "ewerton.bezerra.silva@gmail.com",
        photos: [
          {
            id: "1",
            url: "/src/assets/images/baby_hazael_portrait_1779399080097.png",
            caption: "Hazael Oliveira Silva - 1 Aninho"
          }
        ]
      },
      rsvps: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
  }
}

initializeDB();

// Read DB helper
function readDB() {
  try {
    initializeDB();
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return { config: {}, rsvps: [] };
  }
}

// Write DB helper
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Support large JSON payloads for base64 photo uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API ENDPOINTS ---

// GET config
app.get("/api/config", (req, res) => {
  const db = readDB();
  res.json(db.config);
});

// POST config
app.post("/api/config", (req, res) => {
  const db = readDB();
  db.config = { ...db.config, ...req.body };
  writeDB(db);
  res.json({ success: true, config: db.config });
});

// GET RSVPs
app.get("/api/rsvps", (req, res) => {
  const db = readDB();
  res.json(db.rsvps);
});

// POST RSVP (for guests or manual entries)
app.post("/api/rsvps", (req, res) => {
  const { name, isAttending, adults, children, childrenAges } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Nome completo é obrigatório." });
  }

  const db = readDB();
  const newRsvp = {
    id: Date.now().toString(),
    name: name.trim(),
    isAttending: Boolean(isAttending),
    adults: isAttending ? parseInt(adults || "1", 10) : 0,
    children: isAttending ? parseInt(children || "0", 10) : 0,
    childrenAges: isAttending ? (childrenAges || "").trim() : "",
    createdAt: new Date().toISOString()
  };

  db.rsvps.push(newRsvp);
  writeDB(db);

  res.status(201).json({ success: true, rsvp: newRsvp });
});

// DELETE RSVP
app.delete("/api/rsvps/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.rsvps.length;
  db.rsvps = db.rsvps.filter((item: any) => item.id !== id);
  
  if (db.rsvps.length === initialLength) {
    return res.status(404).json({ error: "Presença não encontrada." });
  }
  
  writeDB(db);
  res.json({ success: true });
});

// POST Photo upload (Base64)
app.post("/api/photos", (req, res) => {
  const { url, caption } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL ou conteúdo da imagem em base64 é necessário." });
  }

  const db = readDB();
  const newPhoto = {
    id: Date.now().toString(),
    url: url, // Contains base64 Data URL
    caption: (caption || "").trim() || "Nova foto do Hazael!"
  };

  db.config.photos = db.config.photos || [];
  db.config.photos.push(newPhoto);
  writeDB(db);

  res.status(201).json({ success: true, photo: newPhoto });
});

// DELETE Photo
app.delete("/api/photos/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (db.config.photos) {
    db.config.photos = db.config.photos.filter((pic: any) => pic.id !== id);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Nenhuma foto encontrada." });
  }
});

// GET Export RSVP to CSV (excel friendly with UTF-8 BOM)
app.get("/api/rsvps/export", (req, res) => {
  const db = readDB();
  const rsvps = db.rsvps;

  // Let's create CSV headers and lines
  const csvHeaders = "Nome,Confirmou presenca?,Adultos,Criancas,Idades das Criancas,Data de Confirmacao\n";
  const csvRows = rsvps.map((r: any) => {
    const escapedName = `"${r.name.replace(/"/g, '""')}"`;
    const yesNo = r.isAttending ? "Sim" : "Não";
    const escapedAges = `"${(r.childrenAges || "").replace(/"/g, '""')}"`;
    const dateFormatted = new Date(r.createdAt).toLocaleString("pt-BR", { timeZone: "America/Rio_Branco" });
    return `${escapedName},${yesNo},${r.adults},${r.children},${escapedAges},"${dateFormatted}"`;
  }).join("\n");

  const csvContent = "\uFEFF" + csvHeaders + csvRows; // Add UTF-8 BOM for Excel compatibility

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=convidados_hazael.csv");
  res.send(csvContent);
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
