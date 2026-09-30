-- Idempotent schema. Applied on every boot.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  session_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  provider TEXT PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  w INTEGER NOT NULL DEFAULT 4,
  h INTEGER NOT NULL DEFAULT 4,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weather_cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  country TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  display_name TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_path TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rss_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  title_override TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS todo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id INTEGER NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  sort_order INTEGER DEFAULT 0
);

-- Named snapshots of the entire board (widgets + their child rows), so a user can
-- save the current layout and later load a different one from a list.
CREATE TABLE IF NOT EXISTS dashboard_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_weather_cities_widget ON weather_cities(widget_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchlist_widget ON stock_watchlist(widget_id);
CREATE INDEX IF NOT EXISTS idx_links_widget ON links(widget_id);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_widget ON rss_feeds(widget_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_widget ON todo_items(widget_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
