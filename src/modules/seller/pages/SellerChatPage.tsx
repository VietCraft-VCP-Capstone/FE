import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, RotateCcw, Tag, Paperclip, Image as ImageIcon,
  Bold, Italic, List, CheckCheck, MessageSquare
} from 'lucide-react';
import { chatService } from '../../chat/services/chatService';
import { useSocket } from '../../../infrastructure/websocket/useSocket';
import { ChatMessage, ConversationItem, ProductWidget } from '../../chat/types/chatTypes';

const getInitials = (name: string) => {
  if (!name) return 'KH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatConvTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[d.getDay()];
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const formatDatePill = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const now = new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  if (d.toDateString() === now.toDateString()) {
    return `Hôm nay, ${day} Tháng ${month}`;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hôm qua, ${day} Tháng ${month}`;
  }
  return `${day} Tháng ${month}, ${d.getFullYear()}`;
};

export function SellerChatPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'ORDER'>('ALL');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentRoomId = activeConv?.conversation_id;

  const { isTypingPartner, sendMessage, sendTyping, markRead } = useSocket(currentRoomId);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Tải danh sách hội thoại từ Backend
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
      setTimeout(() => scrollToBottom('auto'), 60);
    } catch (err) {
      console.error('Lỗi tải tin nhắn seller:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [markRead]);

  // Lắng nghe các event realtime
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (activeConv) {
      sendTyping(activeConv.conversation_id, e.target.value.length > 0);
    }
  };

  // Các nút công cụ soạn thảo tin nhắn
  const applyFormatting = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = inputText.substring(start, end);
    const replacement = prefix + (selected || 'văn bản') + suffix;
    const newText = inputText.substring(0, start) + replacement + inputText.substring(end);
    setInputText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 7));
    }, 10);
  };

  const handleInsertVoucher = () => {
    setInputText((prev) => (prev ? prev + ' [Mã giảm giá: VIETCRAFT10 - Giảm 10%]' : 'Gửi bạn mã giảm giá: VIETCRAFT10 (Giảm 10% cho đơn hàng này) nhé!'));
    textareaRef.current?.focus();
  };

  // Trích xuất thông tin sản phẩm đính kèm từ hội thoại/tin nhắn (nếu có)
  const attachedProduct: ProductWidget | undefined = messages.slice().reverse().find((m) => m.product_widget)?.product_widget;

  // Lọc danh sách hội thoại
  const filteredList = conversations.filter((c) => {
    const matchesSearch = c.partner.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'UNREAD') {
      return matchesSearch && c.unread_count > 0;
    }
    if (filterTab === 'ORDER') {
      return matchesSearch; // Sẽ lọc theo đơn hàng khi có trường orderId
    }
    return matchesSearch;
  });

  return (
    <div className="w-full h-full flex flex-row overflow-hidden bg-white font-sans select-none">
      {/* ────────────────────────────────────────────────────────── */}
      {/* CỘT TRÁI: DANH SÁCH CUỘC TRÒ CHUYỆN (WIDTH: ~340px)       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-80 lg:w-[340px] flex flex-col shrink-0 border-r border-stone-200 bg-white">
        {/* Tiêu đề "Tin nhắn" */}
        <div className="px-5 pt-4 pb-2">
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">Tin nhắn</h1>
        </div>

        {/* Ô Tìm kiếm tin nhắn */}
        <div className="px-4 pb-3">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#f4f7f4] border border-stone-200/90 rounded-lg outline-none focus:bg-white focus:border-[#0a5c15] text-stone-800 placeholder-stone-400 transition-all"
            />
          </div>
        </div>

        {/* Các tab: Tất cả | Chưa đọc | Đơn hàng */}
        <div className="flex border-b border-stone-200 px-5 text-xs font-semibold gap-6">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              filterTab === 'ALL'
                ? 'text-[#0a5c15] font-bold border-b-2 border-[#0a5c15]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterTab('UNREAD')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              filterTab === 'UNREAD'
                ? 'text-[#0a5c15] font-bold border-b-2 border-[#0a5c15]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Chưa đọc
          </button>
          <button
            onClick={() => setFilterTab('ORDER')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              filterTab === 'ORDER'
                ? 'text-[#0a5c15] font-bold border-b-2 border-[#0a5c15]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Đơn hàng
          </button>
        </div>

        {/* Danh sách các cuộc trò chuyện */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {loadingConv ? (
            <div className="p-8 text-center text-xs text-stone-400">
              <div className="w-5 h-5 border-2 border-[#0a5c15] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Đang tải tin nhắn...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <MessageSquare size={36} className="opacity-20 text-stone-400 mb-2" />
              <p className="text-xs font-semibold text-stone-600">Chưa có tin nhắn</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
                Khi người mua gửi tin nhắn, cuộc hội thoại sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            filteredList.map((c) => {
              const isSelected = activeConv?.conversation_id === c.conversation_id;
              const timeStr = formatConvTime(c.last_message?.created_at);

              return (
                <button
                  key={c.conversation_id}
                  onClick={() => handleSelectConv(c)}
                  className={`w-full p-3.5 px-4 flex items-start gap-3 text-left transition-colors relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#f4f9f4] border-l-4 border-l-[#0a5c15]'
                      : 'hover:bg-stone-50 bg-white'
                  }`}
                >
                  {/* Avatar + chấm online */}
                  <div className="relative shrink-0 mt-0.5">
                    {c.partner.avatar ? (
                      <img
                        src={c.partner.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-stone-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0a5c15] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {getInitials(c.partner.full_name)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-purple-600 border-2 border-white rounded-full" />
                  </div>

                  {/* Nội dung tóm tắt */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-stone-900 truncate">
                        {c.partner.full_name}
                      </span>
                      <span className="text-[10px] text-stone-400 shrink-0">{timeStr}</span>
                    </div>
                    <p className="text-xs text-stone-500 truncate mb-1">
                      {c.last_message?.text || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      {/* Badge #POD mã đơn/sản phẩm */}
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded">
                        #POD-{c.conversation_id.substring(c.conversation_id.length - 4).toUpperCase()}
                      </span>
                      {c.unread_count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center ml-auto">
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* CỘT PHẢI: KHUNG CHAT CHÍNH (FULL CHIỀU RỘNG CÒN LẠI)      */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
        {activeConv ? (
          <>
            {/* Header thanh trên: Thông tin khách hàng & nút "Xem lịch sử đơn hàng" */}
            <div className="p-3.5 px-6 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  {activeConv.partner.avatar ? (
                    <img
                      src={activeConv.partner.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0a5c15] text-white flex items-center justify-center font-bold text-xs uppercase">
                      {getInitials(activeConv.partner.full_name)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-purple-600 border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-stone-900 truncate">
                    {activeConv.partner.full_name}
                  </h3>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                    <span>{isTypingPartner ? 'Đang soạn tin...' : 'Trực tuyến'}</span>
                  </p>
                </div>
              </div>

              {/* Nút Xem lịch sử đơn hàng */}
              <button
                type="button"
                onClick={() => navigate('/seller/orders')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer shadow-none"
              >
                <RotateCcw size={13} />
                <span>Xem lịch sử đơn hàng</span>
              </button>
            </div>

            {/* Banner ngữ cảnh sản phẩm / đơn hàng (pinned dưới header) */}
            {attachedProduct && (
              <div className="bg-[#edf7ed] border-b border-emerald-200/70 p-3 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={attachedProduct.image}
                    alt=""
                    className="w-12 h-12 rounded-md object-cover border border-stone-200 bg-white shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-stone-200/80 text-stone-700 rounded">
                        #POD-{attachedProduct.product_id.substring(attachedProduct.product_id.length - 4).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-100 text-red-600 rounded">
                        Cần xử lý
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#0a5c15] truncate">
                      {attachedProduct.title}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Sản phẩm • {attachedProduct.price.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInsertVoucher}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0a5c15] hover:bg-[#074710] rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer ml-4"
                >
                  <Tag size={13} />
                  <span>Gửi Voucher ưu đãi</span>
                </button>
              </div>
            )}

            {/* Dòng thời gian tin nhắn (Canvas cuộn) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {/* Badge ngày tháng ở giữa */}
              <div className="flex justify-center my-2">
                <span className="text-xs text-stone-500 bg-[#eef2ee] border border-stone-200/70 px-3.5 py-1 rounded-full font-medium">
                  {formatDatePill(messages[0]?.created_at)}
                </span>
              </div>

              {loadingMessages ? (
                <div className="flex items-center justify-center h-40 text-xs text-stone-400">
                  <div className="w-5 h-5 border-2 border-[#0a5c15] border-t-transparent rounded-full animate-spin mr-2" />
                  Đang tải nội dung...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-30 text-stone-400" />
                  <p className="text-xs font-semibold text-stone-600">Chưa có tin nhắn nào</p>
                  <p className="text-[11px] text-stone-400 mt-1">Hãy gửi phản hồi cho khách hàng!</p>
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
                      {!isMe ? (
                        /* Tin nhắn từ người mua (Bên trái: Avatar + Bong bóng trắng viền xám) */
                        <div className="flex items-start gap-2.5 max-w-[70%]">
                          {activeConv.partner.avatar ? (
                            <img
                              src={activeConv.partner.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-stone-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5">
                              {activeConv.partner.full_name.substring(0, 1)}
                            </div>
                          )}

                          <div>
                            <div className="bg-white border border-stone-200 text-stone-800 rounded-2xl rounded-tl-xs p-3.5 px-4 text-xs sm:text-sm leading-relaxed shadow-xs">
                              {m.message_text}
                            </div>
                            <span className="text-[10px] text-stone-400 mt-1 ml-1 block">
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Tin nhắn từ người bán (Bên phải: Bong bóng xanh lá đậm #0a5c15) */
                        <div className="flex flex-col items-end max-w-[70%]">
                          <div className="bg-[#0a5c15] text-white rounded-2xl rounded-tr-xs p-3.5 px-4 text-xs sm:text-sm leading-relaxed shadow-xs">
                            {m.message_text}
                          </div>
                          <div className="flex items-center gap-1 mt-1 mr-1 text-[10px] text-stone-400">
                            <span>{timeStr}</span>
                            <CheckCheck
                              size={12}
                              className={m.is_read ? 'text-emerald-500' : 'text-stone-400'}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Chỉ báo khách hàng đang soạn tin */}
              {isTypingPartner && (
                <div className="flex items-center gap-1.5 text-xs text-stone-500 italic bg-stone-50 px-3.5 py-1.5 rounded-full w-fit border border-stone-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                  {activeConv.partner.full_name} đang soạn tin...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Khung Soạn Thảo Tin Nhắn Chuẩn Mẫu (Rich Input Box) */}
            <div className="m-5 mt-2 border border-stone-300 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col shrink-0">
              {/* Thanh công cụ định dạng (B, I, List, Thêm mã giảm giá) */}
              <div className="px-3.5 py-2 border-b border-stone-200 flex items-center gap-3 bg-white text-stone-600">
                <button
                  type="button"
                  onClick={() => applyFormatting('**', '**')}
                  className="font-bold text-xs px-1.5 py-0.5 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
                  title="In đậm"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('*', '*')}
                  className="italic text-xs px-1.5 py-0.5 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
                  title="In nghiêng"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('\n- ', '')}
                  className="px-1.5 py-0.5 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
                  title="Danh sách gạch đầu dòng"
                >
                  <List size={14} />
                </button>
                <span className="h-4 w-px bg-stone-200" />
                <button
                  type="button"
                  onClick={handleInsertVoucher}
                  className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-[#0a5c15] font-medium cursor-pointer"
                >
                  <Tag size={13} />
                  <span>Thêm mã giảm giá</span>
                </button>
              </div>

              {/* Ô Nhập văn bản */}
              <textarea
                ref={textareaRef}
                rows={3}
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm outline-none resize-none border-none text-stone-800 placeholder-stone-400"
              />

              {/* Thanh hành động dưới cùng: Đính kèm file, ảnh và nút Gửi */}
              <div className="px-3.5 py-2 flex items-center justify-between border-t border-stone-100 bg-white">
                <div className="flex items-center gap-1 text-stone-500">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:text-stone-800 hover:bg-stone-50 rounded transition-colors cursor-pointer"
                    title="Đính kèm tệp"
                  >
                    <Paperclip size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:text-stone-800 hover:bg-stone-50 rounded transition-colors cursor-pointer ml-1"
                    title="Đính kèm hình ảnh"
                  >
                    <ImageIcon size={17} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={() => {}}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#0b6417] hover:bg-[#094d12] disabled:opacity-50 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
                >
                  <span>Gửi</span>
                  <Send size={12} className="fill-current" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Khi chưa chọn cuộc trò chuyện */
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8">
            <MessageSquare size={48} className="text-stone-300 mb-3" />
            <p className="text-sm font-bold text-stone-700">Chưa chọn cuộc trò chuyện</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm text-center">
              Chọn một khách hàng ở danh sách bên trái để xem nội dung và bắt đầu hỗ trợ.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerChatPage;
