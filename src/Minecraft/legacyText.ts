export function chatcolor(message: string): string {
    return message.replaceAll("&", "§").replaceAll("§§", "&");
}

export function getMessageSize(message: string): number {
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

const CENTER_MOTD_PX = 127;
const SPACE_LENGTH = 3 + 1; // ' ' size + 1

// https://github.com/colbster937/Center-MOTD/blob/master/CenterMOTD-spigot/src/main/java/com/axeelheaven/centermotd/CenterMessage.java
export function centerMotd(message: string): string {
    const lines = chatcolor(message).split("\n").slice(0, 40);

    return lines.map(line => {
        let messagePxSize = 0;
        let previousCode = false;
        let isBold = false;

        for (const c of line) {
            if (c === "§") {
                previousCode = true;
            } else if (previousCode) {
                previousCode = false;
                isBold = c === "l";
            } else {
                messagePxSize += isBold ? getMessageSize(c) + 1 : getMessageSize(c);
                messagePxSize++;
            }
        }

        const toCompensate = CENTER_MOTD_PX - Math.floor(messagePxSize / 2);
        const spaces = " ".repeat(Math.floor(toCompensate / SPACE_LENGTH));
        return spaces + line;
    }).join("\n");
}