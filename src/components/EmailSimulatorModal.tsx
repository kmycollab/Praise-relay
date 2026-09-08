import React from 'react';
import { NotificationItem } from '../types';
import { Mail, CheckCircle2, X, Bell, Calendar, User } from 'lucide-react';

interface EmailSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="crayon-card bg-white w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl border-sky-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-sky-200 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-sky-500" />
            <h2 className="text-2xl font-extrabold text-sky-700">💌 사내 알림 메일함 (시뮬레이터)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 mb-4">
          칭찬 릴레이 당첨자(수신자)들에게 발송된 사내 알림 메일 내역입니다. 메일을 확인하고 다음 릴레이 바통을 이어받으세요!
        </p>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-lg">발송된 알림 메일이 아직 없습니다.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  notif.read ? 'bg-gray-50 border-gray-200' : 'bg-sky-50/80 border-sky-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl text-xl mt-0.5 ${notif.read ? 'bg-gray-200' : 'bg-sky-200 text-sky-800'}`}>
                    💌
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-gray-800">
                        수신: {notif.recipientName} ({notif.recipientEmail})
                      </span>
                      {!notif.read && (
                        <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      보낸 사람: <span className="font-bold text-pink-600">{notif.senderName}</span> 님이 칭찬을 보냈습니다!
                    </p>
                    <p className="text-xs text-gray-500 bg-white/80 p-2 rounded-lg border border-dashed border-gray-300 italic">
                      "{notif.contentSummary}"
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notif.sentAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => onMarkAsRead(notif.id)}
                    className="crayon-btn bg-sky-200 hover:bg-sky-300 text-sky-900 font-bold px-3 py-1.5 text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> 메일 확인 완료
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t-2 border-dashed border-sky-200 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="crayon-btn bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-2 cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
