import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComptaMentorsData } from "@/lib/compta/actions";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const STATUS_LABEL: Record<string, string> = { pending_report: "En attente rapport", to_pay: "À payer", paid: "Payé" };

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sp    = req.nextUrl.searchParams;
  const now   = new Date();
  const month = parseInt(sp.get("month") ?? "") || now.getMonth() + 1;
  const year  = parseInt(sp.get("year")  ?? "") || now.getFullYear();

  const data = await getComptaMentorsData(month, year);

  const rows = ["Mentor;Date;Séance;Durée (min);Élève;Statut;Montant (FCFA)"];
  for (const { teacher, lines } of data) {
    for (const line of lines) {
      const at = new Date(line.at);
      rows.push([
        teacher.display_name,
        at.toLocaleDateString("fr-FR"),
        `"${line.title}"`,
        line.duration_min,
        line.studentName ?? "Tous",
        STATUS_LABEL[line.status] ?? line.status,
        line.amount,
      ].join(";"));
    }
    rows.push([`Total ${teacher.display_name}`,"","","","","",data.find((d: any) => d.teacher.id === teacher.id)?.totalDue ?? 0].join(";"));
    rows.push("");
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compta-mentors-${MONTHS[month-1]}-${year}.csv"`,
    },
  });
}
