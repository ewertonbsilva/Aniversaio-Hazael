import type { Request, Response } from "express";
import { isValidCronAuthorization, runProjectHeartbeat } from "../../server.js";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  if (!process.env.CRON_SECRET) {
    return res.status(500).json({ error: "CRON_SECRET nao configurado." });
  }

  if (!isValidCronAuthorization(req.headers.authorization)) {
    return res.status(401).json({ error: "Requisicao de cron nao autorizada." });
  }

  try {
    const payload = await runProjectHeartbeat();
    return res.status(200).json({ success: true, heartbeat: payload });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
