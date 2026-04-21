import zlib from "node:zlib";

export namespace Compression {
    export async function unzipIfNeeded(raw: Uint8Array): Promise<Uint8Array> {
        return new Promise(res => {
            zlib.unzip(raw, (error, buffer) => {
                if (error) {
                    if ("code" in error) {
                        if (error.code == "Z_DATA_ERROR") {
                            res(raw);
                        }
                    } else throw error;
                }
                res(buffer);
            });
        });
    }
}