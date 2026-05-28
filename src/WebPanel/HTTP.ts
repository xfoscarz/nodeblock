
import { capitalize } from "@shared/Util";
import { WebConnectionHandler } from "@/WebPanel/WebServer";
import { Log } from "@/Debug";

const handler: WebConnectionHandler = (server, socket) => {
    const builder = new HTTPIncomingRequestBuilder(request => {
        server.emit("route", request, socket);

        const connectionStatus = request.getHeader("Connection");
        if (connectionStatus == "close") {
            socket.end();
        }
    });

    socket.on("data", chunk => builder.write(chunk));

    socket.on("error", (err) => {
        Log.error(err);
        socket.end();
    });

    socket.on("timeout", () => {
        socket.end();
    });
}
export default handler;

// BUG limit header body size
// BUG chunked
// BUG multi-map header
// BUG content-length validation
export class HTTPIncomingRequestBuilder {
    private _contentLength = -1;
    private _requestBuffer!: HTTPIncomingRequest;
    private _buffer: Buffer;

    constructor(
        public onbuild: (request: HTTPIncomingRequest) => void,
        initialBuffer?: Uint8Array,
    ) {
        this._buffer = Buffer.from(initialBuffer || new Uint8Array());
    }

    public write(chunk: string | Uint8Array) {
        const data = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        this._buffer = Buffer.concat([ this._buffer, data ]);

        while (true) {
            if (this._contentLength === -1) {
                const headerEnd = this._buffer.indexOf("\r\n\r\n");
                if (headerEnd === -1) return;
    
                const headerBlock = this._buffer.subarray(0, headerEnd).toString("utf8");
                this._buffer = this._buffer.subarray(headerEnd + 4);
    
                const lines = headerBlock.split("\r\n");
                this._buildHTTPHeader(lines);

                if (this._contentLength === -1) continue;
            }
            
            if (!this._buildHTTPRequestBody()) {
                return;
            }

            this.onbuild(this._requestBuffer);
        }
    }

    private _buildHTTPHeader(lines: string[]) {
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

        this._requestBuffer = new HTTPIncomingRequest(path, protocol as any, method as any, headers);
        this._contentLength = this._requestBuffer.contentLength || 0;
    }
    
    private _buildHTTPRequestBody(): boolean {
        if (this._contentLength < 0) return false;
        if (this._buffer.length < this._contentLength) return false;

        const body = this._buffer.subarray(0, this._contentLength);
        this._buffer = this._buffer.subarray(this._contentLength);

        this._requestBuffer.body = body;
        this._contentLength = -1;
        return true;
    }
}

export type HTTPMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type HTTPProtocols = `HTTP/${string}`;

export interface HTTPFrame {
    body: Uint8Array | string;
    headers: Record<string, string>;

    toString(): string;
}

class HTTPIncomingRequest implements HTTPFrame {
    public readonly route: string;
    public readonly searchParams: URLSearchParams;
    private _body: Uint8Array | null = null;
    private _headers: Record<string, string> = {};
    
    constructor(
        path: string,
        public readonly protocol: HTTPProtocols,
        private _method: HTTPMethods,
        headers: Record<string, string>
    ) {
        const [ route, ...params ] = path.split("?");

        this.route = route;
        this.searchParams = new URLSearchParams(params.join("?"));
        
        for (const name in headers) {
            this._headers[name.toLowerCase()] = headers[name];
        }

        Object.freeze(this._headers);
    }

    public getHeader(name: string) {
        return this._headers[name.toLowerCase()];
    }

    public get headers() {
        return this._headers;
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

    public toString() {
        let s = `${this.method} ${this.route}${this.searchParams.size !== 0 ? "?" + this.searchParams.toString() : ""} ${this.protocol}\r\n`;

        for (const header in this.headers) {
            s += `${header.split("-").map(capitalize).join("-")}: ${this.headers[header]}\r\n`;
        }

        s += `\r\n${this.body.toString()}`;

        return s;
    }
}
export type HTTPRequest = HTTPIncomingRequest;

export type MIMETypes = "text/plain" | "text/html" | "text/css" | "text/csv" | "text/javascript" | "text/markdown" |
    "audio/mpeg" | "audio/wav" | "audio/webm" |
    "video/mp4" | "video/mpeg" | "video/webm" |
    "image/jpeg" | "image/png" | "image/gif" | "image/svg+xml" | "image/webp" | "image/x-icon" | "image/vnd.microsoft.icon" |
    "application/xml" | "application/pdf" | "application/zip" | "application/gzip" | "application/octet-stream" | "application/json" | "application/x-www-form-urlencoded" | "application/javascript" |
    "font/woff" | "font/woff2" | "font/ttf" | "font/otf" | "application/vnd.ms-fontobject" | (string & {});

export class MIMETypeAssociationProvider {
    public static associations: Record<`.${string}`, MIMETypes> = {
        ".html": "text/html",
        ".txt": "text/plain",
        ".css": "text/css",
        ".js": "application/javascript",
        ".xml": "application/xml",
        ".json": "application/json",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".svg": "image/svg+xml",
        ".mp4": "video/mp4",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".pdf": "application/pdf",
        ".map": "application/json",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".eot": "application/vnd.ms-fontobject",
        ".otf": "font/otf"
    }

    public static default: MIMETypes = "text/plain";

    public static get(extension: `.${string}`): MIMETypes {
        return this.associations[extension] || this.default;
    }
}

type HTTPResponseOptions = {
    protocol?: HTTPProtocols;
};
export class HTTPResponse implements HTTPFrame {
    public headers: Record<string, any> = {};
    public protocol: HTTPProtocols = "HTTP/1.1";
    
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
        return this;
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

        let header = `${this.protocol} ${this.status} ${this.reasonPhrase}\r\n`;

        this.setHeader("Content-Length", body.byteLength);

        for (const name in this.headers) {
            const value = this.headers[name];
            header += `${name}: ${value}\r\n`;
        }

        header += "\r\n";

        const buffer = Buffer.from(header);

        return Buffer.concat([ buffer, body ]);
    }

    public valueOf() {
        return this.payload;
    }

    public toString() {
        return this.payload.toString();
    }
}