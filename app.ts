import { Server } from './src/Router.ts';

const server = new Server();

server.router.get(/\/*/, req => {  
    req.respondWith(new Response(Deno.inspect(new URL(req.request.url))))
})

server.listen();