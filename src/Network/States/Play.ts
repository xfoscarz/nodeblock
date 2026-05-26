import { UnknownPacketError } from "@/Errors";
import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundPlayKeepAlivePacket
} from "@/Network/Packets.barrel";
import ServerboundAcceptTeleportation from "@/Network/Packets/Serverbound/ServerboundAcceptTeleportation";
import ServerboundClientTickEndPacket from "@/Network/Packets/Serverbound/ServerboundClientTickEndPacket";
import ServerboundMovePlayerPosRotPacket from "@/Network/Packets/Serverbound/ServerboundMovePlayerPosRotPacket";

export default abstract class Play {
    public static async decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x1b: // KEEP_ALIVE
                const keepAliveID = await reader.readNextLong();
                return new ServerboundPlayKeepAlivePacket(keepAliveID);
            case 0x0:
                const teleportID = await reader.readNextVarInt();
                return new ServerboundAcceptTeleportation(teleportID);
            case 0x1e:
                const x = await reader.readNextDouble();
                const feetY = await reader.readNextDouble();
                const z = await reader.readNextDouble();
                const yaw = await reader.readNextFloat();
                const pitch = await reader.readNextFloat();
                const flags = await reader.readNextByte();
                return new ServerboundMovePlayerPosRotPacket(x, feetY, z, yaw, pitch, flags);
            case 0xc:
                return new ServerboundClientTickEndPacket();
        }
        throw new UnknownPacketError();
    }
}