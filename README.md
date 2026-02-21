# CampusKart

<!-- Project logo/banner: Add your image or graphic here for portfolio and demos -->

**Buy & sell safely within your campus.** A verified .edu marketplace for college students.

[![Status](https://img.shields.io/badge/Status-MVP%20Complete-success?style=flat-square)](https://github.com/CampusKart2/CampusKart)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Team](https://img.shields.io/badge/Team-11%20members-7C3AED?style=flat-square)](https://github.com/CampusKart2)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Current Status & Roadmap](#current-status--roadmap)
- [Architecture](#architecture)
- [Team & Contributing](#team--contributing)
- [License & Contact](#license--contact)

---

## Overview

### What is CampusKart?

**CampusKart** is a campus-only marketplace where college students buy and sell textbooks, furniture, electronics, clothing, and dorm essentials within a verified .edu community. Every user is tied to a real university, and exchanges are designed to happen on or near campus—combining the convenience of a marketplace with the trust of a closed, verified network.

### Why We Built It

| Problem | Our Solution |
|--------|---------------|
| Generic marketplaces feel risky for students | **Campus-verified users** — only .edu emails |
| Listings scattered across Craigslist, Facebook, flyers | **One place** for all campus buying & selling |
| No trust signals for student-to-student deals | **Reviews, ratings, condition badges**, safety guidelines |
| Poor mobile experience for quick dorm deals | **Mobile-first** design, fast search, filters, and chat |

We built CampusKart as a **Senior Software Engineering / university course project** to deliver a production-quality MVP: modern frontend practices, clear architecture, and a defined path to backend and deployment.

### Key Differentiators

- **.edu verification** — Access limited to current students and staff
- **Campus-scoped** — Listings and meetups designed for your school
- **Trust-first** — Reviews, condition labels, safety tips, and report flows
- **Student-centric UX** — Price filters (e.g. “Under $20”, “Free”), Deal of the Day, wishlist, recently viewed

### Target Audience

- **College and university students** buying or selling course materials, dorm items, and electronics
- **Campus organizations** and **administrations** interested in a sanctioned, safe marketplace

---

## Features

### 1. Core Marketplace

| Feature | Status | Description |
|---------|--------|-------------|
| **Homepage** | ✅ | Hero, Deal of the Day, categories, recently viewed, featured listings, trust/sustainability |
| **Browse** | ✅ | Full listing grid with search, category filters, and price filters |
| **Categories** | ✅ | Textbooks, Furniture, Electronics, Clothing, Dorm Essentials + category pages |
| **Listing detail** | ✅ | Description, seller info, reviews, price history, similar items, share & bookmark |
| **Create listing** | ✅ | Listing creation flow (UI complete; backend planned) |
| **Single data source** | ✅ | 25–30 mock listings with reviews, price history, metadata |
| **Header search → Browse** | ✅ | Search persists query and navigates to browse with results |

### 2. Communication

| Feature | Status | Description |
|---------|--------|-------------|
| **Chat** | ✅ | Conversation list, chat window, message bubbles |
| **Contact seller** | ✅ | “Contact seller” opens or creates conversation by listing |
| **Persistence** | ✅ | Conversations and messages in `localStorage` |
| **Auto-replies** | ✅ | Mock auto-replies for demo flow |
| **Unread badges** | ✅ | Message count in header |
| **Real-time chat** | 🔜 | Socket.io integration (Sprint 1) |

### 3. User Experience

| Feature | Status | Description |
|---------|--------|-------------|
| **Recently viewed** | ✅ | Last 10 listings in `localStorage`, section on homepage |
| **Price filters** | ✅ | All, Free, Under $20, Under $50, $50–$100, $100+ (with counts) |
| **My Saves / Wishlist** | ✅ | Global bookmark state, dedicated page, header badge |
| **Deal of the Day** | ✅ | Daily rotating featured deal on homepage |
| **Smart badges** | ✅ | Hot Deal, Trending, New, Free on listing cards |
| **Condition badges** | ✅ | New, Like New, Good, Fair on cards and detail page |
| **Similar items** | ✅ | Same category + price within ±30% |
| **Share listing** | ✅ | Copy link to clipboard + toast |
| **Mobile responsive** | ✅ | Touch-friendly layout, hamburger menu, full-width search |
| **Dark mode** | ✅ | Toggle in header, preference in `localStorage` |

### 4. Trust & Safety

| Feature | Status | Description |
|---------|--------|-------------|
| **Campus verification** | ✅ | Dedicated page and flow (UI; backend verification in Sprint 1) |
| **How it works** | ✅ | Explainer content and page |
| **Reviews & ratings** | ✅ | 2–5 mock reviews per listing, star ratings, “Write a review” CTA |
| **Safety guidelines** | ✅ | Safety page (meeting safely, scams, payment, emergency) |
| **Contact & FAQ** | ✅ | Contact page (email, campus safety, report form), FAQ with accordion |
| **.edu auth** | 🔜 | JWT + .edu verification (Sprint 1) |

### 5. Engagement & Polish

| Feature | Status | Description |
|---------|--------|-------------|
| **Toast notifications** | ✅ | Sonner for success, error, info |
| **Animations** | ✅ | Smooth transitions, hover states, duration-300 |
| **Hash routing** | ✅ | Single-page app with hash-based routes |
| **Accessibility** | ✅ | Semantic HTML, ARIA where needed, keyboard-friendly |

---

## Tech Stack

### Frontend (Current)

| Layer | Technology |
|-------|------------|
| **Framework** | React 18.3.1 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Build** | Vite 6.3.5 |
| **UI** | shadcn/ui (Radix), Lucide React |
| **Notifications** | Sonner |
| **Routing** | Hash-based (client-side) |
| **State** | React state + Context (Bookmarks, Chat, Theme) |
| **Persistence** | `localStorage` (bookmarks, recently viewed, theme, chat) |

### Backend (Planned — Sprint 1)

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | JWT + .edu email verification |
| **Real-time** | Socket.io (chat) |
| **Storage** | AWS S3 or Cloudinary (images) |
| **Email** | SendGrid (verification, notifications) |
| **Search** | Full-text search (DB or dedicated) |

### DevOps (Future)

- **Containers** — Docker  
- **CI/CD** — GitHub Actions  
- **Hosting** — AWS / Vercel  

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommend 20 LTS)
- **pnpm** (or npm/yarn)

```bash
node -v   # v18 or higher
npm install -g pnpm   # if needed
```

### Installation

```bash
git clone https://github.com/CampusKart2/CampusKart.git
cd CampusKart
cd Frontend
pnpm install
```

### Run locally

```bash
# From CampusKart/Frontend
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Use hash routes (e.g. `/#browse`, `/#listing/1`).

### Build for production

```bash
# From CampusKart/Frontend
pnpm build
```

Output is in `Frontend/dist/`. Serve with any static host (e.g. `npx serve dist`).

---

## Project Structure

```
CampusKart/
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── data/
│   │   │   ├── hooks/
│   │   │   └── App.tsx
│   │   ├── styles/
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/          # Coming in Sprint 1
├── .gitignore
└── README.md
```

---

## Screenshots

**Screenshots coming soon!** For now, clone and run locally to see the full experience.

| Screen | Description |
|--------|-------------|
| **Homepage** | Hero section with Deal of the Day and featured listings |
| **Browse** | Advanced filtering and search |
| **Chat** | Real-time messaging interface (mock) |
| **Listing detail** | Full listing with reviews, similar items, share |
| **My Saves** | Wishlist grid with remove actions |
| **Mobile** | Hamburger menu, full-width search, touch-friendly |

---

## Current Status & Roadmap

### Timeline

| Phase | Timeline | Status | Focus |
|-------|----------|--------|--------|
| **Phase 1** | Week 5 | ✅ **COMPLETE** | Frontend MVP |
| **Phase 2** | Week 7–8 | 🔄 **IN PROGRESS** | Backend integration |
| **Phase 3** | Week 9–10 | 📋 **PLANNED** | Advanced features |
| **Phase 4** | Week 11+ | 📋 **PLANNED** | Polish & deploy |

### Phase 1 (Week 5): Frontend MVP — COMPLETE ✅

- 9+ fully functional pages (Homepage, Browse, Categories, Listing Detail, Create Listing, Chat, My Saves, Login, Signup, How It Works, Campus Verification, Contact, FAQ, Safety)
- Single mock data source (25–30 listings), recently viewed, price filters, wishlist
- Deal of the Day, smart badges, reviews, share, similar items algorithm
- Complete chat UI with auto-replies and `localStorage` persistence
- Header search → browse, condition badges, mobile responsive, toasts, dark mode, hash routing

### Phase 2 (Week 7–8): Backend Integration — IN PROGRESS 🔄

- Express.js REST API
- PostgreSQL + Prisma ORM
- JWT authentication with .edu email verification
- Real-time Socket.io chat
- Image upload (AWS S3 or Cloudinary)
- SendGrid email notifications
- Full-text search

### Phase 3 (Week 9–10): Advanced Features — PLANNED 📋

- Notifications, saved searches, performance and UX polish

### Phase 4 (Week 11+): Polish & Deploy — PLANNED 📋

- Docker, CI/CD (e.g. GitHub Actions), production deployment (AWS/Vercel), monitoring

**Demo date:** February 25, 2026

---

## Architecture

### High-Level Model

- **Client–server** — React SPA talks to a REST API (planned). Real-time chat over WebSockets (Socket.io).
- **RESTful API** — Express.js: listings, users, auth, conversations. REST for CRUD; WebSockets for chat.
- **Real-time layer** — Socket.io for live messaging and presence (Sprint 1).
- **Database** — PostgreSQL with Prisma. Core entities: Users, Listings, Categories, Conversations, Messages, Reviews.
- **Authentication** — Register/Login → JWT. .edu verification → email code → mark user verified. Frontend stores token; backend validates on protected routes.

### Current Frontend Architecture

- **Single mock source** — One `mockListings.ts` (and related) for consistent IDs and shape across Browse, Category, Detail, Similar, Deal of the Day.
- **Context** — Bookmarks and Chat state in React Context; theme in a hook + `localStorage`.
- **Routing** — Hash-based; one `App.tsx` switch for all routes.

---

## Team & Contributing

### Team

- **Organization:** [CampusKart2](https://github.com/CampusKart2)
- **Team size:** 11 members
- **Context:** Senior university project / Software Engineering course

### How to Contribute

1. **Fork** the repository (if external).
2. **Create a branch:** `git checkout -b feature/your-feature` or `fix/your-fix`.
3. **Commit** with clear messages; reference issues where applicable.
4. **Push** and open a **Pull Request** against the default branch.
5. **Code style** — TypeScript strict; follow existing patterns; use Prettier/ESLint if configured.

For larger features, open an issue first to align on scope. See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines (when available).

---

## License & Contact

### License

This project is licensed under the **MIT License** (or as specified in the repo). Educational use is encouraged.

### Contact

- **GitHub:** [CampusKart2](https://github.com/CampusKart2)
- **Issues:** [GitHub Issues](https://github.com/CampusKart2/CampusKart/issues) for bugs, features, and questions
- **Email:** See the GitHub organization or course materials for course/organization contact

---

**CampusKart** — *Buy & sell safely within your campus.*
