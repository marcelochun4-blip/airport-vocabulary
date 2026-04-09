const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_ROOT = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_ROOT)) fs.mkdirSync(DATA_ROOT, { recursive: true });

const SUBJECTS_FILE = path.join(DATA_ROOT, 'subjects.json');
const PLANS_FILE = path.join(DATA_ROOT, 'plans.json');
const STATUS_FILE = path.join(DATA_ROOT, 'daily-status.json');

// ─── Merged subjects (10 total) ───────────────────────────────────────────────
const SEED_SUBJECTS = [
  { id: 'math',       name: 'Math',       color: '#6366f1' },
  { id: 'ict',        name: 'ICT',        color: '#0ea5e9' },
  { id: 'phys',       name: 'Phys',       color: '#ef4444' },
  { id: 'chem',       name: 'Chem',       color: '#10b981' },
  { id: 'bio',        name: 'Bio',        color: '#22c55e' },
  { id: 'geo',        name: 'Geo',        color: '#06b6d4' },
  { id: 'biz',        name: 'Biz',        color: '#f97316' },
  { id: 'french',     name: 'French',     color: '#8b5cf6' },
  { id: 'igcse-exam', name: 'IGCSE Exam', color: '#dc2626' },
  { id: 'exam',       name: 'Exam',       color: '#991b1b' },
];

// Map old IDs → new merged IDs
const MERGE_MAP = {
  'ict-1': 'ict', 'ict-2': 'ict', 'ict-3': 'ict',
  'phys-1': 'phys', 'phys-2': 'phys',
  'chem-1': 'chem', 'chem-2': 'chem',
  'bio-1': 'bio', 'bio-2': 'bio',
  'geo-1': 'geo', 'geo-2': 'geo', 'geo-3': 'geo',
  'biz-1': 'biz', 'biz-2': 'biz', 'biz-3': 'biz',
  'fre-1': 'french', 'french-2': 'french', 'french-3': 'french', 'french-4': 'french',
};

const SEED_SCHEDULE = [
  { date: '2026-04-03', subjects: ['ict'] },
  { date: '2026-04-04', subjects: ['ict'] },
  { date: '2026-04-05', subjects: ['chem', 'bio'] },
  { date: '2026-04-06', subjects: ['phys'] },
  { date: '2026-04-07', subjects: ['math'] },
  { date: '2026-04-08', subjects: ['math'] },
  { date: '2026-04-09', subjects: ['math'] },
  { date: '2026-04-10', subjects: ['math'] },
  { date: '2026-04-11', subjects: ['geo'] },
  { date: '2026-04-12', subjects: ['biz', 'french'] },
  { date: '2026-04-13', subjects: ['math'] },
  { date: '2026-04-14', subjects: ['math'] },
  { date: '2026-04-15', subjects: ['math'] },
  { date: '2026-04-16', subjects: ['math'] },
  { date: '2026-04-17', subjects: ['math'] },
  { date: '2026-04-18', subjects: ['ict'] },
  { date: '2026-04-19', subjects: ['biz', 'french'] },
  { date: '2026-04-20', subjects: ['math'] },
  { date: '2026-04-21', subjects: ['math'] },
  { date: '2026-04-22', subjects: ['math'] },
  { date: '2026-04-23', subjects: ['math'] },
  { date: '2026-04-24', subjects: ['math'] },
  { date: '2026-04-25', subjects: ['geo'] },
  { date: '2026-04-26', subjects: ['chem', 'bio'] },
  { date: '2026-04-27', subjects: ['math'] },
  { date: '2026-04-28', subjects: ['igcse-exam'] },
  { date: '2026-04-29', subjects: ['french'] },
  { date: '2026-04-30', subjects: ['phys', 'geo'] },
  { date: '2026-05-01', subjects: ['math'] },
  { date: '2026-05-02', subjects: ['math'] },
  { date: '2026-05-03', subjects: ['math'] },
  { date: '2026-05-04', subjects: ['math'] },
  { date: '2026-05-05', subjects: ['igcse-exam'] },
  { date: '2026-05-06', subjects: ['french'] },
  { date: '2026-05-08', subjects: ['biz'] },
  { date: '2026-05-09', subjects: ['ict'] },
  { date: '2026-05-11', subjects: ['exam'] },
  { date: '2026-05-12', subjects: ['exam'] },
  { date: '2026-05-13', subjects: ['exam'] },
  { date: '2026-05-14', subjects: ['exam'] },
  { date: '2026-05-15', subjects: ['exam'] },
];

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Migration: merge old split subjects into unified ones ────────────────────
function migrateIfNeeded() {
  const subjects = readJSON(SUBJECTS_FILE, []);
  const needsMigration = subjects.some(s => MERGE_MAP[s.id]);
  if (!needsMigration) return;

  // Replace subjects with merged list
  writeJSON(SUBJECTS_FILE, SEED_SUBJECTS);

  // Remap plan subjectIds
  const plans = readJSON(PLANS_FILE, []);
  const updated = plans.map(p => ({
    ...p,
    subjectId: MERGE_MAP[p.subjectId] || p.subjectId
  }));
  writeJSON(PLANS_FILE, updated);
  console.log('Migrated subjects to merged format');
}

function seedIfNeeded() {
  if (!fs.existsSync(SUBJECTS_FILE)) {
    writeJSON(SUBJECTS_FILE, SEED_SUBJECTS);
  } else {
    migrateIfNeeded();
  }
  if (!fs.existsSync(PLANS_FILE)) {
    const now = new Date().toISOString();
    const plans = [];
    for (const { date, subjects } of SEED_SCHEDULE) {
      for (const subjectId of subjects) {
        plans.push({ id: uuidv4(), date, subjectId, completed: false, createdAt: now, modifiedDates: [] });
      }
    }
    writeJSON(PLANS_FILE, plans);
  }
  if (!fs.existsSync(STATUS_FILE)) {
    writeJSON(STATUS_FILE, {});
  }
}

