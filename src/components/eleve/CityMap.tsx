"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type LessonNode = {
  id: string;
  title: string;
  completed: boolean;
  x: number;
  y: number;
  zoneColor: string;
  zoneIcon: string;
};

type Props = { lessons: LessonNode[] };

// Building shapes drawn with Phaser graphics
const ZONE_POSITIONS: { x: number; y: number; w: number; h: number; label: string; color: number; darkColor: number }[] = [
  { x: 60,  y: 340, w: 180, h: 160, label: "La Place du Code",       color: 0x1d4ed8, darkColor: 0x1e3a8a },
  { x: 60,  y: 80,  w: 180, h: 200, label: "La Tour des Boucles",    color: 0x6d28d9, darkColor: 0x4c1d95 },
  { x: 360, y: 80,  w: 200, h: 180, label: "Le Pont des Conditions", color: 0x059669, darkColor: 0x064e3b },
  { x: 360, y: 340, w: 200, h: 160, label: "Le Labo Blockly",         color: 0xd97706, darkColor: 0x78350f },
];

export default function CityMap({ lessons }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;
    let game: unknown = null;

    async function initPhaser() {
      const Phaser = (await import("phaser")).default;

      const W = containerRef.current!.clientWidth || 640;
      const H = 540;

      class CityScene extends Phaser.Scene {
        constructor() { super("CityScene"); }

        create() {
          // Sky / ground
          this.add.rectangle(W / 2, H / 2, W, H, 0x0f172a);
          // Ground
          this.add.rectangle(W / 2, H - 20, W, 40, 0x1e293b);
          // Roads
          const graphics = this.add.graphics();
          graphics.fillStyle(0x334155, 1);
          graphics.fillRect(240, 0, 100, H); // vertical road
          graphics.fillRect(0, 270, W, 80);  // horizontal road
          // Road markings
          graphics.fillStyle(0xfbbf24, 1);
          for (let y = 0; y < H; y += 40) graphics.fillRect(287, y, 6, 20);
          for (let x = 0; x < W; x += 40) graphics.fillRect(x, 307, 20, 6);

          // Zones / buildings
          ZONE_POSITIONS.forEach((zone, zIdx) => {
            const zoneLessons = lessons.filter((_, i) => Math.floor(i / 3) === zIdx);
            const allDone = zoneLessons.every((l) => l.completed);
            const anyDone = zoneLessons.some((l) => l.completed);
            const color = anyDone ? zone.color : 0x334155;
            const dark  = anyDone ? zone.darkColor : 0x1e293b;

            // Building shadow
            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(zone.x + 6, zone.y + 6, zone.w, zone.h);
            // Building body
            graphics.fillStyle(color, 1);
            graphics.fillRect(zone.x, zone.y, zone.w, zone.h);
            // Roof
            graphics.fillStyle(dark, 1);
            graphics.fillRect(zone.x, zone.y, zone.w, 16);
            // Windows
            graphics.fillStyle(allDone ? 0xfef08a : 0x475569, 1);
            for (let row = 0; row < 3; row++) {
              for (let col = 0; col < 3; col++) {
                graphics.fillRect(
                  zone.x + 18 + col * 48,
                  zone.y + 30 + row * 38,
                  28, 22
                );
              }
            }
            // Door
            graphics.fillStyle(dark, 1);
            graphics.fillRect(zone.x + zone.w / 2 - 15, zone.y + zone.h - 36, 30, 36);

            // Zone label
            this.add.text(zone.x + zone.w / 2, zone.y - 14, zone.label, {
              fontSize: "10px",
              fontFamily: "system-ui",
              fontStyle: "bold",
              color: anyDone ? "#ffffff" : "#64748b",
            }).setOrigin(0.5);

            // Lesson dots on building
            zoneLessons.forEach((lesson, li) => {
              const dotX = zone.x + 20 + (li % 3) * 58;
              const dotY = zone.y + zone.h - 60;
              const dotColor = lesson.completed ? 0x4ade80 : 0x64748b;

              const dot = this.add.circle(dotX + 15, dotY, 10, dotColor);
              dot.setInteractive({ useHandCursor: true });

              const label = this.add.text(dotX + 15, dotY + 18, lesson.title.split(" ")[0], {
                fontSize: "8px",
                fontFamily: "system-ui",
                color: lesson.completed ? "#4ade80" : "#94a3b8",
              }).setOrigin(0.5);

              dot.on("pointerover", () => {
                dot.setScale(1.3);
                // Tooltip
                const tooltip = this.add.text(dotX + 15, dotY - 20, lesson.title, {
                  fontSize: "10px", fontFamily: "system-ui", color: "#fff",
                  backgroundColor: "#1e293b", padding: { x: 6, y: 3 },
                }).setOrigin(0.5).setDepth(10).setName(`tip-${lesson.id}`);
              });

              dot.on("pointerout", () => {
                dot.setScale(1);
                this.children.getByName(`tip-${lesson.id}`)?.destroy();
              });

              dot.on("pointerdown", () => {
                router.push(`/eleve/quete/${lesson.id}`);
              });
            });
          });

          // Floating title
          this.add.text(W / 2, 20, "🏙️  Ta Cité Numérique", {
            fontSize: "18px", fontFamily: "system-ui", fontStyle: "bold", color: "#f1f5f9",
          }).setOrigin(0.5);
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: W,
        height: H,
        parent: containerRef.current!,
        backgroundColor: "#0f172a",
        scene: CityScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
    }

    initPhaser();

    return () => {
      if (game && (game as any).destroy) (game as any).destroy(true);
    };
  }, [lessons, router]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-slate-700"
      style={{ height: 540 }}
    />
  );
}
