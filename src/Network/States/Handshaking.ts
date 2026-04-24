import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundHandshakePacket
} from "@/Network/Packets.barrel";

export default Handshaking;
namespace Handshaking {
    export async function decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x0: // HANDSHAKE
                const protocolVersion = await reader.readNextVarInt();
                const serverAddress = await reader.readNextString();
                const serverPort = await reader.readNextUnsignedShort();
                const nextState = await reader.readNextVarInt();
                return new ServerboundHandshakePacket(protocolVersion, serverAddress, serverPort, nextState);
        }

        throw new TypeError("Packet decode error");
    }
}