import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundKeepAlivePlayPacket
} from "@/Network/Packets.barrel";

export default Play;
namespace Play {
    export async function decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x1b: // KEEP_ALIVE
                const keepAliveID = await reader.readNextLong();
                return new ServerboundKeepAlivePlayPacket(keepAliveID);
        }
        throw new TypeError("not working yet");
    }
}