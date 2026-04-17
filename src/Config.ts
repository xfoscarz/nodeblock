import fs from "fs"
import path from "path"

export namespace Config {
    export const ROOT_FOLDER = "./Config";

    export function getFile(filePath: string): Uint8Array {
        const data = fs.readFileSync(path.join(ROOT_FOLDER, filePath));
        return data;
    }
}