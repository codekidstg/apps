import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import CertificatePDF from "@/lib/certificates/CertificatePDF";
import React, { type JSXElementConstructor, type ReactElement } from "react";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  const { certId } = await params;
  const preview = req.nextUrl.searchParams.get("preview") === "1";
  const supabase   = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const admin = createAdminClient();

  // Récupérer le certificat (RLS appliquée via supabase client)
  const { data: cert } = await (supabase.from("certificates") as any)
    .select("*")
    .eq("id", certId)
    .eq("revoked", false)
    .single();

  if (!cert) return NextResponse.json({ error: "Certificat introuvable" }, { status: 404 });

  // Autoriser le prof/admin à prévisualiser avant validation
  const role = user.app_metadata?.role;
  const isStaff = ["admin", "teacher", "manager"].includes(role);
  if (!cert.validated_at && !isStaff) {
    return NextResponse.json({ error: "Certificat non encore validé" }, { status: 403 });
  }

  // Données élève
  const { data: student } = await (admin.from("students") as any)
    .select("xp, profiles!profile_id(display_name)")
    .eq("id", cert.student_id)
    .single();

  // Prof validateur
  const { data: prof } = cert.validated_by
    ? await admin.from("profiles").select("display_name").eq("id", cert.validated_by).single()
    : { data: null };

  // Thème ou niveau
  let themeName: string | undefined;
  let levelName: string | undefined;
  let modules: string[] = [];
  let nLessons = 0;

  let competencies: string[] = [];

  if (cert.cert_type === "theme" && cert.theme_id) {
    const { data: theme } = await admin.from("themes").select("title, competencies").eq("id", cert.theme_id).single<{ title: string; competencies: string[] }>();
    themeName = theme?.title;
    competencies = theme?.competencies ?? [];

    const { data: lessons } = await admin
      .from("lessons")
      .select("id, chapters!inner(theme_id)")
      .eq("chapters.theme_id", cert.theme_id as any);
    nLessons = lessons?.length ?? 0;
  }

  if (cert.cert_type === "level") {
    const { LEVELS } = await import("@/lib/gamification/levels");
    const lvl = LEVELS.find((l) => l.num === cert.level_num);
    levelName = lvl?.name ?? `Niveau ${cert.level_num}`;

    // Lister les thèmes complétés
    const { data: progThemes } = await (admin.from("lesson_progress") as any)
      .select("lessons!inner(chapters!inner(themes(title)))")
      .eq("student_id", cert.student_id)
      .eq("status", "completed");
    const themeSet = new Set<string>();
    for (const p of progThemes ?? []) {
      const t = (p as any).lessons?.chapters?.themes?.title;
      if (t) themeSet.add(t);
    }
    modules   = [...themeSet];
    nLessons  = progThemes?.length ?? 0;
  }

  const element = React.createElement(CertificatePDF, {
      type:          cert.cert_type,
      studentName:   (student as any)?.profiles?.display_name ?? "Élève",
      themeName,
      levelName,
      levelNum:      cert.level_num ?? undefined,
      modules,
      competencies,
      score:         cert.score ?? 0,
      totalXp:       cert.total_xp ?? (student as any)?.xp ?? 0,
      nLessons,
      profName:      (prof as any)?.display_name ?? "Prof CodeKids",
      issuedAt:      new Date(cert.issued_at).toLocaleDateString("fr-FR"),
      certId:        cert.id,
      verifyHash:    cert.verify_hash ?? "",
  }) as unknown as ReactElement<DocumentProps, JSXElementConstructor<DocumentProps>>;

  const pdfBuffer = await renderToBuffer(element);

  const studentDisplayName = (student as any)?.profiles?.display_name ?? "Eleve";
  const subjectLabel = cert.cert_type === "theme"
    ? (themeName ?? "theme")
    : (levelName ?? `Niveau-${cert.level_num ?? ""}`);
  // Normalise : accents retirés, espaces → _, caractères spéciaux supprimés
  const slug = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "")
     .replace(/[^a-zA-Z0-9]+/g, "_")
     .replace(/^_|_$/g, "");
  const filename = `${slug(studentDisplayName)}_${slug(subjectLabel)}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
    },
  });
}
