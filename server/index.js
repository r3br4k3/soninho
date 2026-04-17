import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const wallpaperStoreDir = path.join(publicDir, "wallpapers");
const passItemsDir = path.join(publicDir, "passe-itens");
const passProfileItemsDir = path.join(passItemsDir, "perfil");
const CUSTOM_WALLPAPER_PRICE = 200;
const CUSTOM_THEME_COLOR_PRICE = 120;
const WEEKLY_PASS_PRICE = 100;
const DAILY_PASS_REWARD = 20;
const WEEKEND_PASS_REWARD = 100;
const ADMIN_KEY = String(process.env.ADMIN_KEY || "william").toLowerCase();
const TAG_CUSTOM_ITEM_ID = "tag_custom_personalizada";
const ALLOWED_TAG_FONT_CLASSES = new Set(["font-dancing", "font-orbitron", "font-playfair", "font-courier"]);
const ALLOWED_TAG_ANIMATION_CLASSES = new Set(["tag-anim-blink", "tag-anim-pulse", "tag-anim-float"]);

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

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function fileExtensionFromContentType(contentType) {
  const normalized = String(contentType || "").toLowerCase();
  if (normalized.includes("image/jpeg")) return ".jpg";
  if (normalized.includes("image/png")) return ".png";
  if (normalized.includes("image/webp")) return ".webp";
  if (normalized.includes("image/gif")) return ".gif";
  return null;
}

async function ensureWallpaperStoreDir() {
  await fs.mkdir(wallpaperStoreDir, { recursive: true });
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function localDateISO(dateObj = new Date()) {
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
}

function startOfWeekLocal(dateObj = new Date()) {
  const copy = new Date(dateObj);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  return copy;
}

function weekStartISO(dateObj = new Date()) {
  return localDateISO(startOfWeekLocal(dateObj));
}

function isWeekendDate(dateObj = new Date()) {
  const day = dateObj.getDay();
  return day === 0 || day === 6;
}

function getDailyPassReward(dateObj = new Date()) {
  return isWeekendDate(dateObj) ? WEEKEND_PASS_REWARD : DAILY_PASS_REWARD;
}

async function listPassItems() {
  try {
    const entries = await fs.readdir(passItemsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: `/passe-itens/${entry.name}`,
      }));
  } catch {
    return [];
  }
}

function isSupportedImageFile(fileName) {
  return /\.(png|jpe?g|webp|gif)$/i.test(String(fileName || ""));
}

async function listPassProfileRewardFiles() {
  const sources = [
    { dirPath: passProfileItemsDir, urlPrefix: '/passe-itens/perfil/' },
    { dirPath: passItemsDir, urlPrefix: '/passe-itens/' },
  ];

  const allFiles = [];
  for (const source of sources) {
    try {
      const entries = await fs.readdir(source.dirPath, { withFileTypes: true });
      const files = await Promise.all(
        entries
          .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && isSupportedImageFile(entry.name))
          .map(async (entry) => {
            const absolutePath = path.join(source.dirPath, entry.name);
            const stats = await fs.stat(absolutePath);
            return {
              itemKey: `${source.urlPrefix}${entry.name}`,
              itemName: entry.name.replace(/\.[^.]+$/, ""),
              imagePath: `${source.urlPrefix}${entry.name}`,
              mtimeMs: stats.mtimeMs,
            };
          })
      );
      allFiles.push(...files);
    } catch {
      // pasta pode nao existir ou estar vazia
    }
  }

  return allFiles.sort((a, b) => b.mtimeMs - a.mtimeMs || a.itemKey.localeCompare(b.itemKey));
}

async function getCurrentWeeklyProfileReward() {
  const profileFiles = await listPassProfileRewardFiles();
  return profileFiles[0] || null;
}

