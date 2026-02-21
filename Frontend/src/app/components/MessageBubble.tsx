import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '../data/mockChat';
import { formatMessageTime } from '../data/mockChat';

type MessageBubbleProps = {
  message: Message;
  isSender: boolean;
};

export function MessageBubble({ message, isSender }: MessageBubbleProps) {
  return (
    <div
      className={`flex flex-col max-w-[70%] animate-in fade-in duration-300 ${
        isSender ? 'items-end ml-auto' : 'items-start'
      }`}
    >
      <div
        className={`rounded-2xl px-3 py-2.5 ${
          isSender
            ? 'bg-[#1E3A8A] text-white rounded-br-md'
            : 'bg-[#F3F4F6] text-[#111827] rounded-bl-md'
        }`}
      >
        <p className="text-[15px] leading-snug break-words">{message.text}</p>
      </div>
      <div className={`flex items-center gap-1 mt-0.5 ${isSender ? 'flex-row-reverse' : ''}`}>
        <span className="text-xs text-[#6B7280]">{formatMessageTime(message.timestamp)}</span>
        {isSender && (
          <span className="text-[#6B7280]">
            {message.isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#1E3A8A]" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
