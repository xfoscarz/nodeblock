import { printBuffer, printBytes } from "@/Debug";
import { HTTPResponse } from "@/WebPanel/HTTP";
import { WebConnectionHandler } from "@/WebPanel/WebServer";
import { hash } from "node:crypto";
import { EventEmitter } from "node:events";

export const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
export const generateAccept = (key: string) => {
    return hash("sha1", key + MAGIC_STRING, { "outputEncoding": "base64" });
}

const factory: (websocketKey: string) => WebConnectionHandler = (websocketKey) => {
    const handler: WebConnectionHandler = (server, socket) => {
        const handshakeResponse = buildHandshakeResponse(websocketKey);
        socket.write(handshakeResponse.payload);
        server.emit("websocketopen", socket);

        const builder = new WebsocketFrameBuilder(payload => {
            server.emit("websocketmessage", socket, payload);
        });

        socket.on("data", chunk => builder.write(chunk));

        socket.on("close", () => {
            console.log("Closed websocket connection");
            server.emit("websocketclose", socket);
        });

        socket.on("error", console.error);
    }

    return handler;
}

export class WebsocketFrameBuilder {
    public static readonly OP_CODES = {
        CONTINUATION: 0x0,
        TEXT: 0x1,
        BINARY: 0x2
    }

    private _emitter = new EventEmitter();
    private _frameBuffer: WebsocketFrame = {
        fin: true, rsv1: false, rsv2: false, rsv3: false,
        opcode: 0, mask: true,
        payloadLength: 0,
        maskingKey: 0,
        body: Buffer.alloc(0)
    }
    private _buffer: Buffer;

    constructor(
        public onbuild: (payload: Uint8Array) => void,
        initialBuffer?: Uint8Array
    ) {
        this._buffer = Buffer.from(initialBuffer || new Uint8Array());

        this.waitForBytes(2).then(console.log);
    }

    public async waitForBytes(count: number): Promise<Uint8Array> {
        const buffer: number[] = [];

        while (buffer.length < count) {
            if (this._buffer.length > 0) {
                const take = Math.min(this._buffer.length, count - buffer.length);
                buffer.push(...this._buffer.subarray(0, take));
            } else {
                await new Promise(res => this._emitter.once("chunk", res));
            }
        }

        return new Uint8Array(buffer);
    }

    public write(chunk: string | Uint8Array) {
        if (typeof chunk === "string") throw new Error("Invalid encoding property");
        this._buffer = Buffer.concat([ this._buffer, chunk ]);
        this._emitter.emit("chunk");
    }
}

export type WebsocketFrame = {
    fin: boolean;
    
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;
    
    opcode: number;
    mask: boolean;

    payloadLength: number;
    maskingKey: number;

    body: Uint8Array;
}

function buildHandshakeResponse(websocketKey: string) {
    const handshakeResponse = new HTTPResponse(101, "Switching Protocols");
    const acceptString = generateAccept(websocketKey);
    return handshakeResponse
        .setHeader("Sec-WebSocket-Accept", acceptString)
        .setHeader("Connection", "Upgrade")
        .setHeader("Upgrade", "websocket");
}

export default factory;