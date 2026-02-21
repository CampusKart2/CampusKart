import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Conversation, Message } from '../data/mockChat';
import {
  loadConversationsFromStorage,
  saveConversationsToStorage,
  getSellerAutoReply,
} from '../data/mockChat';

const BUYER_ID = 'buyer-me';
const BUYER_NAME = 'You';

type ChatContextValue = {
  conversations: Conversation[];
  totalUnreadCount: number;
  getConversation: (id: string) => Conversation | undefined;
  findConversationByListingId: (listingId: number) => Conversation | undefined;
  addMessage: (conversationId: string, text: string) => void;
  addSellerReply: (conversationId: string, text: string, sellerId: string, sellerName: string) => void;
  markConversationRead: (conversationId: string) => void;
  createConversation: (listingId: number, listingTitle: string, listingPrice: number, listingImage: string, sellerId: string, sellerName: string, sellerAvatar: string, firstMessage?: string) => string;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(loadConversationsFromStorage());
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      saveConversationsToStorage(conversations);
    }
  }, [conversations]);

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id),
    [conversations]
  );

  const findConversationByListingId = useCallback(
    (listingId: number) => conversations.find((c) => c.listingId === listingId),
    [conversations]
  );

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          unreadCount: 0,
          messages: c.messages.map((m) => ({ ...m, isRead: true })),
        };
      })
    );
    console.log('Chat: conversation marked read', conversationId);
  }, []);

  const addMessage = useCallback((conversationId: string, text: string) => {
    const now = new Date();
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      conversationId,
      senderId: BUYER_ID,
      senderName: BUYER_NAME,
      text,
      timestamp: now,
      isRead: false,
      isSender: true,
    };

    setConversations((prev) => {
      const conv = prev.find((c) => c.id === conversationId);
      if (!conv) return prev;
      const updated = prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: now,
          messages: [...c.messages, newMsg],
        };
      });
      return updated;
    });

    console.log('Chat: message sent', conversationId, text);
  }, []);

  const addSellerReply = useCallback((conversationId: string, text: string, sellerId: string, sellerName: string) => {
    const now = new Date();
    const newMsg: Message = {
      id: `msg-${Date.now()}-seller-${Math.random().toString(36).slice(2, 9)}`,
      conversationId,
      senderId,
      senderName,
      text,
      timestamp: now,
      isRead: true,
      isSender: false,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: now,
          unreadCount: c.unreadCount + 1,
          messages: [...c.messages, newMsg],
        };
      })
    );
    console.log('Chat: auto-reply sent', conversationId, text);
  }, []);

  const createConversation = useCallback(
    (
      listingId: number,
      listingTitle: string,
      listingPrice: number,
      listingImage: string,
      sellerId: string,
      sellerName: string,
      sellerAvatar: string,
      firstMessage?: string
    ): string => {
      const existing = conversations.find((c) => c.listingId === listingId);
      if (existing) return existing.id;

      const id = `conv-${Date.now()}`;
      const now = new Date();
      const initialMsg: Message = {
        id: `msg-${Date.now()}-init`,
        conversationId: id,
        senderId: BUYER_ID,
        senderName: BUYER_NAME,
        text: firstMessage ?? `Hi! Is ${listingTitle} still available?`,
        timestamp: now,
        isRead: false,
        isSender: true,
      };

      const newConv: Conversation = {
        id,
        listingId,
        listingTitle,
        listingPrice,
        listingImage,
        sellerId,
        sellerName,
        sellerAvatar,
        lastMessage: initialMsg.text,
        lastMessageTime: now,
        unreadCount: 0,
        messages: [initialMsg],
      };

      setConversations((prev) => [...prev, newConv]);
      console.log('Chat: new conversation created', id, listingTitle);
      return id;
    },
    [conversations]
  );

  const value: ChatContextValue = {
    conversations,
    totalUnreadCount,
    getConversation,
    findConversationByListingId,
    addMessage,
    addSellerReply,
    markConversationRead,
    createConversation,
    setConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

export { getSellerAutoReply };
