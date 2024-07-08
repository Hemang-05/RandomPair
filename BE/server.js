const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const next = require('next');
const { v4: uuidv4 } = require('uuid'); // UUID generation

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

let waitingQueue = [];
let rooms = {};

nextApp.prepare().then(() => {
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
            handleUserDisconnection(socket);
        });

        socket.on('joinQueue', () => {
            handleUserJoiningQueue(socket);
        });

        socket.on('sendMessage', (message) => {
            const roomId = socket.roomId;
            if (roomId && rooms[roomId]) {
                io.to(roomId).emit('message', { userId: socket.id, message });
            }
        });
    });

    app.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(3000, (err) => {
        if (err) throw err;
        console.log('Server is running on http://localhost:3000');
    });
}).catch((err) => {
    console.error(err.stack);
    process.exit(1);
});

function handleUserJoiningQueue(socket) {
    if (waitingQueue.length > 0) {
        const partnerSocket = waitingQueue.shift();
        const roomId = uuidv4(); // Generate a unique room ID

        socket.roomId = roomId;
        partnerSocket.roomId = roomId;

        socket.join(roomId);
        partnerSocket.join(roomId);

        rooms[roomId] = [socket, partnerSocket];

        socket.emit('paired', { roomId });
        partnerSocket.emit('paired', { roomId });
    } else {
        waitingQueue.push(socket);
        socket.emit('waiting', { message: 'Waiting for a partner to connect...' });
    }
}

function handleUserDisconnection(socket) {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
        const room = rooms[roomId];
        const partnerSocket = room.find(user => user.id !== socket.id);
        
        if (partnerSocket) {
            partnerSocket.leave(roomId);
            waitingQueue.push(partnerSocket);
            partnerSocket.emit('waiting', { message: 'Your partner has disconnected. Waiting for a new partner...' });
        }
        delete rooms[roomId];
    }
    waitingQueue = waitingQueue.filter(user => user.id !== socket.id);
}
