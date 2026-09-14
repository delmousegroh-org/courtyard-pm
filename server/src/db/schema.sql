PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY,
  room_number TEXT UNIQUE NOT NULL,
  floor INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  sort_order INTEGER
);

CREATE TABLE IF NOT EXISTS checklist_categories (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES checklist_categories(id),
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  UNIQUE (category_id, label)
);

-- one row per room per trimester per year = "a visit"
CREATE TABLE IF NOT EXISTS inspections (
  id INTEGER PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  year INTEGER NOT NULL,
  trimester INTEGER NOT NULL CHECK (trimester IN (1,2,3)),
  date_completed TEXT NOT NULL,
  is_quick_entry INTEGER NOT NULL DEFAULT 0,
  overall_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  UNIQUE (room_id, year, trimester)
);

-- who performed the PM (1 or 2 people credited per visit)
CREATE TABLE IF NOT EXISTS inspection_technicians (
  inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (inspection_id, user_id)
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id INTEGER PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
  status TEXT NOT NULL CHECK (status IN ('ok','needs_repair','repair_complete')),
  repair_code TEXT CHECK (repair_code IN ('caulking','replace','paint')),
  note TEXT,
  UNIQUE (inspection_id, checklist_item_id)
);

CREATE INDEX IF NOT EXISTS idx_inspections_period ON inspections(year, trimester);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);

-- session store (custom, see db/sessionStore.js)
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  expires INTEGER NOT NULL,
  data TEXT NOT NULL
);
