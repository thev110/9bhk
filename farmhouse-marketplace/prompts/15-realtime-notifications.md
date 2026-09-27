# Prompt 15 — Realtime and Notifications

Add Supabase Realtime only where it meaningfully improves UX.

## Realtime events
- availability changed
- booking created
- booking status changed
- notification created
- host property status changed

## Notifications
Create an in-app notifications system with:
- unread count
- read/unread state
- timestamp
- deep link to relevant trip/booking/property

Use database notifications as source of truth.
Use Realtime to push updates to connected clients.
Do not create a custom websocket server.
Do not build offline-first sync in this phase.

Stop after this task.
