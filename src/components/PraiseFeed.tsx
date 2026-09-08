import React, { useState } from 'react';
import { Praise, Employee } from '../types';
import { Heart, Search, Filter, Trash2, Edit3, Sparkles, User, Building, Calendar, ArrowRight } from 'lucide-react';

interface PraiseFeedProps {
  praises: Praise[];
  employees: Employee[];
  currentPersona: Employee | null;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (praise: Praise) => void;
  onNavigateToWrite: () => void;
}

export const PraiseFeed: React.FC<PraiseFeedProps> = ({
  praises,
  employees,
  currentPersona,
  onLike,
  onDelete,
  onEdit,
  onNavigateToWrite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPerson, setSelectedPerson] = useState('ALL');
  const [viewMode, setViewMode] = useState<'all' | 'person'>('all');

  const departments = Array.from(new Set(employees.map(e => e.department)));

  // Filter praises
  const filteredPraises = praises.filter(p => {
    const matchesSearch =
      p.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.senderDept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      selectedDept === 'ALL' ||
      p.senderDept === selectedDept ||
      p.recipientDept === selectedDept;

    const matchesPerson =
      selectedPerson === 'ALL' ||
      p.senderEmail === selectedPerson ||
      p.recipientEmail === selectedPerson;

    if (viewMode === 'person' && selectedPerson !== 'ALL') {
      return matchesSearch && matchesPerson;
    }
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Top Filter & View Controls */}
      <div className="crayon-card p-5 mb-8 bg-amber-50/60 border-amber-300">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Search className="w-5 h-5 text-amber-600" />
            <input
              type="text"
              placeholder="이름, 부서, 칭찬 내용 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-dashed border-amber-300 rounded-xl px-4 py-2 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-amber-400 text-base"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex bg-white rounded-xl border-2 border-dashed border-amber-300 p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  viewMode === 'all' ? 'bg-amber-300 text-amber-950 shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                전체 현황 보기
              </button>
              <button
                onClick={() => setViewMode('person')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  viewMode === 'person' ? 'bg-amber-300 text-amber-950 shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                개인별 모아보기
              </button>
            </div>

            {viewMode === 'all' ? (
              <select
                className="bg-white border-2 border-dashed border-amber-300 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="ALL">🏢 전체 부서 보기</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            ) : (
              <select
                className="bg-white border-2 border-dashed border-amber-300 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
              >
                <option value="ALL">👤 임직원 선택 (보낸/받은 칭찬)</option>
                {employees.map(emp => (
                  <option key={emp.email} value={emp.email}>
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Relay Timeline Banner */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-pink-700 flex items-center gap-2">
          <span>🖍️</span> 칭찬 릴레이 스케치보드 ({filteredPraises.length}개)
        </h2>
        <button
          onClick={onNavigateToWrite}
          className="crayon-btn bg-pink-300 hover:bg-pink-400 text-white font-bold px-4 py-2 text-sm flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> 나도 칭찬하기!
        </button>
      </div>

      {/* Praises Grid */}
      {filteredPraises.length === 0 ? (
        <div className="crayon-card p-12 text-center bg-white border-pink-200">
          <div className="text-5xl mb-3">🎨</div>
          <h3 className="text-xl font-bold text-gray-700 mb-1">등록된 칭찬 스케치가 없어요</h3>
          <p className="text-gray-500 mb-4">첫 번째 주인공에게 따뜻한 칭찬의 크레파스를 건네주세요!</p>
          <button
            onClick={onNavigateToWrite}
            className="crayon-btn bg-amber-300 hover:bg-amber-400 text-amber-950 font-bold px-6 py-2.5 shadow-sm cursor-pointer"
          >
            첫 칭찬 릴레이 시작하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPraises.map((praise, index) => {
            const isAuthor = currentPersona && currentPersona.email === praise.senderEmail;
            return (
              <div
                key={praise.id}
                className={`crayon-card p-6 relative flex flex-col justify-between ${
                  index % 3 === 0
                    ? 'bg-pink-50/70 border-pink-300'
                    : index % 3 === 1
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-sky-50/70 border-sky-300'
                }`}
              >
                {/* Sticker Badge */}
                <div className="absolute top-4 right-4 text-3xl bg-white/80 p-2 rounded-2xl shadow-xs border border-dashed border-gray-300">
                  {praise.sticker || '⭐️'}
                </div>

                <div>
                  {/* Sender -> Recipient Header */}
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 flex-wrap">
                    <span className="bg-white px-3 py-1 rounded-full border border-pink-200 shadow-2xs flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-pink-500" /> {praise.senderName} ({praise.senderDept})
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="bg-white px-3 py-1 rounded-full border border-sky-200 shadow-2xs flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-500" /> {praise.recipientName} ({praise.recipientDept})
                    </span>
                  </div>

                  {/* Praise Content */}
                  <p className="text-gray-800 text-lg leading-relaxed mb-6 whitespace-pre-wrap font-medium">
                    "{praise.content}"
                  </p>
                </div>

                {/* Footer: Date, Likes & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-300 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(praise.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Like Button */}
                    <button
                      onClick={() => onLike(praise.id)}
                      className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-pink-300 text-pink-600 hover:bg-pink-100 transition shadow-2xs cursor-pointer font-bold"
                    >
                      <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                      <span>{praise.likes || 0}</span>
                    </button>

                    {/* Edit / Delete (Only Author) */}
                    {isAuthor && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(praise)}
                          className="p-1.5 bg-white rounded-lg border border-gray-300 text-blue-600 hover:bg-blue-50 cursor-pointer shadow-2xs"
                          title="수정하기"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(praise.id)}
                          className="p-1.5 bg-white rounded-lg border border-gray-300 text-red-600 hover:bg-red-50 cursor-pointer shadow-2xs"
                          title="삭제하기"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
