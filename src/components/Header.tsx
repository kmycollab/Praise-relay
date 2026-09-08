import React from 'react';
import { Employee } from '../types';
import { Sparkles, Mail, UserCheck, Shield, BookOpen, PenTool, Send, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: 'feed' | 'write' | 'notifications' | 'admin';
  setActiveTab: (tab: 'feed' | 'write' | 'notifications' | 'admin') => void;
  employees: Employee[];
  currentPersona: Employee | null;
  setCurrentPersona: (emp: Employee | null) => void;
  unreadCount: number;
  onOpenEmailModal: () => void;
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  employees,
  currentPersona,
  setCurrentPersona,
  unreadCount,
  onOpenEmailModal,
  user,
  onLogout,
}) => {
  const currentBatonHolder = employees.find(e => e.isEligibleToRelay);

  return (
    <header className="relative bg-gradient-to-r from-pink-100 via-amber-50 to-sky-100 border-b-4 border-dashed border-pink-300 py-6 px-4 sm:px-8 mb-6 shadow-sm overflow-hidden rounded-b-[30px]">
      {/* Floating Company Emojis Animation */}
      <div className="absolute top-2 left-6 text-2xl floating-sticker-1 select-none pointer-events-none">⭐️</div>
      <div className="absolute bottom-3 left-1/4 text-2xl floating-sticker-2 select-none pointer-events-none">💌</div>
      <div className="absolute top-4 right-1/3 text-2xl floating-sticker-3 select-none pointer-events-none">🧸</div>
      <div className="absolute bottom-2 right-8 text-2xl floating-sticker-1 select-none pointer-events-none">🍀</div>
      <div className="absolute top-2 right-12 text-2xl floating-sticker-2 select-none pointer-events-none">🎈</div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        {/* Title & Subtitle */}
        <div className="text-center md:text-left">
          <div className="inline-block bg-yellow-200 text-amber-800 px-3 py-1 rounded-full text-sm font-bold mb-2 shadow-sm transform -rotate-1">
            🖍️ 5살 어린아이의 스케치북 감성
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-700 tracking-wide drop-shadow-sm flex items-center justify-center md:justify-start gap-2">
            <span>🎨</span> 사내 칭찬릴레이 스케치북
          </h1>
          <p className="text-gray-600 text-lg mt-1">
            동료를 향한 따뜻한 마음과 칭찬을 크레파스 그림처럼 릴레이로 전달해보세요!
          </p>
        </div>

        {/* Persona Switcher & Baton Status & Logout */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {user && (
            <div className="bg-white/90 border-2 border-dashed border-purple-300 px-3 py-1.5 rounded-xl shadow-xs text-xs flex items-center gap-2">
              <span className="font-bold text-purple-700">👤 {user.name} ({user.email})</span>
              <button
                onClick={onLogout}
                className="bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded-lg transition cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="bg-white/90 border-2 border-dashed border-pink-300 px-4 py-2 rounded-2xl shadow-sm text-sm flex items-center gap-2">
            <span className="font-bold text-pink-600 flex items-center gap-1">
              <UserCheck className="w-4 h-4" /> 릴레이 페르소나:
            </span>
            <select
              className="bg-pink-50 border border-pink-200 rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
              value={currentPersona?.email || ''}
              onChange={(e) => {
                const found = employees.find(emp => emp.email === e.target.value);
                setCurrentPersona(found || null);
              }}
            >
              <option value="">-- 페르소나 선택 --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.email}>
                  {emp.name} ({emp.department}) {emp.isEligibleToRelay ? '🔥[바통보유]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Email Simulator Button */}
          <button
            onClick={onOpenEmailModal}
            className="relative crayon-btn px-4 py-2 text-sm font-bold text-blue-700 flex items-center gap-2 bg-sky-100 hover:bg-sky-200 shadow-sm cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>알림메일함</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse shadow">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Current Baton Holder Banner */}
      {currentBatonHolder && (
        <div className="max-w-6xl mx-auto mt-4 bg-amber-100/80 border-2 border-dashed border-amber-300 rounded-xl px-4 py-2 text-center text-sm font-bold text-amber-900 flex items-center justify-center gap-2">
          <span>🔥 [현재 칭찬 릴레이 바통 주인공]</span>
          <span className="bg-white px-2 py-0.5 rounded-md text-pink-600 shadow-xs">
            {currentBatonHolder.name} ({currentBatonHolder.department})님
          </span>
          <span className="text-gray-600 font-normal">
            — 직전 칭찬을 받으신 분이 다음 칭찬을 작성할 수 있어요!
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-base transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'feed'
              ? 'bg-pink-400 text-white shadow-md transform -translate-y-0.5 ring-2 ring-pink-300'
              : 'bg-white text-gray-700 hover:bg-pink-50 border-2 border-pink-200'
          }`}
        >
          <BookOpen className="w-5 h-5" /> 칭찬 현황 & 피드
        </button>

        <button
          onClick={() => setActiveTab('write')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-base transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'write'
              ? 'bg-amber-400 text-amber-950 shadow-md transform -translate-y-0.5 ring-2 ring-amber-300'
              : 'bg-white text-gray-700 hover:bg-amber-50 border-2 border-amber-200'
          }`}
        >
          <PenTool className="w-5 h-5" /> 칭찬 내용 작성하기
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-base transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'notifications'
              ? 'bg-sky-400 text-white shadow-md transform -translate-y-0.5 ring-2 ring-sky-300'
              : 'bg-white text-gray-700 hover:bg-sky-50 border-2 border-sky-200'
          }`}
        >
          <Send className="w-5 h-5" /> 알림 메일함
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-base transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'admin'
              ? 'bg-purple-400 text-white shadow-md transform -translate-y-0.5 ring-2 ring-purple-300'
              : 'bg-white text-gray-700 hover:bg-purple-50 border-2 border-purple-200'
          }`}
        >
          <Shield className="w-5 h-5" /> 관리자 전용 뷰
        </button>
      </div>
    </header>
  );
};
