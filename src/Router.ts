
export default class Router {

}

export class Server {
    static defaultListenOptions: Deno.TcpListenOptions = {
        port: 80,
        hostname: '127.0.0.1',
        reusePort: true
    }
    TcpListener: Deno.Listener;
    Routes = {
        GET: [],
        POST: []
    }
    constructor(options?: Partial<Deno.TcpListenOptions>) {
        this.TcpListener = Server.createListener(options);
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
    async handle(req: Deno.RequestEvent) {
        console.log(req.request)
    }
}