"use client";

import {
  useQuery, useMutation, useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { PromptRow } from "@/lib/supabase/types";

export const promptKeys = {
  all:      ()                      => ["prompts"]                  as const,
  list:     (f: PromptFilter)       => ["prompts", "list", f]       as const,
  detail:   (id: string)            => ["prompts", "detail", id]    as const,
  versions: (pid: string)           => ["prompts", "versions", pid] as const,
};

export interface PromptFilter {
  category?:     string;
  tag?:          string;
  search?:       string;
  is_public?:    boolean;
  model_target?: string;
  author_id?:    string;
  limit?:        number;
}

// ── Fetchers ─────────────────────────────────────────────────────
async function fetchPrompts(f: PromptFilter): Promise<PromptRow[]> {
  const sb = getSupabaseBrowser();
  let q = sb.from("prompts").select("*").order("created_at", { ascending: false });
  if (f.category)     q = q.eq("category",     f.category);
  if (f.is_public != null) q = q.eq("is_public", f.is_public);
  if (f.model_target) q = q.eq("model_target", f.model_target);
  if (f.author_id)    q = q.eq("author_id",    f.author_id);
  if (f.search)       q = q.ilike("title",     `%${f.search}%`);
  if (f.tag)          q = q.contains("tags",   [f.tag]);
  q = q.limit(f.limit ?? 50);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

async function fetchPromptById(id: string): Promise<PromptRow> {
  const { data, error } = await getSupabaseBrowser()
    .from("prompts").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// ── Types ─────────────────────────────────────────────────────────
type CreatePayload = Omit<PromptRow, "id" | "created_at" | "updated_at">;
type UpdatePayload = { id: string } & Partial<CreatePayload>;

// ── Hooks ─────────────────────────────────────────────────────────
export function usePrompts(
  filters: PromptFilter = {},
  options?: Omit<UseQueryOptions<PromptRow[]>, "queryKey" | "queryFn">
) {
  return useQuery({ queryKey: promptKeys.list(filters), queryFn: () => fetchPrompts(filters), staleTime: 30_000, ...options });
}

export function usePrompt(id: string) {
  return useQuery({ queryKey: promptKeys.detail(id), queryFn: () => fetchPromptById(id), staleTime: 60_000, enabled: !!id });
}

export function usePromptVersions(parentId: string) {
  return useQuery({
    queryKey: promptKeys.versions(parentId),
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser()
        .from("prompts").select("*")
        .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
        .order("version", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!parentId,
  });
}

export function useCreatePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const { data, error } = await getSupabaseBrowser().from("prompts").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: promptKeys.all() }),
  });
}

export function useUpdatePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdatePayload) => {
      const { data, error } = await getSupabaseBrowser().from("prompts").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: promptKeys.all() });
      qc.setQueryData(promptKeys.detail(data.id), data);
    },
  });
}

export function useDeletePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseBrowser().from("prompts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: promptKeys.all() }),
  });
}

export function useClonePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (src: PromptRow) => {
      const clone: CreatePayload = {
        title: `${src.title} (copy)`, body: src.body, category: src.category,
        tags: src.tags, version: src.version + 1, parent_id: src.parent_id ?? src.id,
        author_id: src.author_id, is_public: false, model_target: src.model_target,
      };
      const { data, error } = await getSupabaseBrowser().from("prompts").insert(clone).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: promptKeys.all() }),
  });
}
