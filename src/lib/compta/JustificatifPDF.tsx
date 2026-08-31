import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import { EMETTEUR, INDIGO, CUIVRE, ENCRE, duMois, type Justificatif } from "./justificatif";

const LOGO = path.join(process.cwd(), "public", "logo-email.png");

const fcfa = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ") + " F CFA";
const jour = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 64, paddingHorizontal: 46, fontSize: 9.5, color: ENCRE, fontFamily: "Helvetica" },

  // En-tête : identité de l'émetteur à gauche, programme à droite.
  enTete:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  marque:   { fontSize: 17, fontFamily: "Helvetica-Bold", color: INDIGO, letterSpacing: 1.2 },
  activite: { fontSize: 6.4, color: CUIVRE, letterSpacing: 0.7, marginTop: 3 },
  logo:     { width: 68 },
  filet:    { height: 2, backgroundColor: INDIGO, marginTop: 10, marginBottom: 22 },

  lieu:     { textAlign: "right", fontSize: 9, color: "#555", marginBottom: 20 },

  titre:    { fontSize: 14, fontFamily: "Helvetica-Bold", color: INDIGO, marginBottom: 3 },
  ref:      { fontSize: 9, color: CUIVRE, fontFamily: "Helvetica-Bold", marginBottom: 18 },

  bloc:     { flexDirection: "row", marginBottom: 18 },
  colonne:  { flex: 1, paddingRight: 14 },
  etiquette:{ fontSize: 6.6, color: "#8A8A8A", letterSpacing: 0.8, marginBottom: 3 },
  valeur:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: INDIGO },
  detail:   { fontSize: 8.6, color: "#555", marginTop: 2 },

  intro:    { fontSize: 9.5, lineHeight: 1.6, marginBottom: 16 },

  sousTitre:{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CUIVRE, marginBottom: 7 },

  th:       { flexDirection: "row", backgroundColor: INDIGO, paddingVertical: 6, paddingHorizontal: 8 },
  thTxt:    { color: "#fff", fontSize: 7.4, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  tr:       { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#E4E4E4" },
  cDate:    { width: "18%" },
  cSeance:  { width: "34%" },
  cEleve:   { width: "24%" },
  cDuree:   { width: "10%", textAlign: "right" },
  cMontant: { width: "14%", textAlign: "right" },

  totalBox: { marginTop: 14, borderTopWidth: 2, borderTopColor: INDIGO, paddingTop: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLbl: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INDIGO },
  totalVal: { fontSize: 15, fontFamily: "Helvetica-Bold", color: INDIGO },
  lettres:  { fontSize: 8.8, fontStyle: "italic", color: "#555", marginTop: 5 },

  note:     { marginTop: 14, padding: 9, backgroundColor: "#FAF6F2", borderLeftWidth: 2, borderLeftColor: CUIVRE, fontSize: 8.4, color: "#5A5A5A", lineHeight: 1.5 },

  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 34 },
  sign:     { width: "44%" },
  signLbl:  { fontSize: 7.4, color: "#8A8A8A", letterSpacing: 0.6, marginBottom: 30 },
  signLine: { borderTopWidth: 0.8, borderTopColor: "#9A9A9A", paddingTop: 4, fontSize: 8, color: "#555" },

  pied:     { position: "absolute", bottom: 26, left: 46, right: 46, borderTopWidth: 0.5, borderTopColor: "#D8D8D8", paddingTop: 7 },
  piedTxt:  { fontSize: 6.6, color: "#8A8A8A", textAlign: "center", lineHeight: 1.5 },
});

/**
 * Justificatif de paiement d'un mentor.
 *
 * Reprend la trame du modèle Word de NAVOR GROUP — en-tête, filet indigo,
 * titres cuivre, pied de page légal. La police IBM Plex Sans du modèle n'est
 * pas embarquée : le document garde la mise en page et les couleurs, avec la
 * police intégrée au moteur PDF.
 *
 * L'émetteur est NAVOR GROUP, seule entité dont les identifiants légaux
 * engagent le paiement. CodeKids figure comme programme.
 */
