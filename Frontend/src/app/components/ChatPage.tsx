import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../context/ChatContext';
import type { Conversation } from '../data/mockChat';
import { getListingById } from '../data/mockListings';

type ChatPageProps = {
  conversationId: string | null;
  isNewWithListingId: number | null;
};

export function ChatPage({ conversationId, isNewWithListingId }: ChatPageProps) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const {
    conversations,
    getConversation,
    findConversationByListingId,
    createConversation,
  } = useChat();

  useEffect(() => {
    if (isNewWithListingId != null) {
      const listing = getListingById(isNewWithListingId);
      if (!listing) {
        window.location.hash = '#chat';
        return;
      }
      const existing = findConversationByListingId(isNewWithListingId);
      if (existing) {
        window.location.hash = `#chat/${existing.id}`;
        return;
      }
      const newId = createConversation(
        listing.id,
        listing.title,
        listing.price,
        listing.image,
        `seller-${listing.sellerName.replace(/\s/g, '-')}`,
        listing.sellerName,
        listing.sellerAvatar,
        `Hi! Is ${listing.title} still available?`
      );
      window.location.hash = `#chat/${newId}`;
      console.log('Chat: new conversation created from listing', isNewWithListingId);
    }
  }, [isNewWithListingId, findConversationByListingId, createConversation]);

  useEffect(() => {
    if (conversationId && !conversationId.startsWith('new')) {
      const conv = getConversation(conversationId);
      setActiveConversation(conv ?? null);
      if (conv && window.innerWidth < 768) setIsMobileChatOpen(true);
    } else {
      setActiveConversation(null);
      setIsMobileChatOpen(false);
    }
  }, [conversationId, getConversation, conversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    window.location.hash = `#chat/${conv.id}`;
    if (window.innerWidth < 768) setIsMobileChatOpen(true);
    console.log('Chat: conversation selected', conv.id);
  };

  const handleBackToList = () => {
    setIsMobileChatOpen(false);
    window.location.hash = '#chat';
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all conversations and reset to demo data?')) {
      localStorage.removeItem('campuskart_conversations');
      window.location.reload();
    }
  };

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return (
    <div className="bg-[#F9FAFB] min-h-screen flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 bg-white border-b border-[#E5E7EB]">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1E3A8A] font-medium transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </a>
        <h1 className="text-xl font-bold text-[#111827]">Messages</h1>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-sm text-[#6B7280] hover:text-[#EF4444] transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Desktop: two columns */}
        <div className="hidden md:flex flex-1 min-w-0">
          <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
            <ConversationList
              conversations={sortedConversations}
              activeId={activeConversation?.id ?? null}
              onSelect={handleSelectConversation}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {activeConversation ? (
              <ChatWindow conversation={activeConversation} />
            ) : conversationId && !getConversation(conversationId) ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-[#111827] font-medium mb-2">Conversation not found</p>
                  <a href="#chat" className="text-[#1E3A8A] hover:underline">Back to messages</a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#6B7280] p-8">
                <p>Select a conversation or contact a seller from a listing.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: single column with toggle */}
        <div className="flex-1 flex md:hidden min-h-0">
          {!isMobileChatOpen ? (
            <div className="flex-1 flex flex-col min-h-0">
              {sortedConversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[#6B7280]">No messages yet. Contact a seller to start chatting!</p>
                </div>
              ) : (
                <ConversationList
                  conversations={sortedConversations}
                  activeId={null}
                  onSelect={handleSelectConversation}
                />
              )}
            </div>
          ) : activeConversation ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <ChatWindow
                conversation={activeConversation}
                onBack={handleBackToList}
                isMobile
              />
            </div>
          ) : conversationId && !getConversation(conversationId) ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-[#111827] font-medium mb-2">Conversation not found</p>
                <button type="button" onClick={handleBackToList} className="text-[#1E3A8A] hover:underline">Back to messages</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
