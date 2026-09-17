import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, X, Minus, ArrowLeft, Send, Store,
  CheckCheck, ExternalLink, Package, Search, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { useChatSocket } from '../hooks/useChatSocket';
import { ChatMessage, ConversationItem, ProductWidget, appendUniqueMessage, filterUniqueMessages } from '../types/chatTypes';

interface BuyerChatWidgetProps {
  user: any;
}

const formatConvTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

const formatDatePill = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return 'Ngày hôm nay';
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

export function BuyerChatWidget({ user }: BuyerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [activeProductWidget, setActiveProductWidget] = useState<ProductWidget | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRoomId = activeConv?.conversation_id;

  const { isTypingPartner, sendMessage, sendTyping, markRead } = useChatSocket(currentRoomId);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Tải danh sách hội thoại
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const list = await chatService.getConversations();
      setConversations(list);
      // Nếu chưa chọn hội thoại và đã có danh sách, tự động chọn cuộc trò chuyện đầu tiên
      setActiveConv((prev) => {
        if (!prev && list.length > 0) {
          return list[0];
        }
        return prev;
      });
    } catch {
      // Offline fallback
    }
  }, [user]);

  // Tải tin nhắn của cuộc trò chuyện hiện tại
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const history = await chatService.getMessages(convId);
      setMessages(filterUniqueMessages(history));
      markRead(convId);
      
      // Đồng bộ trạng thái đã đọc qua REST API và cập nhật badge header
      chatService.markAsRead(convId).then(async () => {
        const count = await chatService.getUnreadCount();
        window.dispatchEvent(new CustomEvent('vietcraft-chat-unread-updated', { detail: { unreadCount: count } }));
      }).catch(() => {});

      setConversations((prev) =>
        prev.map((c) => (c.conversation_id === convId ? { ...c, unread_count: 0 } : c))
      );
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [markRead]);

  // Khởi tạo và lắng nghe các event realtime
  useEffect(() => {
    if (user) {
      fetchConversations();
    }

    const onMessageReceived = (e: any) => {
      const msg: ChatMessage = e.detail;
      if (activeConv && msg.conversation_id === activeConv.conversation_id) {
        setMessages((prev) => appendUniqueMessage(prev, msg));
        markRead(activeConv.conversation_id);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      fetchConversations();
    };

    const onUnreadUpdated = () => {
      fetchConversations();
    };

    const onOpenChat = async (e: any) => {
      const { shopId, partnerId, productWidget, toggle } = e.detail || {};

      if (toggle) {
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            setIsMinimized(false);
            fetchConversations();
          }
          return next;
        });
        return;
      }

      setIsOpen(true);
      setIsMinimized(false);
      fetchConversations();

      if (productWidget) {
        setActiveProductWidget(productWidget);
      }

      if (shopId || partnerId) {
        setLoadingConv(true);
        try {
          const conv = await chatService.startConversation({
            shopId,
            partnerId
          });
          setActiveConv(conv);
          await loadMessages(conv.conversation_id);
        } catch (err) {
          console.error('Không thể mở cuộc hội thoại:', err);
        } finally {
          setLoadingConv(false);
        }
      }
    };

    window.addEventListener('vietcraft-message-received', onMessageReceived);
    window.addEventListener('vietcraft-chat-unread-updated', onUnreadUpdated);
    window.addEventListener('vietcraft-open-chat', onOpenChat);

    return () => {
      window.removeEventListener('vietcraft-message-received', onMessageReceived);
      window.removeEventListener('vietcraft-chat-unread-updated', onUnreadUpdated);
      window.removeEventListener('vietcraft-open-chat', onOpenChat);
    };
  }, [user, activeConv, fetchConversations, loadMessages, markRead]);

  // Load tin nhắn khi activeConv thay đổi
  useEffect(() => {
    if (activeConv?.conversation_id && isOpen && !isMinimized) {
      loadMessages(activeConv.conversation_id);
    }
  }, [activeConv?.conversation_id, isOpen, isMinimized, loadMessages]);

  // Chọn hội thoại
  const handleSelectConversation = async (conv: ConversationItem) => {
    setActiveConv(conv);
    setActiveProductWidget(null);
    await loadMessages(conv.conversation_id);
    setConversations((prev) =>
      prev.map((c) => (c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c))
    );
  };

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!inputText.trim() && !activeProductWidget) return;
    if (!activeConv || !user) return;

    const text = inputText.trim();
    const widgetToSend = activeProductWidget;

    setInputText('');
    setActiveProductWidget(null);
    sendTyping(activeConv.conversation_id, false);

    // Chỉ gửi kèm thẻ sản phẩm ở tin nhắn đầu tiên ("chỉ hiển thị lúc đầu thôi")
    const hasPriorProduct = messages.some((m) => Boolean(m.product_widget));
    const finalWidget = !hasPriorProduct ? widgetToSend : undefined;

    try {
      const sent = await sendMessage({
        roomId: activeConv.conversation_id,
        receiverId: activeConv.partner.id,
        message: text,
        productWidget: finalWidget || undefined
      });

      if (sent) {
        setMessages((prev) => appendUniqueMessage(prev, sent));
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      fetchConversations();
    } catch {
      // Fallback qua REST API nếu socket bị nghẽn
      try {
        const fallbackMsg = await chatService.sendMessage(activeConv.conversation_id, {
          receiver_id: activeConv.partner.id,
          message_text: text,
          product_widget: finalWidget || undefined
        });
        setMessages((prev) => appendUniqueMessage(prev, fallbackMsg));
        setTimeout(() => scrollToBottom('smooth'), 50);
        fetchConversations();
      } catch (err) {
        console.error('Lỗi gửi tin nhắn fallback:', err);
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

  // Gợi ý câu hỏi nhanh
  const quickQuestions = [
    'Sản phẩm này còn hàng không shop?',
    'Shop có nhận in theo yêu cầu không?',
    'Bao lâu thì nhận được hàng ạ?'
  ];

  if (!user) return null;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.partner.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'UNREAD') {
      return matchesSearch && c.unread_count > 0;
    }
    return matchesSearch;
  });

  return (
    <>
      {/* Minimized Dock Button khi người dùng thu nhỏ cửa sổ Chat */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white text-stone-800 px-4 py-2.5 rounded-t-xl border border-b-0 border-stone-300 shadow-xl hover:bg-stone-50 transition-all font-sans cursor-pointer"
        >
          <span className="font-bold text-sm text-[#ea580c] flex items-center gap-1.5">
            <MessageCircle size={17} className="text-[#ea580c]" />
            Chat
            {totalUnread > 0 && (
              <span className="text-xs text-[#ea580c] font-bold">({totalUnread})</span>
            )}
          </span>
        </button>
      )}

      {/* Cửa Sổ Chat Pop-up Giao Diện Shopee 2 Cột */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[700px] max-w-[calc(100vw-24px)] h-[530px] max-h-[calc(100vh-32px)] bg-white rounded-xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header Shopee Style */}
          <div className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-[#ea580c]">Chat</span>
              {totalUnread > 0 && (
                <span className="text-xs text-[#ea580c] font-bold">({totalUnread})</span>
              )}
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-stone-500">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-800 transition-colors"
                title="Thu nhỏ"
              >
                <Minus size={17} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-800 transition-colors"
                title="Đóng"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Body: Split 2 Columns (Danh sách người nhắn 1 bên + Khung chat 1 bên) */}
          <div className="flex-1 flex flex-row overflow-hidden bg-white">
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* CỘT TRÁI: DANH SÁCH NGƯỜI NHẮN (Conversations List)          */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div
              className={`w-full sm:w-[260px] sm:shrink-0 border-r border-stone-200 flex flex-col bg-white h-full ${
                activeConv ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {/* Thanh Tìm kiếm & Dropdown Bộ Lọc kiểu Shopee */}
              <div className="p-2 border-b border-stone-100 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-7 pr-2 py-1.5 bg-stone-50 border border-stone-200 rounded outline-none focus:border-stone-400 focus:bg-white transition-all text-stone-800 placeholder-stone-400"
                  />
                </div>

                {/* Filter Dropdown (Tất cả / Chưa đọc) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFilterDropdownOpen((prev) => !prev)}
                    className="text-xs px-2 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded flex items-center gap-1 text-stone-700 shrink-0 cursor-pointer"
                  >
                    <span>{filterTab === 'ALL' ? 'Tất cả' : 'Chưa đọc'}</span>
                    <ChevronDown size={12} className="text-stone-400" />
                  </button>
                  {filterDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-stone-200 rounded shadow-lg py-1 z-20 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterTab('ALL');
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-stone-50 ${
                          filterTab === 'ALL' ? 'text-[#ea580c] font-bold bg-orange-50/50' : 'text-stone-700'
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterTab('UNREAD');
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-stone-50 ${
                          filterTab === 'UNREAD' ? 'text-[#ea580c] font-bold bg-orange-50/50' : 'text-stone-700'
                        }`}
                      >
                        Chưa đọc
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Danh sách các cuộc trò chuyện */}
              <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
                {loadingConv ? (
                  <div className="flex items-center justify-center h-40 text-xs text-stone-400">
                    <div className="w-4 h-4 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-3 text-stone-400">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-30 text-stone-400" />
                    <p className="text-xs font-medium text-stone-600">Không có tin nhắn</p>
                    <p className="text-[11px] mt-1 text-stone-400">
                      Khi bấm "Chat với người bán", cuộc trò chuyện sẽ hiện ở đây.
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isSelected = activeConv?.conversation_id === c.conversation_id;
                    const timeStr = formatConvTime(c.last_message?.created_at);

                    return (
                      <button
                        key={c.conversation_id}
                        onClick={() => handleSelectConversation(c)}
                        className={`w-full p-2.5 px-3 flex items-start gap-2.5 transition-colors text-left cursor-pointer ${
                          isSelected
                            ? 'bg-stone-100/90'
                            : 'hover:bg-stone-50 bg-white'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          {c.partner.avatar ? (
                            <img
                              src={c.partner.avatar}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-stone-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs uppercase">
                              {c.partner.full_name.charAt(0)}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                        </div>

                        {/* Thông tin tin nhắn */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-semibold text-stone-900 truncate">
                              {c.partner.full_name}
                            </h4>
                            {timeStr && (
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {timeStr}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`text-[11px] truncate flex-1 ${
                                c.unread_count > 0 ? 'font-bold text-stone-900' : 'text-stone-500'
                              }`}
                            >
                              {c.last_message?.text || 'Bắt đầu cuộc trò chuyện'}
                            </p>
                            {c.unread_count > 0 && (
                              <span className="flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-[#ea580c] text-white rounded-full shrink-0">
                                {c.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* CỘT PHẢI: KHUNG CHAT CHI TIẾT (Active Chat Pane)             */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div
              className={`flex-1 flex flex-col min-w-0 h-full bg-[#fbfbfb] ${
                !activeConv ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {activeConv ? (
                <>
                  {/* Top Bar Header Của Khung Chat */}
                  <div className="p-2.5 px-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Nút quay lại trên Mobile */}
                      <button
                        onClick={() => {
                          setActiveConv(null);
                          setActiveProductWidget(null);
                        }}
                        className="sm:hidden p-1 -ml-1 text-stone-600 hover:bg-stone-100 rounded cursor-pointer"
                        title="Quay lại"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-stone-900 truncate leading-tight">
                            {activeConv.partner.full_name}
                          </h3>
                          {activeConv.partner.shop && (
                            <Link
                              to={`/shop/${activeConv.partner.shop.id || activeConv.partner.id}`}
                              className="text-stone-400 hover:text-stone-700"
                              title="Xem shop"
                            >
                              <Store size={13} />
                            </Link>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {isTypingPartner ? 'Đang soạn tin...' : 'Đang trực tuyến'}
                        </p>
                      </div>
                    </div>

                    {activeConv.partner.shop && (
                      <Link
                        to={`/shop/${activeConv.partner.shop.id || activeConv.partner.id}`}
                        className="text-xs text-stone-600 hover:text-[#ea580c] font-medium flex items-center gap-1 px-2.5 py-1 rounded border border-stone-200 bg-stone-50 hover:bg-orange-50/40 transition-colors"
                      >
                        <span>Xem Shop</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>

                  {/* Cảnh báo an toàn giao dịch phong cách Shopee (Yellow Notice Banner) */}
                  <div className="m-2.5 mb-0 p-2.5 bg-[#fefce8] border border-[#fef08a] rounded-lg text-[11px] text-[#854d0e] leading-relaxed flex items-start gap-2 shadow-xs shrink-0">
                    <AlertCircle size={15} className="text-[#ca8a04] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">LƯU Ý: </span>
                      VietCraft KHÔNG cho phép các hành vi: Đặt cọc/Chuyển khoản riêng cho người bán/Giao dịch ngoài hệ thống. Vui lòng chỉ mua-bán trực tiếp trên ứng dụng VietCraft để đảm bảo an toàn!
                    </div>
                  </div>

                  {/* Product Widget đính kèm khi mở từ trang chi tiết sản phẩm */}
                  {activeProductWidget && (
                    <div className="m-2.5 mb-0 p-2 bg-white border border-emerald-300 rounded-lg shadow-xs flex items-center gap-2.5 shrink-0">
                      <img
                        src={activeProductWidget.image}
                        alt=""
                        className="w-11 h-11 rounded object-cover border border-stone-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {activeProductWidget.title}
                        </p>
                        <p className="text-xs font-bold text-[#15803d]">
                          {activeProductWidget.price.toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveProductWidget(null)}
                        className="text-stone-400 hover:text-stone-600 p-1"
                        title="Bỏ đính kèm"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* Danh Sách Tin Nhắn Cuộn */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* Badge Ngày */}
                    <div className="flex justify-center my-1">
                      <span className="text-[10px] text-stone-500 bg-stone-200/70 px-2.5 py-0.5 rounded-full font-medium">
                        {formatDatePill(messages[0]?.created_at)}
                      </span>
                    </div>

                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-32 text-xs text-stone-400">
                        <div className="w-4 h-4 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin mr-2" />
                        Đang tải tin nhắn...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-6 px-4">
                        <div className="w-10 h-10 mx-auto bg-emerald-50 text-[#15803d] rounded-full flex items-center justify-center mb-2">
                          <Store size={20} />
                        </div>
                        <p className="text-xs font-semibold text-stone-700">
                          Bắt đầu cuộc trò chuyện với {activeConv.partner.full_name}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Hãy hỏi thông tin chi tiết về sản phẩm, giao hàng hoặc yêu cầu tùy chỉnh theo ý bạn.
                        </p>

                        {/* Gợi ý câu hỏi nhanh */}
                        <div className="mt-3 flex flex-col gap-1.5 max-w-xs mx-auto">
                          {quickQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInputText(q)}
                              className="text-xs text-left px-2.5 py-1.5 bg-white border border-stone-200 hover:border-[#15803d] hover:text-[#15803d] rounded-md transition-colors cursor-pointer shadow-xs"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const firstProductIndex = messages.findIndex((m) => Boolean(m.product_widget));

                        return messages.map((m, idx) => {
                          const isMe = m.sender_id === user.id || m.sender_id === user._id;
                          const text = (m.message_text || '').trim();
                          const showProductWidget = Boolean(m.product_widget) && idx === firstProductIndex;

                          if (!text && !showProductWidget && !m.custom_quotation) {
                            return null;
                          }

                          const timeStr = new Date(m.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });

                          return (
                            <div
                              key={m.id || m._id || idx}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              {/* Thẻ Sản Phẩm đính kèm trong tin nhắn */}
                              {showProductWidget && m.product_widget && (
                                <div
                                  className={`mb-1 p-2 max-w-[240px] rounded-lg border flex items-center gap-2 shadow-xs ${
                                    isMe ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'
                                  }`}
                                >
                                  <img
                                    src={m.product_widget.image}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover border border-stone-100 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-stone-900 truncate">
                                      {m.product_widget.title}
                                    </p>
                                    <p className="text-xs font-bold text-[#15803d]">
                                      {m.product_widget.price.toLocaleString('vi-VN')}₫
                                    </p>
                                  </div>
                                  <a
                                    href={`/product/${m.product_widget.product_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-stone-400 hover:text-[#15803d] p-1 shrink-0"
                                    title="Xem sản phẩm"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                </div>
                              )}

                              {/* Thẻ Báo Giá Tùy Chỉnh */}
                              {m.custom_quotation && (
                                <div className="mb-1 p-2.5 max-w-[240px] rounded-lg bg-amber-50 border border-amber-200 shadow-xs">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                                    <Package size={13} /> Báo giá thiết kế riêng
                                  </div>
                                  <p className="text-sm font-extrabold text-amber-700">
                                    {m.custom_quotation.amount.toLocaleString('vi-VN')}₫
                                  </p>
                                  {m.custom_quotation.design_url && (
                                    <img
                                      src={m.custom_quotation.design_url}
                                      alt="Design preview"
                                      className="w-full h-20 object-cover rounded mt-1.5 border border-amber-200"
                                    />
                                  )}
                                </div>
                              )}

                              {/* Bong bóng tin nhắn văn bản */}
                              {m.message_text && (
                                <div
                                  className={`px-3 py-2 max-w-[80%] rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                                    isMe
                                      ? 'bg-[#15803d] text-white rounded-br-none'
                                      : 'bg-white text-stone-800 border border-stone-200/90 rounded-bl-none'
                                  }`}
                                >
                                  {m.message_text}
                                </div>
                              )}

                              {/* Thời gian & Trạng thái đã xem */}
                              <div
                                className={`flex items-center gap-1 mt-0.5 text-[10px] text-stone-400 ${
                                  isMe ? 'mr-1' : 'ml-1'
                                }`}
                              >
                                <span>{timeStr}</span>
                                {isMe && (
                                  <span title={m.is_read ? 'Đã xem' : 'Đã gửi'}>
                                    <CheckCheck
                                      size={11}
                                      className={m.is_read ? 'text-emerald-500' : 'text-stone-400'}
                                    />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}

                    {/* Chỉ báo đối phương đang soạn tin */}
                    {isTypingPartner && (
                      <div className="flex items-center gap-1 text-xs text-stone-500 italic bg-white px-2.5 py-1 rounded-full w-fit border border-stone-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {activeConv.partner.full_name} đang soạn tin...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Thanh Nhập Tin Nhắn Ở Đáy */}
                  <div className="p-2 px-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-[#15803d] focus:bg-white transition-all text-stone-800 placeholder-stone-400"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() && !activeProductWidget}
                      className="p-2 bg-[#15803d] text-white rounded-lg hover:bg-[#166534] disabled:opacity-40 disabled:hover:bg-[#15803d] transition-colors shrink-0 shadow-xs cursor-pointer"
                      title="Gửi tin nhắn"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </>
              ) : (
                /* Chưa chọn cuộc trò chuyện */
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                  <MessageCircle size={40} className="text-stone-300 mb-2" />
                  <p className="text-xs font-semibold text-stone-600">Chưa chọn cuộc trò chuyện</p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-[220px]">
                    Chọn một người bán từ danh sách bên trái để bắt đầu trao đổi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BuyerChatWidget;
