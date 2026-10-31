import { supabase } from "@/lib/supabase";

export interface SupabaseReport {
  id: string;
  user_id?: string;
  title: string;
  business_id: string;
  business_name: string;
  sub_category_id?: string;
  location_id: string;
  location_name: string;
  capital: number;
  target_investment?: number;
  other_funding?: number;
  place_status?: string;
  rent_monthly?: number;
  scale_choice?: string;
  overall_score: number;
  verdict: string;
  verdict_label: string;
  feasibility_data: any;
  created_at?: string;
}

const LOCAL_STORAGE_REPORTS_KEY = "gramudaan_local_reports";

function getLocalReports(): SupabaseReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: SupabaseReport[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error("[Supabase Reports] Local cache error:", err);
  }
}

export async function getUserReports(): Promise<SupabaseReport[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as SupabaseReport[];
      }
    }
  } catch (err) {
    console.warn("[Supabase Reports] Remote fetch fallback to local:", err);
  }

  return getLocalReports();
}

export async function getReportById(id: string): Promise<SupabaseReport | null> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as SupabaseReport;
    }
  } catch (err) {
    console.warn("[Supabase Reports] Error finding report by id:", err);
  }

  const local = getLocalReports().find((r) => r.id === id);
  return local || null;
}

export async function saveReport(reportInput: Omit<SupabaseReport, "id" | "user_id" | "created_at">): Promise<string> {
  const localId = `local-rpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          title: reportInput.title,
          business_id: reportInput.business_id,
          business_name: reportInput.business_name,
          sub_category_id: reportInput.sub_category_id,
          location_id: reportInput.location_id,
          location_name: reportInput.location_name,
          capital: reportInput.capital,
          target_investment: reportInput.target_investment,
          other_funding: reportInput.other_funding,
          place_status: reportInput.place_status,
          rent_monthly: reportInput.rent_monthly,
          scale_choice: reportInput.scale_choice,
          overall_score: reportInput.overall_score,
          verdict: reportInput.verdict,
          verdict_label: reportInput.verdict_label,
          feasibility_data: reportInput.feasibility_data,
        })
        .select("id")
        .single();

      if (!error && data?.id) {
        return data.id;
      }
    }
  } catch (err) {
    console.warn("[Supabase Reports] Remote save fallback to local:", err);
  }

  // Local fallback
  const localList = getLocalReports();
  const newReport: SupabaseReport = {
    ...reportInput,
    id: localId,
    created_at: timestamp,
  };
  saveLocalReports([newReport, ...localList]);
  return localId;
}

export async function deleteReport(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.warn("[Supabase Reports] Remote delete failed:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase Reports] Remote delete error:", err);
  }

  const filtered = getLocalReports().filter((r) => r.id !== id);
  saveLocalReports(filtered);
  return true;
}
