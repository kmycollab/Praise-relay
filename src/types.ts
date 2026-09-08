export interface Employee {
  id: string;
  name: string;
  department: string;
  phone: string;
  email: string;
  isEligibleToRelay: boolean;
}

export interface Praise {
  id: string;
  senderName: string;
  senderDept: string;
  senderEmail: string;
  recipientName: string;
  recipientDept: string;
  recipientEmail: string;
  content: string;
  sticker: string;
  likes: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  contentSummary: string;
  sentAt: string;
  read: boolean;
}
