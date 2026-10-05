# Razorpay Payment Gateway & MCP Integration — 9bhk

This document details the live Razorpay payment gateway integration and MCP server connection configured for **9bhk**.

---

## 1. Razorpay MCP Server Connection

The official Razorpay MCP Server (`https://github.com/razorpay/razorpay-mcp-server`) has been connected to your IDE environment.

### Global IDE Config (`~/.gemini/config/mcp_config.json`)
The Razorpay remote MCP server endpoint (`https://mcp.razorpay.com/mcp`) is registered with Basic HTTP Authentication:

```json
{
  "mcpServers": {
    "razorpay": {
      "serverUrl": "https://mcp.razorpay.com/mcp",
      "headers": {
        "Authorization": "Basic cnpwX2xpdmVfVGtPMnFzdFNxb1A2UHQ6anMwUTlZaUZYYk4wUFNGZGxQVDRUN0Rp"
      }
    }
  }
}
```

### Cursor Setup (`~/.cursor/mcp.json`)
If you also use Cursor, you can add this block under `"mcpServers"` in `~/.cursor/mcp.json`:

```json
"razorpay": {
  "type": "http",
  "url": "https://mcp.razorpay.com/mcp",
  "headers": {
    "Authorization": "Basic cnpwX2xpdmVfVGtPMnFzdFNxb1A2UHQ6anMwUTlZaUZYYk4wUFNGZGxQVDRUN0Rp"
  }
}
```

### Verified Tools Available via MCP (42 tools):
- `create_order`, `fetch_order`, `fetch_all_orders`, `update_order`
- `capture_payment`, `fetch_payment`, `fetch_all_payments`
- `create_payment_link`, `fetch_payment_link`, `send_payment_link`
- `create_refund`, `fetch_refund`, `fetch_all_refunds`
- `create_qr_code`, `fetch_qr_code`, `fetch_all_qr_codes`
- `fetch_all_settlements`, `fetch_settlement_with_id`
- `integrate_razorpay_checkout`

---

## 2. Environment Variables (`.env.local`)

Your live Razorpay API credentials are saved in `.env.local` (which is tracked in `.gitignore` to prevent credential leaks):

```env
# Razorpay Configuration (9bhk Live)
RAZORPAY_KEY_ID=rzp_live_TkO2qstSqoP6Pt
RAZORPAY_KEY_SECRET=js0Q9YiFXbN0PSFdlPT4T7Di
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_TkO2qstSqoP6Pt

# Split Pay Token Secret
SPLIT_TOKEN_SECRET=sk_split_78153e632e4049d88f2fbe24ad15312e9bhk
```

---

## 3. Implemented Routes & Components

### Backend Routes
1. **`POST /api/razorpay/order`** ([app/api/razorpay/order/route.ts](file:///c:/Users/rathn/OneDrive/Pictures/9bhk.app/app/api/razorpay/order/route.ts))
   - Creates authenticated Razorpay orders in paise.
   - Attaches booking metadata and notes.
2. **`POST /api/razorpay/verify`** ([app/api/razorpay/verify/route.ts](file:///c:/Users/rathn/OneDrive/Pictures/9bhk.app/app/api/razorpay/verify/route.ts))
   - Performs cryptographic HMAC-SHA256 signature verification with `crypto.timingSafeEqual`.
3. **`POST /api/payments/webhook`** ([app/api/payments/webhook/route.ts](file:///c:/Users/rathn/OneDrive/Pictures/9bhk.app/app/api/payments/webhook/route.ts))
   - Handles `payment.captured` webhooks from Razorpay to settle both full stays and split shares.
4. **`POST /api/split/pay`** ([app/api/split/pay/route.ts](file:///c:/Users/rathn/OneDrive/Pictures/9bhk.app/app/api/split/pay/route.ts))
   - Creates orders for split group payments.

### Frontend Checkout
- **`RazorpayCheckout`** ([components/RazorpayCheckout.tsx](file:///c:/Users/rathn/OneDrive/Pictures/9bhk.app/components/RazorpayCheckout.tsx))
  - Embeds standard Razorpay checkout modal with 9bhk forest brand styling (`#18352B`).
  - Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Netbanking, and PayLater.
- **Booking Flow Integration** ([app/book/[slug]/page.tsx](file:///c:/Users/rathn/OneDrive/Pictures/9bhk.app/app/book/%5Bslug%5D/page.tsx))
  - Step 3 now features live payment through Razorpay with manual UPI fallback.
  - Step 4 displays verified status and payment reference upon successful completion.

---

## 4. Webhook Configuration (Razorpay Dashboard)

To ensure bookings are updated even if the user closes their browser before redirection:
1. Go to **Razorpay Dashboard → Settings → Webhooks**.
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Secret: Set a secret (and add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET=your_secret`).
4. Select active events:
   - `payment.captured`
   - `order.paid`
