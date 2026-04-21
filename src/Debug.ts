const RESET_COLOR = "\x1b[0m";

const DATA_COLOR = "\x1b[33m";
const LABEL_COLOR = "\x1b[34m";
export function printBuffer(chunk: Iterable<number>, label: string = "") {
    let s: string[] = [];
    for (const b of chunk) {
        const a = b.toString(16);
        s.push("0".repeat(2 - a.length) + a);
    }
    console.log(LABEL_COLOR + label + RESET_COLOR + (s.length == 0 ? "<no data>" : (DATA_COLOR + s.join(" "))) + RESET_COLOR);
    return chunk;
}

export function printBytes(chunk: Iterable<number>, label: string = "") {
    let s: string[] = [];
    for (const b of chunk) {
        const a = b.toString(2);
        s.push("0".repeat(8 - a.length) + a);
    }
    console.log(LABEL_COLOR + label + RESET_COLOR + (s.length == 0 ? "<no data>" : (DATA_COLOR + s.join(" "))) + RESET_COLOR);
    return chunk;
}

const INFO_COLOR = "\x1b[36m";
export function info(message: string) {
    console.log(`${INFO_COLOR}INFO:${RESET_COLOR} ${message}`)
}

const ERROR_COLOR = "\x1b[31m";
export function error(o: any) {
    console.error(`${ERROR_COLOR}ERROR: ${RESET_COLOR}${o}`);
}

export namespace HTMLLogger {
    export function serverbound(chunk: Uint8Array) {}

    export function clientbound(payload: Uint8Array) {}

    export function completePacket(size: number, packetID: number, data: Uint8Array) {}
}