export type UserRole = "entrepreneur" | "advisor" | "admin";

export type AccountStatus = "active" | "suspended" | "pending";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  status: AccountStatus;
  preferred_language?: string;
  // GramUdaan business context
  state?: string;
  district?: string;
  village?: string;
  pincode?: string;
  business_category?: string;
  business_sub_category?: string;
  existing_or_new?: string;
  available_capital?: number;
  goal?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationItem {
  id: string;
  entrepreneur_id: string;
  entrepreneur_name?: string;
  advisor_id?: string;
  business_name: string;
  topic: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  scheduled_at?: string;
  created_at: string;
}
