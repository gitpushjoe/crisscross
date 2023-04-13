import { io, Socket } from "socket.io-client";
import { Protocol, message, protocolError } from "../messaging/protocol";

class User {
    constructor(
        public username: string = '',
        public publicId: string = '',
        public authId: string = '',
        public socket: Socket|null = null
    ) {
        this.username = username;
        this.publicId = publicId;
        this.authId = authId;
        this.socket = socket;
    }

    emit(message: string | message | protocolError): Boolean {
        if (typeof message == 'string') {
            message = Protocol.parse(message);
        }
        if (!message.error) {
            this.socket!.emit('message', message);
            return true;
        }
        return false;
    }
}

export default User;