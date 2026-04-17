import { BufferedWriter } from "../BufferedIO";

export abstract class Packet {
    constructor(
        public readonly packetID: number
    ) {};
}

export abstract class ClientboundPacket extends BufferedWriter {
    private _payload!: Uint8Array;

    constructor(
        public readonly packetID: number
    ) {
        super();
    };

    public abstract write(): void;

    public get payload(): Uint8Array {
        if (this._payload) return this._payload;

        this.writeVarInt(this.packetID);
        this.write();

        const data = this._buffer;
        this._buffer = [];
        this._writeVarInt(data.length);
        this._buffer.push(...data);

        this._payload = new Uint8Array(this._buffer);
        return this._payload;
    }
}