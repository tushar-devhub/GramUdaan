import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

export function useAuth() {
  return useSupabaseAuth();
}
