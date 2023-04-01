// import { MessageType, Message, messageFactory, errorFactory, nullFactory } from "./types";
import { Ensured } from "../utils/types";
import { message } from "../messaging/protocol";
import crypto from 'crypto';
import { Protocol } from '../messaging/protocol'
import { Scheduler, Task, Order } from '../utils/scheduling/scheduler';

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

interface RoomPlayer {
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
    players?: RoomPlayer[];
}

interface PlayerDetails {
    publicId: string;
    roomCode: string;
}

class PlayerMap {
    public data: Map<string, PlayerDetails> = new Map();

    public set(authId: string, details: PlayerDetails) {
        this.data.set(authId, details);
    }

    public get(authId: string): PlayerDetails|undefined {
        return this.data.get(authId);
    }

    public getPublicId(authId: string): string {
        return this.data.get(authId)?.publicId || '';
    }
    
    public getRoomCode(authId: string): string {
        return this.data.get(authId)?.roomCode || '';
    }

    public setRoomCode(authId: string, roomCode: string) {
        if (!this.data.get(authId)) return;
        this.data.set(authId, {publicId: this.data.get(authId)!.publicId!, roomCode});
    }
}

interface SocketType {
    id: `${string}-${string}-${string}-${string}-${string}`;
    join: (roomCode: string) => void;
    leave: (roomCode: string) => void;
}

class RoomManager {
    private _players: PlayerMap = new PlayerMap();
    private _rooms: Map<string, Required<Room>> = new Map();
    private _scheduler: Scheduler = new Scheduler();
    constructor(
        private _capacity: number,
        private _broadcast: (roomCode: string, message: message) => void = () => {},
        private _close: (roomCode: string) => void = () => {},
    ) {
    }

    get size() {
        return this._rooms.size;
    }

    private getRoomFromAuth(authId: string): Required<Room>|undefined {
        if (!this._players.get(authId)?.roomCode) return undefined;
        return this._rooms.get(this._players.get(authId)?.roomCode || '');
    }

    private _atCapacity() {
        return this.size >= this._capacity;
    }

    private _getPublicIdFromAuth(authId: string, defaultValue = crypto.randomUUID()): string {
        if (!this._players.get(authId)?.publicId) {
            this._players.set(authId, {publicId: defaultValue, roomCode: ''});
        }
        return this._players.getPublicId(authId);
    }

    private _getRoomCodeFromAuth(authId: string): string {
        return this._players.get(authId)?.roomCode || '';
    }

    private _getPlayerIndex(authId: string): number|undefined {
        return this.getRoomFromAuth(authId)?.players.findIndex(player => player.publicId == this._getPublicIdFromAuth(authId));
    }

    private _getAuthIdsFromRoomCode(roomCode: string): string[] {
        const players = this._rooms.get(roomCode)?.players || [];
        if (!players.length) return [];
        return [...this._players.data.entries()].reduce((acc, curr) => {
            if (curr[1].roomCode == roomCode) acc.push(curr[0]);
            return acc;
        }, [] as string[]);
    }
    
    private _deleteRoom(roomCode: string) {
        const authIds = this._getAuthIdsFromRoomCode(roomCode);
        authIds.forEach(authId => this._players.setRoomCode(authId, ''));
        this._close(roomCode);
        this._rooms.delete(roomCode);
    }

    private _removeRoomIfEmpty(roomCode: string) {
        if (!this._rooms.get(roomCode)?.players.length) {
            this._deleteRoom(roomCode);
        }
    }

    public createRoom(username: string, authId: string, privacy: string, cwSize: string, capacity: number, socket: SocketType): message {
        if (this._atCapacity()) {
            return errorMsg('host', 'Server is at capacity.');
        }
        if (this._getRoomCodeFromAuth(authId)) {
            return warnMsg('host', 'This will remove you from your current room. Are you sure?');
        }
        const roomKey = [...Array(16).keys()].reduce((acc, curr) => acc + crypto.randomUUID().slice(0, 6), "");
        if (privacy != 'public' && privacy != 'private') {
            return errorMsg('host', 'Invalid privacy setting.');
        }
        if (cwSize != 'mini' && cwSize != 'medium' && cwSize != 'max') {
            return errorMsg('host', 'Invalid crossword size.');
        }
        let roomCode = Math.round(Math.random() * 100000000).toString();
        while (roomCode.length != 8) {
            roomCode = Math.round(Math.random() * 100000000).toString();
        }
        this._rooms.set(roomCode, {
            roomCode,
            capacity,
            privacy,
            cwSize,
            active: false,
            crossword: null,
            players: [{
                username,
                publicId: this._getPublicIdFromAuth(authId, socket.id),
                connected: true,
                completed: false,
                crossword: {crossword: ''}
            }]
        });
        this._players.setRoomCode(authId, roomCode);
        console.log(this._rooms, this._players);
        socket.join(roomCode);
        this._scheduler.makeThread(roomCode);
        return Protocol.parse('success host {}', this._rooms.get(roomCode)) as message;
    }

