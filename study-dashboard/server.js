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

const SEED_SUBJECTS = [
  { id: 'math',       name: 'Math',       color: '#6366f1', level: 1 },
  { id: 'ict-1',      name: 'ICT-1',      color: '#0ea5e9', level: 1 },
  { id: 'ict-2',      name: 'ICT-2',      color: '#0284c7', level: 2 },
  { id: 'ict-3',      name: 'ICT-3',      color: '#1d4ed8', level: 3 },
  { id: 'phys-1',     name: 'Phys-1',     color: '#ef4444', level: 1 },
  { id: 'phys-2',     name: 'Phys-2',     color: '#dc2626', level: 2 },
  { id: 'chem-1',     name: 'Chem-1',     color: '#10b981', level: 1 },
  { id: 'chem-2',     name: 'Chem-2',     color: '#059669', level: 2 },
  { id: 'bio-1',      name: 'Bio-1',      color: '#22c55e', level: 1 },
  { id: 'bio-2',      name: 'Bio-2',      color: '#16a34a', level: 2 },
  { id: 'geo-1',      name: 'Geo-1',      color: '#06b6d4', level: 1 },
  { id: 'geo-2',      name: 'Geo-2',      color: '#0891b2', level: 2 },
  { id: 'geo-3',      name: 'Geo-3',      color: '#0e7490', level: 3 },
  { id: 'biz-1',      name: 'Biz-1',      color: '#f97316', level: 1 },
  { id: 'biz-2',      name: 'Biz-2',      color: '#ea580c', level: 2 },
  { id: 'biz-3',      name: 'Biz-3',      color: '#c2410c', level: 3 },
  { id: 'fre-1',      name: 'Fre-1',      color: '#8b5cf6', level: 1 },
  { id: 'french-2',   name: 'French-2',   color: '#7c3aed', level: 2 },
  { id: 'french-3',   name: 'French-3',   color: '#6d28d9', level: 3 },
  { id: 'french-4',   name: 'French-4',   color: '#5b21b6', level: 3 },
  { id: 'igcse-exam', name: 'IGCSE Exam', color: '#dc2626', level: 4 },
  { id: 'exam',       name: 'Exam',       color: '#991b1b', level: 4 },
];

const SEED_SCHEDULE = [
  { date: '2026-04-03', subjects: ['ict-1'] },
  { date: '2026-04-04', subjects: ['ict-1'] },
  { date: '2026-04-05', subjects: ['chem-1', 'bio-1'] },
  { date: '2026-04-06', subjects: ['phys-1'] },
  { date: '2026-04-07', subjects: ['math'] },
  { date: '2026-04-08', subjects: ['math'] },
  { date: '2026-04-09', subjects: ['math'] },
  { date: '2026-04-10', subjects: ['math'] },
  { date: '2026-04-11', subjects: ['geo-1'] },
  { date: '2026-04-12', subjects: ['biz-1', 'fre-1'] },
  { date: '2026-04-13', subjects: ['math'] },
  { date: '2026-04-14', subjects: ['math'] },
  { date: '2026-04-15', subjects: ['math'] },
  { date: '2026-04-16', subjects: ['math'] },
  { date: '2026-04-17', subjects: ['math'] },
  { date: '2026-04-18', subjects: ['ict-2'] },
  { date: '2026-04-19', subjects: ['biz-2', 'french-2'] },
  { date: '2026-04-20', subjects: ['math'] },
  { date: '2026-04-21', subjects: ['math'] },
  { date: '2026-04-22', subjects: ['math'] },
  { date: '2026-04-23', subjects: ['math'] },
  { date: '2026-04-24', subjects: ['math'] },
  { date: '2026-04-25', subjects: ['geo-2'] },
  { date: '2026-04-26', subjects: ['chem-2', 'bio-2'] },
  { date: '2026-04-27', subjects: ['math'] },
  { date: '2026-04-28', subjects: ['igcse-exam'] },
  { date: '2026-04-29', subjects: ['french-3'] },
  { date: '2026-04-30', subjects: ['phys-2', 'geo-3'] },
  { date: '2026-05-01', subjects: ['math'] },
  { date: '2026-05-02', subjects: ['math'] },
  { date: '2026-05-03', subjects: ['math'] },
  { date: '2026-05-04', subjects: ['math'] },
  { date: '2026-05-05', subjects: ['igcse-exam'] },
  { date: '2026-05-06', subjects: ['french-4'] },
  { date: '2026-05-08', subjects: ['biz-3'] },
  { date: '2026-05-09', subjects: ['ict-3'] },
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

function seedIfNeeded() {
  if (!fs.existsSync(SUBJECTS_FILE)) {
    writeJSON(SUBJECTS_FILE, SEED_SUBJECTS);
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
  return new Date().toISOString().slice(0, 10);
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

  // auto-update streak status for that date
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

  // streak: walk back from yesterday
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

  // today progress
  const todayPlans = plans.filter(p => p.date === today);
  const todayDone = todayPlans.filter(p => p.completed).length;
  const todayModified = !!status[today]?.modified;

  // 7-day rate
  const last7 = [];
  const d7 = new Date(today);
  for (let i = 0; i < 7; i++) {
    last7.push(d7.toISOString().slice(0, 10));
    d7.setDate(d7.getDate() - 1);
  }
  const w7plans = plans.filter(p => last7.includes(p.date));
  const w7rate = w7plans.length ? Math.round((w7plans.filter(p => p.completed).length / w7plans.length) * 100) : 0;

  // monthly rate
  const monthPrefix = today.slice(0, 7);
  const mPlans = plans.filter(p => p.date.startsWith(monthPrefix));
  const mRate = mPlans.length ? Math.round((mPlans.filter(p => p.completed).length / mPlans.length) * 100) : 0;

  // per-subject stats
  const subjects = readJSON(SUBJECTS_FILE, []);
  const subjectStats = subjects.map(s => {
    const sp = plans.filter(p => p.subjectId === s.id);
    return { id: s.id, name: s.name, color: s.color, total: sp.length, done: sp.filter(p => p.completed).length };
  }).filter(s => s.total > 0);

  res.json({ streak, todayTotal: todayPlans.length, todayDone, todayModified, week7Rate: w7rate, monthRate: mRate, subjectStats });
});

seedIfNeeded();
app.listen(PORT, () => console.log(`Study dashboard running at http://localhost:${PORT}`));
