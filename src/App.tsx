import React, { useState, useEffect } from 'react';
import { Employee, Praise, NotificationItem } from './types';
import { Header } from './components/Header';
import { PraiseFeed } from './components/PraiseFeed';
import { PraiseForm } from './components/PraiseForm';
import { EmailSimulatorModal } from './components/EmailSimulatorModal';
import { AdminView } from './components/AdminView';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [praises, setPraises] = useState<Praise[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'write' | 'notifications' | 'admin'>('feed');
  const [editingPraise, setEditingPraise] = useState<Praise | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then(res => res.json()),
      fetch('/api/praises').then(res => res.json()),
      fetch('/api/notifications').then(res => res.json()),
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

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handlers for Praises
  const handleSubmitPraise = async (data: { senderEmail: string; recipientEmail: string; content: string; sticker: string }) => {
    const res = await fetch('/api/praises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || '칭찬 등록에 실패했습니다.');
    }
    setPraises(prev => [json.praise, ...prev]);
    setEmployees(json.employees);
    // Refresh notifications
    const notifRes = await fetch('/api/notifications');
    const notifData = await notifRes.json();
    setNotifications(notifData);
  };

  const handleUpdatePraise = async (id: string, content: string, sticker: string) => {
    const res = await fetch(`/api/praises/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sticker }),
    });
    const updated = await res.json();
    if (!res.ok) {
      throw new Error(updated.error || '수정에 실패했습니다.');
    }
    setPraises(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleDeletePraise = async (id: string) => {
    if (!window.confirm('정말 이 칭찬 릴레이 글을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/praises/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPraises(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleLikePraise = async (id: string) => {
    const res = await fetch(`/api/praises/${id}/like`, { method: 'POST' });
    const updated = await res.json();
    if (res.ok) {
      setPraises(prev => prev.map(p => p.id === id ? updated : p));
    }
  };

  const handleStartEditPraise = (praise: Praise) => {
    setEditingPraise(praise);
    setActiveTab('write');
  };

  // Handlers for Employees
  const handleAddEmployee = async (emp: { name: string; department: string; phone: string; email: string }) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    const newEmp = await res.json();
    if (res.ok) {
      setEmployees(prev => [...prev, newEmp]);
    } else {
      throw new Error(newEmp.error);
    }
  };

  const handleUpdateEmployee = async (id: string, emp: { name: string; department: string; phone: string; email: string; isEligibleToRelay: boolean }) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    const updated = await res.json();
    if (res.ok) {
      // If this employee is set to eligible, unset others
      const empRes = await fetch('/api/employees');
      const allEmp = await empRes.json();
      setEmployees(allEmp);
    } else {
      throw new Error(updated.error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('정말 이 임직원을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleBulkAddEmployees = async (items: any[]) => {
    const res = await fetch('/api/employees/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      const empRes = await fetch('/api/employees');
      const allEmp = await empRes.json();
      setEmployees(allEmp);
    } else {
      const err = await res.json();
      throw new Error(err.error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

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
