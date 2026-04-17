import { printBuffer } from "../Debug";
import { BufferedReader } from "../BufferedIO";
import { Packet } from "./Packet";
import { ServerboundKeepAlivePlayPacket } from "./Serverbound";

export namespace Play {
    export async function decode(reader: BufferedReader, packetID: number): Promise<Packet> {
        switch (packetID) {
            case 0x1b: // KEEP_ALIVE
                const keepAliveID = await reader.readNextLong();
                return new ServerboundKeepAlivePlayPacket(Number(keepAliveID));
        }
        throw new TypeError("not working yet");
    }
}