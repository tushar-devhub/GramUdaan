import { supabase } from "@/lib/supabase";

export interface SupabaseProfile {
  id?: string;
  user_id?: string;
  full_name: string;
  mobile: string;
  email?: string;
  age?: string;
  gender?: string;
  state?: string;
  district?: string;
  village?: string;
  pincode?: string;
  business_category?: string;
  business_sub_category?: string;
  existing_or_new?: string;
  available_capital?: number;
  goal?: string;
  preferred_language?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_PROFILE_KEY = "gramudaan_local_user_profile";

function getLocalProfile(): SupabaseProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(profile: SupabaseProfile) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("[Supabase Profile] Local cache error:", err);
  }
}

export async function getUserProfile(): Promise<SupabaseProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        return data as SupabaseProfile;
      }
    }
  } catch (err) {
    console.warn("[Supabase Profile] Remote profile fetch fallback:", err);
  }

  return getLocalProfile();
}

export async function saveUserProfile(profileInput: Partial<SupabaseProfile>): Promise<SupabaseProfile | null> {
  const localExisting = getLocalProfile() || {
    full_name: "",
    mobile: "",
  };

  const merged: SupabaseProfile = {
    ...localExisting,
    ...profileInput,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            ...merged,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (!error && data) {
        saveLocalProfile(data as SupabaseProfile);
        return data as SupabaseProfile;
      }
    }
  } catch (err) {
    console.warn("[Supabase Profile] Remote profile save fallback:", err);
  }

  saveLocalProfile(merged);
  return merged;
}