async function getPassStatus(db, userId) {
  const now = new Date();
  const today = localDateISO(now);
  const currentWeekStart = weekStartISO(now);
  const subscription = await db.get(
    "SELECT week_start, paid_at FROM pass_subscriptions WHERE user_id = ? AND week_start = ?",
    [userId, currentWeekStart]
  );
  const todayClaim = await db.get(
    "SELECT claim_date, reward_coins, claimed_at FROM pass_claims WHERE user_id = ? AND claim_date = ?",
    [userId, today]
  );
  const weeklyClaims = await db.all(
    `SELECT claim_date, reward_coins, claimed_at
     FROM pass_claims
     WHERE user_id = ? AND week_start = ?
     ORDER BY claim_date ASC`,
    [userId, currentWeekStart]
  );
  const user = await db.get(
    "SELECT soninhos_balance FROM users WHERE id = ?",
    [userId]
  );
  const equipped = await db.get(
    "SELECT active_profile_image FROM user_equipped WHERE user_id = ?",
    [userId]
  );
  const passItems = await listPassItems();
  const profileCatalog = await listPassProfileRewardFiles();
  const currentWeeklyProfileReward = await getCurrentWeeklyProfileReward();
  const ownedProfileRewards = await db.all(
    `SELECT id, week_start, item_key, item_name, image_path, claimed_at
     FROM user_pass_profile_rewards
     WHERE user_id = ?
     ORDER BY claimed_at DESC, id DESC`,
    [userId]
  );
  const alreadyOwnsCurrentProfileReward = currentWeeklyProfileReward
    ? ownedProfileRewards.some((reward) => reward.item_key === currentWeeklyProfileReward.itemKey)
    : false;
  const canClaimWeeklyProfileReward = Boolean(
    subscription
      && currentWeeklyProfileReward
      && !alreadyOwnsCurrentProfileReward
  );

  return {
    active: Boolean(subscription),
    weekStart: currentWeekStart,
    paidAt: subscription?.paid_at || null,
    today,
    todayReward: getDailyPassReward(now),
    todayClaimed: Boolean(todayClaim),
    todayClaimReward: todayClaim?.reward_coins || 0,
    weeklyClaimCount: weeklyClaims.length,
    weeklyClaims,
    soninhosBalance: user?.soninhos_balance ?? 0,
    weeklyPrice: WEEKLY_PASS_PRICE,
    weekdayReward: DAILY_PASS_REWARD,
    weekendReward: WEEKEND_PASS_REWARD,
    itemsFolder: '/passe-itens/',
    profileItemsFolder: '/passe-itens/perfil/ (ou /passe-itens/)',
    items: passItems,
    activeProfileImage: equipped?.active_profile_image || null,
    weeklyProfileRewardClaimed: Boolean(currentWeeklyProfileReward && alreadyOwnsCurrentProfileReward),
    canClaimWeeklyProfileReward,
    currentWeeklyProfileReward: currentWeeklyProfileReward
      ? {
          itemKey: currentWeeklyProfileReward.itemKey,
          itemName: currentWeeklyProfileReward.itemName,
          imagePath: currentWeeklyProfileReward.imagePath,
        }
      : null,
    profileCatalog: profileCatalog.map((item) => ({
      itemKey: item.itemKey,
      itemName: item.itemName,
      imagePath: item.imagePath,
    })),
    ownedProfileRewards,
  };
}

async function downloadWallpaperToStore(imageUrl, userId) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Nao foi possivel baixar a imagem do wallpaper");
  }

  const contentType = response.headers.get("content-type");
  const extension = fileExtensionFromContentType(contentType);
  if (!extension) {
    throw new Error("A URL informada nao aponta para uma imagem valida (jpg, png, webp, gif)");
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const maxBytes = 8 * 1024 * 1024;
  if (imageBuffer.length > maxBytes) {
    throw new Error("A imagem excede o limite de 8MB");
  }

  await ensureWallpaperStoreDir();
  const fileName = `user-${userId}-${Date.now()}${extension}`;
  const absoluteFilePath = path.join(wallpaperStoreDir, fileName);
  await fs.writeFile(absoluteFilePath, imageBuffer);
  return `/wallpapers/${fileName}`;
}

async function deleteWallpaperFile(filePath) {
  if (!filePath) return;
  const normalized = String(filePath).replace(/^\/+/, "");
  const absolutePath = path.join(publicDir, normalized);
  try {
    await fs.unlink(absolutePath);
  } catch {
    // arquivo pode ja ter sido removido
  }
}

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

function requireAdmin(req, res, next) {
  const providedKey = String(req.headers["x-admin-key"] || "").toLowerCase();
  if (!providedKey || providedKey !== ADMIN_KEY) {
    return res.status(403).json({ message: "Acesso admin negado" });
  }
  return next();
}

async function getOwnedTagEffectClasses(db, userId) {
  const rows = await db.all(
    `SELECT si.effect_class
     FROM user_purchases up
     JOIN shop_items si ON si.id = up.item_id
     WHERE up.user_id = ? AND si.category = 'tag_effect'`,
    [userId]
  );
  return new Set(rows.map((row) => row.effect_class).filter(Boolean));
}

async function userOwnsShopItem(db, userId, itemId) {
  const row = await db.get(
    "SELECT 1 FROM user_purchases WHERE user_id = ? AND item_id = ?",
    [userId, itemId]
  );
  return Boolean(row);
}

function normalizeOptionalClass(value) {
  const normalized = value == null ? "" : String(value).trim();
  return normalized || null;
}

function isValidHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "").trim());
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
  const user = await db.get("SELECT id, name, email, created_at, soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  return res.json({ user });
});

