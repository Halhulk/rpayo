export type ProviderInitResult = {
  providerReference: string;
  redirectUrl?: string;
  qrPayload?: string;
  status: "INITIATED" | "AWAITING_CONFIRMATION" | "CAPTURED";
};

export interface PaymentProvider {
  name: string;
  initPayment(input: {
    paymentId: string;
    sessionId: string;
    participantId: string;
    amount: number;
    tipAmount: number;
    currency: "TRY";
  }): Promise<ProviderInitResult>;
}
