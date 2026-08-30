import { Resend } from "resend";

const FROM = "CodeKids <noreply@codekids.tg>";

/**
 * Client instancié à l'envoi, pas au chargement du module.
 *
 * `new Resend(...)` à la racine exigeait la clé dès l'import : composer un
 * message pour l'afficher — ce qui n'envoie rien — échouait donc partout où la
 * clé n'existe pas, notamment côté navigateur.
 */
function client() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Adresse de la plateforme, écrite en dur volontairement.
 *
 * Elle passait par NEXT_PUBLIC_SITE_URL, qui vaut http://localhost:3000 en
 * développement : un email envoyé depuis un poste de dev invitait le
 * destinataire à se connecter sur sa propre machine.
 */
export const SITE_URL = "https://codekids-phi.vercel.app";

/** Logo allégé (21 Ko) — logo.png en fait 251, trop lourd pour un email. */
const LOGO_URL = `${SITE_URL}/logo-email.png`;

export type Role = "student" | "teacher" | "parent" | "manager" | "admin";

export type WelcomeEmail = {
  subject: string;
  /** Version HTML, telle qu'elle part par email. */
  html: string;
  /** Même contenu en texte brut — pour la copie, notamment vers WhatsApp. */
  text: string;
};

type Params = { email: string; displayName: string; password: string; role: Role };

function echappe(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Compose le message d'accès d'un utilisateur.
 *
 * Une seule source pour les trois usages — aperçu, copie, envoi. Les avoir
 * séparés aurait garanti qu'ils divergent : c'est exactement ce qui est arrivé
 * cette semaine aux écrans dupliqués entre admin et manager.
 *
 * Deux tons : le modèle formel pour les adultes, la version enjouée pour les
 * élèves. Un enfant de neuf ans ne reçoit pas un courrier des ressources
 * humaines.
 */
/**
 * Prénom d'appel : tout sauf le dernier mot.
 *
 * Les prénoms composés sont courants ici — « Jean pierre Gaba », « Ryshawn
 * Ekoué AHYI-YENOU ». Ne garder que le premier mot écrivait « Bonjour Jean »
 * à quelqu'un qui s'appelle Jean pierre. Le nom de famille étant en dernier
 * dans les comptes créés, on retire seulement celui-là — et rien s'il n'y a
 * qu'un seul mot.
 */
function prenomDAppel(displayName: string) {
  const mots = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length <= 1) return mots[0] ?? "";
  return mots.slice(0, -1).join(" ");
}

export function buildWelcomeEmail({ email, displayName, password, role }: Params): WelcomeEmail {
  const prenom = prenomDAppel(displayName);

  if (role === "student") {
    const texte = [
      `Salut ${prenom} !`,
      ``,
      `Ton compte CodeKids est pret. Voici comment y entrer :`,
      ``,
      `Lien : ${SITE_URL}`,
      `Email : ${email}`,
      `Mot de passe : ${password}`,
      ``,
      `A tout de suite dans la cite numerique !`,
      `L'equipe CodeKids`,
    ].join("\n");

    return {
      subject: "🎮 Ton compte CodeKids est prêt !",
      text: texte,
      html: enveloppe(`
        <h1 style="font-size:22px;font-weight:800;color:#1B2D5E;margin:0 0 12px;">Salut ${echappe(prenom)} ! 👋</h1>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Ton compte CodeKids est prêt. Prépare-toi à coder, résoudre des énigmes et gagner des badges !
        </p>
        ${bloc(email, password)}
        ${bouton("Commencer à jouer 🚀")}
        <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6;">
          À tout de suite dans la cité numérique !<br /><strong>L'équipe CodeKids</strong>
        </p>
      `),
    };
  }

  const texte = [
    `Bonjour ${prenom},`,
    ``,
    `Voici vos identifiants de connexion a la plateforme CodeKids :`,
    ``,
    `Lien : ${SITE_URL}`,
    `Email : ${email}`,
    `Mot de passe : ${password}`,
    ``,
    `N'hesitez pas a me contacter si vous rencontrez la moindre difficulte.`,
    ``,
    `Bonne journee,`,
    `DRH - codeKids`,
  ].join("\n");

  return {
    subject: "Vos accès CodeKids",
    text: texte,
    html: enveloppe(`
      <h1 style="font-size:20px;font-weight:800;color:#1B2D5E;margin:0 0 12px;">Bonjour ${echappe(prenom)},</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Voici vos identifiants de connexion à la plateforme CodeKids :
      </p>
      ${bloc(email, password)}
      ${bouton("Accéder à la plateforme")}
      <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6;">
        N'hésitez pas à me contacter si vous rencontrez la moindre difficulté.
      </p>
      <p style="margin:20px 0 0;font-size:14px;color:#475569;line-height:1.6;">
        Bonne journée,<br /><strong>DRH - codeKids</strong>
      </p>
    `),
  };
}

function enveloppe(corps: string) {
  return `
<div style="background:#f1f5f9;padding:28px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px 28px;">
    <img src="${LOGO_URL}" alt="CodeKids" width="120" style="width:120px;height:auto;display:block;margin:0 0 24px;" />
    ${corps}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;" />
    <p style="margin:0;font-size:12px;color:#94a3b8;">
      CodeKids — apprendre à coder, du premier programme au vrai projet.
    </p>
  </div>
</div>`;
}

function bloc(email: string, password: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">Vos accès</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1B2D5E;">
          <strong>Lien :</strong> <a href="${SITE_URL}" style="color:#F47B20;">${SITE_URL}</a>
        </p>
        <p style="margin:0 0 6px;font-size:14px;color:#1B2D5E;"><strong>Email :</strong> ${echappe(email)}</p>
        <p style="margin:0;font-size:14px;color:#1B2D5E;">
          <strong>Mot de passe :</strong>
          <code style="background:#e2e8f0;padding:3px 8px;border-radius:5px;font-size:14px;">${echappe(password)}</code>
        </p>
      </td></tr>
    </table>`;
}

function bouton(libelle: string) {
  return `
    <a href="${SITE_URL}" style="display:inline-block;background:#F47B20;color:#ffffff;font-weight:800;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:15px;">
      ${libelle}
    </a>`;
}

export async function sendWelcomeEmail(params: Params) {
  const { subject, html, text } = buildWelcomeEmail(params);

  const { error } = await client().emails.send({
    from: FROM,
    to: params.email,
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
}
