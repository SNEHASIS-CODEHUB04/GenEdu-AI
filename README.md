# VedaAI — Hiring Assignment

Full-stack AI-powered question paper generation system.

## Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Zustand + WebSocket
- **Backend**: Node.js + Express + TypeScript
- **DB**: MongoDB (Mongoose)
- **Cache/Queue**: Redis + BullMQ
- **AI**: OpenAI GPT-4o-mini
- **Real-time**: WebSocket (ws) + Redis pub/sub

## Project Structure
```
├── frontend/          # Next.js app
├── backend/           # Express API + Worker
└── docker-compose.yml # MongoDB + Redis
```

## Setup

### 1. Start MongoDB + Redis
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env .env.local   # edit OPENAI_API_KEY
npm run dev          # API server on :4000
# In another terminal:
npm run worker       # BullMQ worker
```

### 3. Frontend
```bash
cd frontend
npm run dev          # Next.js on :3000
```

## Screens
| Route | Description |
|-------|-------------|
| `/assignments` | Assignment list (empty state + grid) |
| `/assignments/create` | Multi-step creation form |
| `/assignments/:id/processing` | Real-time generation progress |
| `/assignments/:id/paper` | Structured question paper output |
| `/assignments/:id` | Assignment detail |

## Features
- File upload (PDF/image) for context
- Question type builder with stepper controls
- BullMQ background job for AI generation
- WebSocket real-time progress (with polling fallback)
- Structured paper: sections, difficulty badges, marks
- Answer key toggle
- Regenerate action
- PDF download via browser print
- Full validation (Zod + react-hook-form)
