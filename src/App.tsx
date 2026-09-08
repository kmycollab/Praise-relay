import React, { useState, useEffect } from 'react';
import { Employee, Praise, NotificationItem } from './types';
import { Header } from './components/Header';
import { PraiseFeed } from './components/PraiseFeed';
import { PraiseForm } from './components/PraiseForm';
import { EmailSimulatorModal } from './components/EmailSimulatorModal';
import { AdminView } from './components/AdminView';
import { AuthScreen } from './components/AuthScreen';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Safe API Fetch helper with Content-Type check and logging
async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  console.log(`[API Request] ${options?.method || 'GET'} ${url}`, options?.body ? JSON.parse(options.body as string) : '');

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    console.error(`[API Network Error]`, networkErr);
    throw new Error(`네트워크 연결 오류 또는 서버 응답이 없습니다. (${url})`);
  }

  const contentType = res.headers.get("content-type") || "";
  console.log(`[API Response] ${res.status} ${res.statusText} | Content-Type: ${contentType}`);

  if (!contentType.includes("application/json")) {
    const textBody = await res.text();
    console.error(`[API Non-JSON Response Body]:`, textBody);
    throw new Error(`서버 오류 발생 (${res.status}): ${textBody.slice(0, 150) || '서버가 올바르지 않은 응답(HTML/텍스트)을 반환했습니다.'}`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (상태 코드 ${res.status})`);
  }
  return data;
}

export default function App() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [praises, setPraises] = useState<Praise[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'write' | 'notifications' | 'admin'>('feed');
  const [editingPraise, setEditingPraise] = useState<Praise | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check Supabase session on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '사용자'
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '사용자'
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      apiFetch<Employee[]>('/api/employees'),
      apiFetch<Praise[]>('/api/praises'),
      apiFetch<NotificationItem[]>('/api/notifications'),
    ])
      .then(([empData, praiseData, notifData]) => {
        setEmployees(empData);
        setPraises(praiseData);
        setNotifications(notifData);
        if (empData.length > 0) {
          setCurrentPersona(empData[0]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load initial data:", err);
        setIsLoading(false);
      });
  }, []);

  // Realtime subscription for employees table
  useEffect(() => {
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('public:employees')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
          apiFetch<Employee[]>('/api/employees')
            .then(setEmployees)
            .catch(console.error);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handlers for Praises
  const handleSubmitPraise = async (data: { senderEmail: string; recipientEmail: string; content: string; sticker: string }) => {
    const json = await apiFetch<{ praise: Praise; employees: Employee[] }>('/api/praises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setPraises(prev => [json.praise, ...prev]);
    setEmployees(json.employees);
    // Refresh notifications
    const notifData = await apiFetch<NotificationItem[]>('/api/notifications');
    setNotifications(notifData);
  };

  const handleUpdatePraise = async (id: string, content: string, sticker: string) => {
    const updated = await apiFetch<Praise>(`/api/praises/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sticker }),
    });
    setPraises(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleDeletePraise = async (id: string) => {
    if (!window.confirm('정말 이 칭찬 릴레이 글을 삭제하시겠습니까?')) return;
    await apiFetch(`/api/praises/${id}`, { method: 'DELETE' });
    setPraises(prev => prev.filter(p => p.id !== id));
  };

  const handleLikePraise = async (id: string) => {
    const updated = await apiFetch<Praise>(`/api/praises/${id}/like`, { method: 'POST' });
    setPraises(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleStartEditPraise = (praise: Praise) => {
    setEditingPraise(praise);
    setActiveTab('write');
  };

  // Handlers for Employees
  const handleAddEmployee = async (emp: { name: string; department: string; phone: string; email: string }) => {
    const newEmp = await apiFetch<Employee>('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    setEmployees(prev => [...prev, newEmp]);
  };

  const handleUpdateEmployee = async (id: string, emp: { name: string; department: string; phone: string; email: string; isEligibleToRelay: boolean }) => {
    await apiFetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    const allEmp = await apiFetch<Employee[]>('/api/employees');
    setEmployees(allEmp);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('정말 이 임직원을 삭제하시겠습니까?')) return;
    await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const handleBulkAddEmployees = async (items: any[]) => {
    await apiFetch('/api/employees/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const allEmp = await apiFetch<Employee[]>('/api/employees');
    setEmployees(allEmp);
  };

  const handleMarkAsRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffdf5] font-bold text-xl text-pink-600">
        🎨 스케치북 페이지를 펼치는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen notebook-bg text-gray-800 flex flex-col justify-between selection:bg-pink-200">
      <div>
        {/* Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'write') setEditingPraise(null);
            setActiveTab(tab);
          }}
          employees={employees}
          currentPersona={currentPersona}
          setCurrentPersona={setCurrentPersona}
          unreadCount={unreadCount}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
          user={user}
          onLogout={async () => {
            if (isSupabaseConfigured) {
              await supabase.auth.signOut();
            }
            setUser(null);
          }}
        />

        {/* Main Body Content based on Active Tab */}
        <main className="py-2">
          {activeTab === 'feed' && (
            <PraiseFeed
              praises={praises}
              employees={employees}
              currentPersona={currentPersona}
              onLike={handleLikePraise}
              onDelete={handleDeletePraise}
              onEdit={handleStartEditPraise}
              onNavigateToWrite={() => {
                setEditingPraise(null);
                setActiveTab('write');
              }}
            />
          )}

          {activeTab === 'write' && (
            <PraiseForm
              employees={employees}
              currentPersona={currentPersona}
              onSubmitPraise={handleSubmitPraise}
              editingPraise={editingPraise}
              onUpdatePraise={handleUpdatePraise}
              onCancelEdit={() => {
                setEditingPraise(null);
                setActiveTab('feed');
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto px-4 pb-12">
              <div className="crayon-card p-8 bg-sky-50/60 border-sky-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-extrabold text-sky-800 flex items-center gap-2">
                    <span>💌</span> 사내 알림 메일함 (전체 내역)
                  </h2>
                </div>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">발송된 알림 메일이 없습니다.</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 bg-white rounded-2xl border-2 border-dashed border-sky-200 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-800">수신: {notif.recipientName} ({notif.recipientEmail})</span>
                            {!notif.read && <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">읽지 않음</span>}
                          </div>
                          <p className="text-sm text-gray-600">보낸 사람: <span className="font-bold text-pink-600">{notif.senderName}</span></p>
                          <p className="text-xs text-gray-500 italic mt-1">"{notif.contentSummary}"</p>
                          <span className="text-xs text-gray-400 mt-2 block">{new Date(notif.sentAt).toLocaleString()}</span>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="crayon-btn bg-sky-200 hover:bg-sky-300 text-sky-900 font-bold px-3 py-1.5 text-xs cursor-pointer shrink-0"
                          >
                            확인 완료
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            user?.email?.toLowerCase() === 'mykang@lxmma.com' ? (
              <AdminView
                employees={employees}
                praises={praises}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onBulkAddEmployees={handleBulkAddEmployees}
                onDeletePraise={handleDeletePraise}
                onEditPraise={handleStartEditPraise}
                onInitialRegisterPraise={() => {
                  setEditingPraise(null);
                  setActiveTab('write');
                }}
              />
            ) : (
              <div className="max-w-xl mx-auto px-4 py-16 text-center">
                <div className="crayon-card p-8 bg-red-50 border-red-300">
                  <div className="text-5xl mb-4">🚫</div>
                  <h2 className="text-2xl font-extrabold text-red-800 mb-2">접근 권한이 없습니다</h2>
                  <p className="text-red-600 text-sm mb-6">
                    관리자 전용 뷰는 인가된 관리자 계정(<b className="underline">mykang@lxmma.com</b>)만 접근할 수 있습니다.
                    <br />현재 로그인 계정: <b>{user?.email}</b>
                  </p>
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="crayon-btn bg-pink-400 hover:bg-pink-500 text-white font-bold px-6 py-2.5 text-sm cursor-pointer shadow-xs"
                  >
                    칭찬 피드로 돌아가기 🔙
                  </button>
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* Email Simulator Modal */}
      <EmailSimulatorModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />

      {/* Footer */}
      <footer className="text-center py-6 border-t-2 border-dashed border-pink-200 text-gray-500 text-sm bg-white/50 mt-12">
        <p> crayon 🖍️ 스케치북 칭찬릴레이 프로그램 — 사내 동료 간의 따뜻한 감동과 소통을 응원합니다! ✨</p>
      </footer>
    </div>
  );
}
