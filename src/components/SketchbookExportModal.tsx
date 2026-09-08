import React, { useState } from 'react';
import { Praise, Employee } from '../types';
import { Download, X, Calendar, Sparkles, FileCode } from 'lucide-react';

interface SketchbookExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  praises: Praise[];
  employees: Employee[];
}

export const SketchbookExportModal: React.FC<SketchbookExportModalProps> = ({
  isOpen,
  onClose,
  praises,
  employees,
}) => {
  const [exportType, setExportType] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadHTML = () => {
    setIsExporting(true);

    const now = new Date();
    let filtered = [...praises];
    let titleText = '전체 칭찬 릴레이 스케치보드';

    if (exportType === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = praises.filter(p => new Date(p.createdAt) >= oneWeekAgo);
      titleText = '주간 칭찬 릴레이 스케치보드 (최근 7일)';
    } else if (exportType === 'monthly') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = praises.filter(p => new Date(p.createdAt) >= oneMonthAgo);
      titleText = '월간 칭찬 릴레이 스케치보드 (최근 30일)';
    }

    // Generate HTML string
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleText}</title>
    <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Gaegu', cursive, sans-serif;
            background-color: #fffdf5;
            color: #4a4a4a;
            margin: 0;
            padding: 40px;
            background-image: linear-gradient(#e5e0d8 1px, transparent 1px);
            background-size: 100% 32px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #ffd1dc 0%, #fff1c1 50%, #b0e0e6 100%);
            border: 4px dashed #ffb3ba;
            border-radius: 30px;
            padding: 30px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 4px 6px 0px rgba(255, 179, 186, 0.4);
        }
        h1 {
            font-size: 36px;
            color: #d63384;
            margin: 0 0 10px 0;
            text-shadow: 1px 1px 0px white;
        }
        p.subtitle {
            font-size: 20px;
            color: #555;
            margin: 0;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        .stat-card {
            background: white;
            border: 3px dashed #ffb3ba;
            border-radius: 20px;
            padding: 15px 25px;
            text-align: center;
            box-shadow: 2px 3px 0px rgba(0,0,0,0.05);
            font-size: 18px;
        }
        .stat-card b {
            color: #d63384;
            font-size: 24px;
            display: block;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 25px;
        }
        .card {
            background: white;
            border: 3px dashed;
            border-radius: 25px;
            padding: 25px;
            position: relative;
            box-shadow: 4px 6px 0px rgba(0,0,0,0.08);
            page-break-inside: avoid;
        }
        .card:nth-child(3n+1) { border-color: #ffb3ba; background-color: #fff0f3; }
        .card:nth-child(3n+2) { border-color: #ffe066; background-color: #fffef0; }
        .card:nth-child(3n+3) { border-color: #70a1ff; background-color: #f0f8ff; }
        .sticker {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 32px;
            background: white;
            padding: 5px 10px;
            border-radius: 15px;
            border: 2px dashed #ccc;
        }
        .meta {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .badge {
            background: white;
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid #ddd;
            font-size: 16px;
        }
        .content {
            font-size: 22px;
            line-height: 1.6;
            color: #2c2c2c;
            white-space: pre-wrap;
            margin-bottom: 20px;
        }
        .footer-info {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            color: #666;
            border-top: 2px dashed #ddd;
            padding-top: 15px;
        }
        .footer-brand {
            text-align: center;
            margin-top: 50px;
            font-size: 18px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 ${titleText}</h1>
            <p class="subtitle">사내 동료 간의 따뜻한 칭찬과 마음을 담은 스케치북 리포트 (생성일: ${new Date().toLocaleDateString()})</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <b>${filtered.length}건</b>
                <span>칭찬 스케치 수</span>
            </div>
            <div class="stat-card">
                <b>${employees.length}명</b>
                <span>사내 임직원 총원</span>
            </div>
            <div class="stat-card">
                <b>✨ 릴레이 진행중</b>
                <span>사내 소통 프로그램</span>
            </div>
        </div>

        <div class="grid">
            ${filtered.length === 0 ? '<p style="text-align:center; font-size:20px; color:#777;">해당 기간에 등록된 칭찬 스케치가 없습니다.</p>' : filtered.map(p => `
                <div class="card">
                    <div class="sticker">${p.sticker || '⭐️'}</div>
                    <div class="meta">
                        <span class="badge">보낸이: ${p.senderName} (${p.senderDept})</span>
                        <span>➔</span>
                        <span class="badge">받은이: ${p.recipientName} (${p.recipientDept})</span>
                    </div>
                    <div class="content">"${p.content}"</div>
                    <div class="footer-info">
                        <span>작성일: ${new Date(p.createdAt).toLocaleDateString()}</span>
                        <span>❤️ 응원 하트: ${p.likes || 0}개</span>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer-brand">
            🖍️ 스케치북 칭찬릴레이 프로그램 — 사내 동료 간의 따뜻한 감동과 소통을 응원합니다! ✨
        </div>
    </div>
</body>
</html>`;

    // Trigger download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `praise_sketchbook_${exportType}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="crayon-card bg-white w-full max-w-md p-6 shadow-2xl border-amber-300">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-amber-200 mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-extrabold text-amber-900">📥 HTML 스케치보드 다운로드</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          주간 또는 월간 칭찬 릴레이 스케치보드 내용을 귀여운 크레파스 스케치북 테마의 독립형 HTML 리포트로 다운로드합니다. 브라우저에서 바로 열거나 공유할 수 있습니다!
        </p>

        <div className="space-y-3 mb-6">
          <label
            onClick={() => setExportType('weekly')}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
              exportType === 'weekly' ? 'bg-amber-100 border-amber-400 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <div className="text-base text-gray-800">주간 칭찬 스케치보드 (최근 7일)</div>
                <div className="text-xs text-gray-500 font-normal">최근 일주일 동안의 칭찬 모음</div>
              </div>
            </div>
            <input type="radio" name="exportType" checked={exportType === 'weekly'} onChange={() => setExportType('weekly')} className="accent-amber-600" />
          </label>

          <label
            onClick={() => setExportType('monthly')}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
              exportType === 'monthly' ? 'bg-amber-100 border-amber-400 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗓️</span>
              <div>
                <div className="text-base text-gray-800">월간 칭찬 스케치보드 (최근 30일)</div>
                <div className="text-xs text-gray-500 font-normal">한 달 동안의 칭찬 및 감동 스토리 모음</div>
              </div>
            </div>
            <input type="radio" name="exportType" checked={exportType === 'monthly'} onChange={() => setExportType('monthly')} className="accent-amber-600" />
          </label>

          <label
            onClick={() => setExportType('all')}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
              exportType === 'all' ? 'bg-amber-100 border-amber-400 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <div className="text-base text-gray-800">전체 칭찬 스케치보드 (전체 누적)</div>
                <div className="text-xs text-gray-500 font-normal">지금까지 작성된 모든 칭찬 릴레이</div>
              </div>
            </div>
            <input type="radio" name="exportType" checked={exportType === 'all'} onChange={() => setExportType('all')} className="accent-amber-600" />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="crayon-btn bg-gray-200 hover:bg-gray-300 px-5 py-2.5 font-bold cursor-pointer text-sm"
          >
            취소
          </button>
          <button
            onClick={handleDownloadHTML}
            disabled={isExporting}
            className="crayon-btn bg-amber-400 hover:bg-amber-500 text-amber-950 px-6 py-2.5 font-bold shadow-md cursor-pointer flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            {isExporting ? '다운로드 파일 생성 중...' : 'HTML 리포트 다운로드 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
};
