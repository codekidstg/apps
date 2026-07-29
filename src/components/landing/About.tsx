export default function About() {
  return (
    <section id="apropos" className="bg-brand-navy py-20 px-6 md:px-14 overflow-hidden relative">

      {/* Déco fond */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: "#FDB813", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: "#4F8EF7", filter: "blur(60px)" }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Label */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10 border"
          style={{ background: "rgba(253,184,19,0.1)", borderColor: "rgba(253,184,19,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FDB813" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "#FDB813" }}>
            Notre histoire
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Colonne gauche — texte */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white leading-tight mb-8">
              Nés à Lomé.<br />
              <span style={{ color: "#FDB813" }}>Codeurs avant tout.</span>
            </h2>

            <div className="space-y-6 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              <p>
                Tout a commencé avec un constat simple : en Afrique de l'Ouest, l'informatique et la
                programmation n'ont pas encore trouvé leur place dans l'éducation des enfants.
                Pas par manque d'intelligence — par manque d'opportunité.
              </p>

              <p>
                Pendant ce temps, des enfants en Europe ou en Amérique du Nord grandissent entourés
                d'outils, de cours accessibles, de ressources dans leur langue. Ils prennent de l'avance,
                pas parce qu'ils sont plus doués, mais parce que l'environnement le permet.
              </p>

              <p>
                On est une équipe de jeunes Togolais — développeurs, éducateurs, designers, pédagogues —
                convaincus que nos enfants méritent la même chance. Et on a décidé de faire quelque chose.
              </p>

              <p>
                Pas avec des grands discours. Avec une plateforme.
              </p>

              <p>
                <strong className="text-white">codeKids</strong>, c'est ce qu'on aurait voulu avoir à 12 ans :
                des cours en français, adaptés à notre réalité, animés par de vrais profs locaux,
                avec des projets concrets qui donnent envie d'aller plus loin.
              </p>

              <p>
                L'idée n'est pas de former des génies. C'est de donner à chaque enfant
                de 10 à 18 ans les outils pour comprendre le monde numérique qui l'entoure,
                l'apprivoiser, et un jour — peut-être — le transformer.
              </p>
            </div>
          </div>

          {/* Colonne droite — chiffres + citation */}
          <div className="space-y-6">

            {/* Citation fondateur */}
            <div className="rounded-3xl p-7 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-4xl mb-4" style={{ color: "#FDB813", fontFamily: "Georgia, serif" }}>"</div>
              <p className="text-lg font-bold text-white leading-relaxed mb-5">
                On a tous appris à coder dans des conditions difficiles. On veut que la prochaine
                génération n'ait pas à se battre pour ça. Elle a juste à vouloir.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: "#FDB813", color: "#1B2D5E" }}>R</div>
                <div>
                  <div className="text-white font-black text-sm">L'équipe codeKids</div>
                  <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>Lomé, Togo — 2024</div>
                </div>
              </div>
            </div>

            {/* Valeurs clés */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🌍", titre: "Contexte local", texte: "Exemples, personnages et références tirés de la réalité africaine" },
                { icon: "🇫🇷", titre: "100% en français", texte: "Pas de barrière linguistique pour apprendre les bases" },
                { icon: "👩‍🏫", titre: "Profs certifiés", texte: "Des enseignants formés, salariés, présents à chaque session" },
                { icon: "🎮", titre: "Appris en jouant", texte: "XP, badges, projets réels — l'enfant avance sans s'en rendre compte" },
              ].map((v) => (
                <div key={v.titre} className="rounded-2xl p-4 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="text-2xl mb-2">{v.icon}</div>
                  <div className="text-white font-black text-sm mb-1">{v.titre}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{v.texte}</div>
                </div>
              ))}
            </div>

            {/* CTA discret */}
            <a
              href="mailto:codekidstg@proton.me?subject=En savoir plus sur codeKids"
              className="flex items-center justify-between rounded-2xl px-5 py-4 transition-colors group border"
              style={{ background: "rgba(253,184,19,0.08)", borderColor: "rgba(253,184,19,0.2)" }}
            >
              <div>
                <div className="text-white font-black text-sm">Vous voulez en savoir plus ?</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Écrivez-nous — on répond dans la journée.
                </div>
              </div>
              <span className="text-xl transition-transform group-hover:translate-x-1" style={{ color: "#FDB813" }}>→</span>
            </a>

          </div>
        </div>
      </div>
    </section>
  );
}
