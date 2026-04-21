import { printBytes } from "../../Debug";

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
        let s = "";

        let i = 0;
        while (i < value.byteLength) {
            const byte = value[i];
            let codePoint = 0;

            if (byte <= RANGES[1]) {
                codePoint = byte;
            } else {
                if ((byte & 0b11110000) == BYTES.START_3) {
                    const bytes = value.subarray(i, i + 3);
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

                    i += 2;
                } else if ((byte & 0b11100000) == BYTES.START_2) {
                    const bytes = value.subarray(i, i + 2);
                    if (bytes.length != 2) {
                        throw new Error("Malformed modified utf8 string");
                    } else {
                        if (((bytes[1] & 0b1100_0000) != BYTES.CONTINUATION)) {
                            throw new Error("Malformed modified utf8 string");
                        }
                        codePoint += (bytes[0] & 0b11111) << 6;
                        codePoint += bytes[1] & 0b111111;
                    }
                    i++;
                } else {
                    throw new Error("Malformed modified utf8 string");
                }
            }
            i++;
            
            s += String.fromCodePoint(codePoint);
        }

        return s;
    }
}