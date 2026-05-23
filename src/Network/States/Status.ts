import { UnknownPacketError } from "@/Errors";
import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundStatusPingRequestPacket,
    ServerboundStatusRequestPacket
} from "@/Network/Packets.barrel";

export default abstract class Status {
    public static async decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x0: // STATUS_REQUEST
                return new ServerboundStatusRequestPacket();
            case 0x1: // PING_REQUEST
                const timestamp = await reader.readNextLong();
                return new ServerboundStatusPingRequestPacket(timestamp);
        }

        throw new UnknownPacketError();
    }
}