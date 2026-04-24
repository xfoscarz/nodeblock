import { Compression } from "@/Compression/compression";
import { bigEndian } from "@/Util";

export enum NBTTypes {
    END = 0,
    BYTE = 1,
    SHORT = 2,
    INT = 3,
    LONG = 4,
    FLOAT = 5,
    DOUBLE = 6,
    BYTE_ARRAY = 7,
    STRING = 8,
    LIST = 9,
    COMPOUND = 10,
    INT_ARRAY = 11,
    LONG_ARRAY = 12
};

type CompoundObject = { [name: string]: Item; };

type NBTEnd =            [ NBTTypes.END,        0 ];

type NBTByte =           [ NBTTypes.BYTE,       number ];
type NBTShort =          [ NBTTypes.SHORT,      number ];
type NBTInt =            [ NBTTypes.INT,        number ];
type NBTLong =           [ NBTTypes.LONG,       bigint ];
type NBTFloat =          [ NBTTypes.FLOAT,      number ];
type NBTDouble =         [ NBTTypes.DOUBLE,     number ];
type NBTString =         [ NBTTypes.STRING,     string ];

type NBTByteArray =      [ NBTTypes.BYTE_ARRAY, Int8Array ];
type NBTIntArray =       [ NBTTypes.INT_ARRAY,  Int32Array ];
type NBTLongArray =      [ NBTTypes.LONG_ARRAY, BigInt64Array ];

type NBTList
    <T extends NBT = any> =     [ NBTTypes.LIST, Item<T>[], T[0] ];
type NBTCompound =       [ NBTTypes.COMPOUND,   CompoundObject ];

type NBTGNum = NBTByte | NBTShort | NBTInt | NBTLong | NBTFloat | NBTDouble;
type NBTGSmallNum = Exclude<NBTGNum, NBTLong>;
type NBTGNumArray = NBTByteArray | NBTIntArray | NBTLongArray;

type GetNBTByType<T extends NBTTypes> = Extract<NBT, [T, ...any[]]>;
type GetNBTOf<T extends NBTTypes> = GetNBTByType<T>;
type GetValueOf<T extends NBTTypes> = GetNBTByType<T>[1];

type NBT = NBTEnd |
    NBTByte | NBTShort | NBTInt | NBTLong | NBTFloat | NBTDouble |
    NBTByteArray |
    NBTString |
    NBTList |
    NBTCompound |
    NBTIntArray | NBTLongArray;


type GetBytesMemoryOptions = { buffer: Uint8Array | number[], offset: number };
class Item<T extends NBT = NBT> {
    private _n: string | null = null;
    private _d: T;
    
    constructor(data: T, name: string = "") {
        this._n = name;
        this._d = data;
    }

    public get name(): string { return this._n || ""; }

    public get type(): T[0] { return this._d[0]; }
    public get value(): T[1] { return this._d[1]; }

    public get listType(): T[2] { return this._d[2]; }

    public valueOf() {
        return this.value;
    }

