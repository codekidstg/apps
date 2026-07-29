"use client";

import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    name: "Mme Akossiwa Améganvi",
    role: "Directrice d'école primaire",
    city: "Lomé, Togo",
    avatar: "A",
    color: "bg-explorer",
    stars: 5,
    text: "Mon fils de 12 ans rentrait de classe et filait directement sur codeKids. En deux mois il a créé un petit jeu et l'a montré à toute l'école. Ce que j'ai vu dans ses yeux ce jour-là, ça n'a pas de prix.",
    child: "Elikem, 12 ans — Explorateur",
  },
  {
    name: "M. Kofi Lawson",
    role: "Ingénieur civil",
    city: "Lomé, Togo",
    avatar: "K",
    color: "bg-builder",
    stars: 5,
    text: "En tant qu'ingénieur, je savais que le code serait incontournable. Ce qui m'a convaincu : de vrais professeurs, une vraie progression. Pas une appli qu'on jette au bout de trois jours. Kafui est sérieux depuis le premier cours.",
    child: "Kafui, 15 ans — Bâtisseur",
  },
  {
    name: "Mme Yawa Tossou",
    role: "Pharmacienne",
    city: "Lomé, Togo",
    avatar: "Y",
    color: "bg-brand-amber",
    stars: 5,
    text: "J'avais peur que ce soit trop difficile pour ma fille de 11 ans. Dès la première séance, le professeur l'a mise en confiance. Aujourd'hui elle m'explique ce qu'est une boucle. C'est moi qui apprends avec elle.",
    child: "Ines, 11 ans — Exploratrice",
  },
  {
    name: "M. Kossi Agbénou",
    role: "Chef d'entreprise",
    city: "Lomé, Togo",
    avatar: "K",
    color: "bg-brand-orange",
    stars: 5,
    text: "Mon fils de 17 ans vient de livrer le site de ma société. Pas un template — une vraie création. L'investissement codeKids est sans doute le meilleur retour que j'ai eu. Je le recommande à tous les parents de Lomé.",
    child: "Ibrahim, 17 ans — Architecte",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FDB813">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }: { t: typeof TESTIMONIALS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="bg-white rounded-3xl p-7 border border-cream-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${index * 0.12}s, transform 0.55s ease ${index * 0.12}s, box-shadow 0.2s, translate 0.2s`,
      }}
    >
      {/* Quote mark déco */}
      <div className="flex items-start justify-between mb-3">
        <Stars count={t.stars} />
        <span className="font-display text-5xl text-cream-border leading-none select-none">"</span>
      </div>

      <p className="text-ink text-[15px] leading-relaxed mb-6">
        {t.text}
      </p>

      <div className="flex items-center gap-3 pt-5 border-t border-cream-border">
        <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
          {t.avatar}
        </div>
        <div>
          <div className="font-extrabold text-sm text-ink">{t.name}</div>
          <div className="text-xs text-ink-light font-bold">{t.role} · {t.city}</div>
        </div>
        <div className="ml-auto">
          <div className="text-xs font-extrabold text-brand-orange bg-brand-orange-light px-3 py-1 rounded-full whitespace-nowrap">
            {t.child}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeaderVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-cream border-t border-cream-border py-20">
      <div className="max-w-7xl mx-auto px-7">

        <div
          ref={headerRef}
          className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-ink-light mb-4">
              Ils nous font confiance
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-ink leading-tight">
              Ce que les parents<br />
              <span className="text-brand-orange">en pensent</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 self-start md:self-auto">
            <div className="text-right">
              <div className="font-display text-4xl font-black text-ink">4.9</div>
              <Stars count={5} />
              <div className="text-xs text-ink-light font-bold mt-1">Note moyenne</div>
            </div>
            <div className="w-px h-14 bg-cream-border" />
            <div className="text-right">
              <div className="font-display text-4xl font-black text-ink">200+</div>
              <div className="text-xs text-ink-light font-bold mt-1">Familles inscrites</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>

        {/* CTA bas */}
        <div
          className="mt-14 text-center"
          style={{
            opacity: headerVisible ? 1 : 0,
            transition: "opacity 0.5s ease 0.6s",
          }}
        >
          <p className="text-ink-muted text-sm font-bold mb-4">
            Rejoignez les familles de Lomé qui ont déjà franchi le pas.
          </p>
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
