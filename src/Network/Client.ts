import { ClientInformationChatMode } from "../Packets/Serverbound";

export default class Client {
    public locale: string = "en_us";
    public viewDistance: number = 0xf;
    public chatMode: ClientInformationChatMode = ClientInformationChatMode.ENABLED;
    public brand: string = "";
}