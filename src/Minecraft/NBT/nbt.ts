import { Compression } from "../../Compression/compression";
import { bigEndian } from "../../Util";
import { ModifiedUTF8 } from "./modifiedUTF8";

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

export namespace NBT {
    type ListableTypes = Exclude<NBTTypes, NBTTypes.END | NBTTypes.LIST | NBTTypes.COMPOUND>;


    type CompoundObject = { [name: string]: Item; };


    export type NBTEnd =            [ NBTTypes.END,        0 ];

    export type NBTByte =           [ NBTTypes.BYTE,       number ];
    export type NBTShort =          [ NBTTypes.SHORT,      number ];
    export type NBTInt =            [ NBTTypes.INT,        number ];
    export type NBTLong =           [ NBTTypes.LONG,       bigint ];
    export type NBTFloat =          [ NBTTypes.FLOAT,      number ];
    export type NBTDouble =         [ NBTTypes.DOUBLE,     number ];
    type NBTNum = NBTByte | NBTShort | NBTInt | NBTLong | NBTFloat | NBTDouble;
    type NBTSmallNum = Exclude<NBTNum, NBTLong>;

    export type NBTByteArray =      [ NBTTypes.BYTE_ARRAY, Int8Array ];
    export type NBTString =         [ NBTTypes.STRING,     string ];
    export type NBTList
        <T extends NBT = any> =     [ NBTTypes.LIST,       T[1][], T[0] ];
    export type NBTCompound =       [ NBTTypes.COMPOUND,   CompoundObject ];

    export type NBTIntArray =       [ NBTTypes.INT_ARRAY,  Int32Array ];
    export type NBTLongArray =      [ NBTTypes.LONG_ARRAY, BigInt64Array ];
    type NBTNumArray = NBTByteArray | NBTIntArray | NBTLongArray;


    function num<T extends NBTSmallNum[0]>(type: T) {
        type NBTNumType = Extract<NBTSmallNum, [T, any]>;
        return (value: number = 0): Item<NBTNumType> => new Item([ type, value ] as NBTNumType);
    }

    function numArray<T extends NBTNumArray[0]>(type: T, ArrayConstructor: (new( arg: any ) => any)) {
        return (value: Iterable<bigint> | Iterable<number> = []): Item<NBTNumArray> => {
            const bigInt = ArrayConstructor === BigInt64Array;
            let buffer: Int8Array | BigInt64Array;
            if ("length" in value) {
                buffer = new ArrayConstructor(value.length as number);
                let i = 0;
                if (bigInt) {
                    for (const n of value) buffer[i++] = BigInt(n);
                } else {
                    for (const n of value) buffer[i++] = Number(n);
                }
            } else {
                const data: (number | bigint)[] = [];
                if (bigInt) {
                    for (const n of value) data.push(BigInt(n));
                } else {
                    for (const n of value) data.push(Number(n));
                }
                buffer = new ArrayConstructor(data);
            }
            return new Item([ type as any, buffer as any ]);
        }
    }

    export const byte = num(NBTTypes.BYTE);
    export const short = num(NBTTypes.SHORT);
    export const int = num(NBTTypes.INT);
    export const long = (value: bigint | number): Item<NBTLong> => new Item([ NBTTypes.LONG, BigInt(value) ]);
    export const float = num(NBTTypes.FLOAT);
    export const double = num(NBTTypes.DOUBLE);

    export const byteArray = numArray(NBTTypes.BYTE_ARRAY, Int8Array);
    export const string = (value: string = ""): Item<NBTString> => new Item([ NBTTypes.STRING, value ]);
    
    type NBTByType<K extends NBT[0]> = Extract<NBT, [K, ...any[]]>;
    type NBTOf<T extends NBTTypes> = NBTByType<T>;
    type ValueOf<T extends NBTTypes> = NBTByType<T>[1];
    
    export function list<T extends NBTTypes>(
        values?: Item<NBTOf<T>>[],
        type?: T,
        name?: string,
    ): Item<NBTList<NBTOf<T>>>;

    export function list<T extends NBTTypes>(
        values?: ValueOf<T>[],
        type?: T,
        name?: string,
    ): Item<NBTList<NBTOf<T>>>;

    export function list<T extends NBTTypes>(
        values: Item<NBTOf<T>>[] | ValueOf<T>[] = [],
        type?: T,
        name: string = "",
    ): Item<NBTList<NBTOf<T>>> {
        let listType: T;

        if (values.length === 0) {
            listType = (type === undefined) ? NBTTypes.END as T : type;
            return new Item([NBTTypes.LIST, [], listType] as NBTList<NBTOf<T>>, name);
        }

        if (values[0] instanceof Item) {
            listType = values[0].type as T;

            if (values[0].type != NBTTypes.LIST && values[0].type != NBTTypes.COMPOUND) {
                return new Item([
                    NBTTypes.LIST,
                    values.map(v => (v as Item<NBTOf<T>>).value) as ValueOf<T>[],
                    listType
                ] as NBTList<NBTOf<T>>, name);
            }
        }

        listType = type || NBTTypes.END as T;

        return new Item([
            NBTTypes.LIST,
            values as ValueOf<T>[],
            listType
        ] as NBTList<NBTOf<T>>, name);
    }
    export const compound = (value: CompoundObject = {}, name: string = ""): Item<NBTCompound> => {
        for (const name in value) {
            (value[name] as any)._n = name;
        }
        return new Item([ NBTTypes.COMPOUND, value ], name);
    }

