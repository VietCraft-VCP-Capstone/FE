export interface ProductWidget {
  product_id: string;
  title: string;
  price: number;
  image: string;
}

export interface CustomQuotation {
  amount: number;
  design_url: string;
  status: 'OFFERED' | 'ACCEPTED' | 'REJECTED';
}

export interface ChatMessage {
  id: string;
  _id?: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text?: string;
  attachments?: string[];
  product_widget?: ProductWidget;
  custom_quotation?: CustomQuotation;
  is_read: boolean;
  created_at: string;
}

export interface ConversationPartner {
  id: string;
  full_name: string;
  avatar?: string;
  email: string;
  role: string;
  shop?: {
    id: string;
    name: string;
    logo?: string;
    slug?: string;
  };
}

export interface ConversationItem {
  conversation_id: string;
  partner: ConversationPartner;
  last_message?: {
    text: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  updated_at: string;
}

export interface StartConversationPayload {
  partnerId?: string;
  shopId?: string;
  initialMessage?: string;
  productWidget?: ProductWidget;
}

export interface SendMessagePayload {
  receiver_id?: string;
  message_text?: string;
  attachments?: string[];
  product_widget?: ProductWidget;
  custom_quotation?: CustomQuotation;
}

export function appendUniqueMessage(prev: ChatMessage[], newMsg: ChatMessage): ChatMessage[] {
  const newId = newMsg.id || (newMsg as any)._id;
  if (newId) {
    const exists = prev.some((m) => (m.id && m.id === newId) || ((m as any)._id && (m as any)._id === newId));
    if (exists) return prev;
  }
  const isDuplicate = prev.some(
    (m) =>
      m.sender_id === newMsg.sender_id &&
      (m.message_text || '') === (newMsg.message_text || '') &&
      Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 3000
  );
  if (isDuplicate) return prev;

  return [...prev, newMsg];
}

export function filterUniqueMessages(list: ChatMessage[]): ChatMessage[] {
  const seenIds = new Set<string>();
  const uniqueList: ChatMessage[] = [];

  for (const m of list) {
    const id = m.id || (m as any)._id;
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      uniqueList.push(m);
    } else if (!id) {
      uniqueList.push(m);
    }
  }

  // Lọc bỏ thẻ sản phẩm trùng lặp liên tiếp không có nội dung chữ
  const result: ChatMessage[] = [];
  for (let i = 0; i < uniqueList.length; i++) {
    const cur = uniqueList[i];
    const prev = result[result.length - 1];
    if (
      prev &&
      !prev.message_text?.trim() &&
      !cur.message_text?.trim() &&
      prev.product_widget &&
      cur.product_widget &&
      prev.product_widget.product_id === cur.product_widget.product_id
    ) {
      continue;
    }
    result.push(cur);
  }

  return result;
}
