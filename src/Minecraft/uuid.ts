import { v4 } from "uuid";

export default class UUID {
    public buffer: Uint8Array = new Uint8Array(16);

    constructor(
        initializer?: Uint8Array | string
    ) {
        if (initializer) {
            if (typeof initializer == "string") {
                let vector: string[] = [];

                if (initializer.includes("-")) {
                    vector = initializer.split("-");
                } else {
                    vector = [
                        initializer.slice(0, 8),
                        initializer.slice(8, 12),
                        initializer.slice(12, 16),
                        initializer.slice(16, 20),
                        initializer.slice(20, 32),
                    ];
                }

                this.buffer.set([
                    Number.parseInt(vector[0].slice(0, 2), 16),
                    Number.parseInt(vector[0].slice(2, 4), 16),
                    Number.parseInt(vector[0].slice(4, 6), 16),
                    Number.parseInt(vector[0].slice(6, 8), 16),

                    Number.parseInt(vector[1].slice(0, 2), 16),
                    Number.parseInt(vector[1].slice(2, 4), 16),

                    Number.parseInt(vector[2].slice(0, 2), 16),
                    Number.parseInt(vector[2].slice(2, 4), 16),

                    Number.parseInt(vector[3].slice(0, 2), 16),
                    Number.parseInt(vector[3].slice(2, 4), 16),
                    
                    Number.parseInt(vector[4].slice(0, 2), 16),
                    Number.parseInt(vector[4].slice(2, 4), 16),
                    Number.parseInt(vector[4].slice(4, 6), 16),
                    Number.parseInt(vector[4].slice(6, 8), 16),
                    Number.parseInt(vector[4].slice(8, 10), 16),
                    Number.parseInt(vector[4].slice(10, 12), 16),
                ]);
            } else {
                this.buffer.set(initializer);
            }
        } else {
            v4({}, this.buffer);
        }
    }

    public toString(hyphenated: boolean = true) {
        let str = Buffer.from(this.buffer).toString("hex");

        if (hyphenated) {
            return [
                str.slice(0, 8),
                str.slice(8, 12),
                str.slice(12, 16),
                str.slice(16, 20),
                str.slice(20, 32)
            ].join("-");
        } else {
            return str;
        }
    }

    public valueOf(): string {
        return this.toString();
    }
}