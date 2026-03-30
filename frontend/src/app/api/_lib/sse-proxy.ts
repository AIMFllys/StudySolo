const BACKEND_URL = (
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://127.0.0.1:2038'
).replace(/\/+$/, '');

function buildForwardHeaders(req: Request) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };

  const cookie = req.headers.get('cookie');
  if (cookie) headers.Cookie = cookie;

  const auth = req.headers.get('authorization');
  if (auth) headers.Authorization = auth;

  return headers;
}

export async function proxySseRequest(req: Request, upstreamPath: string) {
  const body = await req.text();

  try {
    const backendRes = await fetch(`${BACKEND_URL}${upstreamPath}`, {
      method: 'POST',
      headers: buildForwardHeaders(req),
      body,
      signal: req.signal,
      cache: 'no-store',
    });

    if (!backendRes.ok || !backendRes.body) {
      const errorBody = await backendRes.text();
      return new Response(errorBody, {
        status: backendRes.status,
        headers: {
          'Content-Type': backendRes.headers.get('Content-Type') || 'application/json',
        },
      });
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    console.error('[SSE Proxy] Backend unreachable:', err);
    return new Response(
      JSON.stringify({ detail: '后端服务不可达' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
