"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { SwipeItemRow } from "@/lib/supabase/types";

export const swipeKeys = {
  all:        ()              => ["swipe"]                     as const,
  list:       (f: SwipeFilt) => ["swipe", "list", f]          as const,
  collections:()              => ["swipe", "collections"]      as const,
};

export interface SwipeFilt { tag?: string; collection_id?: string; search?: string; limit?: number; }

export function useSwipeItems(f: SwipeFilt = {}) {
  return useQuery({
    queryKey: swipeKeys.list(f),
    queryFn: async () => {
      let q = getSupabaseBrowser().from("swipe_items").select("*").order("created_at", { ascending: false });
      if (f.collection_id) q = q.eq("collection_id", f.collection_id);
      if (f.tag)           q = q.contains("tags", [f.tag]);
      if (f.search)        q = q.ilike("title", `%${f.search}%`);
      q = q.limit(f.limit ?? 80);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SwipeItemRow[];
    },
    staleTime: 30_000,
  });
}

export function useSwipeCollections() {
  return useQuery({
    queryKey: swipeKeys.collections(),
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser()
        .from("swipe_collections").select("id, name, is_shared").order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useSaveSwipeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<SwipeItemRow, "id" | "created_at">) => {
      const { data, error } = await getSupabaseBrowser().from("swipe_items").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: swipeKeys.all() }),
  });
}

export function useDeleteSwipeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseBrowser().from("swipe_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: swipeKeys.all() }),
  });
}
