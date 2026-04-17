export class Identifier {
    public static readonly NAMESPACE_CHECK = /[a-z0-9.-_]/;
    public static readonly VALUE_CHECK = /[a-z0-9.-_/]/;
    
    constructor(
        public namespace: string,
        public value: string
    ) {
        if (!namespace.match(Identifier.NAMESPACE_CHECK) || !value.match(Identifier.VALUE_CHECK)) {
            throw new TypeError("Invalid identifier");
        }
    }

    public static parse(s: string) {
        const [ namespace, value ] = s.split(":");
        return new Identifier(namespace, value);
    }

    public static ofVanilla(value: string) {
        return this.vanilla.get(value);
    }

    public static ofNodeblock(value: string) {
        return this.nodeblock.get(value);
    }

    public equals(other: Identifier) {
        return this.valueOf() == other.valueOf();
    }

    public toString() {
        return this.namespace + ":" + this.value;
    }

    public valueOf() {
        return this.toString();
    }
}

export namespace Identifier {
    export class Namespace {
        constructor(
            public namespace: string
        ) {
            if (!namespace.match(Identifier.NAMESPACE_CHECK)) {
                throw new TypeError("Invalid identifier namespace");
            }
        }

        public get(value: string) {
            if (!value.match(Identifier.VALUE_CHECK)) {
                throw new TypeError("Invalid identifier value");
            }
            return new Identifier(this.namespace, value);
        }
    }

    export const vanilla = new Identifier.Namespace("minecraft");
    export const nodeblock = new Identifier.Namespace("nodeblock");
}