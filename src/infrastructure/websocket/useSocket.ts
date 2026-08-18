import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(roomId?: string) {
    const socketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = io('http://localhost:8080');
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            if (roomId) {
                socket.emit('join_room', roomId);
            }
        });

        socket.on('message_received', (msgPayload: any) => {
            setMessages((prev) => [...prev, msgPayload]);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    const sendMessage = (senderId: string, text: string) => {
        if (socketRef.current && roomId) {
            socketRef.current.emit('send_message', {
                roomId,
                senderId,
                message: text
            });
        }
    };

    return {
        isConnected,
        messages,
        sendMessage,
        setMessages,
    };
}
