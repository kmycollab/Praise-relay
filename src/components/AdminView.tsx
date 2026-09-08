import React, { useState } from 'react';
import { Employee, Praise } from '../types';
import { Shield, UserPlus, Users, Trash2, Edit2, CheckCircle2, AlertCircle, FileText, Plus, Upload } from 'lucide-react';

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

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
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
      } else {
        await onAddEmployee({
          name: empName,
          department: empDept,
          phone: empPhone,
          email: empEmail,
        });
        setMessage('새 임직원이 등록되었습니다.');
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
      setMessage(`성공적으로 ${items.length}명의 임직원이 다수 등록되었습니다!`);
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
              사내 임직원 다수 등록/수정/삭제 및 칭찬릴레이 콘텐츠 관리
            </p>
          </div>

          <div className="flex bg-white rounded-2xl p-1.5 border-2 border-dashed border-purple-300">
            <button
              onClick={() => setAdminTab('employees')}
              className={`px-5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 ${
                adminTab === 'employees' ? 'bg-purple-400 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" /> 사내 임직원 관리 ({employees.length})
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
        <div className="mb-6 bg-purple-100 border-2 border-purple-300 p-4 rounded-xl text-purple-900 font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-purple-700 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Employees Tab */}
      {adminTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add / Edit Employee Form */}
          <div className="crayon-card p-6 bg-white border-purple-200 lg:col-span-1">
            <h3 className="text-xl font-extrabold text-purple-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> {editingEmpId ? '임직원 정보 수정' : '신규 임직원 등록'}
            </h3>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">성명</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">부서</label>
                <input
                  type="text"
                  placeholder="예: 개발팀"
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">연락처</label>
                <input
                  type="text"
                  placeholder="예: 010-1234-5678"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="예: gildong.hong@company.com"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {editingEmpId && (
                <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <input
                    type="checkbox"
                    id="eligibleCheck"
                    checked={editingIsEligible}
                    onChange={(e) => setEditingIsEligible(e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <label htmlFor="eligibleCheck" className="text-sm font-bold text-purple-900 cursor-pointer">
                    🔥 칭찬 릴레이 바통 부여하기
                  </label>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                {editingEmpId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmpId(null);
                      setEmpName('');
                      setEmpDept('');
                      setEmpPhone('');
                      setEmpEmail('');
                    }}
                    className="crayon-btn bg-gray-200 hover:bg-gray-300 px-4 py-2 font-bold cursor-pointer flex-1"
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  className="crayon-btn bg-purple-400 hover:bg-purple-500 text-white px-6 py-2.5 font-bold shadow-sm cursor-pointer flex-1"
                >
                  {editingEmpId ? '수정 완료' : '임직원 등록'}
                </button>
              </div>
            </form>

            {/* Bulk Import Box */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-purple-200">
              <h4 className="text-md font-extrabold text-purple-800 mb-2 flex items-center gap-1">
                <Upload className="w-4 h-4" /> 사내 임직원 다수 등록 (CSV 형식)
              </h4>
              <p className="text-xs text-gray-500 mb-2">
                형식: 이름, 부서, 연락처, 이메일 (줄바꿈으로 구분)
              </p>
              <textarea
                rows={4}
                placeholder="김철수, 경영지원팀, 010-1111-2222, chulsoo.kim@company.com&#10;이영희, 재무팀, 010-3333-4444, younghee.lee@company.com"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full bg-purple-50/40 border-2 border-purple-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 mb-2"
              />
              <button
                type="button"
                onClick={handleBulkImport}
                className="crayon-btn bg-purple-300 hover:bg-purple-400 text-purple-950 font-bold w-full py-2 text-sm shadow-xs cursor-pointer"
              >
                다수 임직원 일괄 등록하기 🚀
              </button>
            </div>
          </div>

          {/* Employee List Table */}
          <div className="crayon-card p-6 bg-white border-purple-200 lg:col-span-2 overflow-x-auto">
            <h3 className="text-xl font-extrabold text-purple-800 mb-4 flex items-center justify-between">
              <span>👥 사내 임직원 명단 ({employees.length}명)</span>
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
              className="crayon-btn bg-pink-400 hover:bg-pink-500 text-white font-bold px-5 py-2.5 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-5 h-5" /> 칭찬릴레이 최초 등록하기
            </button>
          </div>

          <div className="space-y-4">
            {praises.map(praise => (
              <div key={praise.id} className="p-5 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 font-bold text-gray-800">
                    <span className="bg-white px-2.5 py-0.5 rounded-md border border-purple-200 text-purple-700">
                      {praise.senderName} ({praise.senderDept})
                    </span>
                    <span>➔</span>
                    <span className="bg-white px-2.5 py-0.5 rounded-md border border-sky-200 text-sky-700">
                      {praise.recipientName} ({praise.recipientDept})
                    </span>
                    <span className="text-xl ml-2">{praise.sticker}</span>
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2 font-medium">
                    "{praise.content}"
                  </p>
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
    </div>
  );
};
