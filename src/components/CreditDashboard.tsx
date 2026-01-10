"use client";

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes"
import { 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  History,
  X,
  Minimize2,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';

const CreditDashboard = () => {
  const [userInput, setUserInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Mounted state to avoid hydration mismatch on icons
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Fake Data
  const creditScore = 724;
  const habits = [
    { title: "On-Time Payments", status: "Perfect", value: "100%", color: "text-green-500", icon: <ShieldCheck size={20} /> },
    { title: "Credit Utilization", status: "Good", value: "12%", color: "text-blue-500", icon: <CreditCard size={20} /> },
    { title: "Credit Age", status: "Average", value: "4.2 yrs", color: "text-yellow-500", icon: <History size={20} /> },
  ];

  const transactions = [
    { merchant: "Spotify", date: "Jan 08", amount: "-$10.99", impact: "Neutral" },
    { merchant: "Chase Credit Payment", date: "Jan 05", amount: "+$450.00", impact: "Positive" },
    { merchant: "Late Fee: Gym", date: "Dec 28", amount: "-$35.00", impact: "Negative" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      
      {/* Header */}
      <header className="mb-8 flex justify-between items-center max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">CreditPulse <span className="text-blue-600 dark:text-blue-400">AI</span></h1>
          <p className="text-slate-500 dark:text-slate-400">Real-time credit habit monitoring</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {mounted && theme === 'dark' ? <Sun size={20} className="text-yellow-500"/> : <Moon size={20} className="text-slate-600 dark:text-slate-400"/>}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
          
        {/* Score Gauge */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
          <div className="absolute top-4 right-4 text-slate-300 dark:text-slate-600"><TrendingUp size={24}/></div>
          <p className="text-sm uppercase tracking-widest font-semibold text-slate-400 mb-2">Current Score</p>
          <h2 className="text-8xl font-black text-slate-800 dark:text-white">{creditScore}</h2>
          <div className="mt-4 flex gap-2">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-bold">+12 pts this month</span>
          </div>
          
          <div className="w-full max-w-2xl h-3 bg-slate-100 dark:bg-slate-800 rounded-full mt-8 overflow-hidden flex">
            <div className="h-full bg-red-400 w-1/4"></div>
            <div className="h-full bg-orange-400 w-1/4"></div>
            <div className="h-full bg-yellow-400 w-1/4"></div>
            <div className="h-full bg-green-500 w-1/4"></div>
          </div>
          <div className="w-full max-w-2xl flex justify-between text-[10px] mt-2 font-bold text-slate-400 dark:text-slate-500">
            <span>300</span><span>580</span><span>670</span><span>740</span><span>850</span>
          </div>
        </div>

        {/* Habit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {habits.map((habit, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className={`${habit.color} mb-3`}>{habit.icon}</div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{habit.title}</p>
              <div className="flex justify-between items-end mt-1">
                <span className="text-xl font-bold">{habit.value}</span>
                <span className={`text-xs font-semibold ${habit.color}`}>{habit.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <History size={18} className="text-blue-600 dark:text-blue-400"/> Recent Activity Factors
          </h3>
          <div className="space-y-4">
            {transactions.map((tx, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <div>
                  <p className="font-semibold text-sm">{tx.merchant}</p>
                  <p className="text-xs text-slate-400">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{tx.amount}</p>
                  <span className={`text-[10px] font-bold uppercase ${
                    tx.impact === 'Positive' ? 'text-green-500' : tx.impact === 'Negative' ? 'text-red-500' : 'text-slate-400'
                  }`}>{tx.impact} Impact</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Gemini Agent */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center ${
          isChatOpen ? 'bg-slate-800 dark:bg-white rotate-90' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isChatOpen ? 
          <X size={28} className="text-white dark:text-slate-900" /> : 
          <Sparkles size={28} className="text-white" />
        }
      </button>

      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-slate-900 dark:bg-black text-white rounded-3xl p-6 shadow-2xl border border-slate-700 dark:border-slate-800 z-40 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold">Gemini Assistant</h3>
                <p className="text-xs text-slate-400">Agentic Credit Coach</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
              <Minimize2 size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 text-sm scrollbar-hide">
            <div className="bg-slate-800 dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-700">
              Hi! Based on your <b>Chase Bank</b> transactions, I noticed your utilization hit 12%.
            </div>
            <div className="bg-blue-600 p-4 rounded-2xl rounded-tr-none ml-8 self-end">
              Yes, give me a tip to reach 750.
            </div>
            <div className="bg-slate-800 dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-700">
              <p className="font-bold mb-2 flex items-center gap-1 text-blue-400">
                <AlertCircle size={14}/> Recommendation:
              </p>
              To hit 750, try the "AZEO" method (All Zero Except One).
            </div>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask Gemini about your credit..."
              className="w-full bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-white"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              autoFocus
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
              <ArrowUpRight size={18} className="text-white"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditDashboard;