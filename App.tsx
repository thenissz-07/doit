
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatTutor from './components/ChatTutor';
import WritingLab from './components/WritingLab';
import { View } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'tutor':
        return <ChatTutor />;
      case 'writing-lab':
        return <WritingLab />;
      case 'curriculum':
        return (
          <div className="p-12 text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Your Full Curriculum</h2>
            <p className="text-slate-500">Coming soon in full detail! Access your roadmap via Dashboard for now.</p>
          </div>
        );
      case 'progress':
        return (
          <div className="p-12 text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Advanced Analytics</h2>
            <p className="text-slate-500">Unlock this section after 7 days of active study.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView={view} setView={setView} />
      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
