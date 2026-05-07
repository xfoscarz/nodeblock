export type HTTPRequestMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export default class HTTPRequest {
    public readonly route: string;
    public readonly searchParams: URLSearchParams;
    private _body: Uint8Array | null = null;
    private _headers: Record<string, string> = {};
    
    constructor(
        path: string,
        public readonly protocol: `HTTP/${string}`,
        private _method: HTTPRequestMethods,
        headers: Record<string, string>
    ) {
        const [ route, ...params ] = path.split("?");

        this.route = route;
        this.searchParams = new URLSearchParams(params.join("?"));
        
        for (const name in headers) {
            this._headers[name.toLowerCase()] = headers[name];
        }
    }

    public getHeader(name: string) {
        return this._headers[name.toLowerCase()];
    }

    public get body(): Uint8Array {
        return this._body!;
    }

    public set body(data: Uint8Array) {
        if (this._body !== null) return;
        this._body = data;
    }

    public get method() {
        return this._method;
    }

    public get contentLength() {
        let l = Number(this.getHeader("Content-Length"));
        if (Number.isNaN(l)) return 0;
        return l;
    }
}