export function isSameOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export function mediaType(request) {
  return request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
}

// Também limita corpos que chegam sem Content-Length.
export async function readText(request, limit) {
  if (!request.body || Number(request.headers.get('content-length')) > limit) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    await reader.cancel().catch(() => {});
    return null;
  } finally {
    reader.releaseLock();
  }
}
