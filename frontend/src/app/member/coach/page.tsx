'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchApi } from '@/lib/api';

interface Message {
  sender: 'COACH' | 'MEMBER';
  text: string;
  time: string;
}

export default function MemberCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInitialAdvice = async () => {
      try {
        const advice = await fetchApi('member/coach/advice');
        if (advice) {
          setMessages([
            {
              sender: 'COACH',
              text: `G'day mate! I'm Coach Arnold, your personal AI advisor. ${advice.advice} Based on your posture log, remember this tip: ${advice.postureAudit.tips}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadInitialAdvice();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      sender: 'MEMBER',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate AI thinking and replying
    setTimeout(() => {
      let replyText = "I see. To optimize your reps, focus on core alignment and progressive overload. What weights are you lifting today?";
      const lower = input.toLowerCase();

      if (lower.includes('squat') || lower.includes('knee')) {
        replyText = "If your knees are caving in during squats, push outward through your heels and engage your glutes. Try lowering the load by 10% to focus on depth.";
      } else if (lower.includes('pain') || lower.includes('hurt') || lower.includes('injury')) {
        replyText = "Safety first! If you feel joint pain, stop the set immediately. I suggest substituting the exercise with a bodyweight variant or machine press. Let me know what machines are free.";
      } else if (lower.includes('protein') || lower.includes('macro') || lower.includes('eat')) {
        replyText = "Aim for 1.6 to 2.2 grams of protein per kilogram of body weight. Focus on lean sources like chicken breast, fish, egg whites, and whey isolate.";
      } else if (lower.includes('substitute') || lower.includes('busy') || lower.includes('crowded')) {
        replyText = "Leg press is a great substitute if the squat rack is busy. It keeps your hips locked and allows full knee flexion safely.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'COACH',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-850 rounded-[32px] overflow-hidden shadow-2xl relative">
      
      {/* Bot Chat Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-slate-200">Coach Arnold (AI)</h4>
          <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Personal Trainer Online</p>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'MEMBER' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <div
              className={`p-3 rounded-2xl text-[11px] leading-relaxed font-medium ${
                msg.sender === 'MEMBER'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-tr-none'
                  : 'bg-slate-950 border border-slate-850 text-slate-300 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              {msg.sender === 'MEMBER' ? 'You' : 'Coach'} • {msg.time}
            </span>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-850 p-3 rounded-2xl rounded-tl-none mr-auto max-w-[40%]">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_100ms]" />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_300ms]" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input controls */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask splits, substitutions, macros..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-[11px] text-slate-200 focus:outline-none placeholder-slate-600 transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}
