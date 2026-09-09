import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, X, Minus, ArrowLeft, Send, Store,
  CheckCheck, ExternalLink, Package
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { useChatSocket } from '../hooks/useChatSocket';
import { ChatMessage, ConversationItem, ProductWidget } from '../types/chatTypes';

interface BuyerChatWidgetProps {
  user: any;
}

export function BuyerChatWidget({ user }: BuyerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductWidget, setActiveProductWidget] = useState<ProductWidget | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRoomId = activeConv?.conversation_id;

  const { isTypingPartner, sendMessage, sendTyping, markRead } = useChatSocket(currentRoomId);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Tải danh sách hội thoại & tổng số tin chưa đọc
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const list = await chatService.getConversations();
      setConversations(list);
      const unread = list.reduce((sum, item) => sum + (item.unread_count || 0), 0);
      setTotalUnread(unread);
    } catch {
      // Ignored if offline
    }
  }, [user]);

  // Tải tin nhắn của cuộc trò chuyện hiện tại
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const history = await chatService.getMessages(convId);
      setMessages(history);
      markRead(convId);
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
        setMessages((prev) => [...prev, msg]);
        markRead(activeConv.conversation_id);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      fetchConversations();
    };

    const onUnreadUpdated = (e: any) => {
      const { unreadCount } = e.detail || {};
      if (typeof unreadCount === 'number') {
        setTotalUnread(unreadCount);
      }
      fetchConversations();
    };

    const onOpenChat = async (e: any) => {
      const { shopId, partnerId, productWidget } = e.detail || {};
      setIsOpen(true);

      if (productWidget) {
        setActiveProductWidget(productWidget);
      }

      if (shopId || partnerId) {
        setLoadingConv(true);
        try {
          const conv = await chatService.startConversation({
            shopId,
            partnerId,
            productWidget
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

    try {
      const sent = await sendMessage({
        roomId: activeConv.conversation_id,
        receiverId: activeConv.partner.id,
        message: text,
        productWidget: widgetToSend || undefined
      });

      if (sent) {
        setMessages((prev) => [...prev, sent]);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      fetchConversations();
    } catch {
      // Fallback qua REST API nếu socket bị nghẽn
      try {
        const fallbackMsg = await chatService.sendMessage(activeConv.conversation_id, {
          receiver_id: activeConv.partner.id,
          message_text: text,
          product_widget: widgetToSend || undefined
        });
        setMessages((prev) => [...prev, fallbackMsg]);
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

  const filteredConversations = conversations.filter((c) =>
    c.partner.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Nút Bong Bóng Chat Nổi */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            fetchConversations();
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#15803d] to-[#16a34a] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 group"
          title="Tin nhắn với người bán"
        >
          <MessageCircle size={26} className="group-hover:rotate-12 transition-transform duration-200" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold bg-red-500 text-white rounded-full border-2 border-white shadow-md animate-pulse">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Cửa Sổ Chat Pop-up */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[540px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#15803d] to-[#166534] text-white p-3.5 flex items-center justify-between select-none shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeConv ? (
                <>
                  <button
                    onClick={() => {
                      setActiveConv(null);
                      setActiveProductWidget(null);
                      fetchConversations();
                    }}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                    title="Quay lại danh sách"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative">
                    {activeConv.partner.avatar ? (
                      <img
                        src={activeConv.partner.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-white/30"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold uppercase">
                        {activeConv.partner.full_name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate leading-tight flex items-center gap-1.5">
                      {activeConv.partner.full_name}
                      {activeConv.partner.shop && (
                        <span title="Gian hàng VietCraft" className="inline-flex items-center">
                          <Store size={13} className="text-emerald-200 shrink-0" />
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      {isTypingPartner ? 'Đang soạn tin...' : 'Đang trực tuyến'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm leading-tight">VietCraft Chat</h3>
                    <p className="text-[11px] text-emerald-100">Trao đổi trực tiếp với người bán</p>
                  </div>
                </div>
              )}
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                title="Thu nhỏ"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {activeConv ? (
            /* Khung Tin Nhắn Trực Tiếp */
            <div className="flex-1 flex flex-col overflow-hidden bg-stone-50">
              {/* Product Widget đính kèm khi mở từ trang chi tiết sản phẩm */}
              {activeProductWidget && (
                <div className="m-2.5 p-2.5 bg-white border border-emerald-200 rounded-xl shadow-xs flex items-center gap-3">
                  <img
                    src={activeProductWidget.image}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-stone-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-900 truncate">
                      {activeProductWidget.title}
                    </p>
                    <p className="text-xs font-bold text-[#15803d]">
                      {activeProductWidget.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveProductWidget(null)}
                    className="text-stone-400 hover:text-stone-600 p-1"
                    title="Bỏ đính kèm"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Danh Sách Tin Nhắn */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full text-xs text-stone-400">
                    <div className="w-5 h-5 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin mr-2" />
                    Đang tải lịch sử tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 mx-auto bg-emerald-50 text-[#15803d] rounded-full flex items-center justify-center mb-2">
                      <Store size={22} />
                    </div>
                    <p className="text-xs font-semibold text-stone-700">
                      Bắt đầu cuộc trò chuyện với {activeConv.partner.full_name}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Hãy hỏi thông tin chi tiết về sản phẩm, giao hàng hoặc yêu cầu tùy chỉnh theo ý bạn.
                    </p>

                    {/* Câu hỏi nhanh gợi ý */}
                    <div className="mt-4 flex flex-col gap-1.5">
                      {quickQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputText(q);
                          }}
                          className="text-xs text-left px-3 py-1.5 bg-white border border-stone-200 hover:border-[#15803d] hover:text-[#15803d] rounded-lg transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user.id || m.sender_id === user._id;
                    const timeStr = new Date(m.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={m.id || m._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Thẻ Sản Phẩm đính kèm trong tin nhắn */}
                        {m.product_widget && (
                          <div
                            className={`mb-1 p-2 max-w-[260px] rounded-xl border flex items-center gap-2.5 shadow-xs ${
                              isMe ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'
                            }`}
                          >
                            <img
                              src={m.product_widget.image}
                              alt=""
                              className="w-11 h-11 rounded-md object-cover border border-stone-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-stone-900 truncate">
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
                              className="text-stone-400 hover:text-[#15803d] p-1 shrink-0"
                              title="Xem sản phẩm"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        )}

                        {/* Thẻ Báo Giá Tùy Chỉnh (Custom Quotation) */}
                        {m.custom_quotation && (
                          <div className="mb-1 p-3 max-w-[260px] rounded-xl bg-amber-50 border border-amber-200 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                              <Package size={14} /> Báo giá thiết kế riêng
                            </div>
                            <p className="text-sm font-extrabold text-amber-700">
                              {m.custom_quotation.amount.toLocaleString('vi-VN')}đ
                            </p>
                            {m.custom_quotation.design_url && (
                              <img
                                src={m.custom_quotation.design_url}
                                alt="Design preview"
                                className="w-full h-24 object-cover rounded-lg mt-2 border border-amber-200"
                              />
                            )}
                          </div>
                        )}

                        {/* Bong bóng tin nhắn văn bản */}
                        {m.message_text && (
                          <div
                            className={`px-3.5 py-2 max-w-[80%] rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                              isMe
                                ? 'bg-[#15803d] text-white rounded-br-none'
                                : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
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
                                size={12}
                                className={m.is_read ? 'text-emerald-500' : 'text-stone-400'}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Chỉ báo đối phương đang soạn tin */}
                {isTypingPartner && (
                  <div className="flex items-center gap-1 text-xs text-stone-500 italic bg-white px-3 py-1.5 rounded-full w-fit border border-stone-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {activeConv.partner.full_name} đang soạn tin...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Ô Nhập Tin Nhắn */}
              <div className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-[#15803d] focus:bg-white transition-all text-stone-800 placeholder-stone-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() && !activeProductWidget}
                  className="p-2 bg-[#15803d] text-white rounded-xl hover:bg-[#166534] disabled:opacity-40 disabled:hover:bg-[#15803d] transition-colors shrink-0 shadow-xs"
                  title="Gửi tin nhắn"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          ) : (
            /* Danh Sách Hội Thoại */
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Thanh Tìm Kiếm */}
              <div className="p-2.5 border-b border-stone-100">
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-[#15803d] focus:bg-white transition-all text-stone-800 placeholder-stone-400"
                />
              </div>

              {/* Danh Sách Item */}
              <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
                {loadingConv ? (
                  <div className="flex items-center justify-center h-48 text-xs text-stone-400">
                    <div className="w-5 h-5 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin mr-2" />
                    Đang tải danh sách...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4 text-stone-400">
                    <MessageCircle size={36} className="mx-auto mb-2 opacity-30 text-[#15803d]" />
                    <p className="text-xs font-semibold text-stone-600">Chưa có cuộc trò chuyện nào</p>
                    <p className="text-[11px] mt-1">
                      Khi duyệt sản phẩm, hãy bấm nút "Chat với người bán" để trao đổi trực tiếp!
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((c) => (
                    <button
                      key={c.conversation_id}
                      onClick={() => handleSelectConversation(c)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-emerald-50/40 transition-colors text-left"
                    >
                      <div className="relative shrink-0">
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
                          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                            {c.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {c.partner.full_name}
                          </h4>
                          {c.last_message && (
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {new Date(c.last_message.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] truncate ${
                            c.unread_count > 0 ? 'font-bold text-stone-900' : 'text-stone-500'
                          }`}
                        >
                          {c.last_message?.text || 'Bắt đầu cuộc trò chuyện'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default BuyerChatWidget;
