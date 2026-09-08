import React, { useState, useEffect } from 'react';
import { Employee, Praise } from '../types';
import { Sparkles, Send, AlertCircle, CheckCircle2, User, Building, Mail, Wand2 } from 'lucide-react';

interface PraiseFormProps {
  employees: Employee[];
  currentPersona: Employee | null;
  onSubmitPraise: (data: { senderEmail: string; recipientEmail: string; content: string; sticker: string }) => Promise<void>;
  editingPraise?: Praise | null;
  onUpdatePraise?: (id: string, content: string, sticker: string) => Promise<void>;
  onCancelEdit?: () => void;
}

export const PraiseForm: React.FC<PraiseFormProps> = ({
  employees,
  currentPersona,
  onSubmitPraise,
  editingPraise,
  onUpdatePraise,
  onCancelEdit,
}) => {
  const [senderEmail, setSenderEmail] = useState(currentPersona?.email || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [content, setContent] = useState('');
  const [sticker, setSticker] = useState('⭐️');
  const [isPolishing, setIsPolishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentPersona) {
      setSenderEmail(currentPersona.email);
    }
  }, [currentPersona]);

  useEffect(() => {
    if (editingPraise) {
      setSenderEmail(editingPraise.senderEmail);
      setRecipientEmail(editingPraise.recipientEmail);
      setContent(editingPraise.content);
      setSticker(editingPraise.sticker || '⭐️');
    }
  }, [editingPraise]);

  const selectedSender = employees.find(e => e.email === senderEmail);
  const selectedRecipient = employees.find(e => e.email === recipientEmail);

  // Check relay eligibility
  const currentBatonHolder = employees.find(e => e.isEligibleToRelay);
  const isBatonHolder = currentPersona ? currentPersona.isEligibleToRelay : true;

  const handlePolish = async () => {
    if (!content.trim()) {
      setErrorMessage('먼저 칭찬 내용 초안을 조금이라도 작성해주세요!');
      return;
    }
    setIsPolishing(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: content, recipientName: selectedRecipient?.name || '동료' }),
      });
      const data = await res.json();
      if (data.polished) {
        setContent(data.polished);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('AI 크레파스 다듬기 중 오류가 발생했습니다.');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!senderEmail || !recipientEmail || !content) {
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (content.length < 100) {
      setErrorMessage(`칭찬 내용은 최소 100자 이상 작성해야 합니다. (현재 ${content.length}자)`);
      return;
    }

    if (senderEmail === recipientEmail) {
      setErrorMessage('자기 자신을 칭찬할 수는 없습니다! 다른 동료를 선택해주세요.');
      return;
    }

    try {
      if (editingPraise && onUpdatePraise) {
        await onUpdatePraise(editingPraise.id, content, sticker);
        setSuccessMessage('칭찬 내용이 성공적으로 수정되었습니다!');
        if (onCancelEdit) onCancelEdit();
      } else {
        await onSubmitPraise({
          senderEmail,
          recipientEmail,
          content,
          sticker,
        });
        setSuccessMessage('🎉 칭찬 릴레이가 성공적으로 등록되었으며, 대상자에게 알림 메일이 발송되었습니다! 다음 바통이 대상자에게 전달됩니다.');
        setContent('');
        setRecipientEmail('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '칭찬 등록 중 오류가 발생했습니다.');
    }
  };

  const stickers = ['⭐️', '🧸', '🍀', '💌', '🎈', '🎨', '🔥', '👑', '🍰', '🏆'];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12">
      <div className="crayon-card p-8 bg-amber-50/50 border-amber-300 relative">
        <div className="absolute -top-4 -right-4 bg-yellow-200 text-amber-900 px-4 py-1.5 rounded-full font-bold shadow-sm border border-dashed border-amber-400 rotate-3">
          {editingPraise ? '✏️ 칭찬 수정하기' : '💌 칭찬 크레파스 작성'}
        </div>

        <h2 className="text-2xl font-extrabold text-pink-700 mb-2 flex items-center gap-2">
          <span>🖍️</span> {editingPraise ? '칭찬 내용 수정' : '새로운 칭찬 릴레이 보내기'}
        </h2>
        <p className="text-gray-600 mb-6">
          칭찬을 받을 동료의 성명, 부서, 이메일을 확인하고 진심 어린 칭찬을 100자 이상 꾹꾹 눌러 담아주세요.
        </p>

        {/* Relay rule warning if not baton holder */}
        {!editingPraise && currentPersona && !isBatonHolder && (
          <div className="mb-6 bg-red-50 border-2 border-dashed border-red-300 p-4 rounded-2xl text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">릴레이 규칙 안내:</span> 현재 칭찬 바통은 <b>{currentBatonHolder?.name} ({currentBatonHolder?.department})</b>님에게 있습니다. 칭찬을 받은 대상자만 다음 릴레이를 이어갈 수 있습니다. (관리자 뷰나 바통 보유 계정으로 전환하여 테스트할 수 있습니다.)
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-100 border-2 border-red-300 p-4 rounded-xl text-red-800 font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-emerald-100 border-2 border-emerald-300 p-4 rounded-xl text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sender Info (From Persona or Selector) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-pink-200 shadow-xs">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <User className="w-4 h-4 text-pink-500" /> 보내는 사람 (성명 / 부서)
              </label>
              <select
                className="w-full bg-pink-50 border border-pink-200 rounded-xl px-3 py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                disabled={!!editingPraise}
              >
                <option value="">-- 보내는 사람 선택 --</option>
                {employees.map(emp => (
                  <option key={emp.email} value={emp.email}>
                    {emp.name} ({emp.department}) - {emp.email}
                  </option>
                ))}
              </select>
              {selectedSender && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <span>부서: {selectedSender.department}</span>
                  <span>이메일: {selectedSender.email}</span>
                </div>
              )}
            </div>

            {/* Recipient Info */}
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-sky-200 shadow-xs">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Building className="w-4 h-4 text-sky-500" /> 받는 사람 (칭찬 대상자)
              </label>
              <select
                className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              >
                <option value="">-- 칭찬할 동료 선택 --</option>
                {employees
                  .filter(emp => emp.email !== senderEmail)
                  .map(emp => (
                    <option key={emp.email} value={emp.email}>
                      {emp.name} ({emp.department}) - {emp.email}
                    </option>
                  ))}
              </select>
              {selectedRecipient && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <span>부서: {selectedRecipient.department}</span>
                  <span>이메일: {selectedRecipient.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sticker Selector */}
          <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-amber-200 shadow-xs">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🎨 스케치북 스티커 선택
            </label>
            <div className="flex flex-wrap gap-3">
              {stickers.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSticker(s)}
                  className={`text-2xl p-2 rounded-xl border-2 transition-all cursor-pointer ${
                    sticker === s
                      ? 'bg-amber-200 border-amber-400 scale-110 shadow-sm'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Praise Content */}
          <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-pink-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">
                ✍️ 칭찬 내용 (100자 이상 작성 필수)
              </label>
              <button
                type="button"
                onClick={handlePolish}
                disabled={isPolishing}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-3 py-1.5 rounded-xl border border-purple-300 flex items-center gap-1 transition shadow-2xs cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {isPolishing ? '크레파스 요정이 다듬는 중...' : 'AI 크레파스 다듬기 ✨'}
              </button>
            </div>

            <textarea
              rows={6}
              placeholder="동료와 함께 일하면서 고마웠던 점, 감동받았던 순간을 100자 이상 자세히 적어주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-pink-50/40 border-2 border-pink-200 rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-pink-300 font-medium"
            />

            <div className="flex items-center justify-between mt-2 text-sm">
              <span className={`font-bold ${content.length >= 100 ? 'text-emerald-600' : 'text-pink-600'}`}>
                현재 글자수: {content.length}자 {content.length >= 100 ? '✅ (100자 이상 충족)' : `(100자까지 ${100 - content.length}자 부족)`}
              </span>
              <span className="text-gray-400">사내 칭찬릴레이 규칙 준수</span>
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {editingPraise && onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="crayon-btn bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-3 cursor-pointer"
              >
                취소하기
              </button>
            )}
            <button
              type="submit"
              className="crayon-btn bg-pink-400 hover:bg-pink-500 text-white font-bold px-8 py-3 text-lg flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Send className="w-5 h-5" />
              {editingPraise ? '수정 완료하기' : '칭찬 릴레이 보내기 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
