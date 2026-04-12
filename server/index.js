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

// Evita assets desatualizados em deploy automatico (principalmente no mobile/PWA).
app.use((req, res, next) => {
  const noCacheTargets = ["/", "/index.html", "/app.js", "/styles.css", "/sw.js", "/manifest.webmanifest"];
  if (noCacheTargets.includes(req.path)) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

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

async function areFriends(db, userA, userB) {
  const relation = await db.get(
    `SELECT id
     FROM friend_requests
     WHERE status = 'accepted'
       AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
    [userA, userB, userB, userA]
  );
  return Boolean(relation);
}

async function resolveViewerTargetUserId(db, viewerId, requestedUserId) {
  if (!requestedUserId) return viewerId;

  const targetUserId = Number(requestedUserId);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw new Error("Identificador de usuario invalido");
  }

  if (targetUserId === viewerId) return viewerId;

  const canView = await areFriends(db, viewerId, targetUserId);
  if (!canView) throw new Error("Acesso permitido apenas para amigos");
  return targetUserId;
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

app.get("/api/friends", authMiddleware, async (req, res) => {
  const db = await getDb();
  const friends = await db.all(
    `SELECT
      CASE WHEN fr.requester_id = ? THEN u2.id ELSE u1.id END AS id,
      CASE WHEN fr.requester_id = ? THEN u2.name ELSE u1.name END AS name,
      CASE WHEN fr.requester_id = ? THEN u2.email ELSE u1.email END AS email,
      fr.created_at
     FROM friend_requests fr
     JOIN users u1 ON u1.id = fr.requester_id
     JOIN users u2 ON u2.id = fr.addressee_id
     WHERE fr.status = 'accepted'
       AND (fr.requester_id = ? OR fr.addressee_id = ?)
     ORDER BY name`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
  );

  return res.json({ friends });
});

app.get("/api/friends/requests", authMiddleware, async (req, res) => {
  const db = await getDb();
  const incoming = await db.all(
    `SELECT fr.id, fr.created_at, u.id AS requester_id, u.name, u.email
     FROM friend_requests fr
     JOIN users u ON u.id = fr.requester_id
     WHERE fr.addressee_id = ? AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`,
    [req.user.id]
  );

  return res.json({ incoming });
});

app.get("/api/friends/search", authMiddleware, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ users: [] });

  const db = await getDb();
  const users = await db.all(
    `SELECT id, name, email
     FROM users
     WHERE id != ?
       AND (LOWER(name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))
     ORDER BY name
     LIMIT 10`,
    [req.user.id, `%${q}%`, `%${q}%`]
  );

  return res.json({ users });
});

app.post("/api/friends/request", authMiddleware, async (req, res) => {
  const email = String(req.body.email || "").trim();
  if (!email) return res.status(400).json({ message: "Email do amigo obrigatorio" });

  const db = await getDb();
  const target = await db.get("SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(?)", [email]);
  if (!target) return res.status(404).json({ message: "Usuario nao encontrado" });
  if (target.id === req.user.id) return res.status(400).json({ message: "Nao e possivel adicionar a si mesmo" });

  const existing = await db.get(
    `SELECT id, requester_id, addressee_id, status
     FROM friend_requests
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.user.id, target.id, target.id, req.user.id]
  );

  if (existing?.status === "accepted") {
    return res.status(409).json({ message: "Esse usuario ja e seu amigo" });
  }

  if (existing?.status === "pending" && existing.requester_id === target.id) {
    await db.run("UPDATE friend_requests SET status = 'accepted' WHERE id = ?", [existing.id]);
    return res.json({ message: "Pedido aceito automaticamente. Agora voces sao amigos" });
  }

  if (existing?.status === "pending") {
    return res.status(409).json({ message: "Pedido de amizade ja enviado" });
  }

  if (existing?.status === "rejected") {
    await db.run(
      "UPDATE friend_requests SET requester_id = ?, addressee_id = ?, status = 'pending', created_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.user.id, target.id, existing.id]
    );
    return res.status(201).json({ message: "Pedido reenviado" });
  }

  await db.run(
    "INSERT INTO friend_requests (requester_id, addressee_id, status) VALUES (?, ?, 'pending')",
    [req.user.id, target.id]
  );

  return res.status(201).json({ message: "Pedido de amizade enviado" });
});

app.post("/api/friends/requests/:id/accept", authMiddleware, async (req, res) => {
  const db = await getDb();
  const requestRow = await db.get(
    "SELECT * FROM friend_requests WHERE id = ? AND addressee_id = ? AND status = 'pending'",
    [req.params.id, req.user.id]
  );

  if (!requestRow) return res.status(404).json({ message: "Pedido nao encontrado" });

  await db.run("UPDATE friend_requests SET status = 'accepted' WHERE id = ?", [req.params.id]);
  return res.json({ message: "Pedido aceito" });
});

