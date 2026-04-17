/*

import { createNumber } from "../Util";

enum NBTTypes {
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

type NBTEnd = 0;
type NBTByte = [ NBTTypes.BYTE, number ];
type NBTShort = [ NBTTypes.SHORT, number ];
type NBTInt = [ NBTTypes.INT, number ];
type NBTLong = [ NBTTypes.LONG, number ];
type NBTFloat = [ NBTTypes.FLOAT, number ];
type NBTDouble = [ NBTTypes.DOUBLE, number ];
type NBTByteArray = [ NBTTypes.BYTE_ARRAY, number[] ];
type NBTString = string;
type NBTList = [ NBTTypes.LIST, NBTTypes, number, NBT[] ];
type NBTCompound = { [name: string]: NBT; };
type NBTIntArray = [ NBTTypes.INT_ARRAY, number, number[] ];
type NBTLongArray = [ NBTTypes.LONG_ARRAY, number, number[] ];

type NBT = NBTEnd |
    NBTByte | NBTShort | NBTInt | NBTLong | NBTFloat | NBTDouble |
    NBTByteArray |
    NBTString |
    NBTList |
    NBTCompound |
    NBTIntArray | NBTLongArray;

type JSONNBT = {
    [name: string]: JSONNBT[] | number | number[] | string | string[]
};

export namespace NBT {
    class View {
        private _buffer: NBTCompound = {};
        private _json: JSONNBT = {};

        public get nbt() { return this._buffer; }
        public get json() { return this._json; }
    }

    function readInt(buffer: Uint8Array, start: number, size: number) {
        return createNumber(buffer.slice(start, start + size));
    }

    function readString(buffer: Uint8Array, start: number): string {
        buffer
    }

    export function parse(buffer: Uint8Array): View {
        let data = {};
        let pointer = 0;

        return data;
    }
}


*/