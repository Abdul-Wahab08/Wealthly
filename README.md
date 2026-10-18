# Wealthly

**Wealthly** is an AI-powered personal finance app built with Expo and React Native. Track income and expenses, manage accounts and budgets, scan receipts, log spending by voice, and ask a spending assistant about the last 30 days of activity.

Repo: [github.com/Abdul-Wahab08/Wealthly](https://github.com/Abdul-Wahab08/Wealthly)

---

## Features

### Authentication and onboarding
- Email and password **sign up** and **sign in** with [Clerk](https://clerk.com)
- Email verification and MFA email code when Clerk requires extra trust
- First-time users are synced into Supabase (`users` + default cash account)
- **Onboarding** for preferred currency and starting balance

### Home dashboard
- Time-of-day greeting and profile avatar
- Combined balance across accounts
- Current-month income and expense totals
- Pull to refresh
- Quick actions: **AI receipt scan**, **voice entry**, or **manual add**
- Monthly **budget** progress (create or edit from the dashboard)
- **Pie chart** of this month’s spending by category
- Latest five transactions

### Transactions
- Full history with search (description or category)
- Filters: All / Income / Expense, plus by account
- Daily income vs expense **bar chart** for the current month
- Delete a transaction
- **CSV export** via the system share sheet

### Add transaction
- Expense or income with Zod-validated forms (React Hook Form)
- Categories, account, date, amount, and description
- **Receipt scan**: camera capture or photo library → Gemini extracts type, amount, category, date, and description
- **Voice entry**: record audio → Gemini fills the same fields (transcript stored when input method is voice)

### AI assistant
- Chat about spending and budgets using the last 30 days of data
- Suggested prompts (food spend, biggest expense, over-budget)
- Answers from Google Gemini with your transactions and monthly budget as context

### Profile
- Name and email from Clerk
- Profile photo from the device library
- Preferred **currency**
- Manage accounts: cash, bank, credit card, savings (create, edit, balances)
- Sign out

### Email jobs (Supabase Edge Functions)
- **Budget alerts**: emailed via Resend when monthly spend hits **80%** or **100%** of the budget
- **Weekly tips**: Gemini-generated, category-aware tips from the last 7 days of activity

### Categories

**Expenses:** Food & Dining, Groceries, Transport, Shopping, Entertainment, Health, Utilities, Rent, Education, Travel, Insurance, Subscriptions, EMI / Loan, Personal Care, Other

**Income:** Salary, Freelance, Business, Investment, Gift, Other Income

---

## Screens

| Route | Purpose |
| --- | --- |
| `/(auth)/sign-in` | Sign in |
| `/(auth)/sign-up` | Create account |
| `/(root)/onboarding` | Currency + starting balance |
| `/(root)/(tabs)/` | Home dashboard |
| `/(root)/(tabs)/transactions` | History, charts, export |
| `/(root)/(tabs)/addTransaction` | Manual / scan / voice |
| `/(root)/(tabs)/assistant` | Spending chat |
| `/(root)/(tabs)/profile` | Settings and accounts |

iOS uses native tabs; Android uses a custom tab bar.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | [Expo](https://docs.expo.dev/versions/v54.0.0/) SDK **54**, React Native **0.81**, React **19** |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes) |
| Auth | [Clerk](https://clerk.com) (`@clerk/expo`) with secure token cache |
| Backend / DB | [Supabase](https://supabase.com) (Postgres + JS client + Edge Functions) |
| Server state | [TanStack Query](https://tanstack.com/query) |
| Client state | [Zustand](https://github.com/pmndrs/zustand) |
| Forms / validation | React Hook Form + Zod |
| Styling | [NativeWind](https://www.nativewind.dev/) (Tailwind CSS) |
| Charts | `react-native-gifted-charts` |
| AI | Google Gemini (`gemini-3.1-flash-lite`) |
| Email | [Resend](https://resend.com) (Edge Functions) |
| Device | Camera, image picker, audio recording, file system, sharing, haptics, blur, linear gradient |
| Language | TypeScript |

Expo **New Architecture** and React Compiler experiments are enabled in `app.json`.

---

## Project structure

```
app/                    # Expo Router screens
  (auth)/               # Sign in / sign up
  (root)/               # Authenticated app + onboarding
    (tabs)/             # Home, transactions, add, assistant, profile
components/             # UI: modals, rows, pickers, charts helpers
constants/              # Theme and categories
hooks/                  # Queries, mutations, Clerk-aware Supabase, user sync
lib/
  query/                # Query client and keys
  schemas/              # Zod schemas
  services/             # API + Gemini (transactions, budgets, assistant, extract)
store/                  # Zustand user store (currency, onboarding)
types/                  # Account, budget, transaction types
supabase/functions/     # budgetAlerts, weeklyTips
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm (ships with Node)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) on a phone, or an iOS Simulator / Android Emulator
- Accounts:
  - [Clerk](https://dashboard.clerk.com)
  - [Supabase](https://supabase.com/dashboard)
  - [Google AI Studio](https://aistudio.google.com/) (Gemini API key)
  - [Resend](https://resend.com) (only if you deploy the email functions)

---

## Clone the repository

HTTPS:

```bash
git clone https://github.com/Abdul-Wahab08/Wealthly.git
cd Wealthly
```

SSH:

```bash
git clone git@github.com:Abdul-Wahab08/Wealthly.git
cd Wealthly
```

GitHub CLI:

```bash
gh repo clone Abdul-Wahab08/Wealthly
cd Wealthly
```

---

## Install and configure

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root (this file is gitignored):

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

| Variable | Where to get it |
| --- | --- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API keys |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase anon (public) key |
| `EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY` | Google AI Studio |

The app talks to Supabase with a Clerk session token (`createClerkSupabaseClient`). In Clerk, enable the Supabase integration / JWT template so `getToken()` is accepted by your project’s RLS policies.

### 3. Backend (Supabase)

You need tables the app already uses:

- `users` — `clerk_id`, `email`, `name`, `image_url`, `currency`
- `accounts` — `user_id`, `name`, `type`, `balance`, `is_default`
- `transactions` — amount, type, category, date, account, input method, optional voice transcript
- `budgets` — monthly amount plus alert fields (`last_alert_sent`, `last_alert_threshold`)

Wire Clerk JWT verification on the Supabase project so authenticated requests match `user_id` / `clerk_id`.

Edge Functions live in `supabase/functions/`. Secrets they expect include:

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (typically injected by Supabase)
- `GOOGLE_GEMINI_API_KEY` (weekly tips)
- Resend API key used in `_shared/resend.ts`

Deploy when you are ready:

```bash
npx supabase functions deploy budgetAlerts
npx supabase functions deploy weeklyTips
```

Schedule them with Supabase cron (or your own scheduler) so budget alerts and weekly tips run on a cadence.

---

## Run the app

```bash
npm start
```

or:

```bash
npx expo start
```

Then:

- Scan the QR code with **Expo Go** (Android) or the Camera app (iOS)
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web

Other scripts:

```bash
npm run android   # Expo start targeting Android
npm run ios       # Expo start targeting iOS
npm run web       # Expo start targeting web
npm run lint      # ESLint (expo lint)
```

> Receipt camera, voice recording, and some native modules work best on a **device or simulator**, not only in a limited web preview.

---

## Architecture notes

1. **Auth gate** — `(root)/_layout` waits for Clerk, then redirects unsigned users to sign-in and incomplete profiles to onboarding.
2. **User sync** — `useUserSync` upserts the Clerk user into Supabase and creates a default cash account.
3. **Data** — Accounts, transactions, and budgets are loaded with TanStack Query hooks and mutated through dedicated mutation hooks.
4. **AI extraction** — Receipt images and voice audio are sent to Gemini with a JSON schema so category keys stay in the app’s enum.
5. **Assistant** — Refetches recent transactions and budget, builds a 30-day context string, then asks Gemini.
6. **Jobs** — Deno Edge Functions read spend with the service role and send HTML mail via Resend.

---

## License

Private project (`"private": true` in `package.json`). All rights reserved unless the owner states otherwise.

---

## Author

**Abdul Wahab** — [github.com/Abdul-Wahab08](https://github.com/Abdul-Wahab08)