    public getBytes(network?: boolean, memOptions?: GetBytesMemoryOptions): Uint8Array;
    public getBytes(name?: string, memOptions?: GetBytesMemoryOptions): Uint8Array;
    public getBytes(nameOrNetwork?: string | boolean, memOptions?: GetBytesMemoryOptions): Uint8Array {
        if (!memOptions) memOptions = { buffer: [], offset: 0 };
        nameOrNetwork = nameOrNetwork === true ? true : nameOrNetwork || this.name;

        let bytes: Uint8Array;
        let headerBytes: Buffer;

        if (nameOrNetwork === true) {
            headerBytes = Buffer.alloc(1);
            headerBytes.writeInt8(this.type);
        } else {
            const nameBytes = ModifiedUTF8.toBytes(nameOrNetwork);
            headerBytes = Buffer.alloc(2 + nameBytes.length + 1);
            headerBytes.writeInt8(this.type);
            headerBytes.writeInt16BE(nameBytes.length, 1);
            headerBytes.set(nameBytes, 3);
        }
        
        switch (this.type) {
            case NBTTypes.BYTE:
            case NBTTypes.SHORT:
            case NBTTypes.INT:
            case NBTTypes.LONG:
            case NBTTypes.FLOAT:
            case NBTTypes.DOUBLE:
            case NBTTypes.STRING: {
                bytes = Buffer.concat([ getValueBytes(this.type, this.value) ]);
                break;
            }

            case NBTTypes.BYTE_ARRAY: {
                const lengthBytes = Buffer.alloc(4);
                const dataBytes = getValueBytes(this.type, this.value);
                lengthBytes.writeInt32BE(dataBytes.length);
                bytes = Buffer.concat([ lengthBytes, dataBytes ]);
                break;
            }
            case NBTTypes.INT_ARRAY: {
                const lengthBytes = Buffer.alloc(4);
                const dataBytes = getValueBytes(this.type, this.value);
                lengthBytes.writeInt32BE(dataBytes.length / 4);
                bytes = Buffer.concat([ lengthBytes, dataBytes ]);
                break;
            }
            case NBTTypes.LONG_ARRAY: {
                const lengthBytes = Buffer.alloc(4);
                const dataBytes = getValueBytes(this.type, this.value);
                lengthBytes.writeInt32BE(dataBytes.length / 8);
                bytes = Buffer.concat([ lengthBytes, dataBytes ]);
                break;
            }

            case NBTTypes.LIST: {
                bytes = getValueBytes(this.type, this.value, this.listType);
                break;
            }
            case NBTTypes.COMPOUND: {
                bytes = getValueBytes(this.type, this.value);
                break;
            }

            default: {
                bytes = new Uint8Array();
            }
        }

        bytes = Buffer.concat([ headerBytes, bytes ]);

        for (let i = memOptions.offset; i < memOptions.offset + bytes.length; i++) {
            memOptions.buffer[i] = bytes[i - memOptions.offset];
        }
        
        if (memOptions.buffer instanceof Uint8Array) {
            return memOptions.buffer;
        } else {
            return new Uint8Array(memOptions.buffer);
        }
    }

    public toJSON(): any {
        switch (this.type) {
            case NBTTypes.BYTE:
            case NBTTypes.SHORT:
            case NBTTypes.INT:
            case NBTTypes.LONG:
            case NBTTypes.FLOAT:
            case NBTTypes.DOUBLE:
            case NBTTypes.STRING: {
                return this.value;
            }
            
            case NBTTypes.BYTE_ARRAY:
            case NBTTypes.INT_ARRAY:
            case NBTTypes.LONG_ARRAY: {
                const data = this.value as NBTByteArray[1];
                return Array.from(data);
            }

            case NBTTypes.LIST: {
                const list = this.value as Item[];
                if (list.length === 0) {
                    return [];
                } else {
                    if ((list[0].type == NBTTypes.LIST) || (list[0].type == NBTTypes.COMPOUND)) {
                        return list.map(list => list.toJSON());
                    } else {
                        return list.slice(0);
                    }
                }
            }
            case NBTTypes.COMPOUND: {
                const data: Record<string, any> = {};
                const compoundData = this.value as CompoundObject;
                for (const name in compoundData) {
                    data[name] = compoundData[name].toJSON();
                }
                return data;
            }
        }
    }

    public toJSONString(spacing?: number) {
        return JSON.stringify(this.toJSON(), (k, v) => 
            (typeof v == "bigint") ? (JSON as any).rawJSON(v.toString()) : v
        , spacing);
    }
}

