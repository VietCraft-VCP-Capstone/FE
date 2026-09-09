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
