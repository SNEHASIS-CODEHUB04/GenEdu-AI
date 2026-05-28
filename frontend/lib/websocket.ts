type JobUpdateCallback = (data: {
  jobId: string;
  status: string;
  progress: number;
  paperId?: string;
  error?: string;
}) => void;

export function connectJobWebSocket(jobId: string, onUpdate: JobUpdateCallback): () => void {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
  let ws: WebSocket | null = null;

  try {
    ws = new WebSocket(`${WS_URL}?jobId=${jobId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch { /* ignore malformed messages */ }
    };

    ws.onerror = () => {
      // WS failed — silently fall back to polling, do NOT emit 'failed'
      console.warn('WebSocket unavailable, using polling fallback');
    };

    ws.onclose = () => {
      ws = null;
    };
  } catch {
    console.warn('WebSocket not supported, using polling fallback');
  }

  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    ws = null;
  };
}
