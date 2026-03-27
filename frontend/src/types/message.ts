export interface MessageSender {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender: MessageSender
  content: string
  message_type: 'text' | 'offer' | 'system'
  offer_amount: string | null
  offer_status: 'pending' | 'accepted' | 'rejected' | 'expired' | null
  is_read: boolean
  created_at: string
}

export interface ConversationListing {
  id: string
  title: string
  price: string
  thumbnail: string | null
}

export interface Conversation {
  id: string
  listing: ConversationListing
  other_user: MessageSender
  last_message: Message | null
  unread_count: number
  status: string
  created_at: string
  last_message_at: string | null
}
