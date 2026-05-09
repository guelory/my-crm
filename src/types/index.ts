export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP';
export type ContactStatus = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'CHURNED';
export type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type ActivityType = 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: ContactStatus;
  tags: string[];
  notes?: string;
  linkedinUrl?: string;
  website?: string;
  address?: string;
  avatarUrl?: string;
  ownerId: string;
  owner?: { id: string; name: string };
  deals?: Deal[];
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  closeDate?: string;
  notes?: string;
  contactId?: string;
  contact?: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'company'>;
  ownerId: string;
  owner?: { id: string; name: string };
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  body?: string;
  outcome?: string;
  dueDate?: string;
  completedAt?: string;
  contactId?: string;
  contact?: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'company'>;
  dealId?: string;
  deal?: Pick<Deal, 'id' | 'title'>;
  userId: string;
  user?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalContacts: number;
  totalDeals: number;
  wonRevenue: number;
  wonCount: number;
  lostCount: number;
  activePipelineValue: number;
  activeDealsCount: number;
  conversionRate: number;
  totalActivities: number;
  pipeline: { stage: DealStage; count: number; value: number }[];
  recentActivities: Activity[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
