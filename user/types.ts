import { io, Socket } from "socket.io-client";
import { MessageType } from "../messaging/protocol";
import { message, protocolError } from "../messaging/protocol";

class User {
    constructor(
        public username: string,
        public publicId: string,
        public authId: string,
        public readonly socket: Socket
    ) {
        this.username = username;
        this.publicId = publicId;
        this.authId = authId;
        this.socket = socket;
    }

    emit(message: message | protocolError): void {
        if (!message.error) {
            this.socket.emit('message', message)
        }
    }
}

export default User;