import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDbPath = path.join(__dirname, "..", "soninhos.db");
const productionDbPath = path.join(os.homedir(), ".soninhos", "soninhos.db");
const defaultDbPath = process.env.NODE_ENV === "production" ? productionDbPath : localDbPath;
const dbPath = process.env.DB_PATH || defaultDbPath;

function ensureDbDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function getDb() {
  ensureDbDirectoryExists(dbPath);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trusted_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      device_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, device_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT,
      date TEXT NOT NULL,
      is_important INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#2f7f6e',
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dream_tags (
      dream_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (dream_id, tag_id),
      FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      addressee_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(requester_id, addressee_id),
      CHECK (status IN ('pending', 'accepted', 'rejected')),
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friend_locations (
      user_id INTEGER PRIMARY KEY,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      is_sharing INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      effect_class TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS user_purchases (
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_equipped (
      user_id INTEGER PRIMARY KEY,
      active_font TEXT DEFAULT NULL,
      active_tag_effect TEXT DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Adiciona coluna soninhos_balance se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE users ADD COLUMN soninhos_balance INTEGER DEFAULT 0');
  } catch {
    // coluna ja existe, sem problema
  }

  // Popula itens da loja (INSERT OR IGNORE para nao duplicar)
  const shopItems = [
    ['font_dancing',  'Sonhadora',        'Letra cursiva e elegante para seus sonhos',   'font',       50,  'font-dancing'],
    ['font_orbitron', 'Galatica',         'Fonte espacial futurista',                    'font',       80,  'font-orbitron'],
    ['font_playfair', 'Poetica',          'Serifa classica e refinada',                  'font',       60,  'font-playfair'],
    ['font_courier',  'Maquina do Tempo', 'Monospace estilo retro',                      'font',       40,  'font-courier'],
    ['tag_neon_pink', 'Tags Neon Rosa',   'Brilho neon rosa nas suas tags',              'tag_effect', 70,  'tag-neon-pink'],
    ['tag_neon_blue', 'Tags Neon Azul',   'Brilho neon azul nas suas tags',              'tag_effect', 70,  'tag-neon-blue'],
    ['tag_neon_green','Tags Neon Verde',  'Brilho neon verde nas suas tags',             'tag_effect', 70,  'tag-neon-green'],
    ['tag_gold',      'Tags Douradas',    'Gradiente dourado para suas tags',            'tag_effect', 100, 'tag-gold'],
    ['tag_rgb',       'Tags RGB',         'Efeito arco-iris animado nas suas tags',      'tag_effect', 150, 'tag-rgb'],
  ];

  for (const [id, name, description, category, price, effect_class] of shopItems) {
    await db.run(
      'INSERT OR IGNORE INTO shop_items (id, name, description, category, price, effect_class) VALUES (?,?,?,?,?,?)',
      [id, name, description, category, price, effect_class]
    );
  }

  return db;
}
