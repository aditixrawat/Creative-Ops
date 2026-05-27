"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { AIToolRow } from "@/lib/supabase/types";

export const aiToolKeys = {
  all:    ()            => ["ai-tools"]               as const,
  list:   (f: ToolFilt) => ["ai-tools", "list", f]    as const,
  detail: (id: string)  => ["ai-tools", "detail", id] as const,
};

export interface ToolFilt {
  category?: string; search?: string; api_available?: boolean;
  pricing_model?: string; limit?: number;
}

export function useAITools(f: ToolFilt = {}) {
  return useQuery({
    queryKey: aiToolKeys.list(f),
    queryFn: async () => {
      let q = getSupabaseBrowser().from("ai_tools").select("*").order("rating", { ascending: false, nullsFirst: false });
      if (f.category)      q = q.eq("category",      f.category);
      if (f.pricing_model) q = q.eq("pricing_model",  f.pricing_model);
      if (f.api_available != null) q = q.eq("api_available", f.api_available);
      if (f.search)        q = q.ilike("name",        `%${f.search}%`);
      q = q.limit(f.limit ?? 100);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AIToolRow[];
    },
    staleTime: 60_000,
  });
}

export function useAITool(id: string) {
  return useQuery({
    queryKey: aiToolKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser().from("ai_tools").select("*").eq("id", id).single();
      if (error) throw error;
      return data as AIToolRow;
    },
    enabled: !!id,
  });
}

export function useUpsertAITool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<AIToolRow, "id" | "created_at"> & { id?: string }) => {
      const { data, error } = await getSupabaseBrowser().from("ai_tools").upsert(payload as AIToolRow).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: aiToolKeys.all() }),
  });
}
