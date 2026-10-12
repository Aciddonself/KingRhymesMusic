import { Suspense } from "react";
import CheckoutReturnClient from "./checkout-return-client";

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 pt-20 text-center text-sm text-white/55">Loading payment status…</div>}>
      <CheckoutReturnClient />
    </Suspense>
  );
}