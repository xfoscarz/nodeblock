import { capitalize } from "../Util";

export type MIMETypes = "text/plain" | "text/html" | "text/css" | "text/csv" | "text/javascript" | "text/markdown" |
    "audio/mpeg" | "audio/wav" | "audio/webm" |
    "video/mp4" | "video/mpeg" | "video/webm" |
    "image/jpeg" | "image/png" | "image/gif" | "image/svg+xml" | "image/webp" | "image/x-icon" | "image/vnd.microsoft.icon" |
    "application/xml" | "application/pdf" | "application/zip" | "application/gzip" | "application/octet-stream" | "application/json" | "application/x-www-form-urlencoded" | "application/javascript" |
    "font/woff" | "font/woff2" | "font/ttf" | "font/otf" | "application/vnd.ms-fontobject";

type HTTPResponseOptions = {
    protocol?: string;
};
export default class HTTPResponse {
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
        return this._body;
    }

    public set body(data: Buffer | string) {
        if (typeof data === "string") {
            this._body = Buffer.from(data);
        } else {
            this._body = data;
        }
    }

    public set contentType(type: MIMETypes | (string & {})) {
        this.setHeader("Content-Type", type);
    }

    public get contentType() {
        return this.headers["Content-Type"];
    }

    public get payload(): Buffer {
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