import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { jobEmitter } from './jobEmitter';

export let wss: WebSocketServer;
const clients = new Map<string, WebSocket>();

export function initWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const jobId = url.searchParams.get('jobId') || 'unknown';
    clients.set(jobId, ws);
    console.log(`WS client connected for job: ${jobId}`);

    // Forward job events to this WebSocket client
    const handler = (data: object) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    };
    jobEmitter.on(jobId, handler);

    ws.on('close', () => {
      clients.delete(jobId);
      jobEmitter.off(jobId, handler);
    });
  });

  console.log('WebSocket server initialized');
}
