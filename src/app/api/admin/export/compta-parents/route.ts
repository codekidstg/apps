import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComptaParentsData } from "@/lib/compta/actions";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const STATUS_LABEL: Record<string, string> = { pending: "En attente", paid: "Payé", unpaid: "Impayé" };

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sp    = req.nextUrl.searchParams;
  const now   = new Date();
  const month = parseInt(sp.get("month") ?? "") || now.getMonth() + 1;
  const year  = parseInt(sp.get("year")  ?? "") || now.getFullYear();

  const data = await getComptaParentsData(month, year);

  const rows = ["Parent;Élève;Date;Séance;Durée (min);Statut;Montant (FCFA);Commentaire"];
  for (const { parent, children, grandDue } of data) {
    for (const child of children) {
      for (const line of child.lines) {
        const at = new Date(line.at);
        rows.push([
          parent.display_name,
          child.studentName,
          at.toLocaleDateString("fr-FR"),
          `"${line.title}"`,
          line.duration_min,
          STATUS_LABEL[line.status] ?? line.status,
          line.amount,
          `"${line.payment?.comment ?? ""}"`,
        ].join(";"));
      }
    }
    rows.push([`Total ${parent.display_name}`,"","","","","",grandDue,""].join(";"));
    rows.push("");
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compta-parents-${MONTHS[month-1]}-${year}.csv"`,
    },
  });
}
