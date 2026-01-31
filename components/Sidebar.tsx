
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: '📊' },
    { id: 'curriculum' as View, label: '30-Day Plan', icon: '🗓️' },
    { id: 'tutor' as View, label: 'AI Tutor', icon: '🤖' },
    { id: 'writing-lab' as View, label: 'Writing Lab', icon: '✍️' },
    { id: 'progress' as View, label: 'Progress', icon: '📈' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Linguist Pro
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">A2 → B1 Intensive</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Weekly Goal</p>
          <p className="text-sm font-bold mb-2">4/7 Days Complete</p>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-white h-full rounded-full w-[60%]"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
