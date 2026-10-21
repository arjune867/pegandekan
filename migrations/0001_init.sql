PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  category_slug TEXT NOT NULL DEFAULT 'nasional',
  author TEXT NOT NULL DEFAULT 'Redaksi Pegandekan News',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_slug) REFERENCES categories(slug)
);

CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_slug, status);

INSERT OR IGNORE INTO categories (name, slug) VALUES
 ('Nasional','nasional'),
 ('Daerah','daerah'),
 ('Politik','politik'),
 ('Ekonomi','ekonomi'),
 ('Teknologi','teknologi'),
 ('Olahraga','olahraga'),
 ('Gaya Hidup','gaya-hidup');
