import { nanoid } from "nanoid";
import type {
  CartItem,
  CheckoutSession,
  Participant,
  Payment,
  PaymentMethod,
  PaymentStatus
} from "../domain/types.js";

const now = () => new Date().toISOString();
const round2 = (value: number) => Math.round(value * 100) / 100;

const avatars = ["👩", "👨", "🧑", "👱", "🧔", "👩‍💼", "👨‍💼", "🧑‍🎤"];

const cartTemplates: Array<{
  title: string;
  merchantName: string;
  items: Array<{ name: string; category: string; quantity: number; unitPrice: number }>;
}> = [
  {
    title: "Akşam Yemeği Siparişi",
    merchantName: "SplitCart Demo Restaurant",
    items: [
      { name: "Pizza Margherita", category: "Yemek", quantity: 2, unitPrice: 360 },
      { name: "Burger Menü", category: "Yemek", quantity: 1, unitPrice: 390 },
      { name: "Limonata", category: "İçecek", quantity: 3, unitPrice: 90 },
      { name: "Tiramisu", category: "Tatlı", quantity: 1, unitPrice: 220 }
    ]
  },
  {
    title: "Market Alışverişi",
    merchantName: "SplitCart Market",
    items: [
      { name: "Kahvaltılık Paket", category: "Market", quantity: 1, unitPrice: 480 },
      { name: "Meyve Sepeti", category: "Market", quantity: 1, unitPrice: 260 },
      { name: "İçecek Paketi", category: "Market", quantity: 2, unitPrice: 150 },
      { name: "Atıştırmalık", category: "Market", quantity: 2, unitPrice: 95 }
    ]
  },
  {
    title: "Etkinlik Bileti",
    merchantName: "SplitCart Events",
    items: [
      { name: "Konser Bileti", category: "Etkinlik", quantity: 4, unitPrice: 450 },
      { name: "Servis Ücreti", category: "Hizmet", quantity: 1, unitPrice: 120 }
    ]
  },
  {
    title: "Ofis Öğle Yemeği",
    merchantName: "SplitCart Office Lunch",
    items: [
      { name: "Tavuk Bowl", category: "Yemek", quantity: 3, unitPrice: 280 },
      { name: "Vegan Bowl", category: "Yemek", quantity: 1, unitPrice: 300 },
      { name: "Ayran", category: "İçecek", quantity: 4, unitPrice: 50 },
      { name: "Cookie", category: "Tatlı", quantity: 4, unitPrice: 65 }
    ]
  },
  {
    title: "Alışveriş Sitesi Sepeti",
    merchantName: "SplitCart E-Commerce Demo",
    items: [
      { name: "Kablosuz Kulaklık", category: "Elektronik", quantity: 1, unitPrice: 1250 },
      { name: "Telefon Kılıfı", category: "Aksesuar", quantity: 2, unitPrice: 220 },
      { name: "Hızlı Kargo", category: "Kargo", quantity: 1, unitPrice: 95 },
      { name: "Ekran Koruyucu", category: "Aksesuar", quantity: 2, unitPrice: 150 }
    ]
  }
];

const sessions: CheckoutSession[] = [];
const participants: Participant[] = [];
const payments: Payment[] = [];

function getPeople(sessionId: string) {
  return participants.filter((p) => p.sessionId === sessionId);
}

function toItems(raw: Array<{ name: string; category: string; quantity: number; unitPrice: number }>): CartItem[] {
  return raw.map((item) => ({
    id: `item_${nanoid(8)}`,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.quantity * item.unitPrice
  }));
}

function recalcParticipant(participantId: string) {
  const participant = participants.find((p) => p.id === participantId);
  if (!participant) return undefined;

  const captured = payments.filter((p) => p.participantId === participantId && p.status === "CAPTURED");
  participant.paidAmount = round2(captured.reduce((sum, p) => sum + p.amount, 0));
  participant.tipAmount = round2(captured.reduce((sum, p) => sum + p.tipAmount, 0));
  participant.remainingAmount = round2(Math.max(0, participant.shareAmount - participant.paidAmount));
  participant.status = participant.remainingAmount <= 0 ? "PAID" : participant.paidAmount > 0 ? "PAYING" : "PENDING";
  participant.updatedAt = now();

  return participant;
}

function recalcSession(sessionId: string) {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return undefined;

  getPeople(sessionId).forEach((p) => recalcParticipant(p.id));

  const captured = payments.filter((p) => p.sessionId === sessionId && p.status === "CAPTURED");
  session.paidTotal = round2(captured.reduce((sum, p) => sum + p.amount, 0));
  session.tipTotal = round2(captured.reduce((sum, p) => sum + p.tipAmount, 0));
  session.remainingTotal = round2(Math.max(0, session.total - session.paidTotal));

  const people = getPeople(sessionId);
  const everybodyPaid = people.length > 0 && people.every((p) => p.status === "PAID");
  session.status = everybodyPaid || session.remainingTotal <= 0 ? "PAID" : session.paidTotal > 0 ? "PARTIALLY_PAID" : "OPEN";
  session.updatedAt = now();

  return session;
}