function getValueBytes(
    type: Exclude<NBTTypes, NBTTypes.LIST | NBTTypes.END>,
    data: any
): Uint8Array;
function getValueBytes(
    type: NBTTypes.LIST,
    data: any,
    listType: Exclude<NBTTypes, NBTTypes.END>
): Uint8Array;
function getValueBytes(type: Exclude<NBTTypes, NBTTypes.END>, data: any, listType?: Exclude<NBTTypes, NBTTypes.END>): Uint8Array {
    switch (type) {
        case NBTTypes.BYTE: {
            const buffer = Buffer.alloc(1);
            buffer.writeInt8(data, 0);
            return buffer;
        }
        case NBTTypes.SHORT: {
            const buffer = Buffer.alloc(2);
            buffer.writeInt16BE(data, 0);
            return buffer;
        }
        case NBTTypes.INT: {
            const buffer = Buffer.alloc(4);
            buffer.writeInt32BE(data, 0);
            return buffer;
        }
        case NBTTypes.LONG: {
            const buffer = Buffer.alloc(8);
            buffer.writeBigInt64BE(data, 0);
            return buffer;
        }
        case NBTTypes.FLOAT: {
            const buffer = Buffer.alloc(4);
            buffer.writeFloatBE(data, 0);
            return buffer;
        }
        case NBTTypes.DOUBLE: {
            const buffer = Buffer.alloc(8);
            buffer.writeDoubleBE(data, 0);
            return buffer;
        }
        case NBTTypes.STRING: {
            const bytes = ModifiedUTF8.toBytes(data);
            const buffer = Buffer.alloc(2 + bytes.length, bytes.length);
            buffer.writeInt16BE(bytes.length);
            buffer.set(bytes, 2);
            return buffer;
        }

        case NBTTypes.BYTE_ARRAY: {
            const list = data as NBTByteArray[1];
            const length = list.length;
            const buffer = Buffer.alloc(length);

            let i = 0;
            for (const byte of list) {
                buffer.writeInt8(byte, i);
                i += 1;
            }
            return buffer;
        }
        case NBTTypes.INT_ARRAY: {
            const list = data as NBTIntArray[1];
            const length = list.length * 4;
            const buffer = Buffer.alloc(length);

            let i = 0;
            for (const int of list) {
                buffer.writeInt32BE(int, i);
                i += 4;
            }
            return buffer;
        }
        case NBTTypes.LONG_ARRAY: {
            const list = data as NBTLongArray[1];
            const length = list.length * 8;
            const buffer = Buffer.alloc(length);

            let i = 0;
            for (const long of list) {
                buffer.writeBigInt64BE(long, i);
                i += 8;
            }
            return buffer;
        }

        case NBTTypes.COMPOUND: {
            const obj = data as CompoundObject;

            const endTagByte = Buffer.alloc(1);
            endTagByte.writeInt8(NBTTypes.END);

            const itemBuffers: Uint8Array[] = [];
            for (const itemName in obj) {
                itemBuffers.push(obj[itemName].getBytes(itemName));
            }

            return Buffer.concat([ ...itemBuffers, endTagByte ]);
        }
        case NBTTypes.LIST: {
            if (listType === undefined) throw new TypeError("Parameter listType not found while getting value types for TAG_List.");

            const list = data as NBTList<Exclude<NBT, NBTEnd>>[1];

            const lengthBytes = Buffer.alloc(4);
            lengthBytes.writeInt32BE(list.length);

            const itemBuffers: Uint8Array[] = [];

            if (list.length !== 0) {
                if (listType == NBTTypes.COMPOUND) {
                    for (const item of list) {
                        itemBuffers.push(getValueBytes(NBTTypes.COMPOUND, item));
                    }
                } else if (listType == NBTTypes.LIST) {
                    for (const item of list) {
                        itemBuffers.push(getValueBytes(NBTTypes.LIST, item.value, item.listType));
                    }
                } else {
                    for (const item of list) {
                        itemBuffers.push(getValueBytes(listType as any, item.value));
                    }
                }
            }

            const listTypeByte = Buffer.alloc(1);
            listTypeByte.writeInt8(listType);

            return Buffer.concat([ listTypeByte, lengthBytes, ...itemBuffers ]);
        }
        default: {
            return new Uint8Array();
        }
    }
}

