/**
 * SSE Streaming Proxy — Next.js App Router API Route.
 *
 * WHY: Next.js `rewrites()` in dev mode (Turbopack) uses an HTTP proxy that
 * buffers the entire response body before forwarding. This kills SSE streaming.
 */

import { proxySseRequest } from '@/app/api/_lib/sse-proxy';

export async function POST(req: Request) {
  return proxySseRequest(req, '/api/ai/chat-stream');
}
