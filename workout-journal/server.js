const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 관리자 비밀번호: Render 환경변수 ADMIN_PASSWORD 또는 기본값
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'workout2024';

// Render 영구 디스크(/data) 또는 로컬 디렉토리 자동 감지
const DATA_ROOT = fs.existsSync('/data') ? '/data' : path.join(__dirname);
const DATA_FILE = path.join(DATA_ROOT, 'workouts.json');
const UPLOADS_DIR = path.join(DATA_ROOT, 'uploads');

// Multer 설정 (사진 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// 데이터 읽기/쓰기
function readWorkouts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeWorkouts(workouts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(workouts, null, 2), 'utf8');
}

// API: 전체 운동 기록 조회
app.get('/api/workouts', (req, res) => {
  const workouts = readWorkouts();
  workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(workouts);
});

// API: 관리자 인증
app.post('/api/auth', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: '비밀번호가 틀렸습니다.' });
  }
});

// API: 운동 기록 추가
app.post('/api/workouts', upload.array('photos', 20), (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    // 업로드된 파일 삭제
    (req.files || []).forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    return res.status(401).json({ error: '권한이 없습니다.' });
  }

  const { date, notes, type, duration } = req.body;
  const photos = (req.files || []).map(f => '/uploads/' + f.filename);

  const workout = {
    id: Date.now().toString(),
    date: date || new Date().toISOString().split('T')[0],
    type: type || '운동',
    duration: duration || '',
    notes: notes || '',
    photos,
    createdAt: new Date().toISOString()
  };

  const workouts = readWorkouts();
  workouts.push(workout);
  writeWorkouts(workouts);
  res.json(workout);
});

// API: 운동 기록 삭제
app.delete('/api/workouts/:id', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '권한이 없습니다.' });
  }

  const workouts = readWorkouts();
  const workout = workouts.find(w => w.id === req.params.id);
  if (!workout) return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });

  // 사진 파일 삭제
  workout.photos.forEach(photo => {
    const filePath = path.join(__dirname, photo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  writeWorkouts(workouts.filter(w => w.id !== req.params.id));
  res.json({ success: true });
});

// 관리자 페이지
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// uploads 디렉토리 없으면 생성
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🏋️  운동 일지 서버가 시작되었습니다!');
  console.log(`📱 공개 페이지:  http://localhost:${PORT}`);
  console.log(`🔐 관리자 페이지: http://localhost:${PORT}/admin`);
  console.log(`🌐 같은 와이파이 가족:  http://<내 IP주소>:${PORT}`);
  console.log('');
});
