import { supabase } from "@/lib/supabase";

export interface SupabaseApplication {
  id: string;
  user_id?: string;
  report_id?: string;
  business_name: string;
  applicant_name: string;
  mobile: string;
  state: string;
  district: string;
  project_cost: number;
  own_contribution: number;
  requested_loan: number;
  scheme_name: string;
  status: string;
  form_data: any;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_APPS_KEY = "gramudaan_local_applications";

function getLocalApplications(): SupabaseApplication[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalApplications(apps: SupabaseApplication[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error("[Supabase Applications] Local cache error:", err);
  }
}

export async function getUserApplications(): Promise<SupabaseApplication[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as SupabaseApplication[];
      }
    }
  } catch (err) {
    console.warn("[Supabase Applications] Remote fetch fallback:", err);
  }

  return getLocalApplications();
}

export async function saveApplication(
  appInput: Omit<SupabaseApplication, "id" | "user_id" | "created_at" | "updated_at"> & { id?: string }
): Promise<string> {
  const localId = appInput.id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const payload = {
        user_id: user.id,
        business_name: appInput.business_name,
        applicant_name: appInput.applicant_name,
        mobile: appInput.mobile,
        state: appInput.state,
        district: appInput.district,
        project_cost: appInput.project_cost,
        own_contribution: appInput.own_contribution,
        requested_loan: appInput.requested_loan,
        scheme_name: appInput.scheme_name,
        status: appInput.status,
        form_data: appInput.form_data,
        updated_at: now,
      };

      if (appInput.id) {
        const { error } = await supabase
          .from("applications")
          .update(payload)
          .eq("id", appInput.id);
        if (!error) return appInput.id;
      } else {
        const { data, error } = await supabase
          .from("applications")
          .insert({
            ...payload,
            created_at: now,
          })
          .select("id")
          .single();
        if (!error && data?.id) return data.id;
      }
    }
  } catch (err) {
    console.warn("[Supabase Applications] Remote save fallback:", err);
  }

  const existing = getLocalApplications();
  const index = existing.findIndex((a) => a.id === localId);
  const updatedItem: SupabaseApplication = {
    ...appInput,
    id: localId,
    created_at: index >= 0 ? existing[index].created_at : now,
    updated_at: now,
  };

  if (index >= 0) {
    existing[index] = updatedItem;
    saveLocalApplications([...existing]);
  } else {
    saveLocalApplications([updatedItem, ...existing]);
  }

  return localId;
}
