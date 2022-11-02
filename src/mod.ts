
type RequestPredicate = (request: Deno.RequestEvent['request']) => Promise<boolean> | boolean;
type RequestCallback = (request: Deno.RequestEvent) => void;

class Router {
    private REGISTRY: Map<RequestPredicate, RequestCallback> = new Map;
    register(predicate: RequestPredicate, callback: RequestCallback) {
        this.REGISTRY.set(predicate, callback);
    }
    private registerByMethod(method: string, predicate: RequestPredicate, callback: RequestCallback) {
        this.REGISTRY.set((request) => {
            if(request.method !== method) return false;
            return predicate(request);
        }, callback);
    }
    get(predicate: RequestPredicate, callback: RequestCallback) {
        this.registerByMethod('GET', predicate, callback);
    }
    post(predicate: RequestPredicate, callback: RequestCallback) {
        this.registerByMethod('POST', predicate, callback);
    }
    async handle(req: Deno.RequestEvent) {
        for (const [predicate, callback] of this.REGISTRY.entries()) {
            if(predicate.constructor.name === 'AsyncFunction' ? await predicate(req.request) : predicate(req.request)) return callback(req);
            req.respondWith(new Response(null, {
                status: 404
            }));
        }
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
        for await (const conn of this.TcpListener) this.upgrade(conn);
    }
    async upgrade(conn: Deno.Conn) {
        for await (const request of Deno.serveHttp(conn)) this.handle(request);
    }
    handle(req: Deno.RequestEvent) {
        return this.router.handle(req);
    }
}

