export type ListOfAtLeastOne<T> = [ T, ...T[] ];
export type StringContaining<T extends string> = `${string}${T}${string}`;
export type IdentifierOrTag<ID extends string, Tag extends string> = ID | Tag | (ID | ID[] | Tag)[];
export type EnumString<T extends string> = (string & {}) | T;

export function bigEndian(chunk: Iterable<number>, msb: boolean = false): bigint {
    const size = msb ? 7n : 8n;
    let value = 0n;

    for (const byte of chunk) {
        value <<= size;
        value += BigInt(byte);
    }

    return value;
}

export function toBase64(value: string): string {
    return Buffer.from(value, "binary").toString("base64");
}

export function fromBase64(value: string): string {
    return Buffer.from(value, "base64").toString("binary");
}

export async function wait(millis: number): Promise<void> {
    return new Promise(res => setTimeout(() => res(), millis));
}

export function capitalize(s: string): string {
    return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

export function getBitsAt(data: number, ...indices: number[]): number[] {
    return indices.map(index => getBitAt(data, index));
}

export function getBitAt(data: number, index: number) {
    return (data >> (index - 1)) & 1;
}

export function setBitArray(...bits: boolean[]) {
    return bits.reduce((n, bit) => (n << 1) + (bit ? 1 : 0), 0);
}