class Reader {
    public static DEBUG: boolean = false;

    private _frames: Reader.Frame[] = [];
    private _bytesLeft = 0;
    private _offset = 0;
    private _result: Item<NBTCompound> | null = null;

    constructor(
        private _data: Uint8Array,
        public readonly network: boolean
    ) {}

    public get debugTab(): string {
        return "  ".repeat(this._frames.length);
    }

    private get _frame(): Reader.Frame {
        return this._frames.at(-1)!;
    }

    private _pop() {
        return this._frames.pop()!.item;
    }

    private _readLength() {
        return Number(bigEndian(this.readBytes(2)));
    }

    public readBytes(next: number): Buffer {
        const buffer = this.peek(next);
        this._setOffset(this._offset + next);
        return buffer;
    }

    public peek(next: number): Buffer {
        if (this._bytesLeft < next) throw new Error(`Malformed NBT. Unexpected data end.`);
        const buffer = Buffer.copyBytesFrom(this._data, this._offset, next);
        return buffer;
    }
    
    public readString() {
        const length = this._readLength();
        const string = ModifiedUTF8.fromBytes(this.readBytes(length));
        return string;
    }

    private _setOffset(value: number) {
        this._offset = value;
        this._bytesLeft = this._data.byteLength - this._offset;
    }

    public readItem(type: Exclude<NBTTypes, NBTTypes.END | NBTTypes.LIST | NBTTypes.COMPOUND>): Item {
        switch (type) {
            case NBTTypes.BYTE: {
                const value = this.readBytes(1).readInt8();
                return NBT.byte(value);
            }
            case NBTTypes.SHORT: {
                const value = this.readBytes(2).readInt16BE();
                return NBT.short(value);
            }
            case NBTTypes.INT: {
                const value = this.readBytes(4).readInt32BE();
                return NBT.int(value);
            }
            case NBTTypes.LONG: {
                const value = this.readBytes(8).readBigInt64BE();
                return NBT.long(value);
            }
            case NBTTypes.FLOAT: {
                const value = this.readBytes(4).readFloatBE();
                return NBT.float(value);
            }
            case NBTTypes.DOUBLE: {
                const value = this.readBytes(8).readDoubleBE();
                return NBT.double(value);
            }
            case NBTTypes.BYTE_ARRAY: {
                const length = this.readBytes(4).readInt32BE();
                const buffer = new Int8Array(length);
                for (let i = 0; i < length; i++) {
                    buffer[i] = this.readBytes(1).readInt8();
                }
                return NBT.byteArray(buffer);
            }
            case NBTTypes.STRING: {
                const value = this.readString();
                return NBT.string(value);
            }
            case NBTTypes.INT_ARRAY: {
                const length = this.readBytes(4).readInt32BE();
                const buffer = new Int32Array(length);
                for (let i = 0; i < length; i++) {
                    buffer[i] = this.readBytes(4).readInt32BE();
                }
                return NBT.intArray(buffer);
            }
            case NBTTypes.LONG_ARRAY: {
                const length = this.readBytes(4).readInt32BE();
                const buffer = new BigInt64Array(length);
                for (let i = 0; i < length; i++) {
                    buffer[i] = this.readBytes(8).readBigInt64BE();
                }
                return NBT.longArray(buffer);
            }
        }
    }

    public addFrame(type: NBTTypes.LIST | NBTTypes.COMPOUND, name: string = "") {
        this._frames.push(new Reader.Frame(this, type, name));
    }

