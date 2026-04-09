import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "troque-por-uma-chave-segura";

app.use(express.json());
app.use(express.static(publicDir));

function getTokenFromHeader(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function authMiddleware(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    const deviceId = req.headers["x-device-id"];

    if (!token) return res.status(401).json({ message: "Token ausente" });
    if (!deviceId) return res.status(401).json({ message: "Dispositivo nao identificado" });

    const payload = jwt.verify(token, JWT_SECRET);
    const db = await getDb();

    const trusted = await db.get(
      "SELECT id FROM trusted_devices WHERE user_id = ? AND device_id = ?",
      [payload.userId, deviceId]
    );

    if (!trusted) {
      return res.status(403).json({ message: "Dispositivo nao autorizado" });
    }

    req.user = { id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: "Sessao invalida" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, deviceId, deviceName } = req.body;
  if (!name || !email || !password || !deviceId) {
    return res.status(400).json({ message: "Campos obrigatorios ausentes" });
  }

  const db = await getDb();
  const existing = await db.get("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) return res.status(409).json({ message: "Email ja cadastrado" });

  const hash = await bcrypt.hash(password, 10);
  const userResult = await db.run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, hash]
  );

  await db.run(
    "INSERT INTO trusted_devices (user_id, device_id, device_name) VALUES (?, ?, ?)",
    [userResult.lastID, deviceId, deviceName || "Dispositivo principal"]
  );

  const token = jwt.sign({ userId: userResult.lastID }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: userResult.lastID, name, email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, deviceId, deviceName } = req.body;
  if (!email || !password || !deviceId) {
    return res.status(400).json({ message: "Campos obrigatorios ausentes" });
  }

  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ message: "Credenciais invalidas" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Credenciais invalidas" });

  await db.run(
    "INSERT OR IGNORE INTO trusted_devices (user_id, device_id, device_name) VALUES (?, ?, ?)",
    [user.id, deviceId, deviceName || "Dispositivo"]
  );

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = await db.get("SELECT id, name, email, created_at FROM users WHERE id = ?", [req.user.id]);
  return res.json({ user });
});

app.get("/api/tags", authMiddleware, async (req, res) => {
  const db = await getDb();
  const tags = await db.all("SELECT * FROM tags WHERE user_id = ? ORDER BY name", [req.user.id]);
  return res.json({ tags });
});

app.post("/api/tags", authMiddleware, async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ message: "Nome da tag obrigatorio" });

  const db = await getDb();
  try {
    const result = await db.run(
      "INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)",
      [req.user.id, name.trim(), color || "#2f7f6e"]
    );
    const created = await db.get("SELECT * FROM tags WHERE id = ?", [result.lastID]);
    return res.status(201).json({ tag: created });
  } catch {
    return res.status(409).json({ message: "Tag ja existe" });
  }
});

app.patch("/api/tags/:id", authMiddleware, async (req, res) => {
  const { color } = req.body;
  if (!color) return res.status(400).json({ message: "Cor da tag obrigatoria" });

  const validHexColor = /^#[0-9a-fA-F]{6}$/;
  if (!validHexColor.test(color)) {
    return res.status(400).json({ message: "Cor invalida. Use formato hexadecimal" });
  }

  const db = await getDb();
  const result = await db.run(
    "UPDATE tags SET color = ? WHERE id = ? AND user_id = ?",
    [color, req.params.id, req.user.id]
  );

  if (!result.changes) {
    return res.status(404).json({ message: "Tag nao encontrada" });
  }

  const updated = await db.get("SELECT * FROM tags WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  return res.json({ tag: updated });
});

app.delete("/api/tags/:id", authMiddleware, async (req, res) => {
  const db = await getDb();
  await db.run("DELETE FROM tags WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  return res.json({ ok: true });
});

app.get("/api/dreams", authMiddleware, async (req, res) => {
  const { date, month } = req.query;
  const db = await getDb();

  let dreams = [];
  if (date) {
    dreams = await db.all(
      `SELECT d.*,
        GROUP_CONCAT(t.name, ', ') AS tag_names
       FROM dreams d
       LEFT JOIN dream_tags dt ON dt.dream_id = d.id
       LEFT JOIN tags t ON t.id = dt.tag_id
       WHERE d.user_id = ? AND d.date = ?
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [req.user.id, date]
    );
  } else if (month) {
    dreams = await db.all(
      `SELECT d.id, d.title, d.date, d.is_important
       FROM dreams d
       WHERE d.user_id = ? AND substr(d.date, 1, 7) = ?
       ORDER BY d.date DESC`,
      [req.user.id, month]
    );
  } else {
    dreams = await db.all(
      "SELECT * FROM dreams WHERE user_id = ? ORDER BY date DESC LIMIT 100",
      [req.user.id]
    );
  }

  return res.json({ dreams });
});

app.post("/api/dreams", authMiddleware, async (req, res) => {
  const { title, content, mood, date, isImportant, tagIds } = req.body;
  if (!title || !content || !date) {
    return res.status(400).json({ message: "Titulo, conteudo e data sao obrigatorios" });
  }

  const db = await getDb();
  const result = await db.run(
    `INSERT INTO dreams (user_id, title, content, mood, date, is_important)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, title, content, mood || null, date, isImportant ? 1 : 0]
  );

  if (Array.isArray(tagIds) && tagIds.length) {
    for (const tagId of tagIds) {
      await db.run(
        "INSERT OR IGNORE INTO dream_tags (dream_id, tag_id) VALUES (?, ?)",
        [result.lastID, tagId]
      );
    }
  }

  const created = await db.get("SELECT * FROM dreams WHERE id = ?", [result.lastID]);
  return res.status(201).json({ dream: created });
});

app.get("/api/stats", authMiddleware, async (req, res) => {
  const db = await getDb();

  const totals = await db.get(
    `SELECT
      COUNT(*) AS totalDreams,
      SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) AS importantDreams
     FROM dreams WHERE user_id = ?`,
    [req.user.id]
  );

  const byMood = await db.all(
    `SELECT COALESCE(mood, 'sem-humor') AS mood, COUNT(*) AS count
     FROM dreams
     WHERE user_id = ?
     GROUP BY mood
     ORDER BY count DESC`,
    [req.user.id]
  );

  const topTags = await db.all(
    `SELECT t.name, COUNT(*) AS count
     FROM dream_tags dt
     JOIN tags t ON t.id = dt.tag_id
     JOIN dreams d ON d.id = dt.dream_id
     WHERE d.user_id = ?
     GROUP BY t.id
     ORDER BY count DESC
     LIMIT 5`,
    [req.user.id]
  );

  const byMonth = await db.all(
    `SELECT substr(date, 1, 7) AS month, COUNT(*) AS count
     FROM dreams
     WHERE user_id = ?
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`,
    [req.user.id]
  );

  return res.json({ totals, byMood, topTags, byMonth });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SONINHOS rodando em http://localhost:${PORT}`);
});
