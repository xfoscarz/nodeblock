import { BufferedWriter } from "@/Network/BufferedIO";

export interface Packet {
    readonly packetID: number;
}

export abstract class ServerboundPacket implements Packet {
    constructor(
        readonly packetID: number
    ) {}
}

export abstract class ClientboundPacket extends BufferedWriter implements Packet {
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

        const data = this.buffer;
        this._buffers = [];
        this.writeVarInt(data.length);

        this._payload = Buffer.concat([...this._buffers, data]);
        return this._payload;
    }
}