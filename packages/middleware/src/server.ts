/**
 * Middleware HTTP Server
 *
 * Standalone entry point that exposes:
 *  - POST /webhook/whatsapp   — Twilio WhatsApp inbound messages
 *  - POST /webhook/teable     — Teable record change webhooks
 *  - POST /webhook/status     — Twilio delivery status callbacks
 *  - GET  /health             — Health check
 *
 * Uses Node built-in `http` module (zero external deps).
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';

// ── Helpers ──────────────────────────────────────────────────

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ── Configuration ────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Request handler ──────────────────────────────────────────

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || '/';
  const method = (req.method || 'GET').toUpperCase();

  // Health check
  if (url === '/health' && method === 'GET') {
    json(res, 200, {
      status: 'ok',
      service: 'middleware',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // WhatsApp inbound webhook (Twilio POST)
  if (url === '/webhook/whatsapp' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const contentType = req.headers['content-type'] || '';

      let parsed: Record<string, string> = {};
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Twilio sends form-encoded
        const params = new URLSearchParams(body);
        for (const [key, value] of params) {
          parsed[key] = value;
        }
      } else {
        parsed = JSON.parse(body);
      }

      console.log('[WhatsApp Webhook] Received message from:', parsed.From || 'unknown');
      console.log('[WhatsApp Webhook] Body:', parsed.Body || '(empty)');

      // Acknowledge to Twilio with empty TwiML
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end('<Response></Response>');
    } catch (err: any) {
      console.error('[WhatsApp Webhook] Error:', err?.message);
      json(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // Teable webhook
  if (url === '/webhook/teable' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const payload = JSON.parse(body);

      console.log('[Teable Webhook] Event:', payload.event, 'Table:', payload.table);

      json(res, 200, { received: true });
    } catch (err: any) {
      console.error('[Teable Webhook] Error:', err?.message);
      json(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // Twilio status callback
  if (url === '/webhook/status' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const params = new URLSearchParams(body);
      console.log(
        '[Status Callback] SID:', params.get('MessageSid'),
        'Status:', params.get('MessageStatus'),
      );
      json(res, 200, { received: true });
    } catch (err: any) {
      console.error('[Status Callback] Error:', err?.message);
      json(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // Fallback — 404
  json(res, 404, { error: 'Not found', path: url });
}

// ── Start server ─────────────────────────────────────────────

const server = createServer((req, res) => {
  handler(req, res).catch((err) => {
    console.error('[Server] Unhandled error:', err);
    if (!res.headersSent) {
      json(res, 500, { error: 'Internal server error' });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Middleware] Server running on port ${PORT}`);
  console.log(`[Middleware] Health: http://0.0.0.0:${PORT}/health`);
  console.log(`[Middleware] WhatsApp webhook: http://0.0.0.0:${PORT}/webhook/whatsapp`);
  console.log(`[Middleware] Teable webhook: http://0.0.0.0:${PORT}/webhook/teable`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Middleware] SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Middleware] SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
