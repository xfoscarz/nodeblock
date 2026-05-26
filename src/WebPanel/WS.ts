import { getBitAt, getBitsAt, setBitArray } from "@shared/Util";
import { HTTPResponse } from "@/WebPanel/HTTP";
import WebServer, { WebConnectionHandler } from "@/WebPanel/WebServer";
import { hash } from "node:crypto";
import { EventEmitter } from "node:events";
import { Socket } from "node:net";
import crypto from "node:crypto";
import { Log } from "@/Debug";

export const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
export const generateAccept = (key: string) => {
    return hash("sha1", key + MAGIC_STRING, { "outputEncoding": "base64" });
}

const factory: (route: string, websocketKey: string) => WebConnectionHandler = (route, websocketKey) => {
    const handler: WebConnectionHandler = (server, socket) => {
        const handshakeResponse = buildHandshakeResponse(websocketKey);
        const connection: WebsocketConnection = new Connection(route, server, socket);
        socket.write(handshakeResponse.payload);
        server.emit("websocketopen", route, connection);

        const builder = new WebsocketFrameBuilder(payload => {
            connection.emit("message", payload);
        });

        builder.on("control", frame => {
            if (frame.opcode! == OP_CODES.CLOSE) {
                let closeCode = frame.payloadLength >= 2 ? Buffer.from(frame.body).readUint16BE() : 1006;
                connection.close(closeCode);
            } else if (frame.opcode! == OP_CODES.PING) {
                connection.send(WebsocketResponse.raw(true, OP_CODES.PONG, frame.rawBody));
            }
        });

        builder.on("frame", frame => connection.emit("frame", frame));

        socket.on("data", chunk => {
            try {
                builder.write(chunk);
            } catch (error) {
                if (!(error instanceof WebsocketFrameError)) {
                    Log.error(error);
                }
                connection.emit("error", error);
                socket.end();
            }
        });

        socket.on("close", () => connection.close());
        socket.on("error", error => {
            if ("code" in error) {
                if (error.code == "ECONNRESET") {
                    connection.close();
                    return;
                }
            }
            connection.emit("error", error);
        });
    }

    return handler;
}

type ConnectionEvents = {
    "close": [{ code?: number, message?: string }];
    "message": [ Uint8Array | string ];
    "frame": [ BakedWebsocketFrame ];
    "error": [ any ];
}
class Connection extends EventEmitter<ConnectionEvents> {
    private _closed: boolean = false;
    private _closeHandler = () => this.close(1000, "Server closed");
    private _broadcastHandler = (route: string, payload: Uint8Array | string | WebsocketResponse) => route === this.route ? this.send(payload) : "";

    constructor(
        public readonly route: string,
        public readonly server: WebServer,
        public readonly socket: Socket
    ) {
        super();
        server.once("stop", this._closeHandler);
        server.on("websocketbroadcast", this._broadcastHandler);
    }

    private _getPayload(payload: string | Uint8Array | WebsocketResponse) {
        if (payload instanceof WebsocketResponse) {
            return payload.payload;
        } else if (typeof payload === "string") {
            return WebsocketResponse.text(payload).payload;
        } else {
            return WebsocketResponse.binary(payload).payload;
        }
    }

    public send(payload: string | Uint8Array | WebsocketResponse) {
        this.socket.write(this._getPayload(payload));
    }

    public broadcast(payload: string | Uint8Array | WebsocketResponse) {
        this.server.websocketBroadcast(this.route, payload);
    }

    public async ping(timeout: number = 10_000): Promise<number> {
        const stamp = Date.now();
        const id = crypto.randomBytes(16);

        this.send(WebsocketResponse.raw(true, OP_CODES.PING, id));

        
        return new Promise(res => {
            const timeoutProcess = setTimeout(() => {
                res(-1);
                this.off("frame", resolver);
            }, timeout);

            const resolver = (frame: BakedWebsocketFrame) => {
                if (frame.opcode != OP_CODES.PONG) return;
                
                const now = Date.now();
                if (id.equals(frame.body)) {
                    res(now - stamp);
                    clearTimeout(timeoutProcess);
                    this.off("frame", resolver);
                }
            }
            
            this.on("frame", resolver);
        });

    }

    public close(code?: number, message?: string) {
        if (this._closed) return;
        this._closed = true;
        this.socket.end(WebsocketResponse.close(code, message).payload);
        this.server.emit("websocketclose", this.route, this);
        this.server.off("stop", this._closeHandler);
        this.server.off("websocketbroadcast", this._broadcastHandler);
        this.removeAllListeners();
    }
}
export type WebsocketConnection = Connection;

export const OP_CODES = {
    CONTINUATION: 0x0,
    TEXT: 0x1,
    BINARY: 0x2,
    CLOSE: 0x8,
    PING: 0x9,
    PONG: 0xa,
}

