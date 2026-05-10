import { z } from "zod";
import { db } from "../data/store.js";
import type { PaymentMethod } from "../domain/types.js";
import { mockBankQrProvider } from "../providers/bankQrProvider.mock.js";
import { mockCardProvider } from "../providers/cardProvider.mock.js";

export const createPaymentSchema = z.object({
  method: z.enum(["CARD", "BANK_QR", "CASH"]),
  amount: z.number().positive(),
  tipAmount: z.number().min(0).default(0),
  note: z.string().optional()
});

const round2 = (value: number) => Math.round(value * 100) / 100;

const getProviderName = (method: PaymentMethod) => {
  if (method === "CARD") return mockCardProvider.name;
  if (method === "BANK_QR") return mockBankQrProvider.name;
  return "cash_manual";
};

export async function createParticipantPayment(sessionId: string, participantId: string, raw: unknown) {
  const input = createPaymentSchema.parse(raw);
  const session = db.getSession(sessionId);
  const participant = db.getParticipant(participantId);

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (!participant || participant.sessionId !== sessionId) throw new Error("PARTICIPANT_NOT_FOUND");
  const payableAmount = db.getParticipantPayableAmount(sessionId, participantId);

  if (payableAmount <= 0) {
    throw new Error("PARTICIPANT_OR_SESSION_ALREADY_PAID");
  }

  if (input.amount > payableAmount) {
    throw new Error("PAYMENT_AMOUNT_EXCEEDS_ALLOWED_REMAINING_TOTAL");
  }

  const amount = round2(input.amount);
  const tipAmount = round2(input.tipAmount);
  const initialStatus = input.method === "CASH" ? "CAPTURED" : "INITIATED";

  const payment = db.createPayment({
    sessionId,
    participantId,
    method: input.method,
    provider: getProviderName(input.method),
    amount,
    tipAmount,
    status: initialStatus,
    note: input.note
  });

  if (input.method === "CASH") {
    db.recalcParticipant(participantId);
    db.recalcSession(sessionId);
    return {
      payment,
      providerPayload: null,
      full: db.getSessionFull(sessionId)
    };
  }

  const provider = input.method === "CARD" ? mockCardProvider : mockBankQrProvider;
  const providerPayload = await provider.initPayment({
    paymentId: payment.id,
    sessionId,
    participantId,
    amount,
    tipAmount,
    currency: "TRY"
  });

  db.updatePayment(payment.id, {
    providerReference: providerPayload.providerReference,
    qrPayload: providerPayload.qrPayload,
    status: providerPayload.status
  });

  return {
    payment: db.updatePayment(payment.id, {})!,
    providerPayload,
    full: db.getSessionFull(sessionId)
  };
}

export function capturePayment(paymentId: string) {
  const payment = db.updatePayment(paymentId, { status: "CAPTURED" });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  return {
    payment,
    full: db.getSessionFull(payment.sessionId)
  };
}

export function failPayment(paymentId: string) {
  const payment = db.updatePayment(paymentId, { status: "FAILED" });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  return {
    payment,
    full: db.getSessionFull(payment.sessionId)
  };
}
