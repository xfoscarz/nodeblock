import { getBitAt, getBitsAt } from "@shared/Util";
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

        builder.on("frame", frame => {
            if (frame.opcode! == WebsocketFrameBuilder.OP_CODES.CLOSE) {
                socket.end();
            }
        });

        socket.on("data", chunk => {
            try {
                builder.write(chunk);
            } catch (error) {
                if (!(error instanceof WebsocketFrameError)) {
                    console.error(error);
                }
                socket.end();
            }
        });

        socket.on("close", () => {
            console.log("Closed websocket connection");
            server.emit("websocketclose", socket);
            socket.end();
        });

        socket.on("error", console.error);
    }

    return handler;
}

type WebsocketFrameBuilderEvents = {
    "frame": [ WebsocketFrame ],
    "control": [ WebsocketFrame ]
}

export class WebsocketFrameBuilder extends EventEmitter<WebsocketFrameBuilderEvents> {
    public static readonly OP_CODES = {
        CONTINUATION: 0x0,
        TEXT: 0x1,
        BINARY: 0x2,
        CLOSE: 0x8,
        PING: 0x9,
        PONG: 0xa,
    }

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
        return this._frameBuffer.opcode === WebsocketFrameBuilder.OP_CODES.PING ||
            this._frameBuffer.opcode === WebsocketFrameBuilder.OP_CODES.PONG ||
            this._frameBuffer.opcode === WebsocketFrameBuilder.OP_CODES.CLOSE;
    }

    private _processRawFrame() {
        this.emit("frame", { ...this._frameBuffer });

        if (this._isControl) {
            this.emit("control", { ...this._frameBuffer });
        } else {
            if (this._frameBuffer.mask) {
                for (let i = 0; i < this._frameBuffer.body.length; i++) {
                    this._frameBuffer.body[i] ^= this._frameBuffer.maskingKey![i % 4];
                }
            }
    
            if (this._payloadType !== undefined) {
                if (this._frameBuffer.opcode != WebsocketFrameBuilder.OP_CODES.CONTINUATION) throw new Error("Invalid websocket frame. Fragmentation expected continuation opcode.");
            } else {
                if (this._frameBuffer.opcode == WebsocketFrameBuilder.OP_CODES.CONTINUATION) throw new Error("Invalid websocket frame. Fragmentation expected payload type to be initialized first.");
                this._payloadType = this._frameBuffer.opcode;
                this._payloadBuffer = Buffer.alloc(0);
            }
    
            this._payloadBuffer = Buffer.concat([ this._payloadBuffer as Uint8Array, this._frameBuffer.body ]);
    
            if (this._frameBuffer.fin) {
                if (this._payloadType === WebsocketFrameBuilder.OP_CODES.TEXT) {
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

export type WebsocketFrame = {
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

function buildHandshakeResponse(websocketKey: string) {
    const handshakeResponse = new HTTPResponse(101, "Switching Protocols");
    const acceptString = generateAccept(websocketKey);
    return handshakeResponse
        .setHeader("Sec-WebSocket-Accept", acceptString)
        .setHeader("Connection", "Upgrade")
        .setHeader("Upgrade", "websocket");
}

export default factory;