    public joinRoom(username: string, authId: string, roomCode: string, socket: SocketType): message|null {
        if (!this._rooms.has(roomCode)) {
            return errorMsg('join', 'Invalid room code.');
        }
        if (this._getRoomCodeFromAuth(authId)) {
            if (this._getRoomCodeFromAuth(authId) == roomCode) {
                return errorMsg('join', 'You are already in this room.');
            }
            return warnMsg('join', 'This will remove you from your current room. Are you sure?');
        }
        const room = this._rooms.get(roomCode);
        if (room!.players.length >= room!.capacity) {
            return errorMsg('join', 'Room is at capacity.');
        }
        room!.players.push({
            username,
            publicId: this._getPublicIdFromAuth(authId, socket?.id),
            connected: true,
            completed: false,
            crossword: {crossword: ''}
        });
        this._players.setRoomCode(authId, roomCode);
        socket.join(roomCode);
        console.log(this._rooms, this._players);
        this._broadcast(roomCode, Protocol.parse('broadcast join {}', room) as message);
        return null;
    }

    public closeRoom(authId: string): message|null {
        if (!this._getRoomCodeFromAuth(authId)) {
            return errorMsg('close', 'You are not in a room.');
        }
        if ( this._getPlayerIndex(authId) != 0) {
            return errorMsg('close', 'You are not the host of this room.');
        }
        const room = this.getRoomFromAuth(authId);
        if (!room) {
            return errorMsg('close', 'Room does not exist.');
        }
        this._scheduler.destroyThread(room.roomCode);
        this._deleteRoom(room.roomCode);
        return null;
    }

    public leaveRoom(authId: string, socket: SocketType): message|null {
        if (!this._getRoomCodeFromAuth(authId)) {
            return errorMsg('leave', 'You are not in a room.');
        }
        const room = this.getRoomFromAuth(authId);
        if (!room) {
            return errorMsg('leave', 'Room does not exist.');
        }
        const playerIndex = this._getPlayerIndex(authId);
        if (playerIndex == -1 || playerIndex == undefined) {
            return errorMsg('leave', 'You are not in this room.');
        }
        room.players.splice(playerIndex, 1);
        this._players.setRoomCode(authId, '');
        this._broadcast(room.roomCode, Protocol.parse('broadcast leave {}', room) as message);
        this._removeRoomIfEmpty(room.roomCode);
        socket.leave(room.roomCode);
        return null;
    }

    public startGame(authId: string, beginCountdown: string): message|null {
        if (!this._getRoomCodeFromAuth(authId)) {
            return errorMsg('start', 'You are not in a room.');
        }
        const room = this.getRoomFromAuth(authId);
        if (!room) {
            return errorMsg('start', 'Room does not exist.');
        }
        if (this._getPlayerIndex(authId) != 0) {
            return errorMsg('start', 'You are not the host of this room.');
        }
        if (room.players.length < 2) {
            return errorMsg('start', 'Not enough players.');
        }
        if (room.active) {
            return errorMsg('start', 'Game has already started.');
        }
        if (beginCountdown == 'true') {
            if (this._scheduler.getThread(room.roomCode)!.agendaLength > 0)
                return errorMsg('start', 'Game is already starting.')
            else
                this._scheduler.getThread(room.roomCode)?.push(new Task(() => this._beginStartCountdown(room.roomCode, 5000)));
        } else {
            this._scheduler.getThread(room.roomCode)?.push(new Order(() => this._cancelStartCountdown(room.roomCode)));
        }
        return null;
    }

    private _beginStartCountdown(roomCode: string, countdown: number): Task|void {
        if (this._rooms.get(roomCode)!.active) {
            return;
        }
        this._broadcast(roomCode, Protocol.parse(`broadcast start ${countdown} {}`, this._rooms.get(roomCode)) as message);
        if (countdown == 0) {
            this._rooms.get(roomCode)!.active = true;
            return;
        }
        return new Task(() => this._beginStartCountdown(roomCode, countdown - 1000), 1000);
    }

    private _cancelStartCountdown(roomCode: string): void {
        if (this._rooms.get(roomCode)) {
            this._rooms.get(roomCode)!.active = false;
        }
        this._broadcast(roomCode, Protocol.parse('broadcast start -1 {}', this._rooms.get(roomCode)) as message);
    }

    public get getRooms(): Required<Room>[] { // dev only
        return [...this._rooms.values()];
    }
    public get getPlayers() { // dev only
        return [...this._players.data.entries()];
    }
    public get getScheduler() { // dev only
        return [...this._scheduler.threads];
    }
    public dev_status(): message { // dev only
        return Protocol.parse('reply dev {}', {rooms: this.getRooms, players: this.getPlayers, threads: this.getScheduler}) as message;
    }
}

export { RoomManager };
export type { Room, RoomPlayer, Crossword };

