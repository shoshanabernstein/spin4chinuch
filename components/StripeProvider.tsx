"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function StripeProvider({
  children,
  clientSecret,
}: {
  children: React.ReactNode;
  clientSecret: string;
}) {

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#142A52",
            borderRadius: "12px",
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}