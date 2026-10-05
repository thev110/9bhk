"use client";

import { useEffect, useState } from "react";

export interface RazorpayPaymentSuccess {
  paymentId: string;
  orderId: string;
  signature: string;
}

interface RazorpayCheckoutProps {
  amount: number; // In rupees
  propertyName?: string;
  bookingCode?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  onSuccess?: (result: RazorpayPaymentSuccess) => void;
  onError?: (error: Error) => void;
  onDismiss?: () => void;
  onBeforeCheckout?: () => boolean | Promise<boolean>;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function RazorpayCheckout({
  amount,
  propertyName = "9bhk Stay",
  bookingCode,
  guestName = "",
  guestEmail = "",
  guestPhone = "",
  onSuccess,
  onError,
  onDismiss,
  onBeforeCheckout,
  buttonText = "Pay with Razorpay",
  className = "btn accent block",
  disabled = false,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout SDK");
    };
    document.body.appendChild(script);
  }, []);

  const handleCheckout = async () => {
    if (loading || disabled) return;
    if (onBeforeCheckout) {
      const allowed = await onBeforeCheckout();
      if (!allowed) return;
    }
    setLoading(true);

    try {
      // 1. Create Order via server route
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          receipt: bookingCode || `9bhk_${Date.now()}`,
          notes: {
            propertyName,
            bookingCode: bookingCode || "",
            guestName,
            guestEmail,
            guestPhone,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initialize payment order");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK is not ready yet. Please try again in a moment.");
      }

      // 2. Configure Razorpay Standard Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "9bhk",
        description: `${propertyName} Reservation`,
        order_id: orderData.orderId,
        prefill: {
          name: guestName || undefined,
          email: guestEmail || undefined,
          contact: guestPhone || undefined,
        },
        theme: {
          color: "#18352B", // 9bhk forest green brand token
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onDismiss?.();
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 3. Server-side HMAC SHA-256 signature verification
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment signature verification failed");
            }

            setLoading(false);
            onSuccess?.({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          } catch (verifyError: unknown) {
            setLoading(false);
            const err =
              verifyError instanceof Error
                ? verifyError
                : new Error("Payment verification failed");
            onError?.(err);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on?.("payment.failed", (failureResponse: unknown) => {
        setLoading(false);
        const errorDetail =
          (failureResponse as { error?: { description?: string } })?.error?.description ||
          "Payment processing failed";
        onError?.(new Error(errorDetail));
      });

      rzp.open();
    } catch (err: unknown) {
      setLoading(false);
      const errorObj = err instanceof Error ? err : new Error("Checkout failed to start");
      onError?.(errorObj);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || loading || !scriptReady}
      onClick={handleCheckout}
    >
      {loading ? "Opening Secure Payment…" : buttonText}
    </button>
  );
}
