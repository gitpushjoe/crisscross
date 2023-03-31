import express from 'express';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
const app = express();
import * as http from 'http';
const server = new http.Server(app);
import crypto from 'crypto';
import { serialize, parse } from 'cookie';
import { RoomManager } from '../rooms/rooms';
import { Protocol, message } from '../messaging/protocol';

const io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

io.engine.on("initial_headers", (headers, request) => {
    if (!request!.headers!.cookie || request!.headers!.cookie === 'null') {
            headers["set-cookie"] = serialize("authId", crypto.randomUUID(), { maxAge: 86400, httpOnly: true, path: '/', sameSite: 'strict'});
            console.log(`\tDispatching cookie: ${headers["set-cookie"]}`);
    }
    // console.log(request.headers);
    return '';

});

io.engine.on("headers", (headers, request) => {
    if (!request!.headers!.cookie || request!.headers!.cookie === 'null') {
            headers["set-cookie"] = serialize("authId", crypto.randomUUID(), { maxAge: 86400, httpOnly: true, path: '/', sameSite: 'strict'});
            console.log(`\tDispatching cookie: ${headers["set-cookie"]}`);
    }
    // console.log(request.headers);
    return '';
    
});

app.use(express.static(path.join(__dirname, 'public')));
const RoomMan = new RoomManager(256, 
    (roomCode: string, message: message) => io.to(roomCode).emit('response', message),
    (roomCode: string) => {
        const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
        if (socketsInRoom) {
            socketsInRoom.forEach((socketId: string) => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.emit('response', Protocol.parse('broadcast close'))
                    socket.leave(roomCode);
                }
            });
        }
    }
    );

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

io.on('connection', (socket: any) => {
    const cookie = parse(socket.request.headers.cookie ?? "");
    if (!cookie.authId) {
        console.log(Boolean(cookie.authId), cookie.authId);
        socket.disconnect();
        return;
    }
    console.log(`Client connected: ${socket.id} with authId: ${cookie.authId}`);
    
    socket.on('message', (message: message) => {
        console.log(`Message from ${socket.id}: ${JSON.stringify(message, null, 4)}`);
        switch (message.type) {
            case 'request': {
                switch (message.topic) {
                    case 'host': {
                        const res = RoomMan.createRoom(message.username as string, 
                            cookie.authId, 
                            message.privacy as string, 
                            message.cwSize as string, 
                            parseInt(message.capacity as string),
                            socket);
                        console.log(`Responding: ${JSON.stringify(res, null, 4)}`)
                        socket.emit('response', res);
                        break;
                    }
                }
                break;
            }
            case 'post': {
                switch (message.topic) {
                    case 'close': {
                        const res = RoomMan.closeRoom(cookie.authId);
                        console.log(`Responding: ${JSON.stringify(res, null, 4)}`);
                        if (res) socket.emit('response', res);
                        break;
                    }
                    case 'join': {
                        const res = RoomMan.joinRoom(message.username as string,
                            cookie.authId,
                            message.roomCode as string,
                            socket);
                        console.log(`Responding: ${JSON.stringify(res, null, 4)}`);
                        if (res) socket.emit('response', res);
                        break;
                    }
                    case 'leave': {
                        const res = RoomMan.leaveRoom(cookie.authId, socket);
                        console.log(`Responding: ${JSON.stringify(res, null, 4)}`);
                        if (res) socket.emit('response', res);
                        break;
                    }
                }
                break;
            }
            case 'dev': {
                switch (message.topic) {
                    case 'get': {
                        socket.emit('response', RoomMan.dev_status());
                        break;
                    }
                }
                break;
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});