function distributeEqual(sessionId: string) {
  const session = sessions.find((s) => s.id === sessionId);
  const people = getPeople(sessionId);
  if (!session || people.length === 0) return;

  const lockedPaidPeople = people.filter((p) => p.paidAmount > 0);
  if (lockedPaidPeople.length > 0) {
    const unpaid = people.filter((p) => p.paidAmount <= 0);
    const alreadyAllocated = round2(lockedPaidPeople.reduce((sum, p) => sum + p.shareAmount, 0));
    const remainingForUnpaid = round2(Math.max(0, session.total - alreadyAllocated));
    const baseShareForUnpaid = unpaid.length > 0 ? Math.floor((remainingForUnpaid / unpaid.length) * 100) / 100 : 0;
    let unpaidAllocated = 0;

    unpaid.forEach((p, index) => {
      const isLast = index === unpaid.length - 1;
      const share = isLast ? round2(remainingForUnpaid - unpaidAllocated) : baseShareForUnpaid;
      unpaidAllocated = round2(unpaidAllocated + share);
      p.shareAmount = share;
      recalcParticipant(p.id);
    });

    recalcSession(sessionId);
    return;
  }

  const baseShare = Math.floor((session.total / people.length) * 100) / 100;
  let allocated = 0;

  people.forEach((p, index) => {
    const isLast = index === people.length - 1;
    const share = isLast ? round2(session.total - allocated) : baseShare;
    allocated = round2(allocated + share);
    p.shareAmount = share;
    recalcParticipant(p.id);
  });

  recalcSession(sessionId);
}

function createSessionFromTemplate(templateIndex?: number, participantNames?: string[]) {
  const picked = cartTemplates[
    typeof templateIndex === "number" ? templateIndex % cartTemplates.length : Math.floor(Math.random() * cartTemplates.length)
  ];

  const items = toItems(picked.items);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const serviceFee = round2(subtotal * 0.04);
  const total = round2(subtotal + serviceFee);

  const session: CheckoutSession = {
    id: `sc_${nanoid(10)}`,
    title: picked.title,
    merchantName: picked.merchantName,
    cartItems: items,
    subtotal,
    serviceFee,
    total,
    paidTotal: 0,
    tipTotal: 0,
    remainingTotal: total,
    currency: "TRY",
    status: "OPEN",
    createdAt: now(),
    updatedAt: now()
  };

  sessions.unshift(session);

  const names = participantNames?.length ? participantNames : ["Ali", "Buse", "Can", "Deniz"];
  names.forEach((name, index) => {
    participants.push({
      id: `pt_${nanoid(10)}`,
      sessionId: session.id,
      name,
      avatar: avatars[index % avatars.length],
      shareAmount: 0,
      paidAmount: 0,
      tipAmount: 0,
      remainingAmount: 0,
      status: "PENDING",
      createdAt: now(),
      updatedAt: now()
    });
  });

  distributeEqual(session.id);
  return session;
}

createSessionFromTemplate(0, ["Ali", "Buse", "Can", "Deniz"]);

export const db = {
  sessions,
  participants,
  payments,

  createDemoSession(input?: { templateIndex?: number; participantNames?: string[] }) {
    return createSessionFromTemplate(input?.templateIndex, input?.participantNames);
  },

  resetDemo() {
    payments.splice(0, payments.length);
    participants.splice(0, participants.length);
    sessions.splice(0, sessions.length);
    return createSessionFromTemplate(0, ["Ali", "Buse", "Can", "Deniz"]);
  },

  listSessions() {
    return sessions;
  },

  getSession(sessionId: string) {
    return sessions.find((s) => s.id === sessionId);
  },

  getSessionFull(sessionId: string) {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    recalcSession(sessionId);

    return {
      session,
      participants: getPeople(sessionId),
      payments: payments.filter((p) => p.sessionId === sessionId)
    };
  },

  addParticipant(sessionId: string, name: string) {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    const people = getPeople(sessionId);
    const participant: Participant = {
      id: `pt_${nanoid(10)}`,
      sessionId,
      name,
      avatar: avatars[people.length % avatars.length],
      shareAmount: 0,
      paidAmount: 0,
      tipAmount: 0,
      remainingAmount: 0,
      status: "PENDING",
      createdAt: now(),
      updatedAt: now()
    };

    participants.push(participant);
    distributeEqual(sessionId);
    return participant;
  },

  getParticipant(participantId: string) {
    return participants.find((p) => p.id === participantId);
  },

  listPaymentsBySession(sessionId: string) {
    return payments.filter((p) => p.sessionId === sessionId);
  },

  getParticipantPayableAmount(sessionId: string, participantId: string) {
    const session = this.getSession(sessionId);
    const participant = this.getParticipant(participantId);
    if (!session || !participant || participant.sessionId !== sessionId) return 0;
    recalcSession(sessionId);
    return round2(Math.max(0, Math.min(participant.remainingAmount, session.remainingTotal)));
  },

  createPayment(input: {
    sessionId: string;
    participantId: string;
    method: PaymentMethod;
    provider: string;
    amount: number;
    tipAmount: number;
    status: PaymentStatus;
    providerReference?: string;
    qrPayload?: string;
    note?: string;
  }) {
    const payment: Payment = {
      ...input,
      id: `pay_${nanoid(12)}`,
      createdAt: now(),
      updatedAt: now()
    };

    payments.unshift(payment);
    return payment;
  },

  updatePayment(paymentId: string, patch: Partial<Payment>) {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return undefined;

    Object.assign(payment, patch, { updatedAt: now() });
    recalcParticipant(payment.participantId);
    recalcSession(payment.sessionId);

    return payment;
  },

  recalcParticipant,
  recalcSession
};
