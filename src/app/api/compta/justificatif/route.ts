import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React, { type ReactElement, type JSXElementConstructor } from "react";
import { getJustificatif } from "@/lib/compta/justificatif";
import JustificatifPDF from "@/lib/compta/JustificatifPDF";

/**
 * Justificatif de paiement d'un mentor, en PDF.
 *
 * Réservé à l'admin et au manager : la pièce engage NAVOR GROUP et porte ses
 * identifiants légaux. Le nom du signataire vient de la session, pas d'un
 * paramètre — on ne signe pas au nom de quelqu'un d'autre depuis une URL.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, display_name").eq("id", user.id)
    .single<{ role: string; display_name: string }>();

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return NextResponse.json({ error: "Réservé à l'administration" }, { status: 403 });
  }

  const teacherId = req.nextUrl.searchParams.get("teacher") ?? "";
  const month     = Number(req.nextUrl.searchParams.get("month"));
  const year      = Number(req.nextUrl.searchParams.get("year"));

  if (!teacherId || !month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const j = await getJustificatif(teacherId, month, year);
  if (!j) return NextResponse.json({ error: "Aucune séance pour ce mentor sur cette période" }, { status: 404 });
  if (j.lignes.length === 0) {
    return NextResponse.json({ error: "Aucune séance validée : rien à justifier." }, { status: 400 });
  }

  const doc = React.createElement(JustificatifPDF, {
    j, emisPar: profile.display_name ?? "La direction",
  }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>;

  const pdf = await renderToBuffer(doc);

  return new NextResponse(pdf as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${j.reference}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
