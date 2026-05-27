"use client";

import {
  useQuery, useMutation, useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { CampaignRow, CampaignStatus } from "@/lib/supabase/types";

export const campaignKeys = {
  all:    ()               => ["campaigns"]                as const,
  list:   (f: CampFilter) => ["campaigns", "list", f]     as const,
  detail: (id: string)    => ["campaigns", "detail", id]  as const,
};

export interface CampFilter {
  status?:   CampaignStatus;
  owner_id?: string;
  tag?:      string;
  search?:   string;
  limit?:    number;
}

// ── Fetchers ─────────────────────────────────────────────────────
async function fetchCampaigns(f: CampFilter): Promise<CampaignRow[]> {
  const sb = getSupabaseBrowser();
  let q = sb.from("campaigns").select("*").order("created_at", { ascending: false });
  if (f.status)   q = q.eq("status",   f.status);
  if (f.owner_id) q = q.eq("owner_id", f.owner_id);
  if (f.search)   q = q.ilike("name",  `%${f.search}%`);
  if (f.tag)      q = q.contains("tags", [f.tag]);
  q = q.limit(f.limit ?? 50);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

async function fetchCampaignById(id: string): Promise<CampaignRow> {
  const { data, error } = await getSupabaseBrowser()
    .from("campaigns").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// ── Types ─────────────────────────────────────────────────────────
type CreatePayload = Omit<CampaignRow, "id" | "created_at" | "updated_at">;
type UpdatePayload = { id: string } & Partial<CreatePayload>;

// ── Hooks ─────────────────────────────────────────────────────────
export function useCampaigns(
  filters: CampFilter = {},
  options?: Omit<UseQueryOptions<CampaignRow[]>, "queryKey" | "queryFn">
) {
  return useQuery({ queryKey: campaignKeys.list(filters), queryFn: () => fetchCampaigns(filters), staleTime: 30_000, ...options });
}

export function useCampaign(id: string) {
  return useQuery({ queryKey: campaignKeys.detail(id), queryFn: () => fetchCampaignById(id), staleTime: 60_000, enabled: !!id });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const { data, error } = await getSupabaseBrowser().from("campaigns").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all() }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdatePayload) => {
      const { data, error } = await getSupabaseBrowser().from("campaigns").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: campaignKeys.all() });
      qc.setQueryData(campaignKeys.detail(data.id), data);
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseBrowser().from("campaigns").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all() }),
  });
}

/** Convenience: update just the status field */
export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
      const { data, error } = await getSupabaseBrowser()
        .from("campaigns").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: campaignKeys.all() });
      qc.setQueryData(campaignKeys.detail(data.id), data);
    },
  });
}
