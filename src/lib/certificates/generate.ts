"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export type CertData = {
  type: "theme" | "level";
  studentName: string;
  themeName?: string;
  levelName?: string;
  levelNum?: number;
  modules?: string[];
  score: number;
  totalXp: number;
  nLessons?: number;
  profName: string;
  issuedAt: string;
  certId: string;
  verifyHash: string;
};

export async function issueCertificate(params: {
  studentId: string;
  type: "theme" | "level";
  themeId?: string;
  levelNum?: number;
  score: number;
  totalXp: number;
  validatedBy: string;
}): Promise<{ certId: string; hash: string } | { error: string }> {
  const admin = createAdminClient();
  const hash = crypto
    .createHash("sha256")
    .update(`${params.studentId}-${params.themeId ?? params.levelNum}-${Date.now()}`)
    .digest("hex")
    .slice(0, 12);

  const row: Record<string, unknown> = {
    student_id:   params.studentId,
    cert_type:    params.type,
    score:        params.score,
    total_xp:     params.totalXp,
    validated_by: params.validatedBy,
    validated_at: new Date().toISOString(),
    verify_hash:  hash,
    revoked:      false,
  };
  if (params.themeId)  row.theme_id  = params.themeId;
  if (params.levelNum) row.level_num = params.levelNum;

  const { data, error } = await (admin.from("certificates") as any)
    .insert(row)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { certId: data.id, hash };
}

export async function checkThemeCompletion(studentId: string, themeId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, chapters!inner(theme_id)")
    .eq("chapters.theme_id", themeId as any);

  if (!lessons || lessons.length === 0) return false;

  const ids = lessons.map((l: any) => l.id);
  const { data: prog } = await (admin.from("lesson_progress") as any)
    .select("lesson_id, status")
    .eq("student_id", studentId)
    .in("lesson_id", ids);

  const completed = new Set((prog ?? []).filter((p: any) => p.status === "completed").map((p: any) => p.lesson_id));
  return ids.every((id: string) => completed.has(id));
}