app.post("/api/friends/requests/:id/reject", authMiddleware, async (req, res) => {
  const db = await getDb();
  const requestRow = await db.get(
    "SELECT * FROM friend_requests WHERE id = ? AND addressee_id = ? AND status = 'pending'",
    [req.params.id, req.user.id]
  );

  if (!requestRow) return res.status(404).json({ message: "Pedido nao encontrado" });

  await db.run("UPDATE friend_requests SET status = 'rejected' WHERE id = ?", [req.params.id]);
  return res.json({ message: "Pedido recusado" });
});

app.get("/api/location/share", authMiddleware, async (req, res) => {
  const db = await getDb();
  const current = await db.get(
    "SELECT is_sharing, updated_at FROM friend_locations WHERE user_id = ?",
    [req.user.id]
  );

  return res.json({
    enabled: Boolean(current?.is_sharing),
    updatedAt: current?.updated_at || null
  });
});

app.post("/api/location/share", authMiddleware, async (req, res) => {
  const enabled = Boolean(req.body?.enabled);
  const db = await getDb();

  await db.run(
    `INSERT INTO friend_locations (user_id, is_sharing, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id)
     DO UPDATE SET is_sharing = excluded.is_sharing, updated_at = CURRENT_TIMESTAMP`,
    [req.user.id, enabled ? 1 : 0]
  );

  return res.json({ enabled });
});

app.post("/api/location/update", authMiddleware, async (req, res) => {
  const latitude = Number(req.body?.latitude);
  const longitude = Number(req.body?.longitude);
  const accuracy = Number(req.body?.accuracy || 0);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({ message: "Latitude invalida" });
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: "Longitude invalida" });
  }

  const db = await getDb();
  await db.run(
    `INSERT INTO friend_locations (user_id, latitude, longitude, accuracy, is_sharing, updated_at)
     VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id)
     DO UPDATE SET
       latitude = excluded.latitude,
       longitude = excluded.longitude,
       accuracy = excluded.accuracy,
       is_sharing = 1,
       updated_at = CURRENT_TIMESTAMP`,
    [req.user.id, latitude, longitude, Number.isFinite(accuracy) ? accuracy : 0]
  );

  return res.json({ ok: true });
});

app.get("/api/friends/:friendId/location", authMiddleware, async (req, res) => {
  const friendId = Number(req.params.friendId);
  if (!Number.isInteger(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "Identificador de amigo invalido" });
  }

  const db = await getDb();
  const canView = await areFriends(db, req.user.id, friendId);
  if (!canView) {
    return res.status(403).json({ message: "Acesso permitido apenas para amigos" });
  }

  const friend = await db.get("SELECT id, name FROM users WHERE id = ?", [friendId]);
  if (!friend) {
    return res.status(404).json({ message: "Amigo nao encontrado" });
  }

  const location = await db.get(
    `SELECT latitude, longitude, accuracy, updated_at, is_sharing
     FROM friend_locations
     WHERE user_id = ?`,
    [friendId]
  );

  if (!location || !location.is_sharing || location.latitude == null || location.longitude == null) {
    return res.json({
      friend,
      available: false,
      message: "Esse amigo nao esta compartilhando localizacao no momento"
    });
  }

  return res.json({
    friend,
    available: true,
    location: {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      accuracy: Number(location.accuracy || 0),
      updatedAt: location.updated_at
    }
  });
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
  const { date, month, userId } = req.query;
  const db = await getDb();

  let ownerId;
  try {
    ownerId = await resolveViewerTargetUserId(db, req.user.id, userId);
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }

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
      [ownerId, date]
    );
  } else if (month) {
    dreams = await db.all(
      `SELECT d.id, d.title, d.date, d.is_important
       FROM dreams d
       WHERE d.user_id = ? AND substr(d.date, 1, 7) = ?
       ORDER BY d.date DESC`,
      [ownerId, month]
    );
  } else {
    dreams = await db.all(
      "SELECT * FROM dreams WHERE user_id = ? ORDER BY date DESC LIMIT 100",
      [ownerId]
    );
  }

  return res.json({ dreams, ownerId });
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
  const { userId } = req.query;
  const db = await getDb();

  let ownerId;
  try {
    ownerId = await resolveViewerTargetUserId(db, req.user.id, userId);
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }

  const totals = await db.get(
    `SELECT
      COUNT(*) AS totalDreams,
      SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) AS importantDreams
     FROM dreams WHERE user_id = ?`,
    [ownerId]
  );

  const byMood = await db.all(
    `SELECT COALESCE(mood, 'sem-humor') AS mood, COUNT(*) AS count
     FROM dreams
     WHERE user_id = ?
     GROUP BY mood
     ORDER BY count DESC`,
    [ownerId]
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
    [ownerId]
  );

  const byMonth = await db.all(
    `SELECT substr(date, 1, 7) AS month, COUNT(*) AS count
     FROM dreams
     WHERE user_id = ?
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`,
    [ownerId]
  );

  return res.json({ totals, byMood, topTags, byMonth, ownerId });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SONINHOS rodando em http://localhost:${PORT}`);
});
