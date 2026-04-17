import zlib from "node:zlib";

export namespace GZip {
    export async function unzip(buffer: Uint8Array): Promise<Uint8Array> {
        return new Promise(res => {
            zlib.unzip(buffer, (error, buffer) => {
                res(buffer);
            })
        });
    }
}