app.get("/api/friends", authMiddleware, async (req, res) => {
  const db = await getDb();
  const friends = await db.all(
    `SELECT
      CASE WHEN fr.requester_id = ? THEN u2.id ELSE u1.id END AS id,
      CASE WHEN fr.requester_id = ? THEN u2.name ELSE u1.name END AS name,
      CASE WHEN fr.requester_id = ? THEN u2.email ELSE u1.email END AS email,
      COALESCE(fl.is_sharing, 0) AS location_sharing,
      fl.updated_at AS location_updated_at,
      fr.created_at
     FROM friend_requests fr
     JOIN users u1 ON u1.id = fr.requester_id
     JOIN users u2 ON u2.id = fr.addressee_id
     LEFT JOIN friend_locations fl ON fl.user_id = CASE WHEN fr.requester_id = ? THEN u2.id ELSE u1.id END
     WHERE fr.status = 'accepted'
       AND (fr.requester_id = ? OR fr.addressee_id = ?)
     ORDER BY name`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
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
  const { name, color, tagEffectClass, tagFontClass, tagAnimationClass } = req.body;
  if (!name) return res.status(400).json({ message: "Nome da tag obrigatorio" });

  const db = await getDb();

  let effectClassToSave = null;
  if (tagEffectClass != null && String(tagEffectClass).trim() !== "") {
    const ownedEffects = await getOwnedTagEffectClasses(db, req.user.id);
    if (!ownedEffects.has(String(tagEffectClass))) {
      return res.status(400).json({ message: "Voce nao possui esse efeito de tag" });
    }
    effectClassToSave = String(tagEffectClass);
  }

  const hasTagCustomizer = await userOwnsShopItem(db, req.user.id, TAG_CUSTOM_ITEM_ID);

  const fontClassToSave = normalizeOptionalClass(tagFontClass);
  if (fontClassToSave && !hasTagCustomizer) {
    return res.status(400).json({ message: "Compre Tag Personalizada na loja para alterar fonte da tag" });
  }
  if (fontClassToSave && !ALLOWED_TAG_FONT_CLASSES.has(fontClassToSave)) {
    return res.status(400).json({ message: "Fonte de tag invalida" });
  }

  const animationClassToSave = normalizeOptionalClass(tagAnimationClass);
  if (animationClassToSave && !hasTagCustomizer) {
    return res.status(400).json({ message: "Compre Tag Personalizada na loja para usar animacao na tag" });
  }
  if (animationClassToSave && !ALLOWED_TAG_ANIMATION_CLASSES.has(animationClassToSave)) {
    return res.status(400).json({ message: "Animacao de tag invalida" });
  }

  try {
    const result = await db.run(
      "INSERT INTO tags (user_id, name, color, tag_effect_class, tag_font_class, tag_animation_class) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, name.trim(), color || "#2f7f6e", effectClassToSave, fontClassToSave, animationClassToSave]
    );
    const created = await db.get("SELECT * FROM tags WHERE id = ?", [result.lastID]);
    return res.status(201).json({ tag: created });
  } catch {
    return res.status(409).json({ message: "Tag ja existe" });
  }
});

app.patch("/api/tags/:id", authMiddleware, async (req, res) => {
  const { color, tagEffectClass, tagFontClass, tagAnimationClass } = req.body;
  const hasColor = typeof color === "string";
  const hasEffect = Object.prototype.hasOwnProperty.call(req.body || {}, "tagEffectClass");
  const hasFont = Object.prototype.hasOwnProperty.call(req.body || {}, "tagFontClass");
  const hasAnimation = Object.prototype.hasOwnProperty.call(req.body || {}, "tagAnimationClass");
  if (!hasColor && !hasEffect && !hasFont && !hasAnimation) {
    return res.status(400).json({ message: "Informe cor, efeito, fonte e/ou animacao da tag" });
  }

  const db = await getDb();
  const current = await db.get("SELECT * FROM tags WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (!current) {
    return res.status(404).json({ message: "Tag nao encontrada" });
  }

  let nextColor = current.color;
  if (hasColor) {
    const validHexColor = /^#[0-9a-fA-F]{6}$/;
    if (!validHexColor.test(color)) {
      return res.status(400).json({ message: "Cor invalida. Use formato hexadecimal" });
    }
    nextColor = color;
  }

  let nextEffectClass = current.tag_effect_class || null;
  if (hasEffect) {
    const normalized = tagEffectClass == null ? "" : String(tagEffectClass).trim();
    if (!normalized) {
      nextEffectClass = null;
    } else {
      const ownedEffects = await getOwnedTagEffectClasses(db, req.user.id);
      if (!ownedEffects.has(normalized)) {
        return res.status(400).json({ message: "Voce nao possui esse efeito de tag" });
      }
      nextEffectClass = normalized;
    }
  }

  const hasTagCustomizer = hasFont || hasAnimation
    ? await userOwnsShopItem(db, req.user.id, TAG_CUSTOM_ITEM_ID)
    : false;

  let nextFontClass = current.tag_font_class || null;
  if (hasFont) {
    const normalizedFont = normalizeOptionalClass(tagFontClass);
    if (normalizedFont && !hasTagCustomizer) {
      return res.status(400).json({ message: "Compre Tag Personalizada na loja para alterar fonte da tag" });
    }
    if (normalizedFont && !ALLOWED_TAG_FONT_CLASSES.has(normalizedFont)) {
      return res.status(400).json({ message: "Fonte de tag invalida" });
    }
    nextFontClass = normalizedFont;
  }

  let nextAnimationClass = current.tag_animation_class || null;
  if (hasAnimation) {
    const normalizedAnimation = normalizeOptionalClass(tagAnimationClass);
    if (normalizedAnimation && !hasTagCustomizer) {
      return res.status(400).json({ message: "Compre Tag Personalizada na loja para usar animacao na tag" });
    }
    if (normalizedAnimation && !ALLOWED_TAG_ANIMATION_CLASSES.has(normalizedAnimation)) {
      return res.status(400).json({ message: "Animacao de tag invalida" });
    }
    nextAnimationClass = normalizedAnimation;
  }

  const result = await db.run(
    "UPDATE tags SET color = ?, tag_effect_class = ?, tag_font_class = ?, tag_animation_class = ? WHERE id = ? AND user_id = ?",
    [nextColor, nextEffectClass, nextFontClass, nextAnimationClass, req.params.id, req.user.id]
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
        GROUP_CONCAT(t.name, ', ') AS tag_names,
        GROUP_CONCAT(
          t.name || '::' || COALESCE(t.color, '#7f6edc') || '::' || COALESCE(t.tag_effect_class, '') || '::' || COALESCE(t.tag_font_class, '') || '::' || COALESCE(t.tag_animation_class, ''),
          '||'
        ) AS tag_details
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
  const { title, content, mood, date, isImportant, tagIds, appliedFontClass } = req.body;
  if (!title || !content || !date) {
    return res.status(400).json({ message: "Titulo, conteudo e data sao obrigatorios" });
  }

  const db = await getDb();
  const fontClass = String(appliedFontClass || "").trim() || null;
  const result = await db.run(
    `INSERT INTO dreams (user_id, title, content, mood, date, is_important, applied_font_class)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, title, content, mood || null, date, isImportant ? 1 : 0, fontClass]
  );

  const tagCount = Array.isArray(tagIds) ? tagIds.length : 0;
  if (tagCount) {
    for (const tagId of tagIds) {
      await db.run(
        "INSERT OR IGNORE INTO dream_tags (dream_id, tag_id) VALUES (?, ?)",
        [result.lastID, tagId]
      );
    }
  }

  // Recompensa em Soninhos
  const wordCount = content.trim().split(/\s+/).length;
  let earned = 3;
  if (wordCount > 100) earned += 2;
  earned += Math.min(tagCount, 3);
  await db.run("UPDATE users SET soninhos_balance = soninhos_balance + ? WHERE id = ?", [earned, req.user.id]);

  const created = await db.get("SELECT * FROM dreams WHERE id = ?", [result.lastID]);
  const userAfter = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  return res.status(201).json({ dream: created, soninhosEarned: earned, soninhosBalance: userAfter.soninhos_balance });
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

// ─── LOJA DOS SONHOS ─────────────────────────────────────────────────────────

app.get("/api/shop/balance", authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  return res.json({ balance: user?.soninhos_balance ?? 0 });
});

app.get("/api/pass/status", authMiddleware, async (req, res) => {
  const db = await getDb();
  const pass = await getPassStatus(db, req.user.id);
  return res.json({ pass });
});

app.post("/api/pass/subscribe", authMiddleware, async (req, res) => {
  const db = await getDb();
  const currentWeekStart = weekStartISO();
  const existing = await db.get(
    "SELECT 1 FROM pass_subscriptions WHERE user_id = ? AND week_start = ?",
    [req.user.id, currentWeekStart]
  );

  if (existing) {
    return res.status(400).json({ message: "Voce ja pagou o passe desta semana" });
  }

  const user = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  const balance = user?.soninhos_balance ?? 0;
  if (balance < WEEKLY_PASS_PRICE) {
    return res.status(400).json({
      message: `Soninhos insuficientes. Voce tem ${balance}, precisa de ${WEEKLY_PASS_PRICE}`,
    });
  }

  await db.run("UPDATE users SET soninhos_balance = soninhos_balance - ? WHERE id = ?", [WEEKLY_PASS_PRICE, req.user.id]);
  await db.run(
    "INSERT INTO pass_subscriptions (user_id, week_start) VALUES (?, ?)",
    [req.user.id, currentWeekStart]
  );

  const pass = await getPassStatus(db, req.user.id);
  return res.json({ success: true, pass });
});

app.post("/api/pass/claim", authMiddleware, async (req, res) => {
  const db = await getDb();
  const now = new Date();
  const today = localDateISO(now);
  const currentWeekStart = weekStartISO(now);

  const subscription = await db.get(
    "SELECT 1 FROM pass_subscriptions WHERE user_id = ? AND week_start = ?",
    [req.user.id, currentWeekStart]
  );
  if (!subscription) {
    return res.status(403).json({ message: "Pague o passe da semana antes de resgatar soninhos" });
  }

  const alreadyClaimed = await db.get(
    "SELECT 1 FROM pass_claims WHERE user_id = ? AND claim_date = ?",
    [req.user.id, today]
  );
  if (alreadyClaimed) {
    return res.status(400).json({ message: "A recompensa de hoje ja foi resgatada" });
  }

  const rewardCoins = getDailyPassReward(now);
  await db.run(
    "INSERT INTO pass_claims (user_id, claim_date, week_start, reward_coins) VALUES (?, ?, ?, ?)",
    [req.user.id, today, currentWeekStart, rewardCoins]
  );
  await db.run("UPDATE users SET soninhos_balance = soninhos_balance + ? WHERE id = ?", [rewardCoins, req.user.id]);

  const pass = await getPassStatus(db, req.user.id);
  return res.json({ success: true, rewardSoninhos: rewardCoins, pass });
});

app.post("/api/pass/profile/claim", authMiddleware, async (req, res) => {
  const db = await getDb();
  const now = new Date();
  const currentWeekStart = weekStartISO(now);

  const subscription = await db.get(
    "SELECT 1 FROM pass_subscriptions WHERE user_id = ? AND week_start = ?",
    [req.user.id, currentWeekStart]
  );
  if (!subscription) {
    return res.status(403).json({ message: "Pague o passe da semana para liberar a recompensa final" });
  }

  const weeklyReward = await getCurrentWeeklyProfileReward();
  if (!weeklyReward) {
    return res.status(400).json({ message: "Nenhuma imagem de perfil semanal foi configurada em /public/passe-itens/perfil" });
  }

  const alreadyOwned = await db.get(
    "SELECT id FROM user_pass_profile_rewards WHERE user_id = ? AND item_key = ?",
    [req.user.id, weeklyReward.itemKey]
  );
  if (alreadyOwned) {
    return res.status(400).json({ message: "Essa foto de perfil semanal ja foi resgatada" });
  }

  await db.run(
    `INSERT INTO user_pass_profile_rewards (user_id, week_start, item_key, item_name, image_path)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, currentWeekStart, weeklyReward.itemKey, weeklyReward.itemName, weeklyReward.imagePath]
  );
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper, active_profile_image) VALUES (?, NULL, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_profile_image = ? WHERE user_id = ?", [weeklyReward.imagePath, req.user.id]);

  const pass = await getPassStatus(db, req.user.id);
  return res.json({ success: true, reward: weeklyReward, pass });
});

app.post("/api/pass/profile/equip/:rewardId", authMiddleware, async (req, res) => {
  const rewardId = Number(req.params.rewardId);
  if (!Number.isInteger(rewardId) || rewardId <= 0) {
    return res.status(400).json({ message: "Recompensa de perfil invalida" });
  }

  const db = await getDb();
  const reward = await db.get(
    "SELECT id, image_path FROM user_pass_profile_rewards WHERE id = ? AND user_id = ?",
    [rewardId, req.user.id]
  );
  if (!reward) {
    return res.status(404).json({ message: "Recompensa de perfil nao encontrada" });
  }

  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper, active_profile_image) VALUES (?, NULL, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_profile_image = ? WHERE user_id = ?", [reward.image_path, req.user.id]);

  const pass = await getPassStatus(db, req.user.id);
  return res.json({ success: true, pass });
});

app.post("/api/pass/profile/equip-by-path", authMiddleware, async (req, res) => {
  const imagePath = String(req.body?.imagePath || "").trim();
  if (!imagePath) {
    return res.status(400).json({ message: "Imagem de perfil invalida" });
  }

  const db = await getDb();
  const owned = await db.get(
    "SELECT id, image_path FROM user_pass_profile_rewards WHERE user_id = ? AND image_path = ?",
    [req.user.id, imagePath]
  );
  if (!owned) {
    return res.status(403).json({ message: "Voce precisa resgatar essa foto antes de equipar" });
  }

  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper, active_profile_image) VALUES (?, NULL, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_profile_image = ? WHERE user_id = ?", [owned.image_path, req.user.id]);

  const pass = await getPassStatus(db, req.user.id);
  return res.json({ success: true, pass });
});

app.post("/api/pass/profile/unequip", authMiddleware, async (req, res) => {
  const db = await getDb();
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper, active_profile_image) VALUES (?, NULL, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_profile_image = NULL WHERE user_id = ?", [req.user.id]);

  const pass = await getPassStatus(db, req.user.id);
  return res.json({ success: true, pass });
});

app.get("/api/shop/items", authMiddleware, async (req, res) => {
  const db = await getDb();
  const items = await db.all("SELECT * FROM shop_items ORDER BY category, price");
  const purchases = await db.all("SELECT item_id FROM user_purchases WHERE user_id = ?", [req.user.id]);
  const purchasedSet = new Set(purchases.map((p) => p.item_id));
  const equipped = await db.get("SELECT * FROM user_equipped WHERE user_id = ?", [req.user.id]);

  return res.json({
    items: items.map((item) => ({
      ...item,
      owned: purchasedSet.has(item.id),
      equipped: equipped?.active_font === item.id || equipped?.active_tag_effect === item.id,
    })),
    equipped: {
      active_font: equipped?.active_font || null,
      active_tag_effect: equipped?.active_tag_effect || null,
      active_wallpaper: equipped?.active_wallpaper || null,
      active_theme_color: equipped?.active_theme_color || null,
    },
  });
});

app.post("/api/shop/buy/:itemId", authMiddleware, async (req, res) => {
  const { itemId } = req.params;
  const db = await getDb();

  const item = await db.get("SELECT * FROM shop_items WHERE id = ?", [itemId]);
  if (!item) return res.status(404).json({ message: "Item nao encontrado" });

  const alreadyOwned = await db.get(
    "SELECT 1 FROM user_purchases WHERE user_id = ? AND item_id = ?",
    [req.user.id, itemId]
  );
  if (alreadyOwned) return res.status(400).json({ message: "Voce ja possui este item" });

  const user = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  if ((user?.soninhos_balance ?? 0) < item.price) {
    return res.status(400).json({
      message: `Soninhos insuficientes. Voce tem ${user?.soninhos_balance ?? 0}, precisa de ${item.price}`,
    });
  }

  await db.run("UPDATE users SET soninhos_balance = soninhos_balance - ? WHERE id = ?", [item.price, req.user.id]);
  await db.run("INSERT INTO user_purchases (user_id, item_id) VALUES (?,?)", [req.user.id, itemId]);

  const userAfter = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  return res.json({ success: true, newBalance: userAfter.soninhos_balance });
});

app.post("/api/shop/equip/:itemId", authMiddleware, async (req, res) => {
  const { itemId } = req.params;
  const db = await getDb();

  const item = await db.get("SELECT * FROM shop_items WHERE id = ?", [itemId]);
  if (!item) return res.status(404).json({ message: "Item nao encontrado" });
  if (item.category !== "font" && item.category !== "tag_effect") {
    return res.status(400).json({ message: "Esse item nao pode ser equipado" });
  }
  if (item.category === "tag_effect" && !String(item.effect_class || "").trim()) {
    return res.status(400).json({ message: "Esse item nao e um efeito equipavel" });
  }

  const owned = await db.get(
    "SELECT 1 FROM user_purchases WHERE user_id = ? AND item_id = ?",
    [req.user.id, itemId]
  );
  if (!owned) return res.status(403).json({ message: "Voce nao possui este item" });

  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect) VALUES (?, NULL, NULL)",
    [req.user.id]
  );

  if (item.category === "font") {
    await db.run("UPDATE user_equipped SET active_font = ? WHERE user_id = ?", [itemId, req.user.id]);
  } else if (item.category === "tag_effect") {
    await db.run("UPDATE user_equipped SET active_tag_effect = ? WHERE user_id = ?", [itemId, req.user.id]);
  }

  return res.json({ success: true });
});

