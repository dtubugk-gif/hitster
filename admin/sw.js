// Receives recordings shared to the installed admin app (for example a WhatsApp voice note)
// and keeps them until the page attaches each one to a song as "our performance".
const SHARE_CACHE = "shared-recordings";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "POST" || url.pathname !== new URL("share", self.registration.scope).pathname) return;
  e.respondWith((async () => {
    const back = n => Response.redirect(new URL("./?shared=" + n, self.registration.scope).href, 303);
    try {
      const form = await e.request.formData();
      const files = form.getAll("audio").filter(f => f && typeof f !== "string" && f.size > 0);
      const cache = await caches.open(SHARE_CACHE);
      const stamp = Date.now();
      await Promise.all(files.map((f, i) => cache.put(new URL(`shared/${stamp}-${i}`, self.registration.scope).href,
        new Response(f, { headers: { "Content-Type": f.type || "application/octet-stream", "X-Name": encodeURIComponent(f.name || "") } }))));
      return back(files.length);
    } catch (err) {
      return back("error");
    }
  })());
});
