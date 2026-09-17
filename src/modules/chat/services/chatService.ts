import api from '../../../infrastructure/api/client';
import {
  ChatMessage,
  ConversationItem,
  StartConversationPayload,
  SendMessagePayload
} from '../types/chatTypes';

export const chatService = {
  // Lấy danh sách tất cả các cuộc hội thoại của người dùng hiện tại
  async getConversations(): Promise<ConversationItem[]> {
    const res = await api.get('/chat/conversations');
    return res.data?.data || [];
  },

  // Bắt đầu hoặc mở cuộc hội thoại với Seller hoặc User
  async startConversation(payload: StartConversationPayload): Promise<ConversationItem> {
    const res = await api.post('/chat/conversations', payload);
    return res.data?.data;
  },

  // Lấy lịch sử tin nhắn của một cuộc trò chuyện
  async getMessages(conversationId: string, params?: { limit?: number; before?: string }): Promise<ChatMessage[]> {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
    return res.data?.data || [];
  },

  // Gửi tin nhắn qua REST API (fallback / gửi kèm widget)
  async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<ChatMessage> {
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
    return res.data?.data;
  },

  // Đánh dấu cuộc hội thoại đã đọc
  async markAsRead(conversationId: string): Promise<void> {
    await api.put(`/chat/conversations/${conversationId}/read`);
  },

  // Lấy tổng số lượng tin nhắn chưa đọc
  async getUnreadCount(): Promise<number> {
    const res = await api.get('/chat/unread-count');
    return res.data?.count || 0;
  }
};

export default chatService;
