import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState('Disconnected');

    useEffect(() => {
        socket = io('http://localhost:3000');

        socket.on('connect', () => {
            setStatus('Connected');
            socket.emit('joinQueue');
        });

        socket.on('paired', ({ roomId }) => {
            setStatus(`Paired in room: ${roomId}`);
        });

        socket.on('message', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        socket.on('waiting', (data) => {
            setStatus(data.message);
        });

        socket.on('disconnect', () => {
            setStatus('Disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (input) {
            socket.emit('sendMessage', input);
            setInput('');
        }
    };

    return (
        <div>
            <div>Status: {status}</div>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.userId}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' ? sendMessage() : null}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
