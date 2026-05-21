const RESET_COLOR = "\x1b[0m";

const DATA_COLOR = "\x1b[33m";
const LABEL_COLOR = "\x1b[34m";
export function printBuffer(chunk: Iterable<number>, label: string = "") {
    let s: string[] = [];
    for (const b of chunk) {
        const a = b.toString(16);
        s.push("0".repeat(2 - a.length) + a);
    }
    Log.info(LABEL_COLOR + label + RESET_COLOR + (s.length == 0 ? "<no data>" : (DATA_COLOR + s.join(" "))) + RESET_COLOR);
    return chunk;
}

export function printBytes(chunk: Iterable<number>, label: string = "") {
    let s: string[] = [];
    for (const b of chunk) {
        const a = b.toString(2);
        s.push("0".repeat(8 - a.length) + a);
    }
    Log.info(LABEL_COLOR + label + RESET_COLOR + (s.length == 0 ? "<no data>" : (DATA_COLOR + s.join(" "))) + RESET_COLOR);
    return chunk;
}

export namespace Log {
    const TIME_COLOR = "\x1b[2m";
    function time(): string {
        return `${TIME_COLOR}${new Date().toISOString()}${RESET_COLOR}`;
    }

    const INFO_COLOR = "\x1b[36m";
    export function info(...args: any[]) {
        console.log(`${time()} ${INFO_COLOR}INFO[${process.pid}]:${RESET_COLOR}`, ...args)
    }
    
    const ERROR_COLOR = "\x1b[31m";
    export function error(...args: any[]) {
        console.error(`${time()} ${ERROR_COLOR}ERROR[${process.pid}]:${RESET_COLOR}`, ...args);
    }

    const WARN_COLOR = "\x1b[33m";
    export function warn(...args: any[]) {
        console.warn(`${time()} ${WARN_COLOR}WARN[${process.pid}]:${RESET_COLOR}`, ...args);
    }
}
