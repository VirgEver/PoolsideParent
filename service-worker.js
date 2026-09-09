const CACHE_NAME = "poolside-parent-pwa-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./css/main.css",
    "./js/storage.js",
    "./js/swimmers.js",
    "./js/export.js",
    "./js/timer.js",
    "./js/manual-time.js",
    "./js/ui.js",
    "./js/app.js",
    "./js/history-edit.js",
    "./js/result-edit.js",
    "./js/reliability.js",
    "./manifest.webmanifest"
];

self.addEventListener("install", function(event){
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache){
            return cache.addAll(APP_FILES);
        })
    );
});

self.addEventListener("activate", function(event){
    event.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(
                keys.filter(function(key){
                    return key !== CACHE_NAME;
                }).map(function(key){
                    return caches.delete(key);
                })
            );
        }).then(function(){
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function(event){
    if(event.request.method !== "GET"){
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(cached){
            if(cached){
                return cached;
            }

            return fetch(event.request).then(function(response){
                const copy = response.clone();
                caches.open(CACHE_NAME).then(function(cache){
                    cache.put(event.request, copy);
                });
                return response;
            });
        })
    );
});

self.addEventListener("message", function(event){
    if(event.data && event.data.type === "SKIP_WAITING"){
        self.skipWaiting();
    }
});
