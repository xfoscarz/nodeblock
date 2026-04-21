import esbuild from "esbuild"
import fs from "fs"
import path from "path"

const panelConfig = {
    in: "./Web/dist",
    out: "./Generated/web-distribution.auto.ts"
};

const config: import("esbuild").BuildOptions = {
    // bundling
    entryPoints: [ "src/index.ts" ],
    bundle: true,
    sourcemap: "linked",
    minify: true,
    outfile: "dist/index.js",

    // jsx
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
    loader: { ".ts": "tsx" },

    // libs
    platform: "node",
    target: "node14",
};

function writeToPanelOut(data: string) {
    fs.appendFileSync(panelConfig.out, data);
}

function normalizePath(filepath: string) {
    return filepath.replaceAll(path.sep, "/");
}

async function transform(inFolder: string) {
    const prefix = normalizePath(path.join(panelConfig.in));
    const children = fs.readdirSync(inFolder);

    let indexFiles: string[] = [];

    for (const child of children) {
        const childPath = path.join(inFolder, child);
        
        if (fs.statSync(childPath).isDirectory()) {
            indexFiles.push(...await transform(childPath));
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

async function build(doServer: boolean = true, doTransform: boolean = true) {
    if (doTransform) {
        fs.mkdirSync(path.dirname(panelConfig.out), { recursive: true });
        fs.writeFileSync(panelConfig.out, "");
        
        writeToPanelOut("// Auto-generated: Do not modify\n");
        writeToPanelOut("const _: Record<string, Buffer> = {\n");

        console.log(`\x1b[32mTransforming ${panelConfig.in}\x1b[0m`);
        await transform(panelConfig.in);

        writeToPanelOut("};\n");
        writeToPanelOut("export default _;");
    }

    if (doServer) {
        console.log(`\x1b[32mBuilding server with esbuild\x1b[0m`);
        esbuild.buildSync(config);
    }
}

build(!process.argv.includes("-s"), !process.argv.includes("-t"));