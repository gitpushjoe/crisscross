import express from 'express';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
const app = express();
import * as http from 'http';
const server = new http.Server(app);
import crypto from 'crypto';
import cookie from 'cookie';
import { serialize, parse } from 'cookie';
import fs from 'fs';
import Cookies from 'js-cookie';

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
    
    socket.on('message', (message: string) => {
        console.log(`Message from ${socket.id}: ${message}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});