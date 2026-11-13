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

let sharedSocket: Socket | null = null;
let subscriberCount = 0;
let disconnectTimeout: any = null;

function normalizeMsg(msg: any, fallbackRoomId?: string): ChatMessage {
  return {
    id: msg.id || msg._id || '',
    conversation_id: msg.conversation_id || msg.roomId || fallbackRoomId || '',
    sender_id: msg.sender_id || msg.senderId || '',
    receiver_id: msg.receiver_id || msg.receiverId || '',
    message_text: msg.message_text ?? msg.message ?? '',
    attachments: msg.attachments || [],
    product_widget: msg.product_widget || msg.productWidget,
    custom_quotation: msg.custom_quotation || msg.customQuotation,
    is_read: Boolean(msg.is_read),
    created_at: msg.created_at || msg.timestamp || new Date().toISOString()
  };
}

export function useSocket(currentRoomId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(Boolean(sharedSocket?.connected));
  const [isTypingPartner, setIsTypingPartner] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const currentRoomRef = useRef<string | undefined>(currentRoomId);
  currentRoomRef.current = currentRoomId;

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
      setIsConnected(false);
      return;
    }

    if (disconnectTimeout) {
      clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
    }

    subscriberCount++;

    if (!sharedSocket || !sharedSocket.connected) {
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
      sharedSocket = socket;
    }

    const socket = sharedSocket;

    const handleConnect = () => {
      setIsConnected(true);
      if (currentRoomRef.current) {
        socket.emit('join_room', currentRoomRef.current);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessageReceived = (msg: any) => {
      const normalized = normalizeMsg(msg, currentRoomRef.current);
      setMessages((prev) => appendUniqueMessage(prev, normalized));
      setLastMessage(normalized);
      window.dispatchEvent(new CustomEvent('vietcraft-message-received', { detail: normalized }));
    };

    const handleNewMessageNotif = (data: { message?: any; unreadCount?: number }) => {
      window.dispatchEvent(new CustomEvent('vietcraft-chat-unread-updated', { detail: data }));
      if (data?.message) {
        const normalized = normalizeMsg(data.message, currentRoomRef.current);
        setMessages((prev) => appendUniqueMessage(prev, normalized));
        setLastMessage(normalized);
        window.dispatchEvent(new CustomEvent('vietcraft-message-received', { detail: normalized }));
      }
    };

    const handleUnreadUpdated = (data: { unreadCount: number }) => {
      window.dispatchEvent(new CustomEvent('vietcraft-chat-unread-updated', { detail: data }));
    };

    const handleNotificationReceived = (notification: any) => {
      window.dispatchEvent(new CustomEvent('vietcraft-notification-received', { detail: notification }));
    };

    const handleNotificationUnreadCount = (data: { unreadCount: number }) => {
      window.dispatchEvent(new CustomEvent('vietcraft-notification-unread-updated', { detail: data }));
    };

    const handleUserTyping = (data: { userId: string; roomId: string; isTyping: boolean }) => {
      if (currentRoomRef.current && data.roomId === currentRoomRef.current) {
        setIsTypingPartner(data.isTyping);
        if (data.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTypingPartner(false);
          }, 3500);
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message_received', handleMessageReceived);
    socket.on('new_message_notification', handleNewMessageNotif);
    socket.on('unread_count_updated', handleUnreadUpdated);
    socket.on('notification_received', handleNotificationReceived);
    socket.on('notification_unread_count', handleNotificationUnreadCount);
    socket.on('user_typing', handleUserTyping);

    if (socket.connected) {
      setIsConnected(true);
      if (currentRoomRef.current) {
        socket.emit('join_room', currentRoomRef.current);
      }
    }

    return () => {
      subscriberCount--;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message_received', handleMessageReceived);
      socket.off('new_message_notification', handleNewMessageNotif);
      socket.off('unread_count_updated', handleUnreadUpdated);
      socket.off('notification_received', handleNotificationReceived);
      socket.off('notification_unread_count', handleNotificationUnreadCount);
      socket.off('user_typing', handleUserTyping);

      if (subscriberCount <= 0) {
        disconnectTimeout = setTimeout(() => {
          if (subscriberCount <= 0 && sharedSocket) {
            sharedSocket.disconnect();
            sharedSocket = null;
          }
        }, 3000);
      }
    };
  }, [token]);

  // Tham gia / rời phòng khi currentRoomId thay đổi
  useEffect(() => {
    const socket = sharedSocket;
    if (socket && isConnected && currentRoomId) {
      socket.emit('join_room', currentRoomId);
      return () => {
        socket.emit('leave_room', currentRoomId);
      };
    }
  }, [currentRoomId, isConnected]);

  const sendMessage = useCallback((arg1: SendMessageOptions | string, arg2?: string) => {
    return new Promise<any>((resolve, reject) => {
      const socket = sharedSocket;
      if (!socket || !socket.connected) {
        reject(new Error('Socket chưa kết nối'));
        return;
      }

      let payload: SendMessageOptions;
      if (typeof arg1 === 'string' && typeof arg2 === 'string') {
        payload = {
          roomId: currentRoomRef.current,
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
  }, []);

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    const socket = sharedSocket;
    if (socket && socket.connected) {
      socket.emit(isTyping ? 'typing' : 'stop_typing', { roomId });
    }
  }, []);

  const markRead = useCallback((roomId: string) => {
    const socket = sharedSocket;
    if (socket && socket.connected) {
      socket.emit('mark_read', { roomId });
    }
  }, []);

  return {
    socket: sharedSocket,
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