type WebsocketFrameBuilderEvents = {
    "frame": [ BakedWebsocketFrame ],
    "control": [ BakedWebsocketFrame ]
}

export class WebsocketFrameBuilder extends EventEmitter<WebsocketFrameBuilderEvents> {
    private _frameBuffer!: WebsocketFrame;
    private _buffer: Buffer;

    private _payloadBuffer?: Uint8Array;
    private _payloadType?: number;

    constructor(
        public onbuild: (payload: Uint8Array | string) => void,
        initialBuffer?: Uint8Array
    ) {
        super();
        this._buffer = Buffer.from(initialBuffer || new Uint8Array());
        this._reset();
    }

    public write(chunk: string | Uint8Array) {
        if (typeof chunk === "string") throw new WebsocketFrameError("Invalid encoding property");
        this._buffer = Buffer.concat([ this._buffer, chunk ]);

        while (this._buffer.byteLength !== 0) {
            let bytesUsed = 0;

            if (this._frameBuffer.opcode !== undefined) {
                if (this._isControl && !this._frameBuffer.fin) throw new WebsocketFrameError("Control frames cannot be fragmented");

                if (this._frameBuffer.payloadLength !== 126 && this._frameBuffer.payloadLength !== 127) {
                    bytesUsed = this._processPayloadData();
                } else {
                    if (this._isControl) throw new WebsocketFrameError("Control frame payload too large");
                    bytesUsed = this._processPayloadLengthExtensionData();
                }
            } else {
                bytesUsed = this._processPrePayloadLengthExtensionData();
            }

            if (bytesUsed === 0) break;

            this._buffer = this._buffer.subarray(bytesUsed);
        }
    }

    private get _isControl() {
        return this._frameBuffer.opcode === OP_CODES.PING ||
            this._frameBuffer.opcode === OP_CODES.PONG ||
            this._frameBuffer.opcode === OP_CODES.CLOSE;
    }

    private _bakeFrame(frame: WebsocketFrame, rawBody: Uint8Array) {
        return { ...frame, rawBody } as BakedWebsocketFrame;
    }

    private _processRawFrame() {
        const rawBody = Uint8Array.from(this._frameBuffer.body);

        if (this._frameBuffer.mask) {
            for (let i = 0; i < this._frameBuffer.body.length; i++) {
                this._frameBuffer.body[i] ^= this._frameBuffer.maskingKey![i % 4];
            }
        }

        const bakedFrame = this._bakeFrame(this._frameBuffer, rawBody);
        this.emit("frame", bakedFrame);

        if (this._isControl) {
            this.emit("control", bakedFrame);
        } else {
            if (this._payloadType !== undefined) {
                if (this._frameBuffer.opcode != OP_CODES.CONTINUATION) throw new Error("Invalid websocket frame. Fragmentation expected continuation opcode.");
            } else {
                if (this._frameBuffer.opcode == OP_CODES.CONTINUATION) throw new Error("Invalid websocket frame. Fragmentation expected payload type to be initialized first.");
                this._payloadType = this._frameBuffer.opcode;
                this._payloadBuffer = Buffer.alloc(0);
            }
    
            this._payloadBuffer = Buffer.concat([ this._payloadBuffer as Uint8Array, this._frameBuffer.body ]);
    
            if (this._frameBuffer.fin) {
                if (this._payloadType === OP_CODES.TEXT) {
                    this.onbuild(Buffer.from(this._payloadBuffer!).toString("utf8"));
                } else {
                    this.onbuild(this._payloadBuffer!);
                }
                this._payloadType = undefined;
                this._payloadBuffer = undefined;
            }
        }

        this._reset();
    }
    
    private _processPayloadData(): number {
        if (this._frameBuffer.maskingKey) {
            if (this._buffer.byteLength >= this._frameBuffer.payloadLength) {
                const payloadLength = this._frameBuffer.payloadLength;
                this._frameBuffer.body = this._buffer.subarray(0, payloadLength);
                this._processRawFrame();
                return payloadLength;
            } else return 0;
        } else {
            let maskingBytes = this._frameBuffer.mask ? 4 : 0;
            let allBytes = maskingBytes + this._frameBuffer.payloadLength;
    
            if (this._buffer.byteLength < maskingBytes) return 0;
            if (this._frameBuffer.mask) this._frameBuffer.maskingKey = Array.from(this._buffer.subarray(0, maskingBytes));

            if (this._buffer.byteLength < allBytes) {
                return maskingBytes;
            } else {
                const payloadLength = this._frameBuffer.payloadLength;
                this._frameBuffer.body = this._buffer.subarray(maskingBytes, payloadLength + maskingBytes);
                this._processRawFrame();
                return allBytes;
            }
        }
    }

