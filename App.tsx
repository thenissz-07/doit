
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatTutor from './components/ChatTutor';
import WritingLab from './components/WritingLab';
import { View, Level } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [level, setLevel] = useState<Level>('Intermediate');

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard currentLevel={level} />;
      case 'tutor':
        return <ChatTutor currentLevel={level} />;
      case 'writing-lab':
        return <WritingLab currentLevel={level} />;
      case 'curriculum':
        return (
          <div className="p-12 text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Your Full Curriculum</h2>
            <p className="text-slate-500 italic">Adjusted for {level} level.</p>
            <p className="text-slate-500">Coming soon in full detail! Access your roadmap via Dashboard for now.</p>
          </div>
        );
      case 'progress':
        return (
          <div className="p-12 text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Advanced Analytics</h2>
            <p className="text-slate-500">Unlock this section after 7 days of active study at {level} level.</p>
          </div>
        );
      default:
        return <Dashboard currentLevel={level} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        currentLevel={level} 
        setLevel={setLevel} 
      />
      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
