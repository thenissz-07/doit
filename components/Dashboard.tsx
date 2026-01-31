
import React from 'react';
import { CURRICULUM } from '../constants';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome back, Learner! 👋</h1>
          <p className="text-slate-500">Day 4 of your 30-day transition to B1 Level.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🔥</div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</p>
            <p className="text-lg font-bold text-slate-800">4 Days</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📖</div>
          <h3 className="font-bold text-lg text-slate-800">Grammar Mastery</h3>
          <p className="text-slate-500 text-sm mt-1">12/30 concepts learned</p>
          <div className="w-full mt-4 bg-slate-100 h-2 rounded-full">
            <div className="bg-blue-600 h-full rounded-full w-[40%]"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mb-4">🗣️</div>
          <h3 className="font-bold text-lg text-slate-800">Speaking Confidence</h3>
          <p className="text-slate-500 text-sm mt-1">B1 Level: Rising</p>
          <div className="w-full mt-4 bg-slate-100 h-2 rounded-full">
            <div className="bg-purple-600 h-full rounded-full w-[65%]"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📝</div>
          <h3 className="font-bold text-lg text-slate-800">Writing Accuracy</h3>
          <p className="text-slate-500 text-sm mt-1">8 essays completed</p>
          <div className="w-full mt-4 bg-slate-100 h-2 rounded-full">
            <div className="bg-green-600 h-full rounded-full w-[25%]"></div>
          </div>
        </div>
      </div>

      <section className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Today's Focus: Future Plans</h2>
          <p className="text-indigo-200 mb-6 max-w-md">Learn how to use "going to" vs "will" for spontaneous decisions vs firm arrangements. Essential for B1!</p>
          <button className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
            Start Lesson
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full mr-20 mb-10 blur-xl"></div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Your Roadmap (Week 1)</h2>
        <div className="space-y-3">
          {CURRICULUM.filter(d => d.week === 1).map(day => (
            <div key={day.day} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-500 border border-slate-100">
                  {day.day}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{day.title}</h4>
                  <p className="text-sm text-slate-500">{day.focus}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {day.day < 4 ? (
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold">Done</span>
                ) : day.day === 4 ? (
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">Today</span>
                ) : (
                  <span className="bg-slate-100 text-slate-400 text-xs px-3 py-1 rounded-full font-bold">Locked</span>
                )}
                <span className="text-slate-300 group-hover:text-blue-500 transition-colors">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