export default function JustificatifPDF({ j, emisPar }: { j: Justificatif; emisPar: string }) {
  const aujourdhui = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Document
      title={`Justificatif ${j.reference}`}
      author={EMETTEUR.raison}
      subject={`Paiement des séances de ${j.mentor} — ${j.moisLabel}`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.enTete}>
          <View>
            <Text style={s.marque}>{EMETTEUR.raison.replace(" SARL", "")}</Text>
            <Text style={s.activite}>{EMETTEUR.activite}</Text>
          </View>
          <Image src={LOGO} style={s.logo} />
        </View>
        <View style={s.filet} />

        <Text style={s.lieu}>Lomé, le {aujourdhui}</Text>

        <Text style={s.titre}>Justificatif de paiement</Text>
        <Text style={s.ref}>Référence {j.reference}</Text>

        <View style={s.bloc}>
          <View style={s.colonne}>
            <Text style={s.etiquette}>BÉNÉFICIAIRE</Text>
            <Text style={s.valeur}>{j.mentor}</Text>
            <Text style={s.detail}>Mentor — programme CodeKids</Text>
          </View>
          <View style={s.colonne}>
            <Text style={s.etiquette}>PÉRIODE</Text>
            <Text style={s.valeur}>{j.moisLabel}</Text>
            <Text style={s.detail}>
              {j.lignes.length} séance{j.lignes.length > 1 ? "s" : ""} validée{j.lignes.length > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={s.colonne}>
            <Text style={s.etiquette}>TARIF APPLIQUÉ</Text>
            <Text style={s.valeur}>
              {j.tarif ? fcfa(j.tarif.rate_fcfa) : "—"}
            </Text>
            <Text style={s.detail}>
              {j.tarif ? (j.tarif.rate_type === "per_hour" ? "par heure" : "par séance") : "aucun tarif enregistré"}
            </Text>
          </View>
        </View>

        <Text style={s.intro}>
          La présente pièce atteste du règlement des séances d&apos;accompagnement assurées par{" "}
          {j.mentor} au titre du programme CodeKids pour le mois {duMois(j.moisLabel)}. Seules les séances
          ayant donné lieu à un compte rendu du mentor sont retenues.
        </Text>

        <Text style={s.sousTitre}>Détail des séances</Text>

        <View style={s.th}>
          <Text style={[s.thTxt, s.cDate]}>DATE</Text>
          <Text style={[s.thTxt, s.cSeance]}>SÉANCE</Text>
          <Text style={[s.thTxt, s.cEleve]}>ÉLÈVE</Text>
          <Text style={[s.thTxt, s.cDuree]}>DURÉE</Text>
          <Text style={[s.thTxt, s.cMontant]}>MONTANT</Text>
        </View>

        {j.lignes.map((l, i) => (
          <View key={i} style={s.tr} wrap={false}>
            <Text style={s.cDate}>{jour(l.date)}</Text>
            <Text style={s.cSeance}>{l.titre}</Text>
            <Text style={s.cEleve}>{l.eleve ?? "—"}</Text>
            <Text style={s.cDuree}>{l.duree} min</Text>
            <Text style={s.cMontant}>{fcfa(l.montant)}</Text>
          </View>
        ))}

        <View style={s.totalBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>TOTAL VERSÉ</Text>
            <Text style={s.totalVal}>{fcfa(j.total)}</Text>
          </View>
          <Text style={s.lettres}>
            Arrêté à la somme de {j.totalEnLettres} francs CFA.
          </Text>
        </View>

        {j.sansRapport > 0 && (
          <Text style={s.note}>
            {j.sansRapport} séance{j.sansRapport > 1 ? "s ont" : " a"} été tenue{j.sansRapport > 1 ? "s" : ""} sur
            la période sans compte rendu du mentor. Conformément aux règles du programme,
            elle{j.sansRapport > 1 ? "s ne sont" : " n'est"} pas comprise{j.sansRapport > 1 ? "s" : ""} dans
            le présent règlement.
          </Text>
        )}

        <View style={s.signatures}>
          <View style={s.sign}>
            <Text style={s.signLbl}>POUR {EMETTEUR.raison.toUpperCase()}</Text>
            <Text style={s.signLine}>{emisPar}</Text>
          </View>
          <View style={s.sign}>
            <Text style={s.signLbl}>REÇU PAR LE BÉNÉFICIAIRE</Text>
            <Text style={s.signLine}>{j.mentor} — date et signature</Text>
          </View>
        </View>

        <View style={s.pied} fixed>
          <Text style={s.piedTxt}>
            {EMETTEUR.raison} · {EMETTEUR.capital} · {EMETTEUR.adresse}
            {"\n"}
            {EMETTEUR.tel} · {EMETTEUR.email} · {EMETTEUR.site}
            {"\n"}
            {EMETTEUR.rccm} · {EMETTEUR.nif}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
