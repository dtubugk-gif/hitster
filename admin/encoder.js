// Turns decoded audio into a plain MP3 (no tags, no cover art) off the main thread.
importScripts("lame.min.js");
onmessage = e => {
  const { left, right, sampleRate, kbps } = e.data;
  const enc = new lamejs.Mp3Encoder(2, sampleRate, kbps);
  const toInt16 = f => {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const s = f[i] < -1 ? -1 : f[i] > 1 ? 1 : f[i];
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };
  const L = toInt16(left), R = toInt16(right);
  const parts = [], block = 1152 * 32;
  for (let i = 0; i < L.length; i += block) {
    const chunk = enc.encodeBuffer(L.subarray(i, i + block), R.subarray(i, i + block));
    if (chunk.length) parts.push(new Uint8Array(chunk));
    postMessage({ progress: i / L.length });
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end));
  postMessage({ done: new Blob(parts, { type: "audio/mpeg" }) });
};
