# ⚡ AtomicHabits — AI Identity Transformation App

A production-ready, AI-powered habit transformation mobile app built on identity-based behavior change principles from *Atomic Habits* by James Clear.

> "You do not rise to the level of your goals. You fall to the level of your systems."

---

## 🏗 Architecture Overview

```
AtomicHabits/
├── app/                     # Expo Router screens
│   ├── (auth)/              # Login, Register, Forgot Password
│   ├── (tabs)/              # Main tab navigator
│   │   ├── index.tsx        # 🏠 Dashboard (today's habits + AI coaching)
│   │   ├── habits.tsx       # ✅ All habits with search/filter
│   │   ├── identity.tsx     # 🧬 Identity engine + scores
│   │   ├── analytics.tsx    # 📊 Charts, streaks, compounding
│   │   └── coach.tsx        # 🤖 AI chat coach (Groq LLaMA 3 70B)
│   ├── onboarding/          # Welcome → Philosophy → Identity → Habits
│   ├── habit/               # Create & detail screens
│   ├── journal/             # Daily reflection
│   └── focus/               # Pomodoro focus mode
├── components/              # Reusable UI components
│   ├── ui/                  # Button, Card, Input, ProgressBar, Badge
│   ├── habits/              # HabitCard
│   └── identity/            # IdentityCard
├── services/
│   ├── ai/                  # Groq client + AI coach service
│   ├── supabase/            # Auth, habits, identity, journal
│   └── notifications/       # Smart identity-based notifications
├── stores/                  # Zustand state management
├── types/                   # Complete TypeScript definitions
├── constants/               # Colors, themes, identity templates
├── supabase/migrations/     # Complete PostgreSQL schema
├── __tests__/               # Jest unit tests
└── .github/workflows/       # CI/CD GitHub Actions
```

---

## 🚀 Quick Start (Get App on Your Phone in 20 Minutes)

