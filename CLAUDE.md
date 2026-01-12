# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                 # Start Next.js dev server

# Build (includes Prisma generate + migrate)
npm run build               # npx prisma generate && next build && npx prisma migrate deploy

# Linting
npm run lint                # Run ESLint
npm run lint:fix            # Fix lint issues + run Prettier

# Database
npx prisma generate         # Generate Prisma client
npx prisma migrate dev      # Run migrations in development
npx prisma studio           # Open Prisma database browser
```

### Local Development with Docker

1. Create `.env` from `.env.example`
2. Run `docker compose up --build`
3. In `prisma/schema.prisma`, uncomment local datasource, comment production datasource
4. Exec into container: `npx prisma migrate dev`
5. Restart docker compose

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (Pages Router), Tailwind CSS, PrimeReact
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL, Redis
- **Nostr**: NDK (Nostr Dev Kit), nostr-tools
- **Payments**: Lightning (LND), Bitcoin Connect, Alby SDK

### Directory Structure

```
src/
├── pages/                    # Next.js pages + API routes
│   ├── api/
│   │   ├── auth/[...nextauth].js   # Multi-provider auth (Nostr, Email, GitHub, Anonymous)
│   │   ├── purchase/               # Course/resource purchase processing
│   │   ├── lightning-address/      # LNURL-pay implementation
│   │   └── courses/, resources/    # Content CRUD
│   └── course/[slug]/              # Course detail pages
├── components/
│   ├── content/                    # Carousels, course/video/document displays
│   ├── forms/                      # Content creation forms
│   └── zaps/                       # Lightning payment UI
├── hooks/
│   ├── nostrQueries/content/       # useCoursesQuery, useVideosQuery, useDocumentsQuery
│   ├── encryption/                 # Content encryption/decryption
│   └── tracking/                   # Course progress tracking
├── context/NDKContext.js           # Nostr Dev Kit provider
├── config/appConfig.js             # Relay URLs, author pubkeys, lightning addresses
├── db/
│   ├── prisma.js                   # Prisma client singleton
│   └── models/                     # Database model helpers (15+ files)
└── utils/nostr.js                  # Nostr event parsing & validation
```

### Content Types & Nostr Events

| Type | Nostr Kind | Tag | DB Model |
|------|------------|-----|----------|
| Course | 30004 | - | `Course` → `Lesson` |
| Video | 30023 | `t:video` | `Resource` |
| Document | 30023 | `t:document` | `Resource` |

### State Management

Provider hierarchy in `_app.js`:
```
PrimeReactProvider → SessionProvider → NDKProvider → QueryClientProvider → ToastProvider
```

- **NextAuth Session**: User auth, purchases, subscriptions
- **NDK Context**: Nostr connection, relay management
- **React Query**: Server state caching for Nostr queries
- **LocalStorage**: User preferences, relay lists

### Authentication Flow

NextAuth supports multiple providers:
- **Nostr (NIP-07)**: Browser extension signer → sync kind0 profile → create/update user
- **Email**: Magic link → ephemeral keypair generated
- **GitHub**: OAuth → ephemeral keypair generated
- **Anonymous**: Generate ephemeral keypair on the fly
- **Recovery**: nsec/hex private key → restore account

### Lightning Integration

LNURL-pay flow:
1. `/.well-known/lnurlp/[name]` → returns metadata
2. `/api/lightning-address/callback/[slug]?amount=X` → generates invoice
3. `/api/lightning-address/verify/[name]/[paymentHash]` → verifies payment

Custom lightning addresses configured in `src/config/appConfig.js`.

### Key Patterns

**Content Encryption**: Paid content encrypted on Nostr, decrypted client-side based on `User.purchased` or subscription status. See `src/hooks/encryption/`.

**Draft System**: Content goes through Draft → Published workflow. Models: `Draft`, `CourseDraft`, `DraftLesson`.

**Course Progress**: Tracked via `UserCourse` (enrollment) and `UserLesson` (lesson completion) models.

### Important Files

- `prisma/schema.prisma` - Database schema with all models
- `src/pages/api/auth/[...nextauth].js` - Auth configuration (437 lines)
- `src/config/appConfig.js` - Relay URLs, author pubkeys, pricing
- `src/utils/nostr.js` - Event parsing utilities

## Nostr NIPs Implemented

- NIP-01: Basic protocol
- NIP-05: Platform identities (plebdevs.com)
- NIP-07: Browser extension signer
- NIP-19: bech32 encoding
- NIP-23: Long-form content (documents/videos)
- NIP-47: Nostr Wallet Connect (subscriptions)
- NIP-51: Lists (courses)
- NIP-57: Zaps
- NIP-58: Badges
- NIP-99: Digital content sales
