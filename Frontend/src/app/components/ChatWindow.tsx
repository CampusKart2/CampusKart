import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { Conversation } from '../data/mockChat';
import { formatMessageTime } from '../data/mockChat';
import { getSellerAutoReply } from '../data/mockChat';
import { useChat } from '../context/ChatContext';

type ChatWindowProps = {
  conversation: Conversation;
  onBack?: () => void;
  isMobile?: boolean;
};

const QUICK_REPLIES = ['Is this available?', 'Can we meet?', "I'll take it!"];

export function ChatWindow({ conversation, onBack, isMobile }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addMessage, addSellerReply, markConversationRead } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isTyping]);

  useEffect(() => {
    markConversationRead(conversation.id);
    console.log('Chat: conversation opened', conversation.id);
  }, [conversation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMessage(conversation.id, trimmed);
    setInputValue('');
    toast.success('Message sent!');
    scrollToBottom();

    const delay = 3000 + Math.random() * 2000;
    const typingDuration = 2000;

    const typingTimer = setTimeout(() => {
      setIsTyping(true);
    }, delay - typingDuration);
    timersRef.current.push(typingTimer);

    const replyTimer = setTimeout(() => {
      setIsTyping(false);
      const replyText = getSellerAutoReply(trimmed);
      addSellerReply(conversation.id, replyText, conversation.sellerId, conversation.sellerName);
      toast.success(`New message from ${conversation.sellerName}`);
      scrollToBottom();
    }, delay);
    timersRef.current.push(replyTimer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const showTimestamp = (idx: number) => {
    if (idx === 0) return true;
    const prev = conversation.messages[idx - 1];
    const curr = conversation.messages[idx];
    const diff = curr.timestamp.getTime() - prev.timestamp.getTime();
    return diff > 5 * 60 * 1000;
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 p-3 bg-white border-b border-[#E5E7EB]">
        {isMobile && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 text-[#6B7280] hover:text-[#1E3A8A] hover:bg-[#F9FAFB] rounded-lg transition-all duration-300"
            aria-label="Back to conversations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[#111827] truncate">{conversation.sellerName}</h2>
          <a
            href={`#listing/${conversation.listingId}`}
            className="text-sm text-[#6B7280] hover:text-[#1E3A8A] truncate block"
          >
            {conversation.listingTitle} – {conversation.listingPrice === 0 ? 'Free' : `$${conversation.listingPrice}`}
          </a>
        </div>
        <a
          href={`#listing/${conversation.listingId}`}
          className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-[#1E3A8A] border border-[#1E3A8A] rounded-lg hover:bg-[#EFF6FF] transition-all duration-300"
        >
          View Listing
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages.length === 0 ? (
          <p className="text-center text-[#6B7280] py-8">Start the conversation</p>
        ) : (
          <>
            {conversation.messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                {showTimestamp(idx) && (
                  <p className="text-center text-xs text-[#6B7280] py-1">
                    {formatMessageTime(msg.timestamp)}
                  </p>
                )}
                <MessageBubble message={msg} isSender={msg.isSender} />
              </React.Fragment>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1 text-sm text-[#6B7280] py-2">
                <span>{conversation.sellerName} is typing</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 bg-white border-t border-[#E5E7EB]">
        <div className="flex gap-2 mb-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleQuickReply(reply)}
              className="px-3 py-1.5 text-xs font-medium text-[#1E3A8A] bg-[#EFF6FF] rounded-full hover:bg-[#DBEAFE] transition-all duration-300"
            >
              {reply}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 h-11 px-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center hover:bg-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
