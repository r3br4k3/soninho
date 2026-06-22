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
      coins_balance INTEGER DEFAULT 0,
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
      applied_font_class TEXT DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#2f7f6e',
      tag_effect_class TEXT DEFAULT NULL,
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
      active_wallpaper TEXT DEFAULT NULL,
      active_theme_color TEXT DEFAULT NULL,
      active_profile_image TEXT DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_wallpapers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      source_url TEXT,
      price_paid INTEGER NOT NULL DEFAULT 200,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_theme_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      color TEXT NOT NULL,
      price_paid INTEGER NOT NULL DEFAULT 120,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, color),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pass_subscriptions (
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      paid_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, week_start),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pass_claims (
      user_id INTEGER NOT NULL,
      claim_date TEXT NOT NULL,
      week_start TEXT NOT NULL,
      reward_coins INTEGER NOT NULL,
      claimed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, claim_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_pass_profile_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      item_key TEXT NOT NULL,
      item_name TEXT NOT NULL,
      image_path TEXT NOT NULL,
      claimed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS garden_player (
      user_id INTEGER PRIMARY KEY,
      total_xp INTEGER NOT NULL DEFAULT 0,
      max_slots INTEGER NOT NULL DEFAULT 2,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS garden_plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      seed_cost INTEGER NOT NULL,
      grow_minutes INTEGER NOT NULL,
      harvest_reward INTEGER NOT NULL,
      xp_reward INTEGER NOT NULL,
      unlock_level INTEGER NOT NULL DEFAULT 1,
      rarity TEXT NOT NULL DEFAULT 'comum',
      rarity_color TEXT NOT NULL DEFAULT '#9ea3ad',
      icon TEXT NOT NULL DEFAULT '🌱'
    );

    CREATE TABLE IF NOT EXISTS garden_seed_inventory (
      user_id INTEGER NOT NULL,
      plant_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, plant_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES garden_plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS garden_crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      slot_index INTEGER NOT NULL,
      plant_id TEXT NOT NULL,
      planted_at TEXT NOT NULL,
      ready_at TEXT NOT NULL,
      harvested_at TEXT DEFAULT NULL,
      growth_multiplier REAL NOT NULL DEFAULT 1,
      yield_multiplier REAL NOT NULL DEFAULT 1,
      xp_multiplier REAL NOT NULL DEFAULT 1,
      luck_bonus REAL NOT NULL DEFAULT 0,
      applied_item_template_id TEXT DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES garden_plants(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_garden_crops_user_slot_active
      ON garden_crops(user_id, slot_index)
      WHERE harvested_at IS NULL;

    CREATE TABLE IF NOT EXISTS garden_upgrade_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      upgrade_type TEXT NOT NULL,
      tier INTEGER NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      min_level INTEGER NOT NULL DEFAULT 1,
      effect_value REAL NOT NULL,
      uses_per_purchase INTEGER NOT NULL DEFAULT 1,
      weight INTEGER NOT NULL DEFAULT 10,
      base_stock INTEGER NOT NULL DEFAULT 1,
      max_stock INTEGER NOT NULL DEFAULT 3,
      rarity TEXT NOT NULL DEFAULT 'comum',
      rarity_color TEXT NOT NULL DEFAULT '#9ea3ad',
      icon TEXT NOT NULL DEFAULT '🧰',
      stackable INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS garden_upgrade_offers (
      cycle_key TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      offer_id INTEGER NOT NULL,
      template_id TEXT NOT NULL,
      stock INTEGER NOT NULL,
      price INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (cycle_key, user_id, offer_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES garden_upgrade_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS garden_active_upgrades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      upgrade_type TEXT NOT NULL,
      effect_value REAL NOT NULL,
      remaining_uses INTEGER NOT NULL DEFAULT 1,
      source_template_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (source_template_id) REFERENCES garden_upgrade_templates(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS garden_item_inventory (
      user_id INTEGER NOT NULL,
      template_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, template_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES garden_upgrade_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS garden_decor_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      rarity TEXT NOT NULL DEFAULT 'comum',
      rarity_color TEXT NOT NULL DEFAULT '#9ea3ad',
      asset_path TEXT NOT NULL,
      scene_mode TEXT NOT NULL DEFAULT 'backdrop',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS garden_decor_inventory (
      user_id INTEGER NOT NULL,
      decor_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      equipped INTEGER NOT NULL DEFAULT 0,
      acquired_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, decor_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (decor_id) REFERENCES garden_decor_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS global_event_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      event_key TEXT,
      event_name TEXT,
      multiplier REAL NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Adiciona coluna soninhos_balance se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE users ADD COLUMN soninhos_balance INTEGER DEFAULT 0');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna coins_balance se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE users ADD COLUMN coins_balance INTEGER DEFAULT 0');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna active_wallpaper se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE user_equipped ADD COLUMN active_wallpaper TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna active_profile_image se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE user_equipped ADD COLUMN active_profile_image TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna active_theme_color se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE user_equipped ADD COLUMN active_theme_color TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna tag_effect_class em tags se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE tags ADD COLUMN tag_effect_class TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna tag_font_class em tags se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE tags ADD COLUMN tag_font_class TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna tag_animation_class em tags se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE tags ADD COLUMN tag_animation_class TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  // Adiciona coluna applied_font_class em dreams se ainda nao existir (migracao segura)
  try {
    await db.exec('ALTER TABLE dreams ADD COLUMN applied_font_class TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_plants ADD COLUMN rarity_color TEXT DEFAULT "#9ea3ad"');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_plants ADD COLUMN icon TEXT DEFAULT "🌱"');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_upgrade_templates ADD COLUMN rarity TEXT DEFAULT "comum"');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_upgrade_templates ADD COLUMN rarity_color TEXT DEFAULT "#9ea3ad"');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_upgrade_templates ADD COLUMN icon TEXT DEFAULT "🧰"');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_upgrade_templates ADD COLUMN stackable INTEGER NOT NULL DEFAULT 0');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_crops ADD COLUMN xp_multiplier REAL NOT NULL DEFAULT 1');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_crops ADD COLUMN luck_bonus REAL NOT NULL DEFAULT 0');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE garden_crops ADD COLUMN applied_item_template_id TEXT DEFAULT NULL');
  } catch {
    // coluna ja existe, sem problema
  }

  try {
    await db.exec('ALTER TABLE global_event_state ADD COLUMN multiplier REAL NOT NULL DEFAULT 1');
  } catch {
    // coluna ja existe, sem problema
  }

  // Popula itens da loja (INSERT OR IGNORE para nao duplicar)
  const shopItems = [
    ['font_dancing',  'Sonhadora',        'Letra cursiva e elegante para seus sonhos',   'font',       50,  'font-dancing'],
    ['font_orbitron', 'Galatica',         'Fonte espacial futurista',                    'font',       80,  'font-orbitron'],
    ['font_playfair', 'Poetica',          'Serifa classica e refinada',                  'font',       60,  'font-playfair'],
    ['font_courier',  'Maquina do Tempo', 'Monospace estilo retro',                      'font',       40,  'font-courier'],
    ['tag_custom_personalizada', 'Tag Personalizada', 'Desbloqueia personalizacao avancada da tag: cor, fonte e animacao', 'tag_effect', 1000, ''],
    ['tag_pastel',    'Tags Pastel',      'Efeito suave em tons pastel para suas tags',  'tag_effect', 50,  'tag-pastel'],
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

  const gardenPlants = [
    ['margarida_lunar', 'Margarida Lunar', 8, 5, 12, 3, 1, 'comum', '#9ea3ad', '🌼'],
    ['camelia_serena', 'Camelia Serena', 12, 7, 18, 4, 3, 'comum', '#9ea3ad', '🌷'],
    ['violeta_brisa', 'Violeta da Brisa', 16, 9, 24, 5, 6, 'comum', '#9ea3ad', '🪷'],
    ['lavanda_nevoa', 'Lavanda da Nevoa', 22, 11, 32, 6, 10, 'incomum', '#5bc28f', '🪻'],
    ['girassol_dourado', 'Girassol Dourado', 32, 13, 46, 8, 14, 'incomum', '#5bc28f', '🌻'],
    ['dalia_ambar', 'Dalia de Ambar', 46, 16, 64, 10, 20, 'incomum', '#5bc28f', '🌼'],
    ['rosa_onirica', 'Rosa Onirica', 66, 20, 92, 13, 28, 'rara', '#4d9dfb', '🌹'],
    ['tulipa_boreal', 'Tulipa Boreal', 92, 24, 126, 17, 36, 'rara', '#4d9dfb', '🌷'],
    ['peonia_lucida', 'Peonia Lucida', 126, 29, 170, 22, 45, 'rara', '#4d9dfb', '🌺'],
    ['orquidea_estelar', 'Orquidea Estelar', 170, 34, 226, 29, 55, 'epica', '#a567ff', '🌸'],
    ['anemona_veludo', 'Anemona de Veludo', 232, 40, 302, 37, 66, 'epica', '#a567ff', '🌸'],
    ['loto_espectral', 'Loto Espectral', 306, 47, 390, 46, 74, 'epica', '#a567ff', '🪷'],
    ['lirio_cromatico', 'Lirio Cromatico', 396, 55, 510, 58, 82, 'lendaria', '#ffb84d', '🌺'],
    ['flor_fenix', 'Flor Fenix', 516, 64, 656, 73, 90, 'lendaria', '#ffb84d', '🔥'],
    ['rosa_constelacao', 'Rosa da Constelacao', 690, 78, 860, 92, 100, 'mitica', '#ff6ad5', '💫'],
  ];

  for (const [id, name, seedCost, growMinutes, harvestReward, xpReward, unlockLevel, rarity, rarityColor, icon] of gardenPlants) {
    await db.run(
      `INSERT INTO garden_plants
       (id, name, seed_cost, grow_minutes, harvest_reward, xp_reward, unlock_level, rarity, rarity_color, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         seed_cost = excluded.seed_cost,
         grow_minutes = excluded.grow_minutes,
         harvest_reward = excluded.harvest_reward,
         xp_reward = excluded.xp_reward,
         unlock_level = excluded.unlock_level,
         rarity = excluded.rarity,
         rarity_color = excluded.rarity_color,
         icon = excluded.icon`,
      [id, name, seedCost, growMinutes, harvestReward, xpReward, unlockLevel, rarity, rarityColor, icon]
    );
  }

  const gardenUpgrades = [
    ['regador_bronze', 'Regador de Bronze', 'speed', 1, 'Reduz o tempo da planta escolhida em 10%.', 15, 1, 0.10, 1, 30, 1, 3, 'comum', '#9ea3ad', '🪣', 0],
    ['regador_prata', 'Regador de Prata', 'speed', 2, 'Reduz o tempo da planta escolhida em 20%.', 33, 3, 0.20, 1, 16, 1, 2, 'rara', '#4d9dfb', '🚿', 0],
    ['adubo_organico', 'Adubo Organico', 'yield', 1, 'Aumenta a colheita da planta escolhida em 14%.', 18, 1, 0.14, 1, 26, 1, 3, 'incomum', '#5bc28f', '🧪', 0],
    ['composto_mistico', 'Composto Mistico', 'yield', 2, 'Aumenta a colheita da planta escolhida em 28%.', 40, 4, 0.28, 1, 10, 1, 2, 'epica', '#a567ff', '🧫', 0],
    ['nectar_onirico', 'Nectar Onirico', 'xp', 2, 'Aumenta o XP da planta escolhida em 40%.', 29, 2, 0.40, 1, 18, 1, 3, 'rara', '#4d9dfb', '🍯', 0],
    ['po_estelar', 'Po Estelar', 'xp', 3, 'Aumenta o XP da planta escolhida em 70%.', 56, 5, 0.70, 1, 8, 1, 2, 'epica', '#a567ff', '✨', 0],
    ['trevo_lunar', 'Trevo Lunar', 'luck', 2, 'Chance de 22% de colheita critico na planta escolhida.', 36, 3, 0.22, 1, 14, 1, 2, 'rara', '#4d9dfb', '🍀', 0],
    ['gema_solar', 'Gema Solar', 'luck', 4, 'Chance de 36% de colheita critico na planta escolhida.', 74, 7, 0.36, 1, 6, 1, 1, 'lendaria', '#ffb84d', '💎', 0],
  ];

  for (const [id, name, type, tier, description, price, minLevel, effectValue, usesPerPurchase, weight, baseStock, maxStock, rarity, rarityColor, icon, stackable] of gardenUpgrades) {
    await db.run(
      `INSERT INTO garden_upgrade_templates
       (id, name, upgrade_type, tier, description, price, min_level, effect_value, uses_per_purchase, weight, base_stock, max_stock, rarity, rarity_color, icon, stackable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         upgrade_type = excluded.upgrade_type,
         tier = excluded.tier,
         description = excluded.description,
         price = excluded.price,
         min_level = excluded.min_level,
         effect_value = excluded.effect_value,
         uses_per_purchase = excluded.uses_per_purchase,
         weight = excluded.weight,
         base_stock = excluded.base_stock,
         max_stock = excluded.max_stock,
         rarity = excluded.rarity,
         rarity_color = excluded.rarity_color,
         icon = excluded.icon,
         stackable = excluded.stackable`,
      [id, name, type, tier, description, price, minLevel, effectValue, usesPerPurchase, weight, baseStock, maxStock, rarity, rarityColor, icon, stackable]
    );
  }

  const gardenDecorItems = [
    [
      'gramado_suave',
      'Gramado Suave',
      'Substitui o visual atual do jardim por um gramado pixel-art em tom de terra e verde.',
      300,
      'raro',
      '#6bbf59',
      '/garden-decor/gramado.svg',
      'backdrop',
    ],
    [
      'sol_com_oculos',
      'Sol com Oculos',
      'Adiciona um sol estiloso com oculos para deixar o jardim mais vibrante.',
      250,
      'raro',
      '#f6c14c',
      '/garden-decor/SolComOculos.svg',
      'object',
    ],
    [
      'arbusto',
      'Arbusto',
      'Arbusto decorativo para deixar o jardim mais cheio e natural.',
      180,
      'comum',
      '#5fae5f',
      '/garden-decor/arbusto.png',
      'object',
    ],
    [
      'totem_colheita',
      'Casa rustica padrão',
      'Ao equipar no jardim: todas as plantas recebem +5% de soninhos e crescem 10% mais rapido.',
      5500,
      'epica',
      '#a567ff',
      '/garden-decor/Casa rustica padrão.png',
      'object',
    ],
    [
      'pedra_com_musgo',
      'Pedra com musgo',
      'Pedra decorativa com detalhes de musgo para um visual natural no jardim.',
      500,
      'comum',
      '#5fae5f',
      '/garden-decor/Pedracommusgo.png',
      'object',
    ],
    [
      'arvore_simples',
      'Arvore simples',
      'Arvore decorativa para compor cenarios campestres no jardim.',
      700,
      'incomum',
      '#5bc28f',
      '/garden-decor/Arvoresimples.png',
      'object',
    ],
    [
      'carrinho_de_flores',
      'Carrinho de flores',
      'Carrinho florido para deixar o jardim mais alegre e colorido.',
      500,
      'incomum',
      '#5bc28f',
      '/garden-decor/Carrinhodeflores.png',
      'object',
    ],
    [
      'cerca_simples',
      'Cerca simples',
      'Cerca basica para delimitar e decorar o espaco do jardim.',
      350,
      'comum',
      '#9ea3ad',
      '/garden-decor/Cercasimples.png',
      'object',
    ],
    [
      'tabuas_com_flores',
      'Tabuas com flores',
      'Tabuas ornamentais com flores para dar um toque rustico ao jardim.',
      650,
      'raro',
      '#4d9dfb',
      '/garden-decor/Tabuascomflores.png',
      'object',
    ],
    [
      'sol_envergonhado',
      'Sol envergonhado',
      'Sol decorativo com expressao timida para iluminar o jardim.',
      700,
      'raro',
      '#f6c14c',
      '/garden-decor/Solenvergonhado.png',
      'object',
    ],
    [
      'arvore_pequena',
      'Arvore pequena',
      'Arvore compacta para preencher espacos menores do jardim.',
      400,
      'comum',
      '#5fae5f',
      '/garden-decor/Arvorepequena.png',
      'object',
    ],
  ];

  for (const [id, name, description, price, rarity, rarityColor, assetPath, sceneMode] of gardenDecorItems) {
    await db.run(
      `INSERT INTO garden_decor_items
       (id, name, description, price, rarity, rarity_color, asset_path, scene_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         price = excluded.price,
         rarity = excluded.rarity,
         rarity_color = excluded.rarity_color,
         asset_path = excluded.asset_path,
         scene_mode = excluded.scene_mode`,
      [id, name, description, price, rarity, rarityColor, assetPath, sceneMode]
    );
  }

  return db;
}