app.post("/api/shop/unequip", authMiddleware, async (req, res) => {
  const { category } = req.body;
  if (!["font", "tag_effect"].includes(category)) {
    return res.status(400).json({ message: "Categoria invalida" });
  }

  const db = await getDb();
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect) VALUES (?, NULL, NULL)",
    [req.user.id]
  );

  if (category === "font") {
    await db.run("UPDATE user_equipped SET active_font = NULL WHERE user_id = ?", [req.user.id]);
  } else {
    await db.run("UPDATE user_equipped SET active_tag_effect = NULL WHERE user_id = ?", [req.user.id]);
  }

  return res.json({ success: true });
});

app.post("/api/shop/wallpaper/custom", authMiddleware, async (req, res) => {
  const imageUrl = String(req.body?.imageUrl || "").trim();
  if (!imageUrl) return res.status(400).json({ message: "Informe a URL da imagem" });
  if (!isValidHttpUrl(imageUrl)) return res.status(400).json({ message: "URL invalida. Use http:// ou https://" });

  const db = await getDb();
  const user = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  const balance = user?.soninhos_balance ?? 0;
  if (balance < CUSTOM_WALLPAPER_PRICE) {
    return res.status(400).json({
      message: `Soninhos insuficientes. Voce tem ${balance}, precisa de ${CUSTOM_WALLPAPER_PRICE}`,
    });
  }

  try {
    const savedPath = await downloadWallpaperToStore(imageUrl, req.user.id);

    await db.run("UPDATE users SET soninhos_balance = soninhos_balance - ? WHERE id = ?", [
      CUSTOM_WALLPAPER_PRICE,
      req.user.id,
    ]);
    await db.run(
      "INSERT INTO user_wallpapers (user_id, file_path, source_url, price_paid) VALUES (?, ?, ?, ?)",
      [req.user.id, savedPath, imageUrl, CUSTOM_WALLPAPER_PRICE]
    );
    await db.run(
      "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper) VALUES (?, NULL, NULL, NULL)",
      [req.user.id]
    );
    await db.run("UPDATE user_equipped SET active_wallpaper = ? WHERE user_id = ?", [savedPath, req.user.id]);

    const userAfter = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
    return res.json({ success: true, wallpaperPath: savedPath, newBalance: userAfter.soninhos_balance });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Falha ao aplicar wallpaper" });
  }
});

