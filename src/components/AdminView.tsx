import React, { useState } from 'react';
import { Employee, Praise } from '../types';
import { Shield, UserPlus, Users, Trash2, Edit2, CheckCircle2, AlertCircle, FileText, Plus, Upload, X } from 'lucide-react';

interface AdminViewProps {
  employees: Employee[];
  praises: Praise[];
  onAddEmployee: (emp: { name: string; department: string; phone: string; email: string }) => Promise<void>;
  onUpdateEmployee: (id: string, emp: { name: string; department: string; phone: string; email: string; isEligibleToRelay: boolean }) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onBulkAddEmployees: (items: any[]) => Promise<void>;
  onDeletePraise: (id: string) => Promise<void>;
  onEditPraise: (praise: Praise) => void;
  onInitialRegisterPraise: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  employees,
  praises,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBulkAddEmployees,
  onDeletePraise,
  onEditPraise,
  onInitialRegisterPraise,
}) => {
  const [adminTab, setAdminTab] = useState<'employees' | 'praises'>('employees');

  // Employee Edit / Bulk State
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [editingIsEligible, setEditingIsEligible] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkInput, setBulkInput] = useState('');

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empDept || !empEmail) {
      setMessage('이름, 부서, 이메일은 필수 입력 항목입니다.');
      return;
    }
    try {
      if (editingEmpId) {
        await onUpdateEmployee(editingEmpId, {
          name: empName,
          department: empDept,
          phone: empPhone,
          email: empEmail,
          isEligibleToRelay: editingIsEligible,
        });
        setMessage('임직원 정보가 수정되었습니다.');
        setEditingEmpId(null);
      }
      setEmpName('');
      setEmpDept('');
      setEmpPhone('');
      setEmpEmail('');
      setEditingIsEligible(false);
    } catch (err: any) {
      setMessage(err.message || '저장 중 오류가 발생했습니다.');
    }
  };

  const handleStartEditEmp = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpDept(emp.department);
    setEmpPhone(emp.phone);
    setEmpEmail(emp.email);
    setEditingIsEligible(emp.isEligibleToRelay);
  };

  const handleBulkImport = async () => {
    try {
      // Parse CSV or JSON lines: Name,Dept,Phone,Email
      const lines = bulkInput.split('\n').filter(l => l.trim().length > 0);
      const items = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          name: parts[0] || '임직원',
          department: parts[1] || '일반부서',
          phone: parts[2] || '010-0000-0000',
          email: parts[3] || 'user@company.com',
        };
      });
      if (items.length === 0) {
        setMessage('등록할 다수 임직원 데이터가 올바르지 않습니다.');
        return;
      }
      await onBulkAddEmployees(items);
      setMessage(`성공적으로 ${items.length}명의 임직원이 일괄 등록되었습니다!`);
      setBulkInput('');
    } catch (err: any) {
      setMessage(err.message || '다수 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="crayon-card p-6 bg-purple-50/50 border-purple-300 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-block bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-sm font-bold mb-1 shadow-xs">
              🔒 관리자 권한 전용
            </div>
            <h2 className="text-3xl font-extrabold text-purple-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" /> 관리자 대시보드
            </h2>
            <p className="text-gray-600 mt-1">
              사내 임직원 명단 관리 (신규 임직원은 회원가입을 통해 자동 실시간 연동됩니다) 및 칭찬릴레이 콘텐츠 관리
            </p>
          </div>

          <div className="flex bg-white rounded-2xl p-1.5 border-2 border-dashed border-purple-300">
            <button
              onClick={() => setAdminTab('employees')}
              className={`px-5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
                adminTab === 'employees' ? 'bg-purple-400 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" /> 사내 임직원 명단 ({employees.length})
            </button>
            <button
              onClick={() => setAdminTab('praises')}
              className={`px-5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
                adminTab === 'praises' ? 'bg-purple-400 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" /> 칭찬릴레이 콘텐츠 관리 ({praises.length})
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 bg-purple-100 border-2 border-purple-300 p-4 rounded-xl text-purple-900 font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-700 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-purple-700 hover:text-purple-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Employees Tab */}
      {adminTab === 'employees' && (
        <div className="space-y-6">
          {/* Bulk Import & Notice Box */}
          <div className="crayon-card p-6 bg-white border-purple-200">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-purple-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" /> 사내 임직원 일괄 등록 (CSV 형식)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  💡 신규 임직원은 로그인 화면의 <b>회원가입</b>을 통해 실시간으로 자동 연동됩니다. 대량 등록이 필요한 경우 아래에 입력하세요. (형식: 이름, 부서, 연락처, 이메일)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="김철수, 경영지원팀, 010-1111-2222, chulsoo.kim@company.com&#10;이영희, 재무팀, 010-3333-4444, younghee.lee@company.com"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="crayon-btn bg-purple-300 hover:bg-purple-400 text-purple-950 font-bold px-6 py-2 text-xs shadow-xs cursor-pointer"
                >
                  다수 임직원 일괄 등록하기 🚀
                </button>
              </div>
            </div>
          </div>

          {/* Employee List Table */}
          <div className="crayon-card p-6 bg-white border-purple-200 overflow-x-auto">
            <h3 className="text-xl font-extrabold text-purple-800 mb-4 flex items-center justify-between">
              <span>👥 사내 임직원 명단 (Supabase 실시간 연동됨)</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">
                총 {employees.length}명
              </span>
            </h3>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-purple-200 text-purple-900 bg-purple-50/80">
                  <th className="p-3 font-bold rounded-l-xl">성명 / 부서</th>
                  <th className="p-3 font-bold">연락처</th>
                  <th className="p-3 font-bold">이메일</th>
                  <th className="p-3 font-bold text-center">바통 상태</th>
                  <th className="p-3 font-bold text-center rounded-r-xl">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-purple-50/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-gray-800">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.department}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{emp.phone || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">{emp.email}</td>
                    <td className="p-3 text-center">
                      {emp.isEligibleToRelay ? (
                        <span className="bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                          🔥 바통 보유
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStartEditEmp(emp)}
                          className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg cursor-pointer"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Praises Tab */}
      {adminTab === 'praises' && (
        <div className="crayon-card p-6 bg-white border-purple-200">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="text-xl font-extrabold text-purple-900">
              📝 칭찬릴레이 콘텐츠 관리 및 최초 등록 ({praises.length}개)
            </h3>
            <button
              onClick={onInitialRegisterPraise}
              className="crayon-btn bg-pink-400 hover:bg-pink-500 text-white font-bold px-4 py-2 text-sm cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 최초 칭찬릴레이 등록하기
            </button>
          </div>

          <div className="space-y-4">
            {praises.map(praise => (
              <div key={praise.id} className="p-4 bg-purple-50/40 rounded-2xl border-2 border-dashed border-purple-200 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-pink-200 text-pink-900 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {praise.sticker} {praise.senderName} ({praise.senderDept}) ➔ {praise.recipientName} ({praise.recipientDept})
                    </span>
                    <span className="text-xs text-gray-500">{new Date(praise.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{praise.content}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onEditPraise(praise)}
                    className="crayon-btn bg-purple-200 hover:bg-purple-300 text-purple-900 px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => onDeletePraise(praise.id)}
                    className="crayon-btn bg-red-200 hover:bg-red-300 text-red-900 px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmpId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="crayon-card bg-white w-full max-w-md p-6 shadow-2xl border-purple-300">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-purple-200 mb-4">
              <h3 className="text-lg font-extrabold text-purple-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" /> 임직원 정보 수정
              </h3>
              <button
                onClick={() => setEditingEmpId(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">성명</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">부서</label>
                <input
                  type="text"
                  required
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">연락처</label>
                <input
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  required
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                <input
                  type="checkbox"
                  id="eligibleCheckModal"
                  checked={editingIsEligible}
                  onChange={(e) => setEditingIsEligible(e.target.checked)}
                  className="w-4 h-4 accent-purple-600"
                />
                <label htmlFor="eligibleCheckModal" className="text-sm font-bold text-purple-900 cursor-pointer">
                  🔥 칭찬 릴레이 바통 부여하기
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmpId(null)}
                  className="crayon-btn bg-gray-200 hover:bg-gray-300 px-4 py-2 font-bold cursor-pointer flex-1"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="crayon-btn bg-purple-400 hover:bg-purple-500 text-white px-6 py-2.5 font-bold shadow-sm cursor-pointer flex-1"
                >
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