    private _processPayloadLengthExtensionData(): number {
        if (this._frameBuffer.payloadLength == 126) {
            if (this._buffer.length >= 2) {
                this._frameBuffer.payloadLength = this._buffer.readUInt16BE();
                return 2;
            }
        } else if (this._frameBuffer.payloadLength == 127) {
            if (this._buffer.length >= 8) {
                const length = this._buffer.readBigUInt64BE();
                if (length > Number.MAX_SAFE_INTEGER) throw new WebsocketFrameError(`Exceeded max payload length for node (cant exceed ${Number.MAX_SAFE_INTEGER})`);
                this._frameBuffer.payloadLength = Number(length);
                return 8;
            }
        }
        return 0;
    }

    private _processPrePayloadLengthExtensionData(): number {
        if (this._buffer.length >= 2) {
            const lobyte = this._buffer[0];
            [
                this._frameBuffer.fin,
                this._frameBuffer.rsv1,
                this._frameBuffer.rsv2,
                this._frameBuffer.rsv3
            ] = getBitsAt(lobyte, 8, 7, 6, 5).map(v => v === 1);

            if (this._frameBuffer.rsv1 || this._frameBuffer.rsv2 || this._frameBuffer.rsv3) throw new WebsocketFrameError("This websocket implementation does not support rsv1, rsv2, or rsv3 bytes");

            this._frameBuffer.opcode = lobyte & 0b1111;

            const hibyte = this._buffer[1];
            this._frameBuffer.mask = getBitAt(hibyte, 8) === 1;
            this._frameBuffer.payloadLength = hibyte & 0b111_1111;

            if (!this._frameBuffer.mask) throw new WebsocketFrameError("Client-to-server frames must be masked")

            return 2;
        }
        return 0;
    }

    private _reset() {
        this._frameBuffer = {
            fin: true, rsv1: false, rsv2: false, rsv3: false,
            opcode: undefined, mask: true,
            payloadLength: 0,
            maskingKey: undefined,
            body: Buffer.alloc(0)
        }
    }
}

class WebsocketFrameError extends Error {}

export class WebsocketResponse implements WebsocketFrame {
    public rsv1: boolean = false;
    public rsv2: boolean = false;
    public rsv3: boolean = false;

    public readonly mask: false = false;

    private constructor(
        public readonly fin: boolean,
        public readonly opcode: number,
        public readonly body: Uint8Array
    ) {}

    public get payloadLength() { return this.body.byteLength; }

    public get payload(): Uint8Array {
        let headerBytes = [
            (setBitArray(this.fin, this.rsv1, this.rsv2, this.rsv3) << 4) + (this.opcode & 0b1111),
        ];

        let payloadSize = this.payloadLength;
        let payloadBuffer: Buffer = Buffer.alloc(0);

        if (payloadSize > 125) {
            if (payloadSize <= 0xffff) {
                payloadBuffer = Buffer.alloc(2);
                payloadBuffer.writeUint16BE(payloadSize);
                payloadSize = 126;
            } else {
                payloadBuffer = Buffer.alloc(8);
                payloadBuffer.writeBigUint64BE(BigInt(payloadSize));
                payloadSize = 127;
            }
        }

        let maskAndPayloadSize = (this.mask ? 0b1000_0000 : 0) | payloadSize;
        headerBytes.push(maskAndPayloadSize, ...payloadBuffer);

        return Buffer.concat([ new Uint8Array(headerBytes), this.body ])
    }

    public static text(payload: string) {
        return new WebsocketResponse(true, OP_CODES.TEXT, Buffer.from(payload));
    }

    public static binary(payload: Uint8Array) {
        return new WebsocketResponse(true, OP_CODES.BINARY, payload);
    }

    public static close(code?: number, message?: string) {
        const closePayload = Buffer.alloc(125);
        closePayload.writeUint16BE(code || 0);
        if ((message?.length || 0) > 123) console.warn("Close message cannot be greater than 123 bytes.");
        closePayload.write(message || "", 2);
        return new WebsocketResponse(true, OP_CODES.CLOSE, closePayload);
    }

    public static raw(fin: boolean, opcode: number, body: Uint8Array) {
        return new WebsocketResponse(fin, opcode, body);
    }
}

type WebsocketFrame = {
    fin: boolean;
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;
    opcode?: number;

    mask: boolean;
    payloadLength: number;

    maskingKey?: number[];

    body: Uint8Array;
}
export type BakedWebsocketFrame = Required<WebsocketFrame> & { rawBody: Uint8Array }

function buildHandshakeResponse(websocketKey: string) {
    const handshakeResponse = new HTTPResponse(101, "Switching Protocols");
    const acceptString = generateAccept(websocketKey);
    return handshakeResponse
        .setHeader("Sec-WebSocket-Accept", acceptString)
        .setHeader("Connection", "Upgrade")
        .setHeader("Upgrade", "websocket");
}

export default factory;