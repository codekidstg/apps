// Types générés manuellement — à remplacer par `supabase gen types` une fois le schéma déployé

export type Role = "admin" | "manager" | "teacher" | "student" | "parent";
export type Level = "explorer" | "builder" | "architect";
export type SubscriptionStatus = "active" | "inactive" | "trial" | "cancelled";
export type SubscriptionPeriod = "monthly" | "annual";
export type ContentStatus = "draft" | "validated" | "published" | "locked";
export type BlockType = "text" | "video" | "quiz" | "code_challenge" | "game";
export type GameType = "maze" | "fill_blank" | "sort" | "memory";

// ── Block content shapes ──────────────────────────────────────────────────────

export type TextBlockContent = { markdown: string };
export type VideoBlockContent = { url: string; title?: string; transcript?: string };
export type QuizQuestion = {
  id: string;
  question: string;
  type: "mcq" | "truefalse" | "text";
  options?: string[];
  correct: string | number;
  explanation?: string;
};
export type QuizBlockContent = { questions: QuizQuestion[] };
export type CodeChallengeBlockContent = {
  language: "python" | "javascript";
  starter_code: string;
  tests: { input: string; expected: string }[];
  hints?: string[];
};
export type GameBlockContent = {
  game_type: GameType;
  params: Record<string, unknown>;
};
export type BlockContent =
  | TextBlockContent
  | VideoBlockContent
  | QuizBlockContent
  | CodeChallengeBlockContent
  | GameBlockContent;

// ── Database ──────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          display_name: string;
          avatar_url: string | null;
          school_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      schools: {
        Row: { id: string; name: string; city: string | null; country: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["schools"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>;
      };
      students: {
        Row: {
          id: string; profile_id: string; level: Level;
          points: number; badges: string[]; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "created_at" | "points" | "badges"> & { points?: number; badges?: string[] };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      classes: {
        Row: { id: string; name: string; teacher_id: string; level: Level; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["classes"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };
      class_enrollments: {
        Row: { id: string; class_id: string; student_id: string; enrolled_at: string };
        Insert: Omit<Database["public"]["Tables"]["class_enrollments"]["Row"], "id" | "enrolled_at">;
        Update: never;
      };
      parent_student_links: {
        Row: { id: string; parent_id: string; student_id: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["parent_student_links"]["Row"], "id" | "created_at">;
        Update: never;
      };
      subscriptions: {
        Row: {
          id: string; parent_id: string; student_id: string; level: Level;
          period: SubscriptionPeriod; status: SubscriptionStatus;
          starts_at: string; ends_at: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      themes: {
        Row: {
          id: string; title: string; slug: string | null; description: string | null;
          level: Level; status: ContentStatus; version: number;
          parent_version_id: string | null; created_by: string | null;
          cover_image_url: string | null; estimated_hours: number | null;
          published_at: string | null; locked_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["themes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["themes"]["Insert"]>;
      };
      chapters: {
        Row: {
          id: string; theme_id: string; title: string; description: string | null;
          order_index: number; estimated_minutes: number | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chapters"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
      };
      lessons: {
        Row: {
          id: string; chapter_id: string; theme_id: string; title: string;
          objectives: string[] | null; xp_reward: number; order_index: number;
          estimated_minutes: number | null; created_at: string;
          status: "draft" | "validated" | "published" | "archived";
        };
        Insert: Omit<Database["public"]["Tables"]["lessons"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
      };
      lesson_blocks: {
        Row: {
          id: string; lesson_id: string; theme_id: string;
          order_index: number; type: BlockType; content: BlockContent;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lesson_blocks"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["lesson_blocks"]["Insert"]>;
      };
      theme_assignments: {
        Row: {
          id: string; theme_id: string; class_id: string; teacher_id: string;
          scheduled_at: string | null; created_by: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["theme_assignments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["theme_assignments"]["Insert"]>;
      };
      theme_validations: {
        Row: {
          id: string; theme_id: string; from_status: ContentStatus | null;
          to_status: ContentStatus; changed_by: string | null;
          comment: string | null; changed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["theme_validations"]["Row"], "id" | "changed_at">;
        Update: never;
      };
      grades: {
        Row: {
          id: string; teacher_id: string; student_id: string; theme_id: string;
          score: number | null; comment: string | null; graded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["grades"]["Row"], "id" | "graded_at">;
        Update: Partial<Database["public"]["Tables"]["grades"]["Insert"]>;
      };
      access_logs: {
        Row: {
          id: string; user_id: string; lesson_id: string; theme_id: string;
          ip: string | null; user_agent: string | null;
          suspicious: boolean; accessed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["access_logs"]["Row"], "id" | "accessed_at">;
        Update: never;
      };
    };
    Functions: {
      log_lesson_access: {
        Args: { p_user_id: string; p_lesson_id: string; p_theme_id: string; p_ip?: string | null; p_ua?: string | null };
        Returns: void;
      };
    };
  };
}
