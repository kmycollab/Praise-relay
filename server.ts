import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initial sample data
let employees = [
  { id: "1", name: "김지민", department: "디자인팀", phone: "010-1234-5678", email: "jimin.kim@company.com", isEligibleToRelay: true },
  { id: "2", name: "박서준", department: "개발팀", phone: "010-2345-6789", email: "seojun.park@company.com", isEligibleToRelay: false },
  { id: "3", name: "이지은", department: "기획팀", phone: "010-3456-7890", email: "jieun.lee@company.com", isEligibleToRelay: false },
  { id: "4", name: "최민호", department: "마케팅팀", phone: "010-4567-8901", email: "minho.choi@company.com", isEligibleToRelay: false },
  { id: "5", name: "한다원", department: "인사팀", phone: "010-5678-9012", email: "dawon.han@company.com", isEligibleToRelay: false },
];

let praises = [
  {
    id: "p1",
    senderName: "한다원",
    senderDept: "인사팀",
    senderEmail: "dawon.han@company.com",
    recipientName: "김지민",
    recipientDept: "디자인팀",
    recipientEmail: "jimin.kim@company.com",
    content: "우리 회사 디자인팀의 비타민 김지민 프로님! 항상 밝은 미소로 동료들을 반겨주시고, 바쁜 스케줄 속에서도 사내 포스터와 배너 시안을 언제나 뚝딱 멋지게 완성해주셔서 정말 큰 힘이 됩니다. 덕분에 사내 분위기가 훨씬 화사해졌어요. 앞으로도 멋진 디자인 기대할게요! 늘 응원합니다.",
    sticker: "⭐️",
    likes: 12,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "p2",
    senderName: "김지민",
    senderDept: "디자인팀",
    senderEmail: "jimin.kim@company.com",
    recipientName: "박서준",
    recipientDept: "개발팀",
    recipientEmail: "seojun.park@company.com",
    content: "개발팀의 에이스 박서준 책임님! 지난번 급하게 요청드린 시스템 오류 수정 건을 주말인데도 불구하고 발 빠르게 해결해 주셔서 정말 감동받았습니다. 개발자분들이 밤낮으로 고생하시는 걸 알지만, 서준님은 언제나 세심하게 사용자 입장에서 먼저 생각하고 코딩해 주셔서 함께 일할 때마다 든든함을 느낍니다. 최고에요!",
    sticker: "🧸",
    likes: 8,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

let notifications = [
  {
    id: "n1",
    recipientEmail: "jimin.kim@company.com",
    recipientName: "김지민",
    senderName: "한다원",
    contentSummary: "디자인팀 비타민 김지민 프로님! 항상 밝은 미소로...",
    sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    read: true,
  },
  {
    id: "n2",
    recipientEmail: "seojun.park@company.com",
    recipientName: "박서준",
    senderName: "김지민",
    contentSummary: "개발팀의 에이스 박서준 책임님! 지난번 급하게 요청...",
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  }
];

// API Routes
app.use("/api", (req, res, next) => {
  console.log(`[Server API] ${req.method} ${req.originalUrl}`, req.body);
  next();
});

// Employees
app.get("/api/employees", (req, res) => {
  res.json(employees);
});

app.post("/api/employees", (req, res) => {
  const { name, department, phone, email } = req.body;
  if (!name || !department || !email) {
    return res.status(400).json({ error: "이름, 부서, 이메일은 필수 입력 항목입니다." });
  }
  const newEmp = {
    id: Date.now().toString(),
    name,
    department,
    phone: phone || "",
    email,
    isEligibleToRelay: employees.length === 0,
  };
  employees.push(newEmp);
  res.status(201).json(newEmp);
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, department, phone, email, isEligibleToRelay } = req.body;
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: "직원을 찾을 수 없습니다." });

  if (name) emp.name = name;
  if (department) emp.department = department;
  if (phone !== undefined) emp.phone = phone;
  if (email) emp.email = email;
  if (isEligibleToRelay !== undefined) emp.isEligibleToRelay = isEligibleToRelay;

  res.json(emp);
});

app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  employees = employees.filter(e => e.id !== id);
  res.json({ success: true });
});

app.post("/api/employees/bulk", (req, res) => {
  const { items } = req.body; // Array of { name, department, phone, email }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "올바른 데이터 형식이 아닙니다." });
  }
  const added = items.map((item, idx) => ({
    id: (Date.now() + idx).toString(),
    name: item.name,
    department: item.department,
    phone: item.phone || "",
    email: item.email,
    isEligibleToRelay: false
  }));
  employees.push(...added);
  res.status(201).json({ success: true, count: added.length });
});

