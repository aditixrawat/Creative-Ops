"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { IterationRow } from "@/lib/supabase/types";

export const iterationKeys = {
  all:        ()             => ["iterations"]                    as const,
  byCampaign: (id: string)   => ["iterations", "campaign", id]    as const,
  detail:     (id: string)   => ["iterations", "detail",   id]    as const,
};

export function useIterations(campaignId?: string) {
  return useQuery({
    queryKey: campaignId ? iterationKeys.byCampaign(campaignId) : iterationKeys.all(),
    queryFn: async () => {
      let q = getSupabaseBrowser()
        .from("iterations").select("*, campaigns(name), prompts(title)")
        .order("created_at", { ascending: false });
      if (campaignId) q = q.eq("campaign_id", campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as (IterationRow & { campaigns?: { name: string }; prompts?: { title: string } })[];
    },
    staleTime: 20_000,
  });
}

export function useIteration(id: string) {
  return useQuery({
    queryKey: iterationKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser()
        .from("iterations").select("*, campaigns(name), prompts(title)").eq("id", id).single();
      if (error) throw error;
      return data as IterationRow & { campaigns?: { name: string }; prompts?: { title: string } };
    },
    enabled: !!id,
  });
}

export function useUpdateIterationFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, feedback, score }: { id: string; feedback: unknown; score?: number }) => {
      const { data, error } = await getSupabaseBrowser()
        .from("iterations").update({ feedback, ...(score != null && { score }) }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: iterationKeys.all() });
      qc.setQueryData(iterationKeys.detail(d.id), d);
    },
  });
}
