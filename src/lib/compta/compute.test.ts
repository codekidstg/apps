import { describe, it, expect } from "vitest";
import {
  getEffectiveTeacherRate,
  getEffectiveStudentRate,
  computeMentorAmount,
  inferMentorStatus,
  inferParentStatus,
  buildMonthOccurrences,
  computeMentorTotals,
  computeParentTotals,
  validateParentPayment,
  rateRefDateForMonth,
  type TeacherRate,
  type StudentRate,
  type RawSession,
} from "./compute";

// ─────────────────────────────────────────────────────────────────
// rateRefDateForMonth
// ─────────────────────────────────────────────────────────────────

describe("rateRefDateForMonth", () => {
  it("mois passé → dernier jour du mois", () => {
    const ref = rateRefDateForMonth(7, 2025, new Date("2026-08-14"));
    expect(ref).toBe("2025-07-31");
  });

  it("mois courant → aujourd'hui (tarif créé ce mois visible)", () => {
    const today = new Date("2026-08-14");
    const ref = rateRefDateForMonth(8, 2026, today);
    expect(ref).toBe("2026-08-14");
  });

  it("mois futur → aujourd'hui (pas de date future)", () => {
    const today = new Date("2026-08-14");
    const ref = rateRefDateForMonth(12, 2026, today);
    expect(ref).toBe("2026-08-14");
  });
});

// ─────────────────────────────────────────────────────────────────
// getEffectiveTeacherRate
// ─────────────────────────────────────────────────────────────────

describe("getEffectiveTeacherRate", () => {
  const rates: TeacherRate[] = [
    { teacher_id: "t1", rate_fcfa: 5000,  rate_type: "per_session", effective_from: "2025-01-01" },
    { teacher_id: "t1", rate_fcfa: 6000,  rate_type: "per_hour",    effective_from: "2025-06-01" },
    { teacher_id: "t1", rate_fcfa: 7000,  rate_type: "per_hour",    effective_from: "2026-01-01" },
    { teacher_id: "t2", rate_fcfa: 10000, rate_type: "per_session", effective_from: "2025-01-01" },
  ];

  it("retourne le tarif le plus récent ≤ referenceDate", () => {
    const r = getEffectiveTeacherRate(rates, "t1", "2025-07-01");
    expect(r).toEqual({ rate_fcfa: 6000, rate_type: "per_hour" });
  });

  it("retourne le tarif initial si avant la 2e entrée", () => {
    const r = getEffectiveTeacherRate(rates, "t1", "2025-03-15");
    expect(r).toEqual({ rate_fcfa: 5000, rate_type: "per_session" });
  });

  it("retourne le tarif exact à la date d'effet", () => {
    const r = getEffectiveTeacherRate(rates, "t1", "2026-01-01");
    expect(r).toEqual({ rate_fcfa: 7000, rate_type: "per_hour" });
  });

  it("retourne null si aucun tarif avant la date", () => {
    const r = getEffectiveTeacherRate(rates, "t1", "2024-12-31");
    expect(r).toBeNull();
  });

  it("tarif créé en cours de mois visible avec refDate = aujourd'hui", () => {
    // Scénario exact du bug : tarif créé le 14 août, refDate = 14 août → doit être trouvé
    const rates: TeacherRate[] = [
      { teacher_id: "t1", rate_fcfa: 8000, rate_type: "per_session", effective_from: "2026-08-14" },
    ];
    const r = getEffectiveTeacherRate(rates, "t1", "2026-08-14");
    expect(r).toEqual({ rate_fcfa: 8000, rate_type: "per_session" });
  });

  it("tarif créé en cours de mois invisible si refDate = début du mois (ancien comportement bugué)", () => {
    const rates: TeacherRate[] = [
      { teacher_id: "t1", rate_fcfa: 8000, rate_type: "per_session", effective_from: "2026-08-14" },
    ];
    // Simule l'ancien bug : monthStart = "2026-08-01"
    const r = getEffectiveTeacherRate(rates, "t1", "2026-08-01");
    expect(r).toBeNull(); // c'était le bug
  });

  it("retourne null pour un teacher sans tarif", () => {
    const r = getEffectiveTeacherRate(rates, "t99", "2026-01-01");
    expect(r).toBeNull();
  });

  it("isole bien les tarifs par teacher", () => {
    const r = getEffectiveTeacherRate(rates, "t2", "2026-01-01");
    expect(r).toEqual({ rate_fcfa: 10000, rate_type: "per_session" });
  });
});

