# Recommended implementation order

1. Bootstrap
2. Design system
3. Supabase schema/auth/RLS
4. Onboarding/auth
5. Home/discovery
6. Search/filter
7. Property detail
8. Booking
9. Trips/saved/profile
10. Host dashboard
11. Host listing wizard
12. Host photos/pricing/availability
13. Host bookings/earnings
14. Admin
15. Realtime/notifications
16. SEO/performance/accessibility
17. Seed content
18. Polish/testing
19. Vercel deployment

Do not implement every screen in one giant prompt. Keep commits/task boundaries small so regressions are easy to isolate.
