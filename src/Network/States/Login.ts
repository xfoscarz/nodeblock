import { UnknownPacketError } from "@/Errors";
import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundLoginAcknowledgedPacket,
    ServerboundLoginStartPacket
} from "@/Network/Packets.barrel";

export default abstract class Login {
    public static async decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x0: // LOGIN_START
                const name = await reader.readNextString();
                const playerUUID = await reader.readNextUUID();
                return new ServerboundLoginStartPacket(name, playerUUID);
            case 0x3: // LOGIN_ACKNOWLEDGED
                return new ServerboundLoginAcknowledgedPacket();
        }

        throw new UnknownPacketError();
    }
}