// ─────────────────────────────────────────────────────────────────
// getEffectiveStudentRate
// ─────────────────────────────────────────────────────────────────

describe("getEffectiveStudentRate", () => {
  const rates: StudentRate[] = [
    { student_id: "s1", rate_fcfa: 8000,  effective_from: "2025-01-01" },
    { student_id: "s1", rate_fcfa: 10000, effective_from: "2025-09-01" },
  ];

  it("retourne le bon tarif à date", () => {
    expect(getEffectiveStudentRate(rates, "s1", "2025-08-31")).toBe(8000);
    expect(getEffectiveStudentRate(rates, "s1", "2025-09-01")).toBe(10000);
  });

  it("retourne 0 si aucun tarif", () => {
    expect(getEffectiveStudentRate(rates, "s99", "2026-01-01")).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// computeMentorAmount
// ─────────────────────────────────────────────────────────────────

describe("computeMentorAmount", () => {
  it("per_session : retourne rate_fcfa indépendamment de la durée", () => {
    expect(computeMentorAmount({ rate_fcfa: 5000, rate_type: "per_session" }, 30)).toBe(5000);
    expect(computeMentorAmount({ rate_fcfa: 5000, rate_type: "per_session" }, 120)).toBe(5000);
  });

  it("per_hour 60 min = taux horaire", () => {
    expect(computeMentorAmount({ rate_fcfa: 6000, rate_type: "per_hour" }, 60)).toBe(6000);
  });

  it("per_hour 30 min = moitié", () => {
    expect(computeMentorAmount({ rate_fcfa: 6000, rate_type: "per_hour" }, 30)).toBe(3000);
  });

  it("per_hour 90 min = taux × 1.5", () => {
    expect(computeMentorAmount({ rate_fcfa: 6000, rate_type: "per_hour" }, 90)).toBe(9000);
  });

  it("per_hour 45 min — arrondi correct", () => {
    // 7000 * 45 / 60 = 5250
    expect(computeMentorAmount({ rate_fcfa: 7000, rate_type: "per_hour" }, 45)).toBe(5250);
  });

  it("per_hour arrondi au FCFA (Math.round)", () => {
    // 1000 * 1 / 60 ≈ 16.67 → 17
    expect(computeMentorAmount({ rate_fcfa: 1000, rate_type: "per_hour" }, 1)).toBe(17);
  });

  it("retourne 0 si rate null", () => {
    expect(computeMentorAmount(null, 60)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// inferMentorStatus
// ─────────────────────────────────────────────────────────────────

describe("inferMentorStatus", () => {
  it("sans rapport et sans paiement → pending_report", () => {
    expect(inferMentorStatus(false, undefined)).toBe("pending_report");
  });

  it("rapport présent, pas de paiement → to_pay", () => {
    expect(inferMentorStatus(true, undefined)).toBe("to_pay");
  });

  it("paiement existant → utilise le statut du paiement (priorité)", () => {
    expect(inferMentorStatus(true,  "paid")).toBe("paid");
    expect(inferMentorStatus(false, "to_pay")).toBe("to_pay");
    expect(inferMentorStatus(true,  "pending_report")).toBe("pending_report");
  });
});

// ─────────────────────────────────────────────────────────────────
// inferParentStatus
// ─────────────────────────────────────────────────────────────────

describe("inferParentStatus", () => {
  it("sans paiement → pending", () => {
    expect(inferParentStatus(undefined)).toBe("pending");
  });

  it("avec paiement → utilise le statut", () => {
    expect(inferParentStatus("paid")).toBe("paid");
    expect(inferParentStatus("unpaid")).toBe("unpaid");
  });
});

// ─────────────────────────────────────────────────────────────────
// validateParentPayment
// ─────────────────────────────────────────────────────────────────

describe("validateParentPayment", () => {
  it("unpaid sans commentaire → erreur", () => {
    const r = validateParentPayment("unpaid", undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/commentaire/i);
  });

  it("unpaid avec commentaire vide → erreur", () => {
    expect(validateParentPayment("unpaid", "  ").ok).toBe(false);
  });

  it("unpaid avec commentaire → ok", () => {
    expect(validateParentPayment("unpaid", "Client absent").ok).toBe(true);
  });

  it("paid sans commentaire → ok", () => {
    expect(validateParentPayment("paid", undefined).ok).toBe(true);
  });

  it("pending sans commentaire → ok", () => {
    expect(validateParentPayment("pending", undefined).ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// buildMonthOccurrences
// ─────────────────────────────────────────────────────────────────

const FUTURE = new Date("2099-01-01"); // "now" lointain pour inclure tout

describe("buildMonthOccurrences — session ponctuelle", () => {
  it("inclut une séance dans la période", () => {
    const session: RawSession = {
      id: "s1", teacher_id: "t1", title: "Maths",
      session_type: "once",
      scheduled_at: "2025-08-10T10:00:00Z",
      duration_min: 60,
    };
    const from = new Date("2025-08-01");
    const to   = new Date("2025-08-31T23:59:59Z");
    const occs = buildMonthOccurrences([session], from, to, FUTURE);
    expect(occs).toHaveLength(1);
    expect(occs[0].title).toBe("Maths");
  });

  it("exclut une séance hors période (avant)", () => {
    const session: RawSession = {
      id: "s1", teacher_id: "t1", title: "Maths",
      session_type: "once",
      scheduled_at: "2025-07-31T23:59:59Z",
      duration_min: 60,
    };
    const from = new Date("2025-08-01");
    const to   = new Date("2025-08-31T23:59:59Z");
    expect(buildMonthOccurrences([session], from, to, FUTURE)).toHaveLength(0);
  });

  it("exclut une séance dans le futur (≥ now)", () => {
    const session: RawSession = {
      id: "s1", teacher_id: "t1", title: "Maths",
      session_type: "once",
      scheduled_at: "2025-08-10T10:00:00Z",
      duration_min: 60,
    };
    const from = new Date("2025-08-01");
    const to   = new Date("2025-08-31T23:59:59Z");
    const now  = new Date("2025-08-09T00:00:00Z"); // avant la séance
    expect(buildMonthOccurrences([session], from, to, now)).toHaveLength(0);
  });
});

describe("buildMonthOccurrences — session récurrente", () => {
  // Lundi = 1
  it("génère les bonnes occurrences pour un lundi hebdo", () => {
    const session: RawSession = {
      id: "s2", teacher_id: "t1", title: "Anglais",
      session_type: "recurring",
      weekday: 1, // lundi
      start_time: "09:00:00",
      duration_min: 90,
    };
    // Août 2025 : lundis les 4, 11, 18, 25
    const from = new Date("2025-08-01T00:00:00Z");
    const to   = new Date("2025-08-31T23:59:59Z");
    const now  = FUTURE;
    const occs = buildMonthOccurrences([session], from, to, now);
    expect(occs).toHaveLength(4);
    expect(occs.map(o => o.at.getDate())).toEqual(expect.arrayContaining([4, 11, 18, 25]));
  });

  it("respecte active_until : exclut les occurrences après", () => {
    const session: RawSession = {
      id: "s3", teacher_id: "t1", title: "Code",
      session_type: "recurring",
      weekday: 3, // mercredi
      start_time: "14:00:00",
      duration_min: 60,
      active_until: "2025-08-13T00:00:00Z", // coupe après la 2e semaine
    };
    const from = new Date("2025-08-01T00:00:00Z");
    const to   = new Date("2025-08-31T23:59:59Z");
    // Mercredis août : 6, 13, 20, 27
    const occs = buildMonthOccurrences([session], from, to, FUTURE);
    // active_until = 13 août → les 6 et 13 inclus, 20 et 27 exclus
    expect(occs.length).toBeLessThanOrEqual(2);
    for (const o of occs) {
      expect(o.at <= new Date("2025-08-13T00:00:00Z")).toBe(true);
    }
  });

  it("respecte active_from : exclut les occurrences avant la date de début", () => {
    const session: RawSession = {
      id: "s5", teacher_id: "t1", title: "Maths",
      session_type: "recurring",
      weekday: 0, // dimanche
      start_time: "09:00:00",
      duration_min: 60,
      active_from: "2025-08-14", // commence le 14 août (un jeudi)
    };
    // Dimanches août : 3, 10, 17, 24, 31
    const from = new Date("2025-08-01T00:00:00Z");
    const to   = new Date("2025-08-31T23:59:59Z");
    const occs = buildMonthOccurrences([session], from, to, FUTURE);
    // Le 3 et le 10 sont avant active_from → exclus
    // Le 17, 24, 31 sont >= active_from → inclus
    for (const o of occs) {
      expect(o.at >= new Date("2025-08-14")).toBe(true);
    }
    expect(occs.length).toBe(3); // 17, 24, 31
  });

  it("retourne [] si session récurrente sans weekday", () => {
    const session: RawSession = {
      id: "s4", teacher_id: "t1", title: "Oops",
      session_type: "recurring",
      weekday: null,
      start_time: "10:00:00",
      duration_min: 60,
    };
    const from = new Date("2025-08-01");
    const to   = new Date("2025-08-31T23:59:59Z");
    expect(buildMonthOccurrences([session], from, to, FUTURE)).toHaveLength(0);
  });

  it("tri chronologique des occurrences multi-sessions", () => {
    const sessions: RawSession[] = [
      { id: "sA", teacher_id: "t1", title: "Z", session_type: "recurring", weekday: 5, start_time: "10:00:00", duration_min: 60 }, // vendredi
      { id: "sB", teacher_id: "t1", title: "A", session_type: "recurring", weekday: 1, start_time: "08:00:00", duration_min: 60 }, // lundi
    ];
    const from = new Date("2025-08-01T00:00:00Z");
    const to   = new Date("2025-08-10T23:59:59Z");
    const occs = buildMonthOccurrences(sessions, from, to, FUTURE);
    for (let i = 1; i < occs.length; i++) {
      expect(occs[i].at.getTime()).toBeGreaterThanOrEqual(occs[i - 1].at.getTime());
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// computeMentorTotals
// ─────────────────────────────────────────────────────────────────

describe("computeMentorTotals", () => {
  it("totalDue exclut pending_report, totalPaid = seulement paid", () => {
    const lines = [
      { status: "pending_report" as const, amount: 5000 },
      { status: "to_pay"         as const, amount: 6000 },
      { status: "paid"           as const, amount: 7000 },
    ];
    const { totalDue, totalPaid } = computeMentorTotals(lines);
    expect(totalDue).toBe(6000 + 7000);
    expect(totalPaid).toBe(7000);
  });

  it("lignes vides → zéros", () => {
    expect(computeMentorTotals([])).toEqual({ totalDue: 0, totalPaid: 0 });
  });

  it("tout pending_report → totalDue = 0", () => {
    const lines = [{ status: "pending_report" as const, amount: 9999 }];
    expect(computeMentorTotals(lines).totalDue).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// computeParentTotals
// ─────────────────────────────────────────────────────────────────

describe("computeParentTotals", () => {
  it("totalDue = somme de toutes les lignes, totalPaid = seulement paid", () => {
    const lines = [
      { status: "pending" as const, amount: 8000 },
      { status: "paid"    as const, amount: 10000 },
      { status: "unpaid"  as const, amount: 5000 },
    ];
    const { totalDue, totalPaid } = computeParentTotals(lines);
    expect(totalDue).toBe(23000);
    expect(totalPaid).toBe(10000);
  });

  it("lignes vides → zéros", () => {
    expect(computeParentTotals([])).toEqual({ totalDue: 0, totalPaid: 0 });
  });

  it("tout paid → totalDue = totalPaid", () => {
    const lines = [
      { status: "paid" as const, amount: 5000 },
      { status: "paid" as const, amount: 3000 },
    ];
    const { totalDue, totalPaid } = computeParentTotals(lines);
    expect(totalDue).toBe(totalPaid);
  });
});