    private _next() {
        let type: NBTTypes;

        if (this._frames.length === 0) {
            type = this.readBytes(1)[0];

            if (type == NBTTypes.COMPOUND) {
                const name = this.network ? "" : this.readString();
                this.addFrame(type, name);

                if (Reader.DEBUG) {
                    console.log(`root${name}`);
                }
            } else {
                throw new Error("Malformed nbt. Expected root tag type to be TAG_Compound.");
            }
            return;
        }
        
        if (this._frame.ended) {
            const item = this._pop();

            if (this._frames.length === 0) {
                this._result = item as Item<NBTCompound>;

                if (Reader.DEBUG) console.log("end root");
            } else {
                this._frame.addItem(item, item.name);

                if (Reader.DEBUG) console.log(`${this.debugTab}end ${item.name}`);
            }
            return;
        }

        type = this._frame.readNextType();
        this._frame.next(type);
    }
    
    public async parse(): Promise<Item<NBTCompound>> {
        this._data = await Compression.unzipIfNeeded(this._data);
        this._setOffset(0);
        
        while (this._bytesLeft > 0 && this._result === null) {
            this._next();
        }

        if (this._result === null) {
            throw new Error("Malformed NBT. Failed to parse root compound.");
        }

        return this._result;
    }   
}

namespace Reader {
    export class Frame {
        private _obj: CompoundObject = {};
        private _list: Item[] = [];
        private _lengthRemain: number = -1;
        private _listType!: NBTTypes;

        constructor(
            private readonly _reader: Reader,
            public readonly type: NBTTypes.COMPOUND | NBTTypes.LIST,
            public readonly name: string
        ) {
            if (this.isList) {
                const initializationBuffer = _reader.readBytes(5);
                this._listType = initializationBuffer.at(0)!;
                this._lengthRemain = initializationBuffer.readInt32BE(1);
            }
        }

        private get _tab() {
            return this._reader.debugTab;
        }

        public get ended() {
            if (this.isList) {
                return this._lengthRemain === 0;
            } else {
                const end = this._reader.peek(1)[0] == NBTTypes.END;
                if (end) {
                    this._reader.readBytes(1);
                    return true;
                } else {
                    return false;
                }
            }
        }

        public get isList() {
            return this.type == NBTTypes.LIST;
        }

        public addItem(item: Item, name: string) {
            if (this.isList) {
                this._list.push(item);
            } else {
                this._obj[name] = item;
            }
        }

        public next(type: Exclude<NBTTypes, NBTTypes.END>) {
            const isFrameType = ((type): type is NBTTypes.COMPOUND | NBTTypes.LIST => type == NBTTypes.COMPOUND || type == NBTTypes.LIST)(type);

            let name = "";
            if (this.isList) {
                this._lengthRemain--;
            } else {
                name = this._reader.readString();
            }

            if (isFrameType) {
                if (Reader.DEBUG) console.log(`${this._tab}${type == NBTTypes.COMPOUND ? "compound" : "list"} ${name}`);
                this._reader.addFrame(type, name);
                return;
            }

            const item = this._reader.readItem(type);
            this.addItem(item, name);

            if (Reader.DEBUG) {
                if (this.isList) {
                    console.log(`${this._tab}list-item`, item.value);
                } else {
                    console.log(`${this._tab}${name} =`, item.value);
                }
            }
        }

        public readNextType(): Exclude<NBTTypes, NBTTypes.END> {
            if (this.isList) {
                return this._listType as never;
            } else {
                return this._reader.readBytes(1)[0];
            }
        }

        public get item(): Item<NBTCompound> | Item<NBTList<any>> {
            if (this.isList) {
                return NBT.list(this._list as Item<any>[], this._listType, this.name);
            } else {
                return NBT.compound(this._obj, this.name);
            }
        }
    }
}

export namespace NBT {
    export type Compound = Item<NBTCompound>;

    function num<T extends NBTGSmallNum[0]>(type: T) {
        type NBTNumType = Extract<NBTGSmallNum, [T, any]>;
        return (value: number = 0): Item<NBTNumType> => new Item([ type, value ] as NBTNumType);
    }

