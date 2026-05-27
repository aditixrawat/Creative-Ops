export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole     = "strategist" | "ai_intern" | "admin";
export type CampaignStatus = "draft" | "planned" | "live" | "review" | "complete" | "archived";
export type WorkflowType   = "sop" | "template" | "runbook" | "checklist";
export type PricingModel   = "free" | "freemium" | "paid" | "enterprise" | "open_source";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:         string;
          email:      string;
          full_name:  string | null;
          role:       UserRole;
          avatar_url: string | null;
          team_id:    string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      prompts: {
        Row: {
          id:           string;
          title:        string;
          body:         string;
          category:     string | null;
          tags:         Json;           // string[]
          version:      number;
          parent_id:    string | null;
          author_id:    string;
          is_public:    boolean;
          model_target: string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["prompts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["prompts"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      campaigns: {
        Row: {
          id:         string;
          name:       string;
          brief:      Json;             // { objective, audience, tone, kpis, ... }
          status:     CampaignStatus;
          start_date: string | null;
          end_date:   string | null;
          owner_id:   string;
          tags:       Json;             // string[]
          metrics:    Json;             // { ctr, impressions, conversions, ... }
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      iterations: {
        Row: {
          id:            string;
          campaign_id:   string;
          prompt_id:     string | null;
          version_label: string;
          content:       string;
          diff_from_id:  string | null;
          feedback:      Json;          // { comments: [], score: number }
          score:         number | null;
          created_by:    string;
          created_at:    string;
        };
        Insert: Omit<Database["public"]["Tables"]["iterations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["iterations"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      portfolio_items: {
        Row: {
          id:          string;
          slug:        string;
          title:       string;
          summary:     string | null;
          campaign_id: string | null;
          media_urls:  Json;            // string[]
          results:     Json;            // { metric: string; value: string }[]
          is_featured: boolean;
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["portfolio_items"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["portfolio_items"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      swipe_items: {
        Row: {
          id:            string;
          url:           string;
          thumbnail_url: string | null;
          title:         string | null;
          tags:          Json;          // string[]
          collection_id: string | null;
          source:        string | null;
          saved_by:      string;
          created_at:    string;
        };
        Insert: Omit<Database["public"]["Tables"]["swipe_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["swipe_items"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      swipe_collections: {
        Row: {
          id:         string;
          name:       string;
          owner_id:   string;
          is_shared:  boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["swipe_collections"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["swipe_collections"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      ai_tools: {
        Row: {
          id:            string;
          name:          string;
          slug:          string;
          category:      string;
          use_cases:     Json;          // string[]
          pricing_model: PricingModel;
          rating:        number | null;
          api_available: boolean;
          website_url:   string | null;
          last_reviewed: string | null;
          created_at:    string;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_tools"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["ai_tools"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };

      workflows: {
        Row: {
          id:          string;
          title:       string;
          type:        WorkflowType;
          steps:       Json;            // { order: number; title: string; description: string; tool_id?: string }[]
          tools_used:  Json;            // string[] (ai_tools.id)
          author_id:   string;
          version:     number;
          is_template: boolean;
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["workflows"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["workflows"]["Insert"]>;
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[];
      };
    };

    Views:   Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      user_role:       UserRole;
      campaign_status: CampaignStatus;
      workflow_type:   WorkflowType;
      pricing_model:   PricingModel;
    };
  };
}

// ── Convenience row-type aliases ──────────────────────────────────
export type UserRow           = Database["public"]["Tables"]["users"]["Row"];
export type PromptRow         = Database["public"]["Tables"]["prompts"]["Row"];
export type CampaignRow       = Database["public"]["Tables"]["campaigns"]["Row"];
export type IterationRow      = Database["public"]["Tables"]["iterations"]["Row"];
export type PortfolioItemRow  = Database["public"]["Tables"]["portfolio_items"]["Row"];
export type SwipeItemRow      = Database["public"]["Tables"]["swipe_items"]["Row"];
export type AIToolRow         = Database["public"]["Tables"]["ai_tools"]["Row"];
export type WorkflowRow       = Database["public"]["Tables"]["workflows"]["Row"];
