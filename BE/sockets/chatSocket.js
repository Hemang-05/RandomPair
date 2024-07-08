const handleChatSockets = (io, socket, waitingQueue) => {
    if (waitingQueue.length > 1) {
        const partner = waitingQueue.find((user) => user.userId !== socket.userId);

        if (partner) {
            const roomId = `room-${socket.userId}-${partner.userId}`;
            socket.join(roomId);
            partner.join(roomId);

            socket.status = 'connected';
            partner.status = 'connected';

            waitingQueue = waitingQueue.filter((user) => user.userId !== socket.userId && user.userId !== partner.userId);

            io.to(roomId).emit('paired', { roomId });

            socket.on('sendMessage', (message) => {
                io.to(roomId).emit('message', { userId: socket.userId, message });
            });

            socket.on('disconnect', () => {
                io.to(roomId).emit('partnerDisconnected');
            });
        }
    } else {
        socket.emit('waiting', { message: 'Waiting for a partner...' });
    }
};

module.exports = { handleChatSockets };
