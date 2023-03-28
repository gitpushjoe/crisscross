// import { MessageType, Message, messageFactory, errorFactory, nullFactory } from "./types";
import { Ensured } from "../utils/types";
import { message } from "../messaging/protocol";
import crypto from 'crypto';
import { Protocol } from '../messaging/protocol'

function errorMsg(topic: string, msg: string): message {
    return {
        type: 'error',
        topic: 'host',
        errorMsg: msg
    }
}

function warnMsg(topic: string, msg: string): message {
    return {
        type: 'warn',
        topic: 'host',
        errorMsg: msg
    }
}

interface Player {
    username: string;
    publicId: string;
    connected: boolean;
    completed: boolean;
    crossword: Crossword;
}

interface Crossword {
    crossword: string;
    clues?: {
        across: string[];
        down: string[];
    }
}

interface Room {
    roomCode?: string;
    capacity?: number;
    privacy?: 'public' | 'private';
    cwSize?: 'mini' | 'medium' | 'max';
    active?: Boolean;
    crossword?: Required<Crossword>|null;
    players?: Player[];
}

// type privacySettings = 'public' | 'private';
// type cwSettings = 'mini' | 'medium' | 'max';

class RoomManager {
    constructor(
        private _capacity: number,
        private players: Map<string, {publicId: string, roomId: string}> = new Map(),
        private rooms: Map<string, Required<Room>> = new Map(),
    ) {
    }

    get size() {
        return this.rooms.size;
    }

    get_player(player: string) {
        return this.players.get(player);
    }

    at_capacity() {
        return this.size >= this._capacity;
    }

    get_public(authId: string): string {
        if (!this.get_player(authId)) {
            this.players.set(authId, {publicId: crypto.randomUUID(), roomId: ''});
        }
        return this.players.get(authId)?.publicId || '';
    }

    public createRoom(username: string, authId: string, privacy: string, cwSize: string, capacity: number): message {
        if (this.at_capacity()) {
            return errorMsg('host', 'Server is at capacity.');
        }
        if (this.get_player(authId)?.roomId) {
            return warnMsg('host', 'This will remove you from your current room. Are you sure?');
        }
        const roomKey = [...Array(16).keys()].reduce((acc, curr) => acc + crypto.randomUUID().slice(0, 6), "");
        if (privacy != 'public' && privacy != 'private') {
            return errorMsg('host', 'Invalid privacy setting.');
        }
        if (cwSize != 'mini' && cwSize != 'medium' && cwSize != 'max') {
            return errorMsg('host', 'Invalid crossword size.');
        }
        const roomCode = Math.round(Math.random() * 100000000).toString();
        this.rooms.set(roomCode, {
            roomCode,
            capacity,
            privacy,
            cwSize,
            active: false,
            crossword: null,
            players: [{
                username,
                publicId: this.get_public(authId),
                connected: true,
                completed: false,
                crossword: {crossword: ''}
            }]
        });
        this.get_player(authId)!.roomId = roomCode;
        console.log(this.rooms, this.players);
        return Protocol.parse('success host {}', this.rooms.get(roomCode)) as message;
    }

    public joinRoom(username: string, authId: string, roomCode: string): message {
        if (!this.rooms.has(roomCode)) {
            return errorMsg('join', 'Invalid room code.');
        }
        if (this.get_player(authId)?.roomId) {
            if (this.get_player(authId)?.roomId == roomCode) {
                return errorMsg('join', 'You are already in this room.');
            }
            return warnMsg('join', 'This will remove you from your current room. Are you sure?');
        }
        const room = this.rooms.get(roomCode);
        if (room!.players.length >= room!.capacity) {
            return errorMsg('join', 'Room is at capacity.');
        }
        room!.players.push({
            username,
            publicId: this.get_public(authId),
            connected: true,
            completed: false,
            crossword: {crossword: ''}
        });
        this.get_player(authId)!.roomId = roomCode;
        console.log(this.rooms, this.players);
        return Protocol.parse('success join {}', this.rooms.get(roomCode)) as message;
    }
}

export { RoomManager };
export type { Room, Player, Crossword };

