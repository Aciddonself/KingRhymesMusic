type FlutterwaveResponse<T> = {
  status?: string;
  message?: string;
  data?: T;
};

export type FlutterwaveTransaction = {
  id: number | string;
  tx_ref: string;
  status: string;
  amount: number | string;
  currency: string;
  customer?: { email?: string };
};

export async function createFlutterwaveCheckout(input: {
  reference: string;
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  redirectUrl: string;
  description: string;
}) {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) throw new Error("FLW_SECRET_KEY is not configured");

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.reference,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.redirectUrl,
      payment_options: "card,mobilemoneyuganda",
      customer: {
        email: input.email,
        ...(input.phone ? { phonenumber: input.phone } : {}),
      },
      customizations: {
        title: "King Rhymes Music",
        description: input.description,
      },
    }),
  });

  const result = (await response.json()) as FlutterwaveResponse<{ link?: string }>;
  if (!response.ok || result.status !== "success" || !result.data?.link) {
    throw new Error(result.message || "Flutterwave could not start checkout");
  }

  return result.data.link;
}

export async function verifyFlutterwaveTransaction(transactionId: string, expected: {
  reference: string;
  amount: number;
  currency: string;
  email?: string | null;
}) {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) throw new Error("FLW_SECRET_KEY is not configured");
  if (!transactionId) throw new Error("Flutterwave transaction ID is required");

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });
  const result = (await response.json()) as FlutterwaveResponse<FlutterwaveTransaction>;
  const transaction = result.data;
  if (!response.ok || result.status !== "success" || !transaction) {
    throw new Error(result.message || "Flutterwave transaction verification failed");
  }

  const paidAmount = Number(transaction.amount);
  const expectedEmail = expected.email?.trim().toLowerCase();
  const customerEmail = transaction.customer?.email?.trim().toLowerCase();
  if (
    transaction.status.toLowerCase() !== "successful" ||
    transaction.tx_ref !== expected.reference ||
    transaction.currency.toUpperCase() !== expected.currency.toUpperCase() ||
    !Number.isFinite(paidAmount) ||
    Math.abs(paidAmount - expected.amount) > 0.01 ||
    (expectedEmail && customerEmail && customerEmail !== expectedEmail)
  ) {
    throw new Error("Flutterwave payment details do not match this order");
  }

  return transaction;
}