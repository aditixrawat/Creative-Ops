"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { WorkflowRow } from "@/lib/supabase/types";

export const workflowKeys = {
  all:       ()              => ["workflows"]                  as const,
  list:      (f: WFFilter)   => ["workflows", "list", f]       as const,
  detail:    (id: string)    => ["workflows", "detail", id]    as const,
  templates: ()              => ["workflows", "templates"]     as const,
};

export interface WFFilter { type?: string; is_template?: boolean; search?: string; limit?: number; }

export function useWorkflows(f: WFFilter = {}) {
  return useQuery({
    queryKey: workflowKeys.list(f),
    queryFn: async () => {
      let q = getSupabaseBrowser().from("workflows").select("*").order("created_at", { ascending: false });
      if (f.type)          q = q.eq("type",        f.type);
      if (f.is_template != null) q = q.eq("is_template", f.is_template);
      if (f.search)        q = q.ilike("title",    `%${f.search}%`);
      q = q.limit(f.limit ?? 50);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as WorkflowRow[];
    },
    staleTime: 30_000,
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser().from("workflows").select("*").eq("id", id).single();
      if (error) throw error;
      return data as WorkflowRow;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<WorkflowRow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await getSupabaseBrowser().from("workflows").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.all() }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<WorkflowRow> & { id: string }) => {
      const { data, error } = await getSupabaseBrowser().from("workflows").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: workflowKeys.all() });
      qc.setQueryData(workflowKeys.detail(d.id), d);
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseBrowser().from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.all() }),
  });
}
