import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/db';
import { initWebSocket } from './config/websocket';
import assignmentRoutes from './routes/assignments';
import questionRoutes from './routes/questions';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/assignments', assignmentRoutes);
app.use('/api/questions', questionRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await connectDB();
  initWebSocket(server);
  server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

bootstrap().catch(console.error);
