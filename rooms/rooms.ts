// import { MessageType, Message, messageFactory, errorFactory, nullFactory } from "./types";
import { Ensured } from "../utils/types";
import { message } from "../messaging/protocol";
import crypto from 'crypto';
import { Protocol } from '../messaging/protocol'

function errorMsg(topic: string, msg: string): message {
    return {
        type: 'error',
        topic,
        errorMsg: msg
    }
}

function warnMsg(topic: string, msg: string): message {
    return {
        type: 'warn',
        topic,
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
    },
    solution?: string;
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

    private player_info(player: string) {
        return this.players.get(player);
    }

    private at_capacity() {
        return this.size >= this._capacity;
    }

    private get_public(authId: string): string {
        if (!this.player_info(authId)) {
            this.players.set(authId, {publicId: crypto.randomUUID(), roomId: ''});
        }
        return this.players.get(authId)?.publicId || '';
    }

    private player_index(authId: string): number {
        return this.rooms.get(this.player_info(authId)?.roomId || '')?.players.findIndex(player => player.publicId == this.get_public(authId)) || -1;
    }

    public createRoom(username: string, authId: string, privacy: string, cwSize: string, capacity: number): message {
        if (this.at_capacity()) {
            return errorMsg('host', 'Server is at capacity.');
        }
        if (this.player_info(authId)?.roomId) {
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
        this.player_info(authId)!.roomId = roomCode;
        console.log(this.rooms, this.players);
        return Protocol.parse('success host {}', this.rooms.get(roomCode)) as message;
    }

    public joinRoom(username: string, authId: string, roomCode: string): message {
        if (!this.rooms.has(roomCode)) {
            return errorMsg('join', 'Invalid room code.');
        }
        if (this.player_info(authId)?.roomId) {
            if (this.player_info(authId)?.roomId == roomCode) {
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
        this.player_info(authId)!.roomId = roomCode;
        console.log(this.rooms, this.players);
        return Protocol.parse('success join {}', this.rooms.get(roomCode)) as message;
    }

    // public closeRoom(authId: string): message {
    //     if (!this.player_info(authId)?.roomId) {
    //         return errorMsg('close', 'You are not in a room.');
    //     }
    //     if (!this.player_index(authId)) {
    //         return errorMsg('close', 'You are not the host of this room.');
    //     }

    // }

    public get getRooms(): Required<Room>[] {
        return [...this.rooms.values()];
    }
    public get getPlayers(): Map<string, {publicId: string, roomId: string}> {
        return this.players;
    }
    public dev_status(): message { // dev only
        return Protocol.parse('reply dev {}', {rooms: this.getRooms, players: this.getPlayers}) as message;
    }
}

export { RoomManager };
export type { Room, Player, Crossword };

