const CACHE_NAME = "poolside-parent-pwa-v7";

const APP_FILES = [
  "./index.html",
  "./css/main.css",
  "./js/storage.js",
  "./js/export.js",
  "./js/timer.js",
  "./js/manual-time.js",
  "./js/ui.js",
  "./js/swimmers.js",
  "./js/app.js",
  "./js/history-edit.js",
  "./js/progress-chart.js",
  "./js/result-edit.js",
  "./js/reliability.js",
  "./PoolsideParent-app-icon-final-512.png",
  "./manifest.webmanifest"
];

async function cacheFreshAppFiles(){
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(APP_FILES.map(async function(path){
    const request = new Request(path, {cache:"reload"});
    const response = await fetch(request);

    if(!response.ok){
      throw new Error("Could not cache " + path + ": " + response.status);
    }

    await cache.put(request, response);
  }));
}

self.addEventListener("install", function(event){
  event.waitUntil(cacheFreshAppFiles());
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(
          keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
        );
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET"){
    return;
  }

  if(event.request.mode === "navigate"){
    event.respondWith(
      fetch(new Request(event.request, {cache:"no-store"}))
        .then(function(response){
          if(response && response.ok){
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put("./index.html", copy);
            });
          }
          return response;
        })
        .catch(function(){
          return caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached){
        return cached;
      }

      return fetch(event.request).then(function(response){
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, copy);
          });
        }
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
