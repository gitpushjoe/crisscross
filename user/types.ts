import { io, Socket } from "socket.io-client";
import { MessageType } from "../communications/types";

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

    send(message: string) {
        this.socket.emit('message', message);
    }
}

export default User;