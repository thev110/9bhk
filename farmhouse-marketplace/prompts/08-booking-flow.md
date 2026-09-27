# Prompt 08 — Availability and Booking Flow

Build the booking funnel.

## Screens
- availability calendar
- guest selector
- booking summary
- guest details
- payment
- processing
- confirmation

## Booking summary copy
`Your stay`
`2 nights`
`2 guests`

Line items:
Nightly stay
Cleaning fee
Taxes
Discount
Total

CTA: `Continue to payment`

Payment screen:
`Secure your stay`
CTA: `Pay ₹X`

Confirmation:
`Booking confirmed`
`Your farmhouse escape is booked.`
CTA: `View trip`

## Rules
- Prevent overlapping confirmed bookings.
- Validate dates server-side.
- Never trust client-calculated totals.
- Use a transaction/server action/secure backend path for booking creation.
- Keep payment provider behind an abstraction.
- Build payment UI with a mock/dev adapter if the provider is not connected yet.

Stop after this task.
