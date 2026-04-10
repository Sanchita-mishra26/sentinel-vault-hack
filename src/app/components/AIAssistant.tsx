import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Activity } from 'lucide-react';
import { chatWithAI } from '../../services/api';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [dotPhase, setDotPhase] = useState(1);
  const [messages, setMessages] = useState([
    { text: "All nodes operating within normal parameters.", isUser: false },
    { text: "Node 2 health dropped to 98%, monitoring activity.", isUser: false },
    { text: "No anomaly detected by the AI threat engine.", isUser: false },
    { text: "You can simulate an attack to test system response.", isUser: false },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isThinking) return;
    const t = setInterval(() => {
      setDotPhase(prev => (prev % 3) + 1);
    }, 350);
    return () => clearInterval(t);
  }, [isThinking]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const userMessage = inputText;
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputText('');
    setIsThinking(true);
    
    try {
      const response = await chatWithAI(userMessage);
      if (response.data && response.data.success) {
        setMessages(prev => [...prev, { text: response.data.reply, isUser: false }]);
      } else {
        setMessages(prev => [...prev, { text: "System Warning: AI response anomaly detected.", isUser: false }]);
      }
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages(prev => [...prev, { text: "Critical: Connection to Sentinel Core Intelligence failed.", isUser: false }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 240, damping: 20 }}
            className="w-80 sm:w-96 bg-brand-bg/95 backdrop-blur-xl border border-brand-primary/40 rounded-2xl shadow-[0_0_30px_rgba(62,166,255,0.15)] flex flex-col overflow-hidden mb-4 pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, x: 20, y: 24, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, y: 16, scale: 0.9 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 16 }}
              className="absolute -top-7 -right-3 z-20 text-3xl drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]"
            >
              🤖
            </motion.div>

            {/* Header */}
            <div className="bg-brand-primary/10 border-b border-brand-primary/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/20 rounded-lg">
                  <Bot className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-sm">Sentinel AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-xs text-brand-primary font-medium mt-0.5">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    AI Monitoring Active
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 h-[300px] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${
                    msg.isUser 
                      ? 'bg-brand-card border border-brand-border text-white rounded-tr-sm shadow-[0_0_12px_rgba(15,23,42,0.25)]' 
                      : 'bg-brand-primary/10 border border-brand-primary/20 text-slate-200 rounded-tl-sm shadow-[0_0_14px_rgba(62,166,255,0.22)]'
                  }`}>
                    {msg.text}
                  </div>
                  {!msg.isUser && idx === messages.length - 1 && (
                     <div className="text-[10px] text-slate-500 mt-1 ml-1 flex items-center gap-1">
                       <Activity className="w-3 h-3" /> Just now
                     </div>
                  )}
                </div>
              ))}
              {isThinking && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[85%] p-3 text-sm rounded-2xl rounded-tl-sm bg-brand-primary/10 border border-brand-primary/20 text-slate-200 shadow-[0_0_14px_rgba(62,166,255,0.22)]">
                    AI is thinking{'.'.repeat(dotPhase)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-brand-border/50 bg-brand-bg flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ask about node health, threats, or system activity..."
                className="flex-1 bg-brand-card/50 border border-brand-border/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 disabled:hover:bg-brand-primary text-brand-bg rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center gap-3 bg-brand-primary text-brand-bg px-4 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(62,166,255,0.4)] hover:shadow-[0_0_34px_rgba(62,166,255,0.7)] transition-all border border-white/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        {!isOpen && <span className="text-sm font-heading tracking-wide pr-1">AI Security Assistant</span>}
      </motion.button>
    </div>
  );
}
