import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Conversation } from '../data/mockChat';
import { formatMessageTime } from '../data/mockChat';

type ConversationListProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
};

function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-[#E5E7EB] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const isActive = activeId === conv.id;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-all duration-300 hover:bg-[#F9FAFB] border-b border-[#E5E7EB] last:border-b-0 ${
                isActive ? 'bg-[#EFF6FF] hover:bg-[#DBEAFE]' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {conv.sellerAvatar ? (
                    <img
                      src={conv.sellerAvatar}
                      alt={conv.sellerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(conv.sellerName)
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#111827] truncate">{conv.sellerName}</span>
                  <span className="text-xs text-[#6B7280] flex-shrink-0">
                    {formatMessageTime(conv.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] truncate mt-0.5">{conv.listingTitle}</p>
                <p className="text-sm text-[#6B7280] truncate mt-0.5">
                  {conv.lastMessage.length > 40 ? conv.lastMessage.slice(0, 40) + '…' : conv.lastMessage}
                </p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={conv.listingImage}
                  alt={conv.listingTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
