import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxySseRequest } from '@/app/api/_lib/sse-proxy';

function makeStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function readBody(response: Response) {
  return await response.text();
}

describe('sse proxy helper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes through SSE responses with streaming headers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      makeStream(['event: heartbeat\n', 'data: {"ts":"1"}\n\n']),
      {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      },
    )));

    const response = await proxySseRequest(
      new Request('http://localhost/api/workflow/wf-1/execute', {
        method: 'POST',
        body: '{}',
        headers: { cookie: 'access_token=abc' },
      }),
      '/api/workflow/wf-1/execute',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    expect(await readBody(response)).toBe('event: heartbeat\ndata: {"ts":"1"}\n\n');
  });

  it('forwards non-streaming backend errors without masquerading as SSE', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ detail: 'bad request' }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      },
    )));

    const response = await proxySseRequest(
      new Request('http://localhost/api/workflow/wf-1/execute', {
        method: 'POST',
        body: '{}',
      }),
      '/api/workflow/wf-1/execute',
    );

    expect(response.status).toBe(422);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(await response.json()).toEqual({ detail: 'bad request' });
  });

  it('maps aborted upstream fetches to 499', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    }));

    const response = await proxySseRequest(
      new Request('http://localhost/api/workflow/wf-1/execute', {
        method: 'POST',
        body: '{}',
      }),
      '/api/workflow/wf-1/execute',
    );

    expect(response.status).toBe(499);
  });
});
