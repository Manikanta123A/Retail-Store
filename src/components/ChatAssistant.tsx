import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, User, Bot,
  Loader2, ShoppingCart, UserPlus, Banknote,
  Search, Package, HelpCircle, Zap,
} from 'lucide-react';
import { chatService } from '../services/api';
import clsx from 'clsx';

// ─── Intent metadata ─────────────────────────────────────────────────────────
const INTENT_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  CREATE_BILL:      { label: 'Create Bill',      color: 'bg-violet-100 text-violet-700',  Icon: ShoppingCart },
  CREATE_CUSTOMER:  { label: 'Add Customer',     color: 'bg-emerald-100 text-emerald-700', Icon: UserPlus },
  COLLECT_PAYMENT:  { label: 'Collect Payment',  color: 'bg-amber-100 text-amber-700',    Icon: Banknote },
  QUERY_CUSTOMER:   { label: 'Customer Info',    color: 'bg-sky-100 text-sky-700',        Icon: Search },
  QUERY_PRODUCT:    { label: 'Product Info',     color: 'bg-pink-100 text-pink-700',      Icon: Package },
  GREETING:         { label: 'Small Talk',       color: 'bg-blue-100 text-blue-700',      Icon: Sparkles },
  UNKNOWN:          { label: 'Unknown',          color: 'bg-gray-100 text-gray-500',      Icon: HelpCircle },
};

// ─── Quick-action chips shown before first message ────────────────────────────
const QUICK_CHIPS = [
  { text: 'Create bill for Ravi 2 shoes', icon: ShoppingCart },
  { text: 'Add Vaishu 9398432494 vaishu@gmail.com', icon: UserPlus },
  { text: 'Ravi paid 500', icon: Banknote },
  { text: 'Show details of Ravi', icon: Search },
  { text: 'Price of jeans', icon: Package },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  intent?: string;
  confidence?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ChatAssistant() {
  const [isOpen, setIsOpen]       = useState(false);
  const [message, setMessage]     = useState('');
  const [history, setHistory]     = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    console.log('Sending message:', trimmed);
    setMessage('');
    
    // Ensure focus returns to input
    setTimeout(() => inputRef.current?.focus(), 10);

    setHistory(prev => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const res = await chatService.sendMessage(trimmed, []);
      console.log('Received response:', res.data);
      const data = res.data;
      setHistory(prev => [
        ...prev,
        {
          role:       'bot',
          content:    data.response,
          intent:     data.intent,
          confidence: data.confidence,
        },
      ]);
    } catch {
      setHistory(prev => [
        ...prev,
        { role: 'bot', content: 'Connection error. Make sure the backend is running.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="mb-4 w-[400px] h-[560px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
              className="p-4 flex items-center justify-between shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Anitha Assistant</h3>
                  <p className="text-indigo-200 text-[10px] tracking-wider uppercase">
                    AI Store Manager · Local NLP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* ── Chat Area ──────────────────────────────────────────────── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ background: 'linear-gradient(180deg,#f0f0ff 0%,#fff 60%)' }}
            >
              {/* Welcome / quick chips */}
              {history.length === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-4 space-y-2">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Bot className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h4 className="text-indigo-900 font-semibold text-sm">Hello! What can I do for you?</h4>
                    <p className="text-indigo-400 text-xs">
                      I can create bills, add customers, collect payments, and look up info.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(chip.text)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-indigo-100 rounded-full text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                      >
                        <chip.icon className="w-3 h-3" />
                        {chip.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {history.map((msg, i) => {
                const isUser = msg.role === 'user';
                const meta   = msg.intent ? INTENT_META[msg.intent] ?? INTENT_META.UNKNOWN : null;
                const Icon   = meta?.Icon;

                return (
                  <div
                    key={i}
                    className={clsx('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
                  >
                    {/* Avatar */}
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1',
                        isUser
                          ? 'bg-indigo-600'
                          : 'bg-white border border-indigo-100 shadow-sm'
                      )}
                    >
                      {isUser
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={clsx('max-w-[78%] space-y-1', isUser ? 'items-end' : 'items-start')}>
                      {/* Intent badge (bot only) */}
                      {!isUser && meta && msg.intent !== 'UNKNOWN' && (
                        <div className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', meta.color)}>
                          {Icon && <Icon className="w-3 h-3" />}
                          {meta.label}
                          {msg.confidence !== undefined && (
                            <span className="opacity-60 ml-0.5">
                              {Math.round(msg.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Text bubble */}
                      <div
                        className={clsx(
                          'p-3 rounded-2xl text-sm shadow-sm whitespace-pre-line leading-relaxed',
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 rounded-tl-sm border border-indigo-50'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  </div>
                  <div className="bg-white border border-indigo-50 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Input ──────────────────────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t border-indigo-50 flex gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. 'bill for Ravi 2 shoes 3 shirts'…"
                className="flex-1 px-4 py-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all placeholder:text-indigo-300"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(v => !v)}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
