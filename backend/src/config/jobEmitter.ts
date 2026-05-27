import { EventEmitter } from 'events';

// Shared event emitter for job progress — bridges queue → WebSocket
export const jobEmitter = new EventEmitter();
jobEmitter.setMaxListeners(100);
