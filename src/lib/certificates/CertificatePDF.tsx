// react-pdf — rendu serveur uniquement
import { Document, Page, View, Text, StyleSheet, Svg, Circle, Path, Polygon, Rect, Image } from "@react-pdf/renderer";
import path from "path";

const LOGO_PATH = path.join(process.cwd(), "public", "logo-white.png");

const GOLD   = "#d4a017";
const GOLD2  = "#c9980a";
const GOLD_D = "rgba(212,160,23,0.25)";
const NAVY   = "#0e1520";
const NAVY2  = "#1e2a45";
const BLUE   = "#8aaed4";
const BLUE_D = "#6a8aaa";
const BLUE_2 = "#4a6a8a";
const BLUE_3 = "#2a3a5a";
const WHITE  = "#ffffff";
const GREEN  = "#10B981";

const LEVEL_COLORS: Record<string, string> = {
  "1": "#10B981",
  "2": "#7C3AED",
  "3": "#F47B20",
};

const s = StyleSheet.create({
  page: { backgroundColor: NAVY, flexDirection: "column", alignItems: "center", justifyContent: "center" },
  card: {
    width: 560, backgroundColor: NAVY2,
    borderRadius: 4,
    paddingHorizontal: 36, paddingVertical: 24,
  },
  // Ornements haut/bas
  ornRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ornLine: { flex: 1, height: 1.5, backgroundColor: GOLD2 },
  // Badge type
  badgeRow: { alignItems: "center", marginBottom: 8 },
  badge: { borderWidth: 1, borderColor: BLUE_3, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 3 },
  badgeTxt: { fontFamily: "Helvetica", fontSize: 7.5, color: BLUE, letterSpacing: 2 },
  // Logo
  logoRow: { alignItems: "center", marginBottom: 6 },
  logoImg: { width: 110, height: 38, objectFit: "contain" },
  // Phrase de certification
  certPhrase: {
    fontFamily: "Helvetica-Oblique", fontSize: 8.5, color: BLUE_D,
    textAlign: "center", marginBottom: 8, lineHeight: 1.5,
    paddingHorizontal: 12,
  },
  certPhraseHighlight: { fontFamily: "Helvetica-Bold", color: WHITE },
  // Séparateur milieu
  sepRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sepLine: { flex: 1, height: 1, backgroundColor: GOLD2 },
  // "décerné à"
  decrLabel: { fontFamily: "Helvetica-Oblique", fontSize: 8, color: BLUE_D, textAlign: "center", marginBottom: 4 },
  // Nom
  name: { fontFamily: "Times-Bold", fontSize: 28, color: WHITE, textAlign: "center", marginBottom: 8 },
  // Badge niveau
  levelRow: { alignItems: "center", marginBottom: 8 },
  levelBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  levelTxt: { fontFamily: "Helvetica-Bold", fontSize: 10, color: WHITE, letterSpacing: 1 },
  // Compétences
  compsSection: { marginBottom: 8 },
  compsLabel: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: GOLD, letterSpacing: 2, textAlign: "center", marginBottom: 5 },
  compsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 3 },
  compChip: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderColor: GOLD_D, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  compDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: GREEN },
  compTxt: { fontFamily: "Helvetica", fontSize: 6.5, color: BLUE },
  compMore: { fontFamily: "Helvetica-Oblique", fontSize: 6.5, color: GOLD, textAlign: "center", marginTop: 3 },
  // Modules (pour les diplômes de niveau)
  modsLabel: { fontFamily: "Helvetica", fontSize: 7, color: BLUE_D, letterSpacing: 1.5, textAlign: "center", marginBottom: 5 },
  modsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 3, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: GOLD_D, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 },
  chipTxt: { fontFamily: "Helvetica", fontSize: 7, color: GOLD },
  // Score
  scoreTxt: { fontFamily: "Helvetica-Oblique", fontSize: 7.5, color: BLUE_2, textAlign: "center", marginBottom: 10 },
  // Footer
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sealArea: { alignItems: "center", width: 52 },
  sealLabel: { fontFamily: "Helvetica", fontSize: 5.5, color: BLUE_2, letterSpacing: 0.5, marginTop: 2 },
  sigBlock: { alignItems: "center", flex: 1 },
  sigName: { fontFamily: "Times-Italic", fontSize: 10, color: GOLD, marginBottom: 3 },
  sigLine: { width: 90, height: 1, backgroundColor: GOLD, marginBottom: 3 },
  sigRole: { fontFamily: "Helvetica", fontSize: 6, color: BLUE_D, textTransform: "uppercase" as const },
  // Numéro de certificat — bloc centré
  certIdRow: { alignItems: "center", marginTop: 10, marginBottom: 0 },
  certIdBox: { borderWidth: 1, borderColor: BLUE_3, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 3 },
  certIdLabel: { fontFamily: "Helvetica", fontSize: 5.5, color: BLUE_2, letterSpacing: 1.5, textAlign: "center", marginBottom: 1 },
  certIdTxt: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: BLUE, textAlign: "center", letterSpacing: 1 },
  // Méta droite
  metaBlock: { alignItems: "flex-end", width: 80 },
  metaTxt: { fontFamily: "Helvetica", fontSize: 6, color: BLUE_2, marginBottom: 1 },
});

