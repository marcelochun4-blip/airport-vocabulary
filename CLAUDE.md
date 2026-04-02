# Claude Project

## Overview
This directory contains HTML-based projects and tools.

## Files
- `airport-vocabulary.html` — Airport English vocabulary flashcard app with category filters, dark/light mode toggle, and example sentences.
- `workout-journal/` — 가족 운동 일지 공유 사이트 (Node.js/Express)

---

## workout-journal 개발 현황

### 개요
매일 운동 사진을 업로드하고 가족과 공유하는 웹사이트.
- **공개 페이지** (`/`): 운동 이력 타임라인, 사진 갤러리, 월별 필터, 연속 운동 스트릭
- **관리자 페이지** (`/admin`): 비밀번호 인증 후 사진 업로드, 기록 삭제

### 기술 스택
- Backend: Node.js + Express + Multer(사진 업로드)
- Frontend: 순수 HTML/CSS/JS (프레임워크 없음)
- 데이터: JSON 파일(`workouts.json`) + 로컬 파일시스템
- 배포: Render (render.yaml 레포 루트에 위치)

### 파일 구조
```
workout-journal/
├── server.js           ← Express 서버, API 라우트
├── package.json
├── .gitignore          ← node_modules, uploads, data 제외
├── public/
│   ├── index.html      ← 공개 페이지
│   └── admin.html      ← 관리자 페이지
├── data/               ← workouts.json 저장 (gitignore)
└── uploads/            ← 업로드 사진 저장 (gitignore)
render.yaml             ← 레포 루트에 위치 (Render Blueprint)
```

### 주요 API
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/workouts` | 전체 기록 조회 |
| POST | `/api/auth` | 관리자 인증 |
| POST | `/api/workouts` | 기록 추가 (multipart, 사진 포함) |
| DELETE | `/api/workouts/:id` | 기록 삭제 |

### 환경변수
- `ADMIN_PASSWORD`: 관리자 비밀번호 (기본값: `workout2024`) — Render에서 설정 필요
- `PORT`: 포트 (기본값: 3000)

### 데이터 저장 경로 로직
- Render 디스크 마운트 시: `/data/workouts.json`, `/data/uploads/`
- 로컬 실행 시: `server.js` 위치 기준 `data/`, `uploads/`

### Render 배포 설정 (필수)
- Root Directory: `workout-journal`
- Build Command: `npm install`
- Start Command: `node server.js`
- Disk Mount Path: `/data` (데이터 영구 보존용, 유료)
- 환경변수: `ADMIN_PASSWORD` 설정

### 미해결 이슈
- 공개 페이지 접속 불가 문제 보고됨 → Root Directory 설정 누락이 원인으로 추정
  - Render Settings에서 Root Directory = `workout-journal` 확인 필요
  - render.yaml을 레포 루트로 이동 완료 (2026-04-02)

### 로컬 실행
```bash
cd workout-journal
npm install
npm start
# http://localhost:3000        공개 페이지
# http://localhost:3000/admin  관리자 페이지
```
