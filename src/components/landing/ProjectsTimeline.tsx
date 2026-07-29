const PROJECTS = [
  {
    age: "10-12 ans",
    level: "Explorateur 🌱",
    levelColor: "bg-explorer",
    levelBorder: "border-explorer-border",
    levelBg: "bg-explorer-light",
    levelText: "text-explorer",
    accent: "#10B981",
    icon: "🏙️",
    project: "Construire les premières rues de la Cité",
    desc: "Ton enfant programme les feux de circulation, trace les routes, et fait circuler les habitants. Chaque instruction donnée à Kodi bâtit un morceau de ville — le résultat est visible, immédiat, et source de fierté.",
  },
  {
    age: "13-15 ans",
    level: "Bâtisseur 🏗️",
    levelColor: "bg-builder",
    levelBorder: "border-builder-border",
    levelBg: "bg-builder-light",
    levelText: "text-builder",
    accent: "#7C3AED",
    icon: "🏘️",
    project: "Concevoir les quartiers et leurs bâtiments",
    desc: "Ton enfant crée une interface web pour visualiser et interagir avec la Cité — carte interactive, annuaires de services, tableau de bord de quartier. Un vrai projet utilisable par d'autres.",
  },
  {
    age: "16-18 ans",
    level: "Architecte 🏛️",
    levelColor: "bg-brand-amber",
    levelBorder: "border-architect-border",
    levelBg: "bg-architect-light",
    levelText: "text-ink",
    accent: "#FDB813",
    icon: "🌐",
    project: "Piloter la Cité intelligente",
    desc: "Ton enfant conçoit les algorithmes de trafic, sécurise la Cité contre les cybermenaces, et intègre une IA pour optimiser les flux. Un portfolio professionnel qui ouvre les portes des meilleures écoles.",
  },
];

export default function ProjectsTimeline() {
  return (
    <section id="niveaux" className="bg-white py-20 border-t border-cream-border">
      <div className="max-w-7xl mx-auto px-7">

        <div className="mb-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-ink-light mb-4">
            Parcours concrets
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-black text-ink leading-tight max-w-2xl">
            Ce que votre enfant<br />
            <span className="text-brand-orange">va construire</span>
          </h2>
          <p className="text-ink-muted text-base mt-5 max-w-xl leading-relaxed">
            Pas des exercices abstraits — de vrais projets, du premier jeu jusqu'à l'application professionnelle.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-cream-border -translate-x-1/2" />

          <div className="flex flex-col gap-16">
            {PROJECTS.map((p, i) => (
              <div key={p.level} className={`relative flex flex-col md:flex-row gap-8 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>

                {/* Nœud timeline */}
                <div
                  className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-white shadow-lg items-center justify-center text-xl z-10"
                  style={{ background: p.accent }}
                >
                  {p.icon}
                </div>

                {/* Carte */}
                <div className={`flex-1 ${i % 2 === 1 ? "md:pl-10" : "md:pr-10"}`}>
                  <div className={`${p.levelBg} border-2 ${p.levelBorder} rounded-3xl p-7`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-2xl ${p.levelColor} flex items-center justify-center text-xl flex-shrink-0`}>
                        {p.icon}
                      </div>
                      <div>
                        <span className={`text-xs font-extrabold uppercase tracking-widest ${p.levelText}`}>{p.level}</span>
                        <h3 className="font-display text-xl font-black text-ink">{p.project}</h3>
                      </div>
                    </div>
                    <p className="text-ink-muted text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>

                {/* Étiquette âge */}
                <div className={`flex-1 hidden md:flex ${i % 2 === 1 ? "justify-end pr-10" : "justify-start pl-10"}`}>
                  <div className="font-display text-6xl font-black leading-none" style={{ color: p.accent, opacity: 0.18 }}>
                    {p.age}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* CTA bas */}
        <div className="mt-16 text-center">
          <a
            href="mailto:codekidstg@proton.me?subject=Inscription codeKids — Rentrée 2026"
            className="inline-flex items-center gap-2 bg-brand-orange text-white font-extrabold text-sm px-8 py-4 rounded-xl hover:bg-brand-orange-dark transition-colors"
          >
            Inscrire mon enfant →
          </a>
        </div>

      </div>
    </section>
  );
}
