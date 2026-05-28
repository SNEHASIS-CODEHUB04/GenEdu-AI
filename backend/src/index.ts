import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/db';
import { initWebSocket } from './config/websocket';
import assignmentRoutes from './routes/assignments';
import questionRoutes from './routes/questions';

dotenv.config();

// Log all env vars present (without values) to help debug
console.log('ENV CHECK — keys present:', Object.keys(process.env).filter(k =>
  ['MONGODB_URI', 'GROQ_API_KEY', 'FRONTEND_URL', 'NODE_ENV', 'PORT'].includes(k)
));

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // allow all in prod for now
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/assignments', assignmentRoutes);
app.use('/api/questions', questionRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

const PORT = parseInt(process.env.PORT || '4000', 10);

async function bootstrap() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Initializing WebSocket...');
    initWebSocket(server);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();
