import { Socket } from "node:net";

import { capitalize } from "@/Util";
import WebServer from "./WebServer";

export default class HTTPConnection {
    private _requestBuffer!: HTTPRequest;
    private _contentLength = -1;
    private _buffer: Buffer = Buffer.alloc(0);
    private _ended: boolean = false;

    constructor(
        public readonly server: WebServer,
        public readonly socket: Socket
    ) {
        this.socket.setTimeout(60 * 1000);

        socket.on("data", chunk => {
            if (this._ended) return;
            
            const data = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
            this._buffer = Buffer.concat([this._buffer, data]);
            this._pump();
        });

        socket.on("error", (err) => {
            console.error(err);
            this.socket.destroy();
        });

        socket.on("close", () => this._ended = true);
        socket.on("timeout", () => this.close());
    }

    private _pump() {
        while (true) {
            if (this._contentLength === -1) {
                const headerEnd = this._buffer.indexOf("\r\n\r\n");
                if (headerEnd === -1) return;

                const headerBlock = this._buffer.subarray(0, headerEnd).toString("utf8");
                this._buffer = this._buffer.subarray(headerEnd + 4);

                const lines = headerBlock.split("\r\n");
                this._handleHeader(lines);
                continue;
            }

            if (!this._buildRequestBody()) {
                return;
            }
        }
    }
    
    private _buildRequestBody(): boolean {
        if (this._contentLength < 0) return false;

        if (this._buffer.length < this._contentLength) {
            return false;
        }

        const body = this._buffer.subarray(0, this._contentLength);
        this._buffer = this._buffer.subarray(this._contentLength);

        this._requestBuffer.body = Uint8Array.from(body);
        this._contentLength = -1;

        this._handleRequest(this._requestBuffer);
        return true;
    }

    private _handleHeader(lines: string[]) {
        if (lines.length === 0) return;

        const [method, path, protocol] = lines[0].split(" ");
        if (!method || !path || !protocol) return;

        const headers: Record<string, string> = {};

        for (const line of lines.slice(1)) {
            const index = line.indexOf(":");
            if (index !== -1) {
                const name = line.slice(0, index).trim().toLowerCase();
                const value = line.slice(index + 1).trim();
                headers[name] = value;
            }
        }

        this._requestBuffer = new HTTPRequest(path, protocol as any, method as any, headers);
        this._contentLength = this._requestBuffer.contentLength || 0;
    }

    private _handleRequest(request: HTTPRequest) {
        const route = request.route;
        
        this.server.emit("route", request, this);

        const connectionStatus = request.getHeader("Connection");

        if (connectionStatus == "close") {
            this.close();
        }
    }

    public get ended() { return this._ended; }

    public close() {
        if (this._ended || this.socket.destroyed) return;
        this._ended = true;
        this.socket.end();
    }

    public send(response: HTTPResponse) {
        if (this._ended) throw new Error("Cannot send as response is already baked");
        const payload = response.payload;
        this.socket.write(payload);
    }
}

export type HTTPRequestMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export class HTTPRequest {
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

export type MIMETypes = "text/plain" | "text/html" | "text/css" | "text/csv" | "text/javascript" | "text/markdown" |
    "audio/mpeg" | "audio/wav" | "audio/webm" |
    "video/mp4" | "video/mpeg" | "video/webm" |
    "image/jpeg" | "image/png" | "image/gif" | "image/svg+xml" | "image/webp" | "image/x-icon" | "image/vnd.microsoft.icon" |
    "application/xml" | "application/pdf" | "application/zip" | "application/gzip" | "application/octet-stream" | "application/json" | "application/x-www-form-urlencoded" | "application/javascript" |
    "font/woff" | "font/woff2" | "font/ttf" | "font/otf" | "application/vnd.ms-fontobject";

type HTTPResponseOptions = {
    protocol?: string;
};
export class HTTPResponse {
    public headers: Record<string, any> = {};
    public protocol: string = "HTTP/1.1";
    
    private _body: Buffer = Buffer.from("");

    constructor(
        public status: number = 200,
        public reasonPhrase: string = "",
        { protocol = "HTTP/1.1" }: HTTPResponseOptions = {}
    ) {
        this.protocol = protocol;

        this.setHeader("Server", "nodeblock");
    }

    public setHeader(name: string, value: any) {
        const words = name.split("-").map(word => capitalize(word)).join("-");
        this.headers[words] = value;
    }

    public get body() {
        return this._body || Buffer.from("");
    }

    public set body(data: Uint8Array | string) {
        this._body = Buffer.from(data);
    }

    public set contentType(type: MIMETypes | (string & {})) {
        this.setHeader("Content-Type", type);
    }

    public get contentType() {
        return this.headers["Content-Type"];
    }

    public get payload(): Uint8Array {
        const body = typeof this.body === "string" ? Buffer.from(this.body, "utf8") : this.body;

        let header = `${this.protocol} ${this.status} ${this.reasonPhrase}\n`;

        this.setHeader("Content-Length", body.byteLength);

        for (const name in this.headers) {
            const value = this.headers[name];
            header += `${name}: ${value}\n`;
        }

        header += "\n";

        const buffer = Buffer.from(header);

        return Buffer.concat([ buffer, body ]);
    }

    public valueOf() {
        return this.payload;
    }

    public toString() {
        return this.payload;
    }
}