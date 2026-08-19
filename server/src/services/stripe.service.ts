export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export const createPaymentIntent = async (req: PaymentIntentRequest) => {
  // Mocking Stripe SDK integration
  console.log(`[Stripe] Creating Payment Intent for ${req.amount} ${req.currency || 'USD'}`);
  
  return {
    id: `pi_${Math.random().toString(36).substring(2, 15)}`,
    clientSecret: `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`,
    amount: req.amount,
    currency: req.currency || 'usd',
    status: 'requires_payment_method',
  };
};

export const validateWebhook = (payload: any, signature: string) => {
  // Mocking Stripe Webhook validation
  if (!signature) {
    throw new Error('Invalid Stripe signature');
  }
  return payload;
};
