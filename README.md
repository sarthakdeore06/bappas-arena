# 🐘 Bappa's Arena — Society Ganapati Games Portal

**AH Society Mitra Mandal**

A complete, premium full-stack web portal to manage your housing society's Ganapati festival games — participant-backed game scheduling, age-group medal results, leaderboards, and a festival photo gallery.

Built with **plain HTML, CSS and vanilla JavaScript** on the frontend, and **Node.js + Express + MongoDB (Mongoose)** on the backend. No React, Vue, Angular, Tailwind, Bootstrap or TypeScript.

---

## ✨ Features

- **Premium Ganapati theme** — saffron / gold / cream / dark maroon palette, glassmorphism cards, mandala rings, floating diyas and particles, fully mobile-first responsive.
- **Dashboard** — total participants, total games, completed competitions, total winners, current festival year.
- **Participant management** — add / edit / search / delete, categories (Children, Teenage, Adult), participant profile with full game history.
- **Game management** — name, category, date, time, venue, status (Upcoming / Ongoing / Completed).
- **Result management** — score, rank, remarks; Gold/Silver/Bronze auto-assigned from rank; duplicate results for the same participant+game are blocked.
- **Leaderboards** — game-wise and overall, filterable by category and year, with a podium view.
- **Admin panel** — JWT-based admin login; only admins can add/edit/delete; the public can browse everything read-only.
- **Festival memories** — photo gallery with captions and event names; no private participant details are ever shown publicly.
- **Extras** — search & filters, delete confirmations, form validation, loading states, toast notifications, empty states, CSV export, print-friendly winner lists.

---

## 📁 Folder Structure

```
bappas-arena/
├── package.json
├── server.js                  # Express app entry point
├── .env.example                # Sample environment variables
├── README.md
├── public/                     # Static frontend (served by Express)
│   ├── index.html               # Festival homepage
│   ├── dashboard.html           # Admin dashboard
│   ├── games.html                # Game management
│   ├── results.html              # Result entry
│   ├── leaderboard.html          # Rankings
│   ├── memories.html             # Photo gallery
│   ├── login.html                # Admin login
│   ├── css/
│   │   ├── style.css             # Design system (colors, layout, components)
│   │   └── animations.css        # Diyas, mandala rings, particles, festive motion
│   ├── js/
│   │   ├── api.js                # Fetch wrapper, auth/session, toasts, CSV export
│   │   ├── nav.js                 # Shared header/nav behaviour, admin-state toggling
│   │   ├── particles.js           # Hero particle effect
│   │   ├── main.js, dashboard.js, games.js, results.js,
│   │   │   leaderboard.js, memories.js, login.js
│   └── uploads/memories/         # Uploaded festival photos (created automatically)
└── server/
    ├── config/db.js              # MongoDB connection
    ├── models/                   # Mongoose schemas
    │   ├── Participant.js
    │   ├── Game.js
    │   ├── Result.js
    │   ├── Admin.js
    │   ├── Memory.js
    │   └── Settings.js           # Stores the current active festival year
    ├── routes/                   # Express routes (REST API)
    │   ├── authRoutes.js
    │   ├── participantRoutes.js
    │   ├── gameRoutes.js
    │   ├── resultRoutes.js
    │   ├── leaderboardRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── memoryRoutes.js
    │   └── settingsRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js     # JWT verification for admin routes
    │   └── errorHandler.js       # Centralised error handling
    └── utils/
        ├── generateToken.js
        └── seedAdmin.js          # Creates the default admin on first run
```

---

## 🚀 Setup & Run Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or a local MongoDB instance)

### 2. Install dependencies
```bash
cd bappas-arena
npm install
```

### 3. Configure environment variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bappas-arena?retryWrites=true&w=majority

# JWT secret for admin auth tokens
JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d

# Default admin account (auto-created on first run if no admin exists)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeThisPassword123!

# Current festival year shown by default
CURRENT_FESTIVAL_YEAR=2026
```

> On first startup, if no admin account exists yet in the database, the server automatically creates one using `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env` file. Log in at `/login.html` with these credentials, then consider changing your password via the API (`PUT /api/auth/change-password`).

### 4. Run the server
```bash
npm start
```
You should see:
```
MongoDB connected: cluster0-xxxxx.mongodb.net
Default admin account created.
Default festival settings created.
Bappa's Arena server running on http://localhost:5000
```

### 5. Open the site
Visit **http://localhost:5000** in your browser. The Express server serves both the API (`/api/...`) and the static frontend from the `public/` folder — there's nothing separate to run for the frontend.

For development with auto-restart on file changes:
```bash
npm run dev
```

---

## 🔑 Admin Access

- Public visitors can browse the homepage, dashboard, games, leaderboard and memories gallery — **read-only**.
- Only a logged-in admin (via `login.html`) can add, edit or delete games, results and gallery photos.
- The admin session is a JWT stored in the browser's `localStorage` and sent as a `Bearer` token on every write request. It expires automatically based on `JWT_EXPIRES_IN`.

---

## 🗄️ Database Schemas (Mongoose)

| Model | Key Fields |
|---|---|
| **Participant** | name, category (Children/Teenage/Adult), contactName, contactPhone, year, notes |
| **Game** | name, category, date, time, venue, status (Upcoming/Ongoing/Completed), year, description |
| **Result** | game (ref), participant (ref), score, rank, position (Gold/Silver/Bronze/Participant — auto-assigned), remarks, year. A unique index on `(game, participant)` prevents duplicate results. |
| **Admin** | username, password (hashed with bcrypt), name |
| **Memory** | imageUrl, caption, eventName, year |
| **Settings** | currentYear, pandalName — a single document used to track the active festival year |

---

## 🔌 API Overview

All endpoints are prefixed with `/api`. Routes marked 🔒 require an admin `Authorization: Bearer <token>` header.

- `POST /auth/login`, `GET /auth/me` 🔒, `PUT /auth/change-password` 🔒
- `GET /games`, `GET /games/:id`, `POST /games` 🔒, `PUT /games/:id` 🔒, `DELETE /games/:id` 🔒
- Internal participant APIs remain available for result eligibility and leaderboard aggregation.
- `GET /results`, `GET /results/game/:gameId`, `POST /results` 🔒, `PUT /results/:id` 🔒, `DELETE /results/:id` 🔒
- `GET /leaderboard/overall?year=&category=`
- `GET /dashboard/stats?year=`, `GET /dashboard/years`
- `GET /memories?year=`, `POST /memories` 🔒 (multipart/form-data), `DELETE /memories/:id` 🔒
- `GET /settings`, `PUT /settings` 🔒

---

## 🧩 Extending for Future Festivals

1. In `.env`, bump `CURRENT_FESTIVAL_YEAR` (or update it via `PUT /api/settings` once logged in as admin) at the start of a new festival.
2. Simply start adding new games and medal results with the new year — old years' data remains stored separately in MongoDB.
3. Want an extra participant field, a new category, or a new game status? Add the field to the relevant Mongoose model in `server/models/`, adjust the matching route validation, and extend the form fields in the corresponding HTML/JS page — the rest of the stack (dashboard, leaderboard, exports) needs no changes since it reads live from the database.

---

## 🙏 Credits

Built for **AH Society Mitra Mandal**'s Ganapati festival. Ganpati Bappa Morya! 🐘🪔