// Praises
app.get("/api/praises", (req, res) => {
  res.json(praises);
});

app.post("/api/praises", (req, res) => {
  const { senderEmail, recipientEmail, content, sticker } = req.body;

  if (!senderEmail || !recipientEmail || !content) {
    return res.status(400).json({ error: "보내는 사람, 받는 사람, 칭찬 내용은 필수입니다." });
  }

  if (content.length < 100) {
    return res.status(400).json({ error: "칭찬 내용은 100자 이상 작성해야 합니다." });
  }

  const sender = employees.find(e => e.email === senderEmail);
  const recipient = employees.find(e => e.email === recipientEmail);

  if (!sender) {
    return res.status(400).json({ error: "보내는 사람의 정보가 임직원 명단에 없습니다." });
  }
  if (!recipient) {
    return res.status(400).json({ error: "받는 사람의 정보가 임직원 명단에 없습니다." });
  }

  // Check relay rule: only eligible users can write praise (unless no praises exist yet or admin override)
  // If there are existing praises, sender should be eligible (isEligibleToRelay) or sender must have received the last praise
  if (praises.length > 0 && !sender.isEligibleToRelay) {
    return res.status(403).json({ 
      error: "앗! 현재 칭찬 릴레이 바통을 가지고 계신 분만 다음 칭찬을 작성할 수 있습니다. 직전 칭찬을 받은 대상자에게 바통이 전달됩니다." 
    });
  }

  const newPraise = {
    id: "p_" + Date.now(),
    senderName: sender.name,
    senderDept: sender.department,
    senderEmail: sender.email,
    recipientName: recipient.name,
    recipientDept: recipient.department,
    recipientEmail: recipient.email,
    content,
    sticker: sticker || "⭐️",
    likes: 0,
    createdAt: new Date().toISOString()
  };

  praises.unshift(newPraise);

  // Update relay eligibility: sender is no longer eligible, recipient is now eligible!
  sender.isEligibleToRelay = false;
  employees.forEach(e => {
    if (e.email === recipient.email) {
      e.isEligibleToRelay = true;
    }
  });

  // Create simulated notification email
  const notif = {
    id: "n_" + Date.now(),
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    senderName: sender.name,
    contentSummary: content.slice(0, 50) + "...",
    sentAt: new Date().toISOString(),
    read: false
  };
  notifications.unshift(notif);

  res.status(201).json({ praise: newPraise, employees });
});

app.put("/api/praises/:id", (req, res) => {
  const { id } = req.params;
  const { content, sticker } = req.body;
  const praise = praises.find(p => p.id === id);
  if (!praise) return res.status(404).json({ error: "칭찬글을 찾을 수 없습니다." });

  if (content) {
    if (content.length < 100) {
      return res.status(400).json({ error: "칭찬 내용은 100자 이상 작성해야 합니다." });
    }
    praise.content = content;
  }
  if (sticker) {
    praise.sticker = sticker;
  }

  res.json(praise);
});

app.delete("/api/praises/:id", (req, res) => {
  const { id } = req.params;
  praises = praises.filter(p => p.id !== id);
  res.json({ success: true });
});

app.post("/api/praises/:id/like", (req, res) => {
  const { id } = req.params;
  const praise = praises.find(p => p.id === id);
  if (!praise) return res.status(404).json({ error: "칭찬글을 찾을 수 없습니다." });
  praise.likes = (praise.likes || 0) + 1;
  res.json(praise);
});

// Notifications
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// AI Polish Helper
app.post("/api/ai/polish", async (req, res) => {
  const { draft, recipientName } = req.body;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ polished: draft + "\n\n(AI API 키가 설정되지 않아 원문 그대로 반환됩니다. 스케치북에 꾹꾹 눌러쓴 것처럼 따뜻한 마음이 잘 담겨있어요!)" });
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `당신은 사내 칭찬 릴레이 도우미 요정입니다. 아래의 초안을 바탕으로, 동료(${recipientName || '동료'})를 향한 칭찬과 격려의 마음이 5살 어린아이의 순수한 마음과 어른의 따뜻한 감성이 어우러진 친근하고 감동적인 톤으로 100자가 넘도록 다듬어주세요. 칭찬 내용만 출력해주세요:\n\n${draft}`
    });
    res.json({ polished: response.text || draft });
  } catch (err) {
    console.error("AI polish error:", err);
    res.json({ polished: draft });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sketchbook Compliment Relay Server running on port ${PORT}`);
  });
}

startServer();