    function numArray<T extends NBT>(type: T[0], ArrayConstructor: Int8ArrayConstructor | Int32ArrayConstructor | BigInt64ArrayConstructor) {
        const bigInt = ((ArrayConstructor: Int8ArrayConstructor | Int32ArrayConstructor | BigInt64ArrayConstructor): ArrayConstructor is BigInt64ArrayConstructor => ArrayConstructor == BigInt64Array)(ArrayConstructor);
        return (value: Iterable<number | bigint> = []): Item<T> => {
            let buffer: NBTGNumArray[1]

            if ("length" in value) {
                buffer = new ArrayConstructor(value.length as number);
                let i = 0;
                if (bigInt) for (const n of value) buffer[i++] = BigInt(n);
                else for (const n of value) buffer[i++] = Number(n);
            } else {
                const data = Array.from(value);

                if (bigInt) buffer = new ArrayConstructor(data.map(n => BigInt(n)));
                else buffer = new ArrayConstructor(data.map(n => Number(n)));
            }
            return new Item([ type, buffer ] as T);
        };
    }

    export function byte(value: number = 0) { return num(NBTTypes.BYTE)(value) };
    export function short(value: number = 0) { return num(NBTTypes.SHORT)(value); }
    export function int(value: number = 0) { return num(NBTTypes.INT)(value); }
    export function long(value: bigint | number = 0) { return new Item([ NBTTypes.LONG, BigInt(value) ]); }
    export function float(value: number = 0) { return num(NBTTypes.FLOAT)(value); }
    export function double(value: number = 0) { return num(NBTTypes.DOUBLE)(value); }

    export function byteArray(value: Iterable<number | bigint> = []) { return numArray(NBTTypes.BYTE_ARRAY, Int8Array)(value); }
    export function intArray(value: Iterable<number | bigint> = []) { return numArray(NBTTypes.INT_ARRAY, Int32Array)(value); }
    export function longArray(value: Iterable<number | bigint> = []) { return numArray(NBTTypes.LONG_ARRAY, BigInt64Array)(value); }

    export function string(value: string = "") { return new Item([ NBTTypes.STRING, value ]); }
    
    export const compound = (value: CompoundObject = {}, name: string = ""): Item<NBTCompound> => {
        for (const name in value) {
            (value[name] as any)._n = name;
        }
        return new Item([ NBTTypes.COMPOUND, value ], name);
    }

    export function list<T extends NBTTypes>(
        values?: Item<GetNBTOf<T>>[],
        type?: T,
        name?: string,
    ): Item<NBTList<GetNBTOf<T>>>;
    export function list<T extends NBTTypes>(
        values?: GetValueOf<T>[],
        type?: T,
        name?: string,
    ): Item<NBTList<GetNBTOf<T>>>;
    export function list<T extends NBTTypes>(
        values: Item<GetNBTOf<T>>[] | GetValueOf<T>[] = [],
        type?: T,
        name: string = "",
    ): Item<NBTList<GetNBTOf<T>>> {
        let listType: NBTTypes;

        if (values.length === 0) {
            listType = (type === undefined) ? NBTTypes.END as T : type;
            return new Item([NBTTypes.LIST, [], listType]) as Item<NBTList>;
        }

        if (values[0] instanceof Item) {
            listType = values[0].type as T;
            
            return new Item([
                NBTTypes.LIST,
                values,
                listType
            ] as NBTList<GetNBTOf<T>>, name);
        } else {
            if (type === undefined) {
                if (typeof values[0] == "string") {
                    listType = NBTTypes.STRING;
                } else throw new Error("List type must be explicit for an NBT.list of primitives.");
            } else {
                listType = type;
            }
        }

        return new Item([
            NBTTypes.LIST,
            values as GetValueOf<T>[],
            listType
        ] as NBTList<GetNBTOf<T>>, name);
    }

