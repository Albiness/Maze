const CACHE_NAME = "maze-cache-ve88";
const urlsToCache = [
    "/",
    "/index.html",
    "/css.css",
    "/Maze.js",
    "/levels.json",
    "/manifest.json",
    "/favicon/web-app-manifest-192x192.png",
    "/favicon/web-app-manifest-512x512.png"
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});


self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});