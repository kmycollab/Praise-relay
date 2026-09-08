import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, saveSupabaseConfig } from '../lib/supabase';
import { Lock, Mail, User, Sparkles, KeyRound, Database, ArrowRight, Settings, Check, Building } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Supabase Config states
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState(() => {
    try { return localStorage.getItem('SUPABASE_URL') || ''; } catch { return ''; }
  });
  const [inputKey, setInputKey] = useState(() => {
    try { return localStorage.getItem('SUPABASE_ANON_KEY') || ''; } catch { return ''; }
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl || !inputKey) {
      alert('Supabase URL과 Anon Key를 모두 입력해주세요.');
      return;
    }
    saveSupabaseConfig(inputUrl, inputKey);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      // Demo mode fallback when Supabase is not configured yet
      setTimeout(() => {
        if (!email) {
          setError('이메일을 입력해주세요.');
          setLoading(false);
          return;
        }
        onLoginSuccess({ email, name: name || email.split('@')[0] });
        setLoading(false);
      }, 500);
      return;
    }

    try {
      if (isSignUp) {
        if (!name || !department || !email || !password) {
          setError('이름, 부서, 이메일, 비밀번호를 모두 입력해주세요.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, department }
          }
        });
        if (signUpError) throw signUpError;

        // Insert into Supabase employees table
        const { error: dbError } = await supabase.from('employees').upsert([
          {
            name,
            department,
            email,
            phone: '',
            is_eligible_to_relay: false
          }
        ], { onConflict: 'email' });

        if (dbError) {
          console.error("Supabase employee table insert warning:", dbError);
        }

        // Also sync with backend API
        try {
          await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, department, phone: '', email })
          });
        } catch (apiErr) {
          console.error("Backend employee sync warning:", apiErr);
        }

        alert('회원가입 및 사내 임직원 등록이 완료되었습니다!');
        if (data.user) {
          onLoginSuccess({ email: data.user.email || email, name });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          onLoginSuccess({
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0]
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sqlSchemaText = `-- 1. 임직원 테이블 (Employees Table - CSV 누적 저장용)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  is_eligible_to_relay BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 칭찬 릴레이 테이블 (Praises Table)
CREATE TABLE IF NOT EXISTS public.praises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_dept TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_dept TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  content TEXT NOT NULL,
  sticker TEXT DEFAULT '⭐️',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 알림 메일함 테이블 (Notifications Table)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content_summary TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 활성화 및 정책 설정 예시
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for authenticated users on employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Enable read/write for authenticated users on praises" ON public.praises FOR ALL USING (true);
CREATE POLICY "Enable read/write for authenticated users on notifications" ON public.notifications FOR ALL USING (true);`;

  return (
    <div className="min-h-screen notebook-bg flex items-center justify-center p-4">
      <div className="crayon-card bg-white w-full max-w-lg p-8 shadow-2xl border-pink-300 relative">
        <div className="absolute -top-4 -right-4 bg-yellow-200 text-amber-900 px-4 py-1.5 rounded-full font-bold shadow-sm border border-dashed border-amber-400 rotate-3">
          🔒 Supabase 인가 로그인
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎨</div>
          <h1 className="text-3xl font-extrabold text-pink-700 mb-1">사내 칭찬릴레이</h1>
          <p className="text-gray-600 text-sm">
            {isSupabaseConfigured
              ? '✨ Supabase 인증 연동 완료 (정상 연결됨)'
              : '⚠️ Supabase 미설정 상태 (데모 로그인 모드 — 아래에서 Supabase 연결을 설정하실 수 있습니다)'}
          </p>
        </div>

        {/* Supabase Config Accordion / Section */}
        <div className="mb-6 bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <Settings className="w-4 h-4 text-purple-600" />
              <span>Supabase 프로젝트 연결 설정</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs bg-purple-200 hover:bg-purple-300 text-purple-900 font-bold px-3 py-1 rounded-xl cursor-pointer"
            >
              {showConfig ? '설정 닫기 🔼' : '설정 열기 ⚙️'}
            </button>
          </div>

          {showConfig && (
            <form onSubmit={handleSaveConfig} className="mt-3 pt-3 border-t border-purple-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Supabase URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="crayon-btn bg-purple-400 hover:bg-purple-500 text-white font-bold px-4 py-1.5 text-xs shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> 저장 및 연결하기
                </button>
              </div>
            </form>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border-2 border-red-300 p-3 rounded-xl text-red-800 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4 text-pink-500" /> 이름 (성명)
                </label>
                <input
                  type="text"
                  required
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Building className="w-4 h-4 text-pink-500" /> 부서명
                </label>
                <input
                  type="text"
                  required
                  placeholder="개발팀 / 경영지원팀"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4 text-pink-500" /> 사내 이메일
            </label>
            <input
              type="email"
              required
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Lock className="w-4 h-4 text-pink-500" /> 비밀번호
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="crayon-btn bg-pink-400 hover:bg-pink-500 text-white font-bold w-full py-3 text-base shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? '처리 중...' : isSignUp ? '회원가입 및 임직원 등록하기 🚀' : '로그인하기 🚀'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-600 font-bold hover:underline cursor-pointer"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <Database className="w-4 h-4" /> Supabase SQL 보기
          </button>
        </div>
      </div>

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="crayon-card bg-white w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl border-purple-300">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-purple-200 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-extrabold text-purple-900">🗄️ Supabase 데이터베이스 SQL 스키마</h2>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Supabase 대시보드의 <b>SQL Editor</b>에 아래 스크립트를 복사하여 실행하시면 CSV 데이터 누적 저장 및 인증 테이블이 생성됩니다.
            </p>

            <div className="flex-1 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs select-all">
              <pre>{sqlSchemaText}</pre>
            </div>

            <div className="pt-4 mt-4 border-t-2 border-dashed border-purple-200 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchemaText);
                  alert('SQL 스키마가 클립보드에 복사되었습니다!');
                }}
                className="crayon-btn bg-purple-300 hover:bg-purple-400 text-purple-950 font-bold px-5 py-2 text-sm cursor-pointer shadow-xs"
              >
                SQL 복사하기 📋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
