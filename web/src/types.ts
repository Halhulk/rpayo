export type PaymentMethod = "CARD" | "BANK_QR" | "CASH";
export type PaymentStatus =
  | "INITIATED"
  | "AWAITING_CONFIRMATION"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type SessionStatus = "OPEN" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
export type ParticipantStatus = "PENDING" | "PAYING" | "PAID";

export type CartItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Participant = {
  id: string;
  sessionId: string;
  name: string;
  avatar: string;
  shareAmount: number;
  paidAmount: number;
  tipAmount: number;
  remainingAmount: number;
  status: ParticipantStatus;
  createdAt: string;
  updatedAt: string;
};

export type CheckoutSession = {
  id: string;
  title: string;
  merchantName: string;
  cartItems: CartItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  paidTotal: number;
  tipTotal: number;
  remainingTotal: number;
  currency: "TRY";
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

export type SessionFull = {
  session: CheckoutSession;
  participants: Participant[];
  payments: Payment[];
};
