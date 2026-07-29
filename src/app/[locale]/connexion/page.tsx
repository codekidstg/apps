"use client";

import { useEffect, useRef, useActionState } from "react";
import { login } from "@/app/[locale]/auth/actions";
import Logo from "@/components/Logo";
import { useSearchParams } from "next/navigation";

// ── Neurone canvas ───────────────────────────────────────────────
function NeuronCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const safeCanvas = canvas;

    const ctxRaw = safeCanvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx = ctxRaw;

    let raf: number;
    let W = 0, H = 0;

    const NODE_COUNT = 55;
    const CONNECT_DIST = 140;
    const SPEED = 0.25;

    type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number; pulseSpeed: number };
    let nodes: Node[] = [];

    function resize() {
      W = safeCanvas.offsetWidth;
      H = safeCanvas.offsetHeight;
      safeCanvas.width  = W * devicePixelRatio;
      safeCanvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    function init() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: 2 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Update
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      // Connexions
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONNECT_DIST) continue;

          const alpha = (1 - dist / CONNECT_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(253,184,19,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Points
      for (const n of nodes) {
        const glow = 0.5 + 0.5 * Math.sin(n.pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + 0.3 * glow), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(27,45,94,${0.35 + 0.2 * glow})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(safeCanvas);
    resize();
    init();
    draw();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
}

// ── Page connexion ───────────────────────────────────────────────
export default function ConnexionPage() {
  const searchParams = useSearchParams();
  const error         = searchParams.get("error");
  const redirectParam = searchParams.get("redirect");

  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await login(formData);
    return null;
  }, null);

  return (
    <div className="relative min-h-screen bg-cream flex items-center justify-center px-4 overflow-hidden">

      {/* Animation fond */}
      <NeuronCanvas />

      {/* Overlay dégradé pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream/60 via-cream/40 to-cream/70 pointer-events-none" />

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="drop-shadow-sm">
            <Logo size={160} />
          </div>
          <p className="text-ink-muted mt-1 text-sm font-bold">Connecte-toi à ton espace</p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm border border-stone-100 p-8">
          <h1 className="font-display text-2xl font-bold text-ink mb-6">Connexion</h1>

          {error && (
            <div className="bg-architect-light text-red-800 text-sm rounded-xl px-4 py-3 mb-6">
              {error === "Invalid login credentials"
                ? "Email ou mot de passe incorrect."
                : error}
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-5">
            {/* Honeypot — invisible pour les humains, piège pour les bots */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
            />

            {redirectParam && (
              <input type="hidden" name="redirect" value={redirectParam} />
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="toi@exemple.com"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-1 bg-brand-orange text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-orange-dark disabled:opacity-60 transition-colors"
            >
              {pending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
