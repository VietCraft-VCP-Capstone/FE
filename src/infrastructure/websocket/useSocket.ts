import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, appendUniqueMessage } from '../../modules/chat/types/chatTypes';

const SOCKET_URL = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8080' : ''));

export interface SendMessageOptions {
  roomId?: string;
  receiverId?: string;
  message?: string;
  attachments?: string[];
  productWidget?: any;
  customQuotation?: any;
}

export function useSocket(currentRoomId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTypingPartner, setIsTypingPartner] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (currentRoomId) {
        socket.emit('join_room', currentRoomId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('message_received', (msg: any) => {
      // Chuẩn hoá payload để tương thích cả sender_id / senderId và message_text / message
      const normalized: ChatMessage = {
        id: msg.id || msg._id || '',
        conversation_id: msg.conversation_id || msg.roomId || currentRoomId || '',
        sender_id: msg.sender_id || msg.senderId || '',
        receiver_id: msg.receiver_id || msg.receiverId || '',
        message_text: msg.message_text ?? msg.message ?? '',
        attachments: msg.attachments || [],
        product_widget: msg.product_widget || msg.productWidget,
        custom_quotation: msg.custom_quotation || msg.customQuotation,
        is_read: Boolean(msg.is_read),
        created_at: msg.created_at || msg.timestamp || new Date().toISOString()
      };

      setMessages((prev) => appendUniqueMessage(prev, normalized));
      setLastMessage(normalized);

      window.dispatchEvent(new CustomEvent('vietcraft-message-received', { detail: normalized }));
    });

    socket.on('new_message_notification', (data: { message: ChatMessage; unreadCount: number }) => {
      window.dispatchEvent(new CustomEvent('vietcraft-chat-unread-updated', { detail: data }));
    });

    socket.on('unread_count_updated', (data: { unreadCount: number }) => {
      window.dispatchEvent(new CustomEvent('vietcraft-chat-unread-updated', { detail: data }));
    });

    socket.on('notification_received', (notification: any) => {
      window.dispatchEvent(new CustomEvent('vietcraft-notification-received', { detail: notification }));
    });

    socket.on('notification_unread_count', (data: { unreadCount: number }) => {
      window.dispatchEvent(new CustomEvent('vietcraft-notification-unread-updated', { detail: data }));
    });

    socket.on('user_typing', (data: { userId: string; roomId: string; isTyping: boolean }) => {
      if (currentRoomId && data.roomId === currentRoomId) {
        setIsTypingPartner(data.isTyping);
        if (data.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTypingPartner(false);
          }, 3500);
        }
      }
    });

    return () => {
      if (currentRoomId) {
        socket.emit('leave_room', currentRoomId);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Tham gia / rời phòng khi currentRoomId thay đổi
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && isConnected && currentRoomId) {
      socket.emit('join_room', currentRoomId);
      return () => {
        socket.emit('leave_room', currentRoomId);
      };
    }
  }, [currentRoomId, isConnected]);

  // Hỗ trợ cả 2 cách gọi:
  // 1. sendMessage(options: SendMessageOptions)
  // 2. sendMessage(senderId: string, text: string) (tương thích code cũ)
  const sendMessage = useCallback((arg1: SendMessageOptions | string, arg2?: string) => {
    return new Promise<any>((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        reject(new Error('Socket chưa kết nối'));
        return;
      }

      let payload: SendMessageOptions;
      if (typeof arg1 === 'string' && typeof arg2 === 'string') {
        payload = {
          roomId: currentRoomId,
          receiverId: undefined,
          message: arg2
        };
      } else {
        payload = arg1 as SendMessageOptions;
      }

      socket.emit('send_message', payload, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response?.data);
        }
      });
    });
  }, [currentRoomId]);

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(isTyping ? 'typing' : 'stop_typing', { roomId });
    }
  }, []);

  const markRead = useCallback((roomId: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('mark_read', { roomId });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    setMessages,
    lastMessage,
    isTypingPartner,
    sendMessage,
    sendTyping,
    markRead
  };
}

export { useSocket as useChatSocket };
export default useSocket;
