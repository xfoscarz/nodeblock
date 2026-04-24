import esbuild from "esbuild"
import fs from "fs"
import path from "path"

const webConfig = {
    in: "./Web/dist",
    out: "./Generated/web-distribution.auto.ts"
}

const barrelConfig: Record<string, { directories: string[], default: boolean, named: boolean }> = {
    "./src/Network/Packets.barrel.ts": {
        "directories": [
            "./src/Network/Packets/Clientbound",
            "./src/Network/Packets/Serverbound"
        ],
        "default": true,
        "named": false
    },
    "./src/Network/States.barrel.ts": {
        "directories": [
            "./src/Network/States",
        ],
        "default": true,
        "named": false
    }
}

const esbuildConfig: import("esbuild").BuildOptions = {
    // bundling
    entryPoints: [ "src/index.ts" ],
    bundle: true,
    sourcemap: "linked",
    minify: !process.argv.includes("-m"),
    outfile: "dist/index.js",

    // jsx
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
    loader: { ".ts": "tsx" },

    // libs
    platform: "node",
    target: "node14",
}

const AUTO_GENERATE_HEADER = "// Auto-generated: Do not modify\n";

function writeToPanelOut(data: string) {
    fs.appendFileSync(webConfig.out, data);
}

function normalizePath(filepath: string) {
    return filepath.replaceAll(path.sep, "/");
}

async function transformWeb(inFolder: string) {
    const prefix = normalizePath(path.join(webConfig.in));
    const children = fs.readdirSync(inFolder);

    let indexFiles: string[] = [];

    for (const child of children) {
        const childPath = path.join(inFolder, child);
        
        if (fs.statSync(childPath).isDirectory()) {
            indexFiles.push(...await transformWeb(childPath));
        } else {
            const data = fs.readFileSync(childPath, { "encoding": "base64" });
            let key = normalizePath(childPath).slice(prefix.length);
            
            const format = 40;
            const line = [ childPath, `\x1b[0m-> \x1b[32m"${key}"\x1b[0m` ]
            if (line[0].length > format) {
                line[0] = "..." + childPath.slice(line[0].length - format + 3);
            }
            console.log(`\x1b[2m${line.join(" ".repeat(Math.max(0, format - line[0].length) + 1))}\x1b[0m`);
            
            if (child.toLowerCase() == "index.html") {
                indexFiles.push(key);
            }

            writeToPanelOut("    // @ts-ignore\n");
            writeToPanelOut(`    "${key}": Buffer.from("${data}", "base64"),\n`);
        }
    }

    return indexFiles;
}

async function barrelDirectories(out: string, directories: string[], defaults: boolean, named: boolean) {
    const write = (line: string) => fs.appendFileSync(out, line);

    fs.writeFileSync(out, AUTO_GENERATE_HEADER);

    for (const directory of directories) {
        let directoryRelative = path.posix.relative(path.posix.dirname(out), directory);

        write("\n// " + directoryRelative + "\n");
        
        for (const sourceFile of fs.readdirSync(directory)) {
            if (!sourceFile.endsWith(".ts")) continue;
            const tsSymbol = sourceFile.split(".ts")[0];
            let exportPath = path.posix.join(directoryRelative, tsSymbol);

            if (!exportPath.startsWith("./") && !exportPath.startsWith("../")) exportPath = "./" + exportPath;

            if (defaults) write(`export { default as ${tsSymbol} } from "${exportPath}"\n`);
            if (named) write(`export * from "${exportPath}";\n`);
        }
    }
}

async function build({
    server = false,
    webTransform = false,
    barrel = false,
}: Record<string, boolean>) {
    if (webTransform) {
        fs.mkdirSync(path.dirname(webConfig.out), { recursive: true });
        fs.writeFileSync(webConfig.out, "");
        
        writeToPanelOut(AUTO_GENERATE_HEADER);
        writeToPanelOut("\nconst _: Record<string, Buffer> = {\n");

        console.log(`\x1b[32mTransforming ${webConfig.in}\x1b[0m`);
        await transformWeb(webConfig.in);

        writeToPanelOut("};\n");
        writeToPanelOut("export default _;");
    }

    if (barrel) {
        for (const barrelFile in barrelConfig) {
            const config = barrelConfig[barrelFile];
            console.log(`\x1b[36mCreating barrel ${barrelFile} \x1b[0m`);
            await barrelDirectories(barrelFile, config.directories, config.default, config.named);
        }
    }

    if (server) {
        console.log(`\x1b[32mBuilding server with esbuild\x1b[0m`);
        esbuild.buildSync(esbuildConfig);
    }
}

build({
    "server": process.argv.includes("--server"),
    "barrel": process.argv.includes("--barrel"),
    "webTransform": process.argv.includes("--web-transform")
});