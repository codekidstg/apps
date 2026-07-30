// Rendu HTML fidèle au certificat PDF — utilisé dans la modal de prévisualisation

export type CertPreviewData = {
  type: "theme" | "level";
  studentName: string;
  themeName?: string;
  levelName?: string;
  levelNum?: number;
  modules?: string[];
  competencies?: string[];
  score: number;
  totalXp: number;
  nLessons?: number;
  profName: string;
  issuedAt: string; // format "30 juillet 2026"
  certId: string;
  verifyHash: string;
};

const LEVEL_COLORS: Record<string, string> = {
  "1": "#10B981",
  "2": "#7C3AED",
  "3": "#F47B20",
};

function formatCertNumber(certId: string, issuedAt: string, themeName?: string): string {
  const year = issuedAt.split(" ").pop() ?? new Date().getFullYear().toString();
  const slug = themeName
    ? themeName.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5)
    : null;
  const hash = certId.slice(0, 8).toUpperCase();
  return slug ? `CK-${year}-${slug}-${hash}` : `CK-${year}-${hash}`;
}

export default function CertHtmlPreview(p: CertPreviewData) {
  const isLevel    = p.type === "level";
  const docType    = isLevel ? "DIPLÔME DE FIN DE PARCOURS" : "CERTIFICAT DE COMPLÉTION";
  const subject    = isLevel ? `${p.levelName ?? "Niveau"} — Niveau ${p.levelNum ?? ""}` : (p.themeName ?? "");
  const lvlColor   = LEVEL_COLORS[String(p.levelNum ?? "1")] ?? "#10B981";
  const certNum    = formatCertNumber(p.certId, p.issuedAt, p.themeName ?? p.levelName);
  const allComps   = p.competencies ?? [];
  const shownComps = allComps.slice(0, 5);
  const hasMore    = allComps.length > 5;
  const showXp     = (p.totalXp ?? 0) > 0;

  const phraseSubject = isLevel ? (p.levelName ?? `Niveau ${p.levelNum}`) : (p.themeName ?? "ce module");
  const certPhrase = isLevel
    ? `Certifie que ${p.studentName} a complété avec succès le parcours ${phraseSubject}, démontrant une maîtrise des compétences numériques fondamentales.`
    : `Certifie que ${p.studentName} a acquis avec succès toutes les compétences du module « ${phraseSubject} », validées à l'issue d'un parcours pédagogique supervisé par un mentor certifié codeKids.`;

  return (
    <div style={{ background: "#0e1520", width: "100%", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", boxSizing: "border-box" }}>
      <div style={{ background: "#1e2a45", borderRadius: 6, padding: "24px 32px", width: "100%", maxWidth: 620, fontFamily: "Georgia, serif" }}>

        {/* Ornement haut */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1.5, background: "#c9980a" }} />
          <span style={{ color: "#d4a017", fontSize: 14, margin: "0 8px" }}>★</span>
          <div style={{ flex: 1, height: 1.5, background: "#c9980a" }} />
        </div>

        {/* Badge type */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ display: "inline-block", border: "1px solid #2a3a5a", borderRadius: 20, padding: "3px 14px", color: "#8aaed4", fontSize: 9, letterSpacing: 2, fontFamily: "Arial, sans-serif" }}>
            {docType}
          </span>
        </div>

        {/* Logo codeKids officiel */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img src="/logo-white.png" alt="codeKids" style={{ height: 38, objectFit: "contain" }} />
        </div>

        {/* Phrase de certification */}
        <p style={{ color: "#6a8aaa", fontSize: 10, textAlign: "center", fontStyle: "italic", lineHeight: 1.6, margin: "0 0 10px", padding: "0 12px", fontFamily: "Arial, sans-serif" }}>
          {certPhrase}
        </p>

        {/* Séparateur */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,152,10,0.5)" }} />
          <span style={{ color: "#d4a017", margin: "0 8px", fontSize: 8 }}>◆</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,152,10,0.5)" }} />
        </div>

        {/* Décerné à */}
        <p style={{ color: "#6a8aaa", fontSize: 9, textAlign: "center", fontStyle: "italic", margin: "0 0 4px", fontFamily: "Arial, sans-serif" }}>
          décerné à
        </p>

        {/* Nom complet */}
        <h1 style={{ color: "#ffffff", fontSize: 32, textAlign: "center", margin: "0 0 10px", fontWeight: "bold" }}>
          {p.studentName}
        </h1>

        {/* Badge thème/niveau */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ display: "inline-block", background: lvlColor, borderRadius: 20, padding: "4px 16px", color: "#ffffff", fontSize: 11, fontWeight: "bold", letterSpacing: 1, fontFamily: "Arial, sans-serif" }}>
            {subject}
          </span>
        </div>

        {/* Compétences */}
        {shownComps.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: "#d4a017", fontSize: 8, letterSpacing: 2, textAlign: "center", margin: "0 0 6px", fontFamily: "Arial, sans-serif" }}>
              COMPÉTENCES ACQUISES
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
              {shownComps.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid rgba(212,160,23,0.25)", borderRadius: 3, padding: "2px 8px", color: "#8aaed4", fontSize: 9, fontFamily: "Arial, sans-serif" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                  {c}
                </span>
              ))}
            </div>
            {hasMore && <p style={{ color: "#d4a017", fontSize: 9, textAlign: "center", fontStyle: "italic", margin: "4px 0 0", fontFamily: "Arial, sans-serif" }}>et bien plus…</p>}
          </div>
        )}

        {/* Score */}
        <p style={{ color: "#4a6a8a", fontSize: 9, textAlign: "center", fontStyle: "italic", margin: "0 0 10px", fontFamily: "Arial, sans-serif" }}>
          Score {p.score}/100
          {showXp && ` · ${p.totalXp} XP`}
          {p.nLessons ? ` · ${p.nLessons} leçon${p.nLessons > 1 ? "s" : ""}` : ""}
          {" · "}{p.issuedAt}
        </p>

        {/* Séparateur bas */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14, opacity: 0.4 }}>
          <div style={{ flex: 1, height: 1, background: "#2a3a5a" }} />
          <div style={{ flex: 1, height: 1, background: "#2a3a5a" }} />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          {/* Sceau étoile gold */}
          <div style={{ textAlign: "center", width: 56 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1px dashed #d4a017", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e2a45", border: "1.5px solid #c9980a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#d4a017" }}>★</div>
            </div>
            <p style={{ color: "#4a6a8a", fontSize: 7, letterSpacing: 0.5, margin: "2px 0 0", fontFamily: "Arial, sans-serif" }}>CERTIFIÉ</p>
          </div>

          {/* Signature mentor */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#d4a017", fontStyle: "italic", fontSize: 11, margin: "0 0 4px" }}>{p.profName}</p>
            <div style={{ width: 90, height: 1, background: "#d4a017", margin: "0 auto 4px" }} />
            <p style={{ color: "#6a8aaa", fontSize: 7, margin: 0, fontFamily: "Arial, sans-serif" }}>Mentor</p>
          </div>

          {/* Signature direction */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#d4a017", fontStyle: "italic", fontSize: 11, margin: "0 0 4px" }}>Direction Pédagogique</p>
            <div style={{ width: 90, height: 1, background: "#d4a017", margin: "0 auto 4px" }} />
            <p style={{ color: "#6a8aaa", fontSize: 7, margin: 0, fontFamily: "Arial, sans-serif" }}>Directeur pédagogique</p>
          </div>

          {/* Méta */}
          <div style={{ textAlign: "right", width: 84 }}>
            <p style={{ color: "#4a6a8a", fontSize: 7, margin: "0 0 1px", fontFamily: "Arial, sans-serif" }}>Lomé, Togo · {p.issuedAt}</p>
            <p style={{ color: "#4a6a8a", fontSize: 7, margin: "0 0 1px", fontFamily: "Arial, sans-serif" }}>codekids.tg/verif</p>
            <p style={{ color: "#4a6a8a", fontSize: 7, margin: 0, fontFamily: "Arial, sans-serif" }}>Hash : {p.verifyHash.slice(0, 12)}…</p>
          </div>
        </div>

        {/* Numéro certificat */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ display: "inline-block", border: "1px solid #2a3a5a", borderRadius: 3, padding: "4px 12px" }}>
            <p style={{ color: "#4a6a8a", fontSize: 7, letterSpacing: 1.5, margin: "0 0 2px", fontFamily: "Arial, sans-serif" }}>N° D'IDENTIFICATION</p>
            <p style={{ color: "#8aaed4", fontSize: 9, fontWeight: "bold", letterSpacing: 1, margin: 0, fontFamily: "Arial, sans-serif" }}>{certNum}</p>
          </div>
        </div>

        {/* Ornement bas */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, height: 1.5, background: "#c9980a" }} />
          <span style={{ color: "#d4a017", fontSize: 14, margin: "0 8px" }}>★</span>
          <div style={{ flex: 1, height: 1.5, background: "#c9980a" }} />
        </div>

      </div>
    </div>
  );
}
