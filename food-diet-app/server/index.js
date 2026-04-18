/* global process */
import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'profiles.json');
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

const app = express();
app.use(cors({
  origin(origin, callback) {
    if (!origin || NODE_ENV !== 'production' || !ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

const defaultProfile = {
  hasCompletedTest: false,
  constitution: null,
  conditions: [],
  createdAt: null,
  updatedAt: null,
};

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({}), 'utf8');
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

async function writeDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

let dbLock = Promise.resolve();

async function withDbLock(task) {
  const previousLock = dbLock;
  let releaseLock;
  dbLock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;
  try {
    return await task();
  } finally {
    releaseLock();
  }
}

function normalizeProfile(input, previous) {
  const now = new Date().toISOString();
  const constitution =
    typeof input.constitution === 'string' && input.constitution.trim() !== ''
      ? input.constitution.trim()
      : null;
  const conditions = Array.isArray(input.conditions)
    ? input.conditions.filter((item) => typeof item === 'string' && item.trim() !== '')
    : [];

  return {
    ...defaultProfile,
    ...previous,
    constitution,
    conditions,
    hasCompletedTest: Boolean(input.hasCompletedTest ?? (constitution || conditions.length > 0)),
    createdAt: previous?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    storage: DB_FILE,
    env: NODE_ENV,
  });
});

app.get('/api/profile/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const db = await readDb();
  const profile = db[clientId];
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  return res.json(profile);
});

app.put('/api/profile/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const nextProfile = await withDbLock(async () => {
    const db = await readDb();
    const normalizedProfile = normalizeProfile(req.body || {}, db[clientId]);
    db[clientId] = normalizedProfile;
    await writeDb(db);
    return normalizedProfile;
  });
  return res.json(nextProfile);
});

app.delete('/api/profile/:clientId', async (req, res) => {
  const { clientId } = req.params;
  await withDbLock(async () => {
    const db = await readDb();
    if (db[clientId]) {
      delete db[clientId];
      await writeDb(db);
    }
  });
  return res.json({ ok: true });
});

function requireAdminToken(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ message: 'ADMIN_TOKEN is not configured' });
  }
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

app.get('/api/admin/export', requireAdminToken, async (_req, res) => {
  const db = await readDb();
  res.json({
    exportedAt: new Date().toISOString(),
    totalUsers: Object.keys(db).length,
    profiles: db,
  });
});

app.get('/api/admin/stats', requireAdminToken, async (_req, res) => {
  const db = await readDb();
  res.json({
    totalUsers: Object.keys(db).length,
    storageFile: DB_FILE,
  });
});

if (NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`App server listening on http://127.0.0.1:${PORT}`);
});
