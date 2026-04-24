export namespace LegacyText {
    const ESCAPE = "§";
    const CENTER_MOTD_PX = 127;
    const SPACE_LENGTH = 3 + 1; // ' ' size + 1

    export function transform(message: string, replaceCharacter = "&"): string {
        return message
            .replaceAll(replaceCharacter, ESCAPE)
            .replaceAll(ESCAPE.repeat(2), replaceCharacter);
    }

    function getMessageSize(message: string): number {
        const sizes = {
            'A': 5,
            'a': 5,
            'B': 5,
            'b': 5,
            'C': 5,
            'c': 5,
            'D': 5,
            'd': 5,
            'E': 5,
            'e': 5,
            'F': 5,
            'f': 4,
            'G': 5,
            'g': 5,
            'H': 5,
            'h': 5,
            'I': 3,
            'i': 1,
            'J': 5,
            'j': 5,
            'K': 5,
            'k': 4,
            'L': 5,
            'l': 1,
            'M': 5,
            'm': 5,
            'N': 5,
            'n': 5,
            'O': 5,
            'o': 5,
            'P': 5,
            'p': 5,
            'Q': 5,
            'q': 5,
            'R': 5,
            'r': 5,
            'S': 5,
            's': 5,
            'T': 5,
            't': 4,
            'U': 5,
            'u': 5,
            'V': 5,
            'v': 5,
            'W': 5,
            'w': 5,
            'X': 5,
            'x': 5,
            'Y': 5,
            'y': 5,
            'Z': 5,
            'z': 5,
            '1': 5,
            '2': 5,
            '3': 5,
            '4': 5,
            '5': 5,
            '6': 5,
            '7': 5,
            '8': 5,
            '9': 5,
            '0': 5,
            '!': 1,
            '@': 6,
            '#': 5,
            '$': 5,
            '%': 5,
            '^': 5,
            '&': 5,
            '*': 5,
            '(': 4,
            ')': 4,
            '-': 5,
            '_': 5,
            '+': 5,
            '=': 5,
            '{': 4,
            '}': 4,
            '[': 3,
            ']': 3,
            ':': 1,
            ';': 1,
            '"': 3,
            '\'': 1,
            '<': 4,
            '>': 4,
            '?': 5,
            '/': 5,
            '\\': 5,
            '|': 1,
            '~': 5,
            '`': 2,
            '.': 1,
            ',': 1,
            ' ': 3,
            '\0': 4
        }
        return sizes[message as keyof typeof sizes] ?? 5;
    }


    // https://github.com/colbster937/Center-MOTD/blob/master/CenterMOTD-spigot/src/main/java/com/axeelheaven/centermotd/CenterMessage.java
    export function centerMOTD(message: string): string {
        const lines = transform(message).split("\n").slice(0, 40);

        return lines.map(line => {
            let size = 0;
            let escapeNext = false;
            let bolded = false;

            for (const c of line) {
                if (c === ESCAPE) {
                    escapeNext = true;
                } else if (escapeNext) {
                    escapeNext = false;
                    bolded = c === "l";
                } else {
                    size += bolded ? getMessageSize(c) + 1 : getMessageSize(c);
                    size++;
                }
            }

            const x = CENTER_MOTD_PX - Math.floor(size / 2);
            const pad = " ".repeat(Math.floor(x / SPACE_LENGTH));
            return pad + line;
        }).join("\n");
    }
}