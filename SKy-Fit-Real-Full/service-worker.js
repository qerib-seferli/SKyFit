const CACHE="skyfit-v1";
const ASSETS=["./","./index.html","./login.html","./register.html","./profile.html","./admin.html","./sevimliler.html","./css/style.css","./js/config.js","./js/core.js","./assets/img/logo.png","./assets/img/hero-gym.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||e.request.url.includes("supabase.co"))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{const y=x.clone();caches.open(CACHE).then(c=>c.put(e.request,y));return x}).catch(()=>caches.match("./index.html"))))});