    export async function parse(raw: Uint8Array, network: boolean = false): Promise<Item<NBTCompound>> {
        return await new Reader(raw, network).parse();
    }
}

export namespace ModifiedUTF8 {
    const RANGES = [
        0,
        0b01111111,          // TOTAL 1: 7 bits
        0b11111_111111,      // TOTAL 2: 5 + 6 bits
        0xffff,              // TOTAL 3: 4 + 6 + 6 bits
        0xffff               // TOTAL 3: 4 + 6 + 6 bits
    ];

    const BYTES = {
        CONTINUATION:    0b10_000000,
        START_2:         0b110_00000,
        START_3:         0b1110_0000,
        HI_SURROGATE:    0b110110 << 10,
        LO_SURROGATE:    0b110111 << 10
    };

    function start2(value: number): Uint8Array {
        return new Uint8Array([
            (value >> 6) | BYTES.START_2,
            (value & 0b111_111) | BYTES.CONTINUATION
        ]);
    }

    function start3(value: number): Uint8Array {
        return new Uint8Array([
            (value >> 12) | BYTES.START_3,
            ((value >> 6) & 0b111_111) | BYTES.CONTINUATION,
            (value & 0b111_111) | BYTES.CONTINUATION
        ]);
    }

    export function toBytes(value: string): Uint8Array {
        const buffer: number[] = [];

        for (const c of value) {
            const char = c.codePointAt(0)!;

            if (char === 0) {
                buffer.push(BYTES.START_2, BYTES.CONTINUATION);
                continue;
            }

            if (char <= RANGES[1]) {
                buffer.push(char);
            } else if (char <= RANGES[2]) {
                buffer.push(...start2(char));
            } else if (char <= RANGES[3]) {
                buffer.push(...start3(char));
            } else {
                const normalized = char - (0xffff + 1);
                const [ hi, lo ] = [ normalized >> 10, (normalized & 0b11111_11111) ];
                buffer.push(...start3(hi | BYTES.HI_SURROGATE));
                buffer.push(...start3(lo | BYTES.LO_SURROGATE));
            }
        }
        return Buffer.from(buffer);
    }

    export function fromBytes(value: Uint8Array): string {
        let result = "";

        let pointer = 0;
        while (pointer < value.byteLength) {
            const byte = value[pointer];
            let codePoint = 0;

            if (byte <= RANGES[1]) {
                codePoint = byte;
            } else {
                if ((byte & 0b11110000) == BYTES.START_3) {
                    const bytes = value.subarray(pointer, pointer + 3);
                    if (bytes.length != 3) {
                        throw new Error("Malformed modified utf8 string");
                    } else {
                        if (
                            ((bytes[1] & 0b1100_0000) != BYTES.CONTINUATION) ||
                            ((bytes[2] & 0b1100_0000) != BYTES.CONTINUATION)
                        ) {
                            throw new Error("Malformed modified utf8 string");
                        }
                        codePoint += (bytes[0] & 0b1111) << 12;
                        codePoint += (bytes[1] & 0b111111) << 6;
                        codePoint += bytes[2] & 0b111111;
                    }

                    pointer += 2;
                } else if ((byte & 0b11100000) == BYTES.START_2) {
                    const bytes = value.subarray(pointer, pointer + 2);
                    if (bytes.length != 2) {
                        throw new Error("Malformed modified utf8 string");
                    } else {
                        if (((bytes[1] & 0b1100_0000) != BYTES.CONTINUATION)) {
                            throw new Error("Malformed modified utf8 string");
                        }
                        codePoint += (bytes[0] & 0b11111) << 6;
                        codePoint += bytes[1] & 0b111111;
                    }
                    pointer++;
                } else {
                    throw new Error("Malformed modified utf8 string");
                }
            }
            pointer++;
            
            result += String.fromCodePoint(codePoint);
        }

        return result;
    }
}