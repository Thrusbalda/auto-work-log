import React, { useState } from 'react';
import { WorkSession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateWorkInsight } from '../services/geminiService';
import { formatDate } from '../utils';

interface ReportsProps {
  sessions: WorkSession[];
}

const Reports: React.FC<ReportsProps> = ({ sessions }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateInsight = async () => {
    setLoading(true);
    const result = await generateWorkInsight(sessions);
    setInsight(result);
    setLoading(false);
  };

  // Prepare Data for Chart (Last 7 days)
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = formatDate(d.getTime());
      
      const dayTotalMs = sessions
        .filter(s => {
          const sDate = new Date(s.startTime);
          sDate.setHours(0,0,0,0);
          return sDate.getTime() === d.getTime() && s.endTime !== null;
        })
        .reduce((acc, curr) => acc + (curr.endTime! - curr.startTime), 0);
      
      data.push({
        name: dateStr,
        hours: parseFloat((dayTotalMs / (1000 * 60 * 60)).toFixed(1))
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  // Calculate monthly stats
  const now = new Date();
  const monthlySessions = sessions.filter(s => {
    const d = new Date(s.startTime);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.endTime !== null;
  });
  
  const totalMonthlyMs = monthlySessions.reduce((acc, curr) => acc + (curr.endTime! - curr.startTime), 0);
  const totalMonthlyHours = (totalMonthlyMs / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Monthly Report</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">This Month</p>
          <p className="text-2xl font-bold text-white mt-1">{totalMonthlyHours} <span className="text-sm font-normal text-gray-500">hrs</span></p>
        </div>
         <div className="bg-card p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Sessions</p>
          <p className="text-2xl font-bold text-white mt-1">{monthlySessions.length}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card p-4 rounded-xl border border-gray-700 h-64 flex flex-col">
        <h3 className="text-sm font-semibold mb-4 text-gray-300">Last 7 Days Activity</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#10b981' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gemini AI Insight */}
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-xl border border-indigo-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={20} />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
          {!insight && (
            <button 
              onClick={handleGenerateInsight} 
              disabled={loading || monthlySessions.length === 0}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              {loading ? "Analyzing..." : "Generate"}
            </button>
          )}
        </div>

        {insight ? (
          <div className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap animate-fade-in">
            {insight}
            <div className="mt-4 flex justify-end">
                <button onClick={() => setInsight(null)} className="text-xs text-indigo-300 hover:text-white underline">Refresh</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            {monthlySessions.length > 0 
              ? "Tap 'Generate' to get a personalized summary of your work habits this month powered by Gemini." 
              : "Log some work sessions to generate insights."}
          </p>
        )}
      </div>
      
    </div>
  );
};

export default Reports;
