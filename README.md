# Golf Charity Subscription Platform

A complete Next.js full-stack project for the PRD:
- subscription-based access
- score entry with last-5 retention
- charity selection and contributions
- monthly draw simulation/publish flow
- winner verification
- admin dashboard
- winner proof upload
- email notification logging / sending

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Demo accounts

Admin:
- `admin@demo.com`
- password: `admin123`

User:
- `user@demo.com`
- password: `user123`

You can also register a new subscriber from the login page.

## Environment variables

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SESSION_SECRET=some-long-random-string
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Digital Heroes <onboarding@resend.dev>
```

## Notes
- The app stores state in a Supabase `app_state` table when Supabase env vars are provided.
- Without Supabase env vars, it falls back to local JSON files for development.
- Winner proof uploads are stored in the app state data.
- Email notifications are logged locally and sent through Resend when configured.
- The PRD's draw logic is implemented as a 5-number set comparison against each user's latest 5 scores.
- Prize allocation follows the PRD split: 40% / 35% / 25%.