app.get("/api/shop/wallpapers", authMiddleware, async (req, res) => {
  const db = await getDb();
  const equipped = await db.get("SELECT active_wallpaper FROM user_equipped WHERE user_id = ?", [req.user.id]);
  const wallpapers = await db.all(
    `SELECT id, file_path, source_url, price_paid, created_at
     FROM user_wallpapers
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [req.user.id]
  );

  return res.json({
    wallpapers: wallpapers.map((item) => ({
      ...item,
      active: equipped?.active_wallpaper === item.file_path,
      resaleValue: Math.floor((item.price_paid || 0) / 2),
    })),
  });
});

app.post("/api/shop/wallpaper/use/:wallpaperId", authMiddleware, async (req, res) => {
  const wallpaperId = Number(req.params.wallpaperId);
  if (!Number.isInteger(wallpaperId) || wallpaperId <= 0) {
    return res.status(400).json({ message: "Wallpaper invalido" });
  }

  const db = await getDb();
  const wallpaper = await db.get(
    "SELECT id, file_path FROM user_wallpapers WHERE id = ? AND user_id = ?",
    [wallpaperId, req.user.id]
  );
  if (!wallpaper) return res.status(404).json({ message: "Wallpaper nao encontrado" });

  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper) VALUES (?, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_wallpaper = ? WHERE user_id = ?", [wallpaper.file_path, req.user.id]);
  return res.json({ success: true, wallpaperPath: wallpaper.file_path });
});

app.post("/api/shop/wallpaper/remove", authMiddleware, async (req, res) => {
  const db = await getDb();
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper) VALUES (?, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_wallpaper = NULL WHERE user_id = ?", [req.user.id]);
  return res.json({ success: true });
});

app.post("/api/shop/theme/custom", authMiddleware, async (req, res) => {
  const color = String(req.body?.color || "").trim();
  if (!isValidHexColor(color)) {
    return res.status(400).json({ message: "Cor invalida. Escolha uma cor valida na roda." });
  }

  const db = await getDb();
  const user = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  const balance = user?.soninhos_balance ?? 0;
  if (balance < CUSTOM_THEME_COLOR_PRICE) {
    return res.status(400).json({
      message: `Soninhos insuficientes. Voce tem ${balance}, precisa de ${CUSTOM_THEME_COLOR_PRICE}`,
    });
  }

  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper, active_theme_color) VALUES (?, NULL, NULL, NULL, NULL)",
    [req.user.id]
  );

  const equipped = await db.get("SELECT active_theme_color FROM user_equipped WHERE user_id = ?", [req.user.id]);
  if (String(equipped?.active_theme_color || "").toLowerCase() === color.toLowerCase()) {
    return res.status(400).json({ message: "Essa cor ja esta em uso" });
  }

  await db.run("UPDATE users SET soninhos_balance = soninhos_balance - ? WHERE id = ?", [CUSTOM_THEME_COLOR_PRICE, req.user.id]);
  await db.run("UPDATE user_equipped SET active_theme_color = ? WHERE user_id = ?", [color, req.user.id]);

  const userAfter = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  return res.json({ success: true, color, newBalance: userAfter.soninhos_balance });
});

app.post("/api/shop/theme/remove", authMiddleware, async (req, res) => {
  const db = await getDb();
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper, active_theme_color) VALUES (?, NULL, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run("UPDATE user_equipped SET active_theme_color = NULL WHERE user_id = ?", [req.user.id]);
  return res.json({ success: true });
});

app.post("/api/shop/wallpaper/remove/:wallpaperId", authMiddleware, async (req, res) => {
  const wallpaperId = Number(req.params.wallpaperId);
  if (!Number.isInteger(wallpaperId) || wallpaperId <= 0) {
    return res.status(400).json({ message: "Wallpaper invalido" });
  }

  const db = await getDb();
  const wallpaper = await db.get(
    "SELECT id, file_path FROM user_wallpapers WHERE id = ? AND user_id = ?",
    [wallpaperId, req.user.id]
  );
  if (!wallpaper) return res.status(404).json({ message: "Wallpaper nao encontrado" });

  await db.run("DELETE FROM user_wallpapers WHERE id = ? AND user_id = ?", [wallpaperId, req.user.id]);
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper) VALUES (?, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run(
    "UPDATE user_equipped SET active_wallpaper = CASE WHEN active_wallpaper = ? THEN NULL ELSE active_wallpaper END WHERE user_id = ?",
    [wallpaper.file_path, req.user.id]
  );
  await deleteWallpaperFile(wallpaper.file_path);

  return res.json({ success: true });
});

app.post("/api/shop/wallpaper/sell/:wallpaperId", authMiddleware, async (req, res) => {
  const wallpaperId = Number(req.params.wallpaperId);
  if (!Number.isInteger(wallpaperId) || wallpaperId <= 0) {
    return res.status(400).json({ message: "Wallpaper invalido" });
  }

  const db = await getDb();
  const wallpaper = await db.get(
    "SELECT id, file_path, price_paid FROM user_wallpapers WHERE id = ? AND user_id = ?",
    [wallpaperId, req.user.id]
  );
  if (!wallpaper) return res.status(404).json({ message: "Wallpaper nao encontrado" });

  const resaleValue = Math.floor((wallpaper.price_paid || CUSTOM_WALLPAPER_PRICE) / 2);
  await db.run("DELETE FROM user_wallpapers WHERE id = ? AND user_id = ?", [wallpaperId, req.user.id]);
  await db.run(
    "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper) VALUES (?, NULL, NULL, NULL)",
    [req.user.id]
  );
  await db.run(
    "UPDATE user_equipped SET active_wallpaper = CASE WHEN active_wallpaper = ? THEN NULL ELSE active_wallpaper END WHERE user_id = ?",
    [wallpaper.file_path, req.user.id]
  );
  await db.run("UPDATE users SET soninhos_balance = soninhos_balance + ? WHERE id = ?", [resaleValue, req.user.id]);
  await deleteWallpaperFile(wallpaper.file_path);

  const userAfter = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  return res.json({ success: true, resaleValue, newBalance: userAfter?.soninhos_balance ?? 0 });
});

app.get("/api/admin/users", authMiddleware, requireAdmin, async (req, res) => {
  const db = await getDb();

  const users = await db.all(
    "SELECT id, name, email, created_at, soninhos_balance FROM users ORDER BY id DESC"
  );
  const purchaseRows = await db.all(
    "SELECT user_id, item_id FROM user_purchases ORDER BY user_id, item_id"
  );

  const purchasesByUser = new Map();
  purchaseRows.forEach((row) => {
    if (!purchasesByUser.has(row.user_id)) purchasesByUser.set(row.user_id, []);
    purchasesByUser.get(row.user_id).push(row.item_id);
  });

  return res.json({
    users: users.map((user) => ({
      ...user,
      purchases: purchasesByUser.get(user.id) || [],
    })),
  });
});

app.get("/api/admin/shop/items", authMiddleware, requireAdmin, async (req, res) => {
  const db = await getDb();
  const items = await db.all("SELECT id, name, category, price FROM shop_items ORDER BY category, price");
  return res.json({ items });
});

app.post("/api/admin/users/:userId/coins", authMiddleware, requireAdmin, async (req, res) => {
  const userId = Number(req.params.userId);
  const delta = Number(req.body?.delta);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Usuario invalido" });
  }
  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ message: "Delta invalido" });
  }

  const db = await getDb();
  const user = await db.get("SELECT id, soninhos_balance FROM users WHERE id = ?", [userId]);
  if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

  const nextBalance = (user.soninhos_balance ?? 0) + delta;
  if (nextBalance < 0) {
    return res.status(400).json({ message: "Saldo nao pode ficar negativo" });
  }

  await db.run("UPDATE users SET soninhos_balance = ? WHERE id = ?", [nextBalance, userId]);
  const updated = await db.get("SELECT id, name, email, soninhos_balance FROM users WHERE id = ?", [userId]);
  return res.json({ success: true, user: updated });
});

app.post("/api/admin/users/:userId/purchases/toggle", authMiddleware, requireAdmin, async (req, res) => {
  const userId = Number(req.params.userId);
  const itemId = String(req.body?.itemId || "").trim();
  const owned = Boolean(req.body?.owned);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Usuario invalido" });
  }
  if (!itemId) {
    return res.status(400).json({ message: "Item invalido" });
  }

  const db = await getDb();
  const user = await db.get("SELECT id FROM users WHERE id = ?", [userId]);
  if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

  const item = await db.get("SELECT id, category FROM shop_items WHERE id = ?", [itemId]);
  if (!item) return res.status(404).json({ message: "Item nao encontrado" });

  if (owned) {
    await db.run("INSERT OR IGNORE INTO user_purchases (user_id, item_id) VALUES (?, ?)", [userId, itemId]);
  } else {
    await db.run("DELETE FROM user_purchases WHERE user_id = ? AND item_id = ?", [userId, itemId]);

    await db.run(
      "INSERT OR IGNORE INTO user_equipped (user_id, active_font, active_tag_effect, active_wallpaper) VALUES (?, NULL, NULL, NULL)",
      [userId]
    );
    if (item.category === "font") {
      await db.run(
        "UPDATE user_equipped SET active_font = CASE WHEN active_font = ? THEN NULL ELSE active_font END WHERE user_id = ?",
        [itemId, userId]
      );
    }
    if (item.category === "tag_effect") {
      await db.run(
        "UPDATE user_equipped SET active_tag_effect = CASE WHEN active_tag_effect = ? THEN NULL ELSE active_tag_effect END WHERE user_id = ?",
        [itemId, userId]
      );
    }
  }

  return res.json({ success: true, owned });
});

// ─────────────────────────────────────────────────────────────────────────────

// ─── Ranking Global ──────────────────────────────────────────────────────────

app.get("/api/ranking", authMiddleware, async (req, res) => {
  const db = await getDb();

  const topSoninhos = await db.all(
    `SELECT id, name, soninhos_balance AS soninhos
     FROM users
     ORDER BY soninhos_balance DESC
     LIMIT 10`
  );

  const topDreams = await db.all(
    `SELECT u.id, u.name, COUNT(d.id) AS total_dreams
     FROM users u
     LEFT JOIN dreams d ON d.user_id = u.id
     GROUP BY u.id
     ORDER BY total_dreams DESC
     LIMIT 10`
  );

  return res.json({ topSoninhos, topDreams });
});

// ─── Transferência de Soninhos ────────────────────────────────────────────────

app.post("/api/soninhos/transfer", authMiddleware, async (req, res) => {
  const amount = Number(req.body?.amount);
  const friendId = Number(req.body?.friendId);

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: "Valor invalido para transferencia" });
  }
  if (!Number.isInteger(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "Amigo invalido" });
  }
  if (friendId === req.user.id) {
    return res.status(400).json({ message: "Nao e possivel transferir para si mesmo" });
  }

  const db = await getDb();

  const isFriend = await areFriends(db, req.user.id, friendId);
  if (!isFriend) {
    return res.status(403).json({ message: "Voce so pode transferir soninhos para amigos" });
  }

  const sender = await db.get("SELECT id, name, soninhos_balance FROM users WHERE id = ?", [req.user.id]);
  if (!sender || sender.soninhos_balance < amount) {
    return res.status(400).json({ message: "Saldo insuficiente de soninhos" });
  }

  const receiver = await db.get("SELECT id, name FROM users WHERE id = ?", [friendId]);
  if (!receiver) {
    return res.status(404).json({ message: "Amigo nao encontrado" });
  }

  await db.run("UPDATE users SET soninhos_balance = soninhos_balance - ? WHERE id = ?", [amount, req.user.id]);
  await db.run("UPDATE users SET soninhos_balance = soninhos_balance + ? WHERE id = ?", [amount, friendId]);

  const updated = await db.get("SELECT soninhos_balance FROM users WHERE id = ?", [req.user.id]);

  return res.json({
    message: `Voce transferiu ✨ ${amount} soninhos para ${receiver.name}!`,
    newBalance: updated.soninhos_balance,
  });
});

// ─────────────────────────────────────────────────────────────────────────────

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SONINHOS rodando em http://localhost:${PORT}`);
});
