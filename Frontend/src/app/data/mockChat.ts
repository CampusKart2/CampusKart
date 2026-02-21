export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  isSender: boolean;
}

export interface Conversation {
  id: string;
  listingId: number;
  listingTitle: string;
  listingPrice: number;
  listingImage: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

const STORAGE_KEY = 'campuskart_conversations';

const BUYER_ID = 'buyer-me';
const BUYER_NAME = 'You';

function now(): Date {
  return new Date();
}

function minutesAgo(m: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - m);
  return d;
}

function hoursAgo(h: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function createSeedConversations(): Conversation[] {
  const conv1Id = 'conv-1';
  const conv2Id = 'conv-2';
  const conv3Id = 'conv-3';
  const conv4Id = 'conv-4';

  const messages1: Message[] = [
    { id: 'm1-1', conversationId: conv1Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Hi! Is the Calculus textbook still available?', timestamp: hoursAgo(3), isRead: true, isSender: true },
    { id: 'm1-2', conversationId: conv1Id, senderId: 'seller-alex', senderName: 'Alex M.', text: 'Yes, it\'s still available!', timestamp: hoursAgo(2), isRead: true, isSender: false },
    { id: 'm1-3', conversationId: conv1Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Great! What\'s the condition?', timestamp: hoursAgo(2), isRead: true, isSender: true },
    { id: 'm1-4', conversationId: conv1Id, senderId: 'seller-alex', senderName: 'Alex M.', text: 'It\'s in great condition! Barely used.', timestamp: hoursAgo(1), isRead: true, isSender: false },
    { id: 'm1-5', conversationId: conv1Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Can we meet near the library tomorrow?', timestamp: minutesAgo(45), isRead: true, isSender: true },
    { id: 'm1-6', conversationId: conv1Id, senderId: 'seller-alex', senderName: 'Alex M.', text: 'Sure! I\'m usually on campus near the library between classes.', timestamp: minutesAgo(30), isRead: false, isSender: false },
  ];

  const messages2: Message[] = [
    { id: 'm2-1', conversationId: conv2Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Is the IKEA chair still available?', timestamp: hoursAgo(5), isRead: true, isSender: true },
    { id: 'm2-2', conversationId: conv2Id, senderId: 'seller-jordan', senderName: 'Jordan P.', text: 'Yes, it\'s still available!', timestamp: hoursAgo(4), isRead: true, isSender: false },
    { id: 'm2-3', conversationId: conv2Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Is the price firm?', timestamp: hoursAgo(3), isRead: true, isSender: true },
    { id: 'm2-4', conversationId: conv2Id, senderId: 'seller-jordan', senderName: 'Jordan P.', text: 'The price is firm, but I\'m happy to answer any questions!', timestamp: hoursAgo(2), isRead: false, isSender: false },
  ];

  const messages3: Message[] = [
    { id: 'm3-1', conversationId: conv3Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Hi, interested in the iPad!', timestamp: daysAgo(1), isRead: true, isSender: true },
    { id: 'm3-2', conversationId: conv3Id, senderId: 'seller-sam', senderName: 'Sam R.', text: 'Thanks for your message! Let me know if you have questions.', timestamp: daysAgo(1), isRead: true, isSender: false },
    { id: 'm3-3', conversationId: conv3Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Does it come with the charger?', timestamp: hoursAgo(20), isRead: true, isSender: true },
    { id: 'm3-4', conversationId: conv3Id, senderId: 'seller-sam', senderName: 'Sam R.', text: 'Yes, charger and case included.', timestamp: hoursAgo(18), isRead: true, isSender: false },
  ];

  const messages4: Message[] = [
    { id: 'm4-1', conversationId: conv4Id, senderId: 'seller-morgan', senderName: 'Morgan L.', text: 'Hi! The mini fridge is still available if you\'re interested.', timestamp: minutesAgo(120), isRead: false, isSender: false },
    { id: 'm4-2', conversationId: conv4Id, senderId: BUYER_ID, senderName: BUYER_NAME, text: 'Yes! Can we meet today?', timestamp: minutesAgo(90), isRead: true, isSender: true },
  ];

  return [
    {
      id: conv1Id,
      listingId: 1,
      listingTitle: 'Calculus Textbook - 8th Edition',
      listingPrice: 45,
      listingImage: 'https://images.unsplash.com/photo-1711613160734-11caf3ce151d?w=200&q=80',
      sellerId: 'seller-alex',
      sellerName: 'Alex M.',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      lastMessage: "Sure! I'm usually on campus near the library between classes.",
      lastMessageTime: minutesAgo(30),
      unreadCount: 1,
      messages: messages1,
    },
    {
      id: conv2Id,
      listingId: 2,
      listingTitle: 'Modern IKEA Desk Chair',
      listingPrice: 30,
      listingImage: 'https://images.unsplash.com/photo-1762423992354-4a11c971bf91?w=200&q=80',
      sellerId: 'seller-jordan',
      sellerName: 'Jordan P.',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
      lastMessage: "The price is firm, but I'm happy to answer any questions!",
      lastMessageTime: hoursAgo(2),
      unreadCount: 1,
      messages: messages2,
    },
    {
      id: conv3Id,
      listingId: 3,
      listingTitle: 'Apple iPad Pro 11"',
      listingPrice: 350,
      listingImage: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=200&q=80',
      sellerId: 'seller-sam',
      sellerName: 'Sam R.',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
      lastMessage: 'Yes, charger and case included.',
      lastMessageTime: hoursAgo(18),
      unreadCount: 0,
      messages: messages3,
    },
    {
      id: conv4Id,
      listingId: 4,
      listingTitle: 'Mini Fridge - Like New',
      listingPrice: 60,
      listingImage: 'https://images.unsplash.com/photo-1759772238095-d1ed3f036ad5?w=200&q=80',
      sellerId: 'seller-morgan',
      sellerName: 'Morgan L.',
      sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
      lastMessage: 'Yes! Can we meet today?',
      lastMessageTime: minutesAgo(90),
      unreadCount: 1,
      messages: messages4,
    },
  ];
}

function serializeConversations(conversations: Conversation[]): string {
  return JSON.stringify(
    conversations.map((c) => ({
      ...c,
      lastMessageTime: c.lastMessageTime.toISOString(),
      messages: c.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }))
  );
}

function deserializeConversations(raw: string): Conversation[] {
  try {
    const parsed = JSON.parse(raw) as Array<{
      lastMessageTime: string;
      messages: Array<{ timestamp: string }>;
      [k: string]: unknown;
    }>;
    return parsed.map((c) => ({
      ...c,
      lastMessageTime: new Date(c.lastMessageTime),
      messages: (c.messages || []).map((m: { timestamp: string; [k: string]: unknown }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    })) as Conversation[];
  } catch {
    return [];
  }
}

export function loadConversationsFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedConversations();
    const list = deserializeConversations(raw);
    return list.length > 0 ? list : createSeedConversations();
  } catch {
    return createSeedConversations();
  }
}

export function saveConversationsToStorage(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeConversations(conversations));
    console.log('Chat: localStorage updated, conversations count:', conversations.length);
  } catch (e) {
    console.warn('Chat: failed to save to localStorage', e);
  }
}

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    if (diffHours < 1) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  }
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString([], { weekday: 'short' })} at ${timeStr}`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) + ' at ' + timeStr;
}

export function getSellerAutoReply(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('available')) return "Yes, it's still available!";
  if (lower.includes('price')) return "The price is firm, but I'm happy to answer any questions!";
  if (lower.includes('meet')) return "Sure! I'm usually on campus near the library between classes.";
  if (lower.includes('condition')) return "It's in great condition! Barely used.";
  return "Thanks for your message! Let me know if you have questions.";
}