function todayStr() {
  // Use local time (not UTC) — avoids off-by-one in KST (UTC+9)
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function markModified(date) {
  const status = readJSON(STATUS_FILE, {});
  if (!status[date]) status[date] = { modified: false, streakEarned: false };
  status[date].modified = true;
  writeJSON(STATUS_FILE, status);
}

function checkStreakForDate(date, plans, status) {
  const dayPlans = plans.filter(p => p.date === date);
  if (dayPlans.length === 0) return false;
  const allDone = dayPlans.every(p => p.completed);
  const notModified = !status[date]?.modified;
  return allDone && notModified;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Subjects
app.get('/api/subjects', (req, res) => {
  res.json(readJSON(SUBJECTS_FILE, []));
});

app.post('/api/subjects', (req, res) => {
  const subjects = readJSON(SUBJECTS_FILE, []);
  const subject = { id: uuidv4(), ...req.body };
  subjects.push(subject);
  writeJSON(SUBJECTS_FILE, subjects);
  res.json(subject);
});

app.put('/api/subjects/:id', (req, res) => {
  const subjects = readJSON(SUBJECTS_FILE, []);
  const i = subjects.findIndex(s => s.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  subjects[i] = { ...subjects[i], ...req.body };
  writeJSON(SUBJECTS_FILE, subjects);
  res.json(subjects[i]);
});

app.delete('/api/subjects/:id', (req, res) => {
  let subjects = readJSON(SUBJECTS_FILE, []);
  subjects = subjects.filter(s => s.id !== req.params.id);
  writeJSON(SUBJECTS_FILE, subjects);
  res.json({ ok: true });
});

// Plans
app.get('/api/plans', (req, res) => {
  res.json(readJSON(PLANS_FILE, []));
});

app.post('/api/plans', (req, res) => {
  const plans = readJSON(PLANS_FILE, []);
  const plan = { id: uuidv4(), completed: false, createdAt: new Date().toISOString(), modifiedDates: [], ...req.body };
  plans.push(plan);
  if (plan.date === todayStr()) markModified(plan.date);
  writeJSON(PLANS_FILE, plans);
  res.json(plan);
});

app.put('/api/plans/:id', (req, res) => {
  const plans = readJSON(PLANS_FILE, []);
  const i = plans.findIndex(p => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  const oldDate = plans[i].date;
  const today = todayStr();
  plans[i] = { ...plans[i], ...req.body };
  if (!plans[i].modifiedDates) plans[i].modifiedDates = [];
  if (!plans[i].modifiedDates.includes(today)) plans[i].modifiedDates.push(today);
  if (oldDate === today || plans[i].date === today) markModified(oldDate === today ? oldDate : plans[i].date);
  writeJSON(PLANS_FILE, plans);
  res.json(plans[i]);
});

app.delete('/api/plans/:id', (req, res) => {
  let plans = readJSON(PLANS_FILE, []);
  const plan = plans.find(p => p.id === req.params.id);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  if (plan.date === todayStr()) markModified(plan.date);
  plans = plans.filter(p => p.id !== req.params.id);
  writeJSON(PLANS_FILE, plans);
  res.json({ ok: true });
});

app.patch('/api/plans/:id/complete', (req, res) => {
  const plans = readJSON(PLANS_FILE, []);
  const i = plans.findIndex(p => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  plans[i].completed = !plans[i].completed;
  writeJSON(PLANS_FILE, plans);

  const status = readJSON(STATUS_FILE, {});
  const date = plans[i].date;
  if (!status[date]) status[date] = { modified: false, streakEarned: false };
  status[date].streakEarned = checkStreakForDate(date, plans, status);
  writeJSON(STATUS_FILE, status);

  res.json(plans[i]);
});

// Stats
app.get('/api/stats', (req, res) => {
  const plans = readJSON(PLANS_FILE, []);
  const status = readJSON(STATUS_FILE, {});
  const today = todayStr();

  let streak = 0;
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10);
    const dayPlans = plans.filter(p => p.date === ds);
    if (dayPlans.length === 0) { d.setDate(d.getDate() - 1); continue; }
    if (!checkStreakForDate(ds, plans, status)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const todayPlans = plans.filter(p => p.date === today);
  const todayDone = todayPlans.filter(p => p.completed).length;
  const todayModified = !!status[today]?.modified;

  const last7 = [];
  const d7 = new Date(today);
  for (let i = 0; i < 7; i++) {
    last7.push(d7.toISOString().slice(0, 10));
    d7.setDate(d7.getDate() - 1);
  }
  const w7plans = plans.filter(p => last7.includes(p.date));
  const w7rate = w7plans.length ? Math.round((w7plans.filter(p => p.completed).length / w7plans.length) * 100) : 0;

  const monthPrefix = today.slice(0, 7);
  const mPlans = plans.filter(p => p.date.startsWith(monthPrefix));
  const mRate = mPlans.length ? Math.round((mPlans.filter(p => p.completed).length / mPlans.length) * 100) : 0;

  const subjects = readJSON(SUBJECTS_FILE, []);
  const subjectStats = subjects.map(s => {
    const sp = plans.filter(p => p.subjectId === s.id);
    return { id: s.id, name: s.name, color: s.color, total: sp.length, done: sp.filter(p => p.completed).length };
  }).filter(s => s.total > 0);

  res.json({ streak, todayTotal: todayPlans.length, todayDone, todayModified, week7Rate: w7rate, monthRate: mRate, subjectStats });
});

seedIfNeeded();
app.listen(PORT, () => console.log(`Study dashboard running at http://localhost:${PORT}`));
