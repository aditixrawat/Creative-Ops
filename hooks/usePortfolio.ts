"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { PortfolioItemRow } from "@/lib/supabase/types";

export const portfolioKeys = {
  all:  ()                 => ["portfolio"]               as const,
  list: (search?: string)  => ["portfolio", "list", { search }] as const,
};

export function usePortfolioItems(search?: string) {
  return useQuery({
    queryKey: portfolioKeys.list(search),
    queryFn: async () => {
      let q = getSupabaseBrowser().from("portfolio_items").select("*").order("created_at", { ascending: false });
      if (search) {
        q = q.ilike("title", `%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PortfolioItemRow[];
    },
    staleTime: 30_000,
  });
}

export function useSavePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<PortfolioItemRow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await getSupabaseBrowser()
        .from("portfolio_items")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.all() }),
  });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseBrowser()
        .from("portfolio_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.all() }),
  });
}
