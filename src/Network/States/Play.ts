import { UnknownPacketError } from "@/Errors";
import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundPlayKeepAlivePacket
} from "@/Network/Packets.barrel";

export default abstract class Play {
    public static async decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x1b: // KEEP_ALIVE
                const keepAliveID = await reader.readNextLong();
                return new ServerboundPlayKeepAlivePacket(keepAliveID);
        }
        throw new UnknownPacketError();
    }
}