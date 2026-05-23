import { UnknownPacketError } from "@/Errors";
import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundIntentionPacket
} from "@/Network/Packets.barrel";

export default abstract class Handshaking {
    public static async decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x0: // HANDSHAKE
                const protocolVersion = await reader.readNextVarInt();
                const serverAddress = await reader.readNextString();
                const serverPort = await reader.readNextUnsignedShort();
                const nextState = await reader.readNextVarInt();
                return new ServerboundIntentionPacket(protocolVersion, serverAddress, serverPort, nextState);
        }

        throw new UnknownPacketError();
    }
}