### Prerequisites
- Node.js 18+
- Expo Go app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- [Supabase](https://supabase.com) account (free)
- [Groq](https://console.groq.com) API key (free)

---

### Step 1: Clone & Install

```bash
git clone https://github.com/jlakshay05/atomic-habits.git
cd atomic-habits
npm install --legacy-peer-deps
```

---

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon/public key** (Settings → API)
3. Go to **SQL Editor** → Run `supabase/migrations/001_initial_schema.sql`
4. Then run `supabase/migrations/002_rls_policies.sql`
5. Enable **Google OAuth** in Auth → Providers (optional)

---

### Step 3: Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Create account (free, no credit card)
3. API Keys → **Create API Key**
4. Copy the key (starts with `gsk_`)

---

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GROQ_API_KEY=gsk_your-key-here
```

---

### Step 5: Run on Your Phone

```bash
npx expo start
```

- **Scan the QR code** with Expo Go app (Android) or Camera app (iOS)
- The app loads live on your phone!

---

## 📱 Deploy to Your Phone Permanently (EAS Build)

### Install EAS CLI

```bash
npm install -g eas-cli
eas login  # Login with your Expo account (create at expo.dev)
```

### Build APK for Android (Easiest)

```bash
eas build --platform android --profile preview
```

This generates a `.apk` download link. Open it on your Android phone to install directly.

### Build for iOS (Requires Apple Developer Account)

```bash
eas build --platform ios --profile preview
```

Requires Apple Developer account ($99/year). Distributes via TestFlight.

---

## 🔧 GitHub Setup & CI/CD

### Create GitHub Repo

```bash
# Create repo at github.com (use account jlakshay05@gmail.com)
# Then:
git remote add origin https://github.com/jlakshay05/atomic-habits.git
git branch -M main
git push -u origin main
```

### Add GitHub Secrets

In your GitHub repo → Settings → Secrets → Actions, add:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your anon key |
| `GROQ_API_KEY` | Your Groq API key |
| `EXPO_TOKEN` | From expo.dev → Account → Access Tokens |

### CI/CD Pipeline

The pipeline automatically:
- ✅ Runs TypeScript type checking
- ✅ Runs all unit tests
- ✅ Builds Android APK on pushes to `main`
- ✅ Builds iOS on pushes to `main`
- ✅ Submits to stores on version tags

---

## 🗄 Database Schema

Complete PostgreSQL schema includes:

| Table | Purpose |
|-------|---------|
| `profiles` | User data + notification prefs |
| `identities` | User-defined identities with scores |
| `identity_evolution` | Daily identity score history |
| `habits` | Complete habit definitions (with habit loop) |
| `habit_logs` | Daily completion records |
| `habit_streaks` | Auto-calculated streaks (via triggers) |
| `habit_stacks` | Chained routine sequences |
| `journal_entries` | Daily reflections with AI summaries |
| `weekly_reviews` | AI-generated weekly analysis |
| `ai_insights` | Stored AI coaching messages |
| `environment_logs` | Environment analysis records |
| `subscriptions` | Premium subscription tracking |

All tables have **Row Level Security (RLS)** — users can only access their own data.

---

## 🤖 AI Features (Groq LLaMA 3 70B)

| Feature | How it works |
|---------|-------------|
| **Daily Coaching** | Personalized message based on streaks, identity, emotional trend |
| **Identity Summaries** | Reinforces who you're becoming, not what you're doing |
| **Recovery Coaching** | "Never miss twice" — compassionate recovery after misses |
| **Pattern Analysis** | Detects behavioral patterns across completion data |
| **Tiny Habit Suggestions** | Two-minute rule applied via AI |
| **Environment Analysis** | Scores focus/distraction, suggests improvements |
| **Smart Notifications** | Identity-first push notification copy |
| **Weekly Review** | Structured AI review with patterns, wins, improvements |
| **AI Chat Coach** | Full conversational coaching with context awareness |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

Tests cover:
- AI coach service (mocked Groq API)
- Zustand stores (habits, auth)
- Streak calculation utilities
- Supabase service layer

---

## 🏛 Key Design Decisions

### Identity-First Architecture
Every habit is linked to an identity. When a habit is completed, it reinforces the identity's score and confidence. The app constantly surfaces this connection.

### Two-Minute Rule Built-In
Every habit has a `tiny_version` field. The AI can auto-generate tiny versions. When consistency drops, the app suggests switching to the tiny version.

### Never Punish Missed Days
The `recovery_speed` metric celebrates how quickly users bounce back — not how perfect they are.

### AI is Supportive, Not Transactional
All AI prompts are engineered to reinforce identity, not just complete tasks. The system prompt explicitly forbids generic platitudes.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 56 |
| Navigation | Expo Router 4 |
| Language | TypeScript (strict) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | Groq API (LLaMA 3 70B) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Animations | React Native Reanimated |
| Notifications | Expo Notifications |
| Testing | Jest + Testing Library |
| CI/CD | GitHub Actions + EAS |

---

## 🔐 Security

- **Supabase RLS**: All data access is user-scoped at the database level
- **SecureStore**: Supabase session tokens stored in iOS Keychain / Android Keystore
- **Environment Variables**: API keys via `EXPO_PUBLIC_*` (client-safe only)
- **Zod Validation**: All user inputs validated before submission

---

## 🗺 Roadmap

- [ ] Apple Sign-In
- [ ] Google Sign-In  
- [ ] Voice journaling (Expo AV)
- [ ] Wearable integration (Apple Watch / WearOS)
- [ ] Bad habit breaking system
- [ ] Social accountability circles
- [ ] Advanced analytics with Victory Native charts
- [ ] Premium subscription (RevenueCat)
- [ ] Environment photo analysis (AI vision)

---

## 📄 License

MIT © 2026 Lakshay

---

*Built with behavioral psychology principles from Atomic Habits by James Clear.*
