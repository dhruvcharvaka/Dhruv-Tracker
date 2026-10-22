/* Bump VERSION whenever any app file changes. Same-origin app shell only. */
'use strict';
const VERSION='dayline-shell-v1.0.0';
const SHELL=['./','./index.html','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dayline-shell-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  const allowed=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
  if(!allowed.has(url.pathname)&&request.mode!=='navigate')return;
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(!response.ok)throw new Error('App file unavailable');
      await cache.put(request,response.clone());
      if(request.mode==='navigate')await cache.put(new URL('./index.html',self.registration.scope),response.clone());
      return response;
    }catch(error){
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      if(request.mode==='navigate'){const shell=await cache.match(new URL('./index.html',self.registration.scope));if(shell)return shell;}
      return new Response('Offline file is not cached yet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
