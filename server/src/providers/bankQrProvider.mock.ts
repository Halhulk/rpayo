import type { PaymentProvider } from "./paymentProvider.js";

export const mockBankQrProvider: PaymentProvider = {
  name: "mock_bank_qr",
  async initPayment(input) {
    return {
      providerReference: `bankqr_ref_${input.paymentId}`,
      qrPayload: `SPLITCART_TRQR|SESSION=${input.sessionId}|PARTICIPANT=${input.participantId}|AMOUNT=${input.amount}|TIP=${input.tipAmount}|CCY=TRY`,
      status: "AWAITING_CONFIRMATION"
    };
  }
};
