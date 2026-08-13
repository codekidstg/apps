import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "CodeKids <noreply@codekids.tg>";

type Role = "student" | "teacher" | "parent" | "manager" | "admin";

export async function sendWelcomeEmail({
  email,
  displayName,
  password,
  role,
}: {
  email: string;
  displayName: string;
  password: string;
  role: Role;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codekids.tg";
  const firstName = displayName.split(" ")[0];

  const templates: Record<Role, { subject: string; html: string }> = {
    student: {
      subject: "🎮 Ton compte CodeKids est prêt !",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <img src="${siteUrl}/logo.png" alt="CodeKids" style="height:48px;margin-bottom:24px;" />
          <h1 style="font-size:22px;font-weight:900;color:#1a1a2e;margin:0 0 8px;">Salut ${firstName} ! 👋</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Ton compte CodeKids est créé. Prépare-toi à coder, résoudre des énigmes et gagner des badges !
          </p>
          <div style="background:#f8f5f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;">Tes identifiants</p>
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0;font-size:15px;color:#1a1a2e;"><strong>Mot de passe :</strong> <code style="background:#e8e0d8;padding:2px 6px;border-radius:4px;">${password}</code></p>
          </div>
          <a href="${siteUrl}/connexion" style="display:inline-block;background:#f97316;color:#fff;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;">
            Commencer à jouer 🚀
          </a>
          <p style="margin-top:32px;font-size:12px;color:#aaa;">CodeKids — La plateforme de coding pour les enfants</p>
        </div>
      `,
    },
    teacher: {
      subject: "Bienvenue sur CodeKids, mentor !",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <img src="${siteUrl}/logo.png" alt="CodeKids" style="height:48px;margin-bottom:24px;" />
          <h1 style="font-size:22px;font-weight:900;color:#1a1a2e;margin:0 0 8px;">Bonjour ${firstName},</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Votre compte mentor CodeKids a été créé. Vous pouvez dès maintenant accéder à vos outils pédagogiques : suivi des élèves, sessions, certificats et rapports.
          </p>
          <div style="background:#f8f5f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;">Vos identifiants</p>
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0;font-size:15px;color:#1a1a2e;"><strong>Mot de passe :</strong> <code style="background:#e8e0d8;padding:2px 6px;border-radius:4px;">${password}</code></p>
          </div>
          <a href="${siteUrl}/connexion" style="display:inline-block;background:#f97316;color:#fff;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;">
            Accéder à mon espace mentor
          </a>
          <p style="margin-top:32px;font-size:12px;color:#aaa;">CodeKids — Plateforme pédagogique</p>
        </div>
      `,
    },
    parent: {
      subject: "Votre espace CodeKids est prêt",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <img src="${siteUrl}/logo.png" alt="CodeKids" style="height:48px;margin-bottom:24px;" />
          <h1 style="font-size:22px;font-weight:900;color:#1a1a2e;margin:0 0 8px;">Bonjour ${firstName},</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Votre compte parent CodeKids a été créé. Depuis votre espace, vous pouvez suivre la progression de votre enfant, consulter ses certificats et gérer votre abonnement.
          </p>
          <div style="background:#f8f5f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;">Vos identifiants</p>
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0;font-size:15px;color:#1a1a2e;"><strong>Mot de passe :</strong> <code style="background:#e8e0d8;padding:2px 6px;border-radius:4px;">${password}</code></p>
          </div>
          <a href="${siteUrl}/connexion" style="display:inline-block;background:#f97316;color:#fff;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;">
            Accéder à mon espace
          </a>
          <p style="margin-top:32px;font-size:12px;color:#aaa;">CodeKids — La plateforme de coding pour les enfants</p>
        </div>
      `,
    },
    manager: {
      subject: "Accès manager CodeKids créé",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <img src="${siteUrl}/logo.png" alt="CodeKids" style="height:48px;margin-bottom:24px;" />
          <h1 style="font-size:22px;font-weight:900;color:#1a1a2e;margin:0 0 8px;">Bonjour ${firstName},</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Votre compte manager CodeKids a été créé. Vous avez accès au backoffice de gestion du contenu pédagogique.
          </p>
          <div style="background:#f8f5f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;">Identifiants</p>
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0;font-size:15px;color:#1a1a2e;"><strong>Mot de passe :</strong> <code style="background:#e8e0d8;padding:2px 6px;border-radius:4px;">${password}</code></p>
          </div>
          <a href="${siteUrl}/connexion" style="display:inline-block;background:#f97316;color:#fff;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;">
            Se connecter
          </a>
          <p style="margin-top:32px;font-size:12px;color:#aaa;">CodeKids</p>
        </div>
      `,
    },
    admin: {
      subject: "Accès administrateur CodeKids",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <img src="${siteUrl}/logo.png" alt="CodeKids" style="height:48px;margin-bottom:24px;" />
          <h1 style="font-size:22px;font-weight:900;color:#1a1a2e;margin:0 0 8px;">Bonjour ${firstName},</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Un compte administrateur CodeKids a été créé pour vous.
          </p>
          <div style="background:#f8f5f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;">Identifiants</p>
            <p style="margin:0 0 6px;font-size:15px;color:#1a1a2e;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0;font-size:15px;color:#1a1a2e;"><strong>Mot de passe :</strong> <code style="background:#e8e0d8;padding:2px 6px;border-radius:4px;">${password}</code></p>
          </div>
          <a href="${siteUrl}/connexion" style="display:inline-block;background:#f97316;color:#fff;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;">
            Se connecter
          </a>
          <p style="margin-top:32px;font-size:12px;color:#aaa;">CodeKids</p>
        </div>
      `,
    },
  };

  const tpl = templates[role] ?? templates.parent;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: tpl.subject,
    html: tpl.html,
  });

  if (error) throw new Error(error.message);
}
