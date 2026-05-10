import type { PaymentProvider } from "./paymentProvider.js";

export const mockCardProvider: PaymentProvider = {
  name: "mock_card_gateway",
  async initPayment(input) {
    return {
      providerReference: `card_ref_${input.paymentId}`,
      redirectUrl: `/mock-provider/card/success?paymentId=${input.paymentId}`,
      status: "INITIATED"
    };
  }
};
