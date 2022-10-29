type pathname = string | RegExp;

class Router {
    private GET: Map<string, (req: Deno.RequestEvent) => void> = new Map;
    private GETREGEX: Map<RegExp, (req: Deno.RequestEvent) => void> = new Map;
    private POST: Map<pathname, (req: Deno.RequestEvent) => void> = new Map;
    private POSTREGEX: Map<RegExp, (req: Deno.RequestEvent) => void> = new Map;
    get(pathname: pathname, req: (req: Deno.RequestEvent) => void) {
        if(pathname instanceof RegExp) return this.GETREGEX.set(pathname, req);
        if(typeof pathname === 'string') return this.GET.set(pathname, req);
    }
    post(pathname: pathname, req: (req: Deno.RequestEvent) => void) {
        if(pathname instanceof RegExp) return this.POSTREGEX.set(pathname, req);
        if(typeof pathname === 'string') return this.POST.set(pathname, req);
    }
    handle(req: Deno.RequestEvent) {
        const url = new URL(req.request.url);
        
        if(req.request.method === 'GET') {
            for(const key of this.GET.keys())
                if(url.pathname === key) return this.GET.get(key)!(req);
            for(const key of this.GETREGEX.keys())
                if(key.test(url.pathname)) return this.GETREGEX.get(key)!(req);
        }
        if(req.request.method === 'POST') {
            for(const key of this.POST.keys())
                if(url.pathname === key) return this.POST.get(key)!(req);
            for(const key of this.POSTREGEX.keys())
                if(key.test(url.pathname)) return this.POSTREGEX.get(key)!(req);
        }
        req.respondWith(new Response('', {
            status: 404
        }));
    }
}

export class Server {
    static defaultListenOptions: Deno.TcpListenOptions = {
        port: 80,
        hostname: '127.0.0.1',
        reusePort: true
    }
    TcpListener: Deno.Listener;
    router: Router;
    constructor(options?: Partial<Deno.TcpListenOptions & Partial<{
        router: Router
    }>>) {
        this.TcpListener = Server.createListener(options);
        this.router = options?.router ? options.router : new Router();
    }
    static createListener(options?: Partial<Deno.TcpListenOptions>): Deno.Listener {
        return Deno.listen({
            ...Server.defaultListenOptions,
            ...options
        });
    }
    async listen() {
        for await (const conn of this.TcpListener)
            for await (const request of Deno.serveHttp(conn))
                this.handle(request);
    }
    handle(req: Deno.RequestEvent) {
        return this.router.handle(req);
    }
}