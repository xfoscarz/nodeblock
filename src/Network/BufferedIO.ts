import GameProfile from "@/Minecraft/GameProfile";
import { Identifier } from "@/Minecraft/Identifier";
import { NBT } from "@/Minecraft/NBT";
import UUID from "@/Minecraft/UUID";
import { bigEndian } from "@shared/Util";
import EventEmitter from "node:events";

export class BufferedReader extends EventEmitter {
    private _buffer: number[] = [];

    constructor(initialData: Iterable<number> = []) {
        super();

        this._buffer.push(...initialData);
        if (this.readable) {
            this.emit("data");
        }
    }

    public write(data: Uint8Array) {
        for (const byte of data) {
            this._buffer.push(byte);
        }
        this.emit("data");
    }

    // BUG: Optimize with Buffer read methods (written in C++ so faster)
    public async readNextBoolean(): Promise<boolean> {
        const byte = await this.waitForByte();
        return byte === 0x1;
    }

    public async readNextByte(): Promise<number> {
        const byte = await this.readNextSigned(1);
        return Number(byte);
    }

    public async readNextUnsignedByte(): Promise<number> {
        const byte = await this.readNextUnsigned(1);
        return Number(byte);
    }

    public async readNextShort(): Promise<number> {
        const bytes = await this.readNextSigned(2);
        return Number(bytes);
    }

    public async readNextUnsignedShort(): Promise<number> {
        const bytes = await this.readNextUnsigned(2);
        return Number(bytes);
    }

    public async readNextInt(): Promise<number> {
        const bytes = await this.readNextSigned(4);
        return Number(bytes);
    }

    public async readNextLong(): Promise<bigint> {
        const bytes = await this.readNextSigned(8);
        return bytes;
    }
    // BUG: ^----------

    public async readNextFloat(): Promise<number> {
        const bytes = await this.waitForBytes(4);
        return Buffer.from(bytes).readFloatBE();
    }

    public async readNextDouble(): Promise<number> {
        const bytes = await this.waitForBytes(8);
        return Buffer.from(bytes).readDoubleBE();
    }

    public async readNextString(): Promise<string> {
        const length = await this.readNextVarInt();
        const bytes = await this.waitForBytes(length);
        return Buffer.from(bytes).toString("binary");
    }

    // TODO
    public async readNextTextComponent(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }
    // TODO
    public async readNextJSONTextComponent(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    public async readNextIdentifier(): Promise<Identifier> {
        const s = await this.readNextString();
        return Identifier.parse(s);
    }

    public async readNextVarInt(): Promise<number> {
        const bytes = await this.waitForMSBBytes();
        return Number(bigEndian(bytes, true));
    }

    public async readNextVarLong(): Promise<bigint> {
        const bytes = await this.waitForMSBBytes();
        return bigEndian(bytes, true);
    }

    // TODO
    public async readNextEntityMetadata(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    // TODO
    public async readNextSlot(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    // TODO
    public async readNextHashedSlot(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    // TODO
    public async readNextNBT(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    // TODO
    public async readNextPosition(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    public async readNextAngleRad(): Promise<number> {
        const byte = await this.waitForByte();
        return byte / 256 * Math.PI * 2;
    }

    public async readNextAngleDeg(): Promise<number> {
        const byte = await this.waitForByte();
        return byte / 256 * 360;
    }

    public async readNextUUID(): Promise<UUID> {
        const bytes = await this.waitForBytes(16);
        return new UUID(bytes);
    }

    // TODO
    public async readNextBitSet(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    // TODO
    public async readNextFixedBitSet(): Promise<void> {
        throw new TypeError("Not implemented yet");
    }

    // TODO more types soon

    public async readNextUnsigned(size: number): Promise<bigint> {
        const bytes = await this.waitForBytes(size);
        return bigEndian(bytes);
    }

    public async readNextSigned(size: number): Promise<bigint> {
        const bytes = await this.waitForBytes(size);
        const compliment = BigInt(bytes[0] >> 7) * (1n << (BigInt(size) * 8n));
        return bigEndian(bytes) - compliment;
    }

    public async waitForMSBBytes(): Promise<Uint8Array> {
        let buffer = [];
        let msb = -1;
        let data;

        do {
            data = await this.waitForByte();
            msb = data & 0b1000_0000;
            buffer.push(data & 0b0111_1111);
        } while (msb != 0);

        return new Uint8Array(buffer);
    }

    public async waitForBytes(count: number, timeout = 10_000): Promise<Uint8Array> {
        const buffer: number[] = [];

        while (buffer.length < count) {
            if (this._buffer.length > 0) {
                const take = Math.min(this._buffer.length, count - buffer.length);
                buffer.push(...this._buffer.splice(0, take));
            } else {
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        this.off("data", res);
                        rej(new BufferedReaderTimeoutError());
                    }, timeout);

                    this.once("data", res);
                });
            }
        }

        return new Uint8Array(buffer);
    }

    public async waitForByte(): Promise<number> {
        return new Promise(res => {
            if (this._buffer.length == 0) {
                this.once("data", () => {
                    res(this._buffer.shift()!);
                });
            } else {
                res(this._buffer.shift()!);
            }
        });
    }

    public async readAllBytes(): Promise<Uint8Array> {
        return new Uint8Array(this._buffer.splice(0));
    }

    public get readable() {
        return this._buffer.length != 0;
    }

    public get buffer(): Uint8Array {
        return new Uint8Array(this._buffer);
    }

    public close() {
        this.removeAllListeners();
    }

    public [Symbol.dispose]() {
        this.close();
    }
}

export class BufferedReaderTimeoutError extends Error {}

export class BufferedWriter {
    protected _buffers: Uint8Array[] = [];

    public writeBytes(bytes: Uint8Array) {
        this._buffers.push(bytes);
        return this;
    }

    public writeBoolean(value: boolean) {
        this._buffers.push(Uint8Array.of(value ? 1 : 0));
        return this;
    }

    public writeByte(value: number) {
        this._buffers.push(Uint8Array.of(value & 0x7f));
        return this;
    }

    public writeUnsignedByte(value: number) {
        this._buffers.push(Uint8Array.of(value & 0xff));
        return this;
    }
    
    public writeShort(value: number) {
        const buf = Buffer.alloc(2);
        buf.writeInt16BE(value);
        this._buffers.push(buf);
        return this;
    }

    public writeUnsignedShort(value: number) {
        const buf = Buffer.alloc(2);
        buf.writeUint16BE(value);
        this._buffers.push(buf);
        return this;
    }

    public writeInt(value: number) {
        const buf = Buffer.alloc(4);
        buf.writeInt32BE(value);
        this._buffers.push(buf);
        return this;
    }

    public writeTeleportFlags(flags: number) {
        const buf = Buffer.alloc(4);
        buf.writeUint32BE(flags);
        this._buffers.push(buf);
        return this;
    }

    public writeLong(value: bigint | number) {
        if (typeof value == "number") {
            value = BigInt(value);
        }

        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64BE(value);
        this._buffers.push(buffer);
        return this;
    }

    public writeFloat(value: number) {
        const buffer = Buffer.alloc(4);
        buffer.writeFloatBE(value);
        this._buffers.push(buffer);
        return this;
    }

    public writeDouble(value: number) {
        const buffer = Buffer.alloc(8);
        buffer.writeDoubleBE(value);
        this._buffers.push(buffer);
        return this;
    }

    public writeString(value: string): this {
        const buffer = Buffer.from(value, "utf8");
        this.writeVarInt(buffer.length);
        this._buffers.push(buffer);
        return this;
    }

    public writePosition(_: null) {
        return this;
    } // TODO;

    public writeIdentifier(vanillaName: string): this;
    public writeIdentifier(identifier: Identifier): this;
    public writeIdentifier(identifierOrVanillaName: Identifier | string): this {
        const identifier = (typeof identifierOrVanillaName == "string") ? Identifier.ofVanilla(identifierOrVanillaName) : identifierOrVanillaName;
        this.writeString(identifier.valueOf());
        return this;
    }

    public writeVarInt(value: number): this {
        if (value == 0) {
            this._buffers.push(Uint8Array.of(0b0));
        } else {
            const buffer: number[] = [];
            while (value != 0) {
                buffer.push((value & 0b111_1111) | 0b1000_0000);
                value >>= 7;
            }
            buffer[buffer.length - 1] = buffer[buffer.length - 1] & 0b0111_1111
            this._buffers.push(new Uint8Array(buffer));
        }
        return this;
    }

    public writeNBT(value: NBT.Compound): this {
        this._buffers.push(value.getBytes(true));
        return this;
    }

    public writeUUID(uuid: UUID): this {
        this._buffers.push(uuid.buffer);
        return this;
    }

    public writePrefixedOptional(present: boolean, writer: () => void = () => {}) {
        this.writeBoolean(present);
        if (present) {
            writer();
        }
        return this;
    }

    public writePrefixedArray(length: number, itemWriter: (index: number) => void = () => {}) {
        this.writeVarInt(length);
        for (let i = 0; i < length; i++) {
            itemWriter(i);
        }
        return this;
    }

    public writeGameProfile(profile: GameProfile): this {
        this.writeUUID(profile.uuid);
        this.writeString(profile.username);
        this.writePrefixedArray(1, () => {
            this.writeString("textures");
            this.writeString(profile.getBase64Data());
            this.writePrefixedOptional(false);
        });
        return this;
    }

    public get buffer() {
        return Buffer.concat(this._buffers);
    }
}