import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, MessageSquare, CheckCheck, User as UserIcon,
  ExternalLink, Package, Info
} from 'lucide-react';
import { chatService } from '../../chat/services/chatService';
import { useChatSocket } from '../../chat/hooks/useChatSocket';
import { ChatMessage, ConversationItem } from '../../chat/types/chatTypes';

const QUICK_REPLIES = [
  'Chào bạn! Shop có thể hỗ trợ gì cho bạn về sản phẩm này ạ?',
  'Sản phẩm này hiện đang có sẵn trong kho, giao hàng từ 2 - 3 ngày bạn nhé!',
  'Shop có nhận in và thiết kế theo yêu cầu từ 1 sản phẩm ạ!',
  'Cảm ơn bạn đã tin tưởng ủng hộ gian hàng của shop!'
];

export function SellerChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [showCustomerInfo, setShowCustomerInfo] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRoomId = activeConv?.conversation_id;

  const { isConnected, isTypingPartner, sendMessage, sendTyping, markRead } = useChatSocket(currentRoomId);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Tải danh sách hội thoại
  const fetchConversations = useCallback(async () => {
    try {
      const list = await chatService.getConversations();
      setConversations(list);
      if (!activeConv && list.length > 0) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách hội thoại seller:', err);
    } finally {
      setLoadingConv(false);
    }
  }, [activeConv]);

  // Tải tin nhắn của hội thoại đang chọn
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const history = await chatService.getMessages(convId);
      setMessages(history);
      markRead(convId);
      setTimeout(() => scrollToBottom('auto'), 80);
    } catch (err) {
      console.error('Lỗi tải tin nhắn seller:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [markRead]);

  // Khởi tạo
  useEffect(() => {
    fetchConversations();

    const onMessageReceived = (e: any) => {
      const msg: ChatMessage = e.detail;
      if (activeConv && msg.conversation_id === activeConv.conversation_id) {
        setMessages((prev) => [...prev, msg]);
        markRead(activeConv.conversation_id);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      fetchConversations();
    };

    const onUnreadUpdated = () => {
      fetchConversations();
    };

    window.addEventListener('vietcraft-message-received', onMessageReceived);
    window.addEventListener('vietcraft-chat-unread-updated', onUnreadUpdated);

    return () => {
      window.removeEventListener('vietcraft-message-received', onMessageReceived);
      window.removeEventListener('vietcraft-chat-unread-updated', onUnreadUpdated);
    };
  }, [activeConv, fetchConversations, markRead]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.conversation_id);
    }
  }, [activeConv?.conversation_id, loadMessages]);

  const handleSelectConv = (conv: ConversationItem) => {
    setActiveConv(conv);
    setConversations((prev) =>
      prev.map((c) => (c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c))
    );
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConv) return;

    setInputText('');
    sendTyping(activeConv.conversation_id, false);

    try {
      const sent = await sendMessage({
        roomId: activeConv.conversation_id,
        receiverId: activeConv.partner.id,
        message: text
      });

      if (sent) {
        setMessages((prev) => [...prev, sent]);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      fetchConversations();
    } catch {
      try {
        const fallbackMsg = await chatService.sendMessage(activeConv.conversation_id, {
          receiver_id: activeConv.partner.id,
          message_text: text
        });
        setMessages((prev) => [...prev, fallbackMsg]);
        setTimeout(() => scrollToBottom('smooth'), 50);
        fetchConversations();
      } catch (err) {
        console.error('Lỗi gửi tin nhắn seller:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (activeConv) {
      sendTyping(activeConv.conversation_id, e.target.value.length > 0);
    }
  };

  const filteredList = conversations.filter((c) => {
    const matchesSearch = c.partner.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'UNREAD') {
      return matchesSearch && c.unread_count > 0;
    }
    return matchesSearch;
  });

  const totalUnreadCount = conversations.reduce((acc, it) => acc + (it.unread_count || 0), 0);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2.5 font-jakarta">
            <MessageSquare className="text-[#15803d]" size={26} />
            Tin nhắn khách hàng
            {totalUnreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-extrabold bg-red-500 text-white rounded-full">
                {totalUnreadCount} chưa đọc
              </span>
            )}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tư vấn sản phẩm, giải đáp thắc mắc và chăm sóc khách hàng theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-[#15803d] font-semibold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống Realtime: {isConnected ? 'Sẵn sàng' : 'Đang kết nối...'}
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="h-[700px] bg-white rounded-2xl border border-stone-200 shadow-sm flex overflow-hidden">
        {/* ── CỘT 1: Danh sách cuộc trò chuyện (Left Column) ── */}
        <div className="w-80 border-r border-stone-200 flex flex-col shrink-0 bg-stone-50/50">
          {/* Search bar & Tabs */}
          <div className="p-3 border-b border-stone-200 bg-white space-y-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm tên khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100 border border-transparent rounded-xl focus:bg-white focus:border-[#15803d] outline-none transition-all"
              />
            </div>

            <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  filterTab === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab('UNREAD')}
                className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  filterTab === 'UNREAD' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Chưa đọc
                {totalUnreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {loadingConv ? (
              <div className="p-6 text-center text-xs text-stone-400">
                <div className="w-6 h-6 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải danh sách khách hàng...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <UserIcon size={36} className="mx-auto mb-2 opacity-30 text-stone-400" />
                <p className="text-xs font-semibold text-stone-600">Không tìm thấy hội thoại</p>
                <p className="text-[11px] text-stone-400 mt-1">Khi người mua gửi tin nhắn, hội thoại sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              filteredList.map((c) => {
                const isSelected = activeConv?.conversation_id === c.conversation_id;
                const timeStr = c.last_message?.created_at
                  ? new Date(c.last_message.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '';

                return (
                  <button
                    key={c.conversation_id}
                    onClick={() => handleSelectConv(c)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors relative ${
                      isSelected
                        ? 'bg-emerald-50/70 border-r-4 border-r-[#15803d]'
                        : 'hover:bg-stone-100/70 bg-white'
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      {c.partner.avatar ? (
                        <img
                          src={c.partner.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#15803d] flex items-center justify-center font-bold text-sm uppercase">
                          {c.partner.full_name.charAt(0)}
                        </div>
                      )}
                      {c.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {c.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {c.partner.full_name}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0">{timeStr}</span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          c.unread_count > 0 ? 'font-bold text-stone-900' : 'text-stone-500'
                        }`}
                      >
                        {c.last_message?.text || 'Bắt đầu cuộc trò chuyện'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── CỘT 2: Khung Chat Chính (Center Column) ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-stone-50/30">
          {activeConv ? (
            <>
              {/* Header đối tác */}
              <div className="p-3.5 bg-white border-b border-stone-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    {activeConv.partner.avatar ? (
                      <img
                        src={activeConv.partner.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-stone-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#15803d] flex items-center justify-center font-bold text-sm uppercase">
                        {activeConv.partner.full_name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-stone-900 truncate">
                      {activeConv.partner.full_name}
                    </h3>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                      <span className="text-emerald-600 font-semibold">Khách hàng</span>
                      <span>•</span>
                      <span>{isTypingPartner ? 'Đang soạn tin...' : 'Trực tuyến'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      showCustomerInfo
                        ? 'bg-emerald-50 text-[#15803d] border-emerald-200'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                    title="Thông tin khách hàng"
                  >
                    <Info size={15} />
                    <span className="hidden sm:inline">Hồ sơ khách</span>
                  </button>
                </div>
              </div>

              {/* Message history */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full text-xs text-stone-400">
                    <div className="w-5 h-5 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin mr-2" />
                    Đang tải nội dung tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-stone-400">
                    <MessageSquare size={36} className="mx-auto mb-2 opacity-30 text-stone-400" />
                    <p className="text-xs font-semibold text-stone-600">Chưa có tin nhắn nào</p>
                    <p className="text-[11px] text-stone-400 mt-1">Hãy gửi lời chào hoặc phản hồi cho khách hàng!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id !== activeConv.partner.id;
                    const timeStr = new Date(m.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={m.id || m._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Thẻ sản phẩm kèm trong tin nhắn */}
                        {m.product_widget && (
                          <div
                            className={`mb-1 p-2.5 max-w-[320px] rounded-xl border flex items-center gap-3 shadow-xs ${
                              isMe ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'
                            }`}
                          >
                            <img
                              src={m.product_widget.image}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover border border-stone-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {m.product_widget.title}
                              </p>
                              <p className="text-xs font-bold text-[#15803d]">
                                {m.product_widget.price.toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                            <a
                              href={`/product/${m.product_widget.product_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stone-400 hover:text-[#15803d] p-1.5 rounded-md hover:bg-white"
                              title="Xem trang sản phẩm"
                            >
                              <ExternalLink size={15} />
                            </a>
                          </div>
                        )}

                        {/* Thẻ báo giá */}
                        {m.custom_quotation && (
                          <div className="mb-1 p-3.5 max-w-[300px] rounded-xl bg-amber-50 border border-amber-200 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                              <Package size={15} /> Đề xuất báo giá tùy chỉnh
                            </div>
                            <p className="text-base font-black text-amber-700">
                              {m.custom_quotation.amount.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        )}

                        {/* Text bubble */}
                        {m.message_text && (
                          <div
                            className={`px-4 py-2.5 max-w-[75%] rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                              isMe
                                ? 'bg-[#15803d] text-white rounded-br-none'
                                : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                            }`}
                          >
                            {m.message_text}
                          </div>
                        )}

                        {/* Meta info */}
                        <div
                          className={`flex items-center gap-1 mt-0.5 text-[10px] text-stone-400 ${
                            isMe ? 'mr-1' : 'ml-1'
                          }`}
                        >
                          <span>{timeStr}</span>
                          {isMe && (
                            <span title={m.is_read ? 'Đã xem' : 'Đã gửi'}>
                              <CheckCheck
                                size={13}
                                className={m.is_read ? 'text-emerald-500' : 'text-stone-400'}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {isTypingPartner && (
                  <div className="flex items-center gap-1 text-xs text-stone-500 italic bg-white px-3 py-1.5 rounded-full w-fit border border-stone-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Khách hàng đang soạn tin...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Bar */}
              <div className="px-3.5 py-2 bg-stone-50 border-t border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-stone-400 shrink-0 flex items-center gap-1">
                  Mẫu nhanh:
                </span>
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(reply)}
                    className="text-[11px] whitespace-nowrap px-3 py-1 bg-white border border-stone-200 hover:border-[#15803d] hover:text-[#15803d] rounded-full transition-colors text-stone-600 shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Nhập câu trả lời cho khách hàng... (Enter để gửi)"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-[#15803d] focus:bg-white transition-all text-stone-800"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 bg-[#15803d] text-white rounded-xl hover:bg-[#166534] disabled:opacity-40 disabled:hover:bg-[#15803d] transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs shrink-0"
                >
                  <Send size={15} />
                  <span>Gửi</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8">
              <MessageSquare size={48} className="text-stone-300 mb-3" />
              <p className="text-sm font-bold text-stone-700">Chưa chọn cuộc trò chuyện</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm text-center">
                Chọn một khách hàng ở danh sách bên trái để xem nội dung và bắt đầu hỗ trợ.
              </p>
            </div>
          )}
        </div>

        {/* ── CỘT 3: Thông tin chi tiết khách hàng (Right Column) ── */}
        {showCustomerInfo && activeConv && (
          <div className="w-72 border-l border-stone-200 bg-white p-5 flex flex-col shrink-0 overflow-y-auto">
            <div className="text-center pb-5 border-b border-stone-100">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-[#15803d] flex items-center justify-center font-extrabold text-xl uppercase mb-2 border-2 border-emerald-200">
                {activeConv.partner.avatar ? (
                  <img
                    src={activeConv.partner.avatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  activeConv.partner.full_name.charAt(0)
                )}
              </div>
              <h4 className="font-extrabold text-sm text-stone-900">{activeConv.partner.full_name}</h4>
              <p className="text-xs text-stone-400 mt-0.5">{activeConv.partner.email || 'Khách hàng VietCraft'}</p>
            </div>

            <div className="py-4 space-y-3.5 border-b border-stone-100 text-xs">
              <h5 className="font-bold text-stone-800 uppercase text-[10px] tracking-wider text-stone-400">
                Thông tin tài khoản
              </h5>
              <div className="flex justify-between text-stone-600">
                <span>Vai trò:</span>
                <span className="font-semibold text-stone-900">{activeConv.partner.role}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>ID Khách hàng:</span>
                <span className="font-mono text-[10px] text-stone-500">
                  {activeConv.partner.id.substring(0, 10)}...
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-2 text-xs">
              <h5 className="font-bold text-stone-800 uppercase text-[10px] tracking-wider text-stone-400">
                Mẹo bán hàng
              </h5>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                💡 Phản hồi khách hàng trong vòng <strong>5 phút</strong> giúp tăng tỷ lệ chốt đơn lên đến <strong>70%</strong>!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerChatPage;
