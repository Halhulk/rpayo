import type { Payment, PaymentMethod, SessionFull } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

export async function apiCreateDemoSession(input?: {
  templateIndex?: number;
  participantNames?: string[];
}): Promise<{ full: SessionFull; hostUrl: string }> {
  const res = await fetch(`${API_BASE}/sessions/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {})
  });

  if (!res.ok) throw new Error("Demo session oluşturulamadı");
  return res.json();
}

export async function apiResetDemo(): Promise<{ full: SessionFull; hostUrl: string }> {
  const res = await fetch(`${API_BASE}/sessions/reset-demo`, { method: "POST" });
  if (!res.ok) throw new Error("Demo sıfırlanamadı");
  return res.json();
}

export async function apiGetSession(sessionId: string): Promise<SessionFull> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Session alınamadı");
  return res.json();
}

export async function apiAddParticipant(sessionId: string, name: string): Promise<{ full: SessionFull }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  if (!res.ok) throw new Error("Katılımcı eklenemedi");
  return res.json();
}

export async function apiCreatePayment(input: {
  sessionId: string;
  participantId: string;
  method: PaymentMethod;
  amount: number;
  tipAmount: number;
  note?: string;
}): Promise<{
  payment: Payment;
  providerPayload: null | { redirectUrl?: string; qrPayload?: string; status: string; providerReference: string };
  full: SessionFull;
}> {
  const res = await fetch(`${API_BASE}/payments/sessions/${input.sessionId}/participants/${input.participantId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: input.method,
      amount: input.amount,
      tipAmount: input.tipAmount,
      note: input.note
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Ödeme başlatılamadı");
  }

  return res.json();
}

export async function apiCapturePayment(paymentId: string): Promise<{ payment: Payment; full: SessionFull }> {
  const res = await fetch(`${API_BASE}/payments/${paymentId}/capture`, { method: "POST" });
  if (!res.ok) throw new Error("Ödeme onaylanamadı");
  return res.json();
}