    export const intArray = numArray(NBTTypes.INT_ARRAY, Int32Array);
    export const longArray = numArray(NBTTypes.LONG_ARRAY, BigInt64Array);

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

        public getBytes(network: false): Uint8Array;
        public getBytes(name: string): Uint8Array;
        public getBytes(nameOrNetwork: string | false = ""): Uint8Array {
            return new Uint8Array();
        }

        public valueOf() {
            return this.value;
        }

        public toJSON(): Record<string, any> {
            let obj = {};

            switch (this.type) {
                case NBTTypes.BYTE:
                case NBTTypes.SHORT:
                case NBTTypes.INT:
                case NBTTypes.LONG:
                case NBTTypes.FLOAT:
                case NBTTypes.DOUBLE:
                case NBTTypes.STRING: {
                    obj = this.value;
                    break;
                }
                
                case NBTTypes.BYTE_ARRAY:
                case NBTTypes.INT_ARRAY:
                case NBTTypes.LONG_ARRAY: {
                    const data = this.value as NBTByteArray[1];
                    obj = Array.from(data);
                    break;
                }

                case NBTTypes.LIST: {
                    const list = this.value as Item[];
                    if (list.length === 0) {
                        obj = [];
                    } else {
                        if ((list[0].type == NBTTypes.LIST) || (list[0].type == NBTTypes.COMPOUND)) {
                            obj = list.map(list => list.toJSON());
                        } else {
                            obj = list;
                        }
                    }
                    break;
                }
                case NBTTypes.COMPOUND: {
                    const data: Record<string, any> = {};
                    const compoundData = this.value as CompoundObject;
                    for (const name in compoundData) {
                        data[name] = compoundData[name].toJSON();
                    }
                    obj = data;
                    break;
                }
            }

            return obj;
        }
    }

    export async function parse(raw: Uint8Array, network: boolean = false): Promise<Item<NBTCompound>> {
        return await new Reader(raw, network).parse();
    }

    class Frame {
        private _obj: CompoundObject = {};
        private _list: Item[] = [];
        private _lengthRemain: number = -1;
        private _listType!: ListableTypes;

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

        public next(type: NBTTypes) {
            const isFrameType = type == NBTTypes.COMPOUND || type == NBTTypes.LIST;

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

            const item = this._reader.readItem(type as ListableTypes);
            this.addItem(item, name);

            if (Reader.DEBUG) {
                if (this.isList) {
                    console.log(`${this._tab}list-item`, item.value);
                } else {
                    console.log(`${this._tab}${name} =`, item.value);
                }
            }
        }

        public readNextType(): NBTTypes {
            if (this.isList) {
                return this._listType;
            } else {
                return this._reader.readBytes(1)[0];
            }
        }

        public get item(): Item<NBTCompound> | Item<NBTList<any>> {
            if (this.isList) {
                return NBT.list(this._list as NBTList, this._listType, this.name);
            } else {
                return NBT.compound(this._obj, this.name);
            }
        }
    }

    class Reader {
        public static DEBUG: boolean = false;

        private _frames: Frame[] = [];
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

        private get _frame(): Frame {
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

        public readItem(type: ListableTypes): Item {
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
                    const buffer = new Int32Array();
                    for (let i = 0; i < length; i++) {
                        buffer[i] = this.readBytes(4).readInt32BE();
                    }
                    return NBT.intArray(buffer);
                }
                case NBTTypes.LONG_ARRAY: {
                    const length = this.readBytes(4).readInt32BE();
                    const buffer = new BigInt64Array();
                    for (let i = 0; i < length; i++) {
                        buffer[i] = this.readBytes(8).readBigInt64BE();
                    }
                    return NBT.longArray(buffer);
                }
            }
            throw new Error(`Malformed nbt. Unknown tag id ${type}.`);
        }

        public addFrame(type: NBTTypes.LIST | NBTTypes.COMPOUND, name: string = "") {
            this._frames.push(new Frame(this, type, name));
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
}

type NBT = NBT.NBTEnd |
    NBT.NBTByte | NBT.NBTShort | NBT.NBTInt | NBT.NBTLong | NBT.NBTFloat | NBT.NBTDouble |
    NBT.NBTByteArray |
    NBT.NBTString |
    NBT.NBTList |
    NBT.NBTCompound |
    NBT.NBTIntArray | NBT.NBTLongArray;