export type CertProps = {
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
  issuedAt: string;
  certId: string;
  verifyHash: string;
};

function StarIcon({ size = 14, color = GOLD }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="12,2 14.5,9 22,9 16,14 18.5,21 12,17 5.5,21 8,14 2,9 9.5,9" fill={color} />
    </Svg>
  );
}

function DiamondIcon({ size = 7 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8">
      <Rect x="1" y="1" width="6" height="6" transform="rotate(45 4 4)" fill={GOLD} />
    </Svg>
  );
}

function LogoSeal() {
  return (
    <View style={s.sealArea}>
      <Image src={LOGO_PATH} style={{ width: 44, height: 44, objectFit: "contain" }} />
      <Text style={s.sealLabel}>CERTIFIÉ</Text>
    </View>
  );
}

function formatCertNumber(certId: string, issuedAt: string, themeName?: string): string {
  const year = issuedAt.split(" ").pop() ?? new Date().getFullYear().toString();
  const slug = themeName
    ? themeName.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5)
    : null;
  const hash = certId.slice(0, 8).toUpperCase();
  return slug ? `CK-${year}-${slug}-${hash}` : `CK-${year}-${hash}`;
}

export default function CertificatePDF(p: CertProps) {
  const isLevel   = p.type === "level";
  const docType   = isLevel ? "DIPLÔME DE FIN DE PARCOURS" : "CERTIFICAT DE COMPLÉTION";
  const subject   = isLevel
    ? `${p.levelName ?? "Niveau"} — Niveau ${p.levelNum ?? ""}`
    : (p.themeName ?? "");
  const modules   = (p.modules ?? []).slice(0, 6);
  const lvlColor  = LEVEL_COLORS[String(p.levelNum ?? "2")] ?? "#7C3AED";
  const ROMAN     = ["I", "II", "III", "IV", "V", "VI"];
  const certNum   = formatCertNumber(p.certId, p.issuedAt, p.themeName ?? p.levelName);
  const showXp    = (p.totalXp ?? 0) > 0;

  // Compétences : max 5, mention "et bien plus" si au-delà
  const allComps  = p.competencies ?? [];
  const shownComps = allComps.slice(0, 5);
  const hasMore   = allComps.length > 5;

  // Phrase de certification
  const phraseSubject = isLevel ? (p.levelName ?? `Niveau ${p.levelNum}`) : (p.themeName ?? "ce module");
  const certPhrase = isLevel
    ? `Certifie que ${p.studentName} a complété avec succès le parcours ${phraseSubject}, démontrant une maîtrise des compétences numériques fondamentales et avancées définies par le référentiel codeKids.`
    : `Certifie que ${p.studentName} a acquis avec succès toutes les compétences du module « ${phraseSubject} », validées à l'issue d'un parcours pédagogique supervisé par un mentor certifié codeKids.`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.card}>

          {/* Ornement haut */}
          <View style={s.ornRow}>
            <View style={s.ornLine} />
            <StarIcon size={14} />
            <View style={s.ornLine} />
          </View>

          {/* Badge type */}
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{docType}</Text>
            </View>
          </View>

          {/* Logo codeKids */}
          <View style={s.logoRow}>
            <Image src={LOGO_PATH} style={s.logoImg} />
          </View>

          {/* Phrase de certification */}
          <Text style={s.certPhrase}>{certPhrase}</Text>

          {/* Séparateur avec diamant */}
          <View style={s.sepRow}>
            <View style={[s.sepLine, { opacity: 0.5 }]} />
            <DiamondIcon />
            <View style={[s.sepLine, { opacity: 0.5 }]} />
          </View>

          {/* Décerné à */}
          <Text style={s.decrLabel}>décerné à</Text>

          {/* Nom */}
          <Text style={s.name}>{p.studentName}</Text>

          {/* Badge niveau/thème */}
          <View style={s.levelRow}>
            <View style={[s.levelBadge, { backgroundColor: lvlColor }]}>
              <Text style={s.levelTxt}>{subject}</Text>
            </View>
          </View>

          {/* Compétences acquises */}
          {shownComps.length > 0 && (
            <View style={s.compsSection}>
              <Text style={s.compsLabel}>COMPÉTENCES ACQUISES</Text>
              <View style={s.compsGrid}>
                {shownComps.map((c, i) => (
                  <View key={i} style={s.compChip}>
                    <View style={s.compDot} />
                    <Text style={s.compTxt}>{c}</Text>
                  </View>
                ))}
              </View>
              {hasMore && <Text style={s.compMore}>et bien plus…</Text>}
            </View>
          )}

          {/* Modules validés (pour diplôme de niveau) */}
          {isLevel && modules.length > 0 && (
            <>
              <Text style={s.modsLabel}>MODULES VALIDÉS</Text>
              <View style={s.modsRow}>
                {modules.map((m, i) => (
                  <View key={i} style={s.chip}>
                    <Text style={s.chipTxt}>{ROMAN[i]} · {m}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Score */}
          <Text style={s.scoreTxt}>
            Score {p.score}/100{showXp ? ` · ${p.totalXp} XP` : ""}{p.nLessons ? ` · ${p.nLessons} leçon${p.nLessons > 1 ? "s" : ""}` : ""} · {p.issuedAt}
          </Text>

          {/* Séparateur bas */}
          <View style={[s.sepRow, { marginBottom: 10, opacity: 0.4 }]}>
            <View style={[s.sepLine, { backgroundColor: BLUE_3 }]} />
            <View style={[s.sepLine, { backgroundColor: BLUE_3 }]} />
          </View>

          {/* Footer */}
          <View style={s.footerRow}>
            <LogoSeal />

            <View style={s.sigBlock}>
              <Text style={s.sigName}>{p.profName}</Text>
              <View style={s.sigLine} />
              <Text style={s.sigRole}>Mentor</Text>
            </View>

            <View style={s.sigBlock}>
              <Text style={s.sigName}>Direction Pédagogique</Text>
              <View style={s.sigLine} />
              <Text style={s.sigRole}>Directeur pédagogique</Text>
            </View>

            <View style={s.metaBlock}>
              <Text style={s.metaTxt}>Lomé, Togo · {p.issuedAt}</Text>
              <Text style={s.metaTxt}>codekids.tg/verif</Text>
              <Text style={s.metaTxt}>Hash : {p.verifyHash.slice(0, 12)}…</Text>
            </View>
          </View>

          {/* Numéro d'identification du certificat */}
          <View style={s.certIdRow}>
            <View style={s.certIdBox}>
              <Text style={s.certIdLabel}>N° D'IDENTIFICATION</Text>
              <Text style={s.certIdTxt}>{certNum}</Text>
            </View>
          </View>

          {/* Ornement bas */}
          <View style={[s.ornRow, { marginTop: 8, marginBottom: 0 }]}>
            <View style={s.ornLine} />
            <StarIcon size={14} />
            <View style={s.ornLine} />
          </View>

        </View>
      </Page>
    </Document>
  );
}
