# TreXplore

A tourism guide website for Bangladesh — browse destinations across all eight
divisions, filter by district or category, and read (or write) traveler
stories. Built for CSE-356 Software Engineering, CUET.

**Stack:** React (Vite) · Express.js · Supabase PostgreSQL and Storage · JWT authentication

```
trexplore/
├── backend/     Express API, PostgreSQL models, JWT auth
└── frontend/    React app (Vite + React Router)
```

## 1. Prerequisites

- Node.js 20+
- A Supabase project (PostgreSQL and Storage)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `.env`, then run
`database/schema.sql` in the Supabase SQL Editor to create the tables. The
connection string is available under **Project Settings → Database**.

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
`SUPABASE_STORAGE_BUCKET` in `.env` for image uploads. Create a public Storage
bucket named `trexplore-media`; keep the service role key private.

Seed an admin account and a handful of starter destinations (optional but
recommended):

```bash
npm run seed
```

Optionally seed three demo travelers (beach / heritage / nature lovers) so the
AI recommendations have history to learn from — see
[AI recommendations](#5-ai-travel-recommendations):

```bash
npm run seed:demo
```

This creates an admin login: **admin@trexplore.com / Admin@123** — use it to
sign in and manage destinations from `/admin` once the frontend is running.

Start the API:

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

The API runs on `http://localhost:5000` by default. Check it's alive at
`http://localhost:5000/api/health`.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and talks to the API at
`http://localhost:5000/api` by default. Set `VITE_API_URL` in
`frontend/.env` to point it elsewhere.

## 4. Deployment

**Supabase**

- Run `backend/database/schema.sql` in the Supabase SQL Editor.
- Create a public Storage bucket named `trexplore-media` for destination and
  story images.
- Use a Supabase PostgreSQL connection string for the backend's
  `DATABASE_URL`. Keep the service role key exclusively in Render.

**Render**

- Create a Blueprint from `render.yaml` or a web service with `backend` as its
  root directory, `npm install` as its build command, and `npm start` as its
  start command.
- Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `CLIENT_URL`. `CLIENT_URL` accepts a comma-separated list, including your
  Vercel production origin and `http://localhost:5173` during development.
- Run `npm run seed` from `backend` after the schema is created to add the
  admin user and starter destinations.

**Vercel**

- Import the repository with `frontend` as the project root. Vercel detects
  Vite; the build command is `npm run build` and the output directory is `dist`.
- Set `VITE_API_URL` to your Render service URL followed by `/api`, then deploy.
- `frontend/vercel.json` routes client-side paths back to the app entry point.

Deployment environment templates are in `backend/.env.example` and
`frontend/.env.example`. Never put the Supabase service role key or database
password in Vercel variables or commit them to GitHub.

## 5. What's implemented

**Travelers**

- Browse destinations across all 8 divisions
- Search and filter by division, district, category
- View detailed destination pages (how to reach, best time to visit, entry fee)
- Register/log in, manage a profile
- Write, publish, and read travel blogs tied to a destination
- Save favourite destinations
- **AI recommendations** — personalised "For You" suggestions that learn from
  each traveler's behaviour (see section 5)

**Website management (admin role)**

- Add, edit, and delete destinations from `/admin`
- Organize destinations by division/district/category
- Moderate blogs (any admin can delete a blog, not just the author)

## 6. AI travel recommendations

TreXplore learns each signed-in traveler's taste from what they do and
suggests destinations to match. It is a hybrid recommender that runs inside the
backend — **no external AI service, API key or extra dependency is needed.**

**What it observes** (logged automatically by the existing endpoints, no extra
frontend calls):

| Signal                          | Weight | Recorded when                              |
| ------------------------------- | ------ | ------------------------------------------ |
| Saved a place                   | 5      | Tapping “Save” on a destination page       |
| Wrote a story about a place     | 4      | Publishing a story linked to a destination |
| Read a story about a place      | 1.5    | Opening a story linked to a destination    |
| Filtered by category / division | 1.2    | Using the filters on `/destinations`       |
| Viewed a place                  | 1      | Opening a destination page                 |

Repeats within 30 minutes (10 for filters) are ignored so a refresh doesn't
inflate interest. Signals lose half their influence every 30 days, so the model
follows a traveler's changing taste.

**How it decides** (`backend/utils/recommender.js`):

1. **Content match** — each destination is a vector of its category, division
   and description keywords (TF-IDF). A traveler's taste profile is the weighted
   sum of the places they interacted with; places are ranked by cosine
   similarity to it.
2. **Travelers like you** — users with overlapping behaviour "vote" for places
   you haven't seen (user-based collaborative filtering).
3. **Popularity** — decayed global interest. It dominates for brand-new users
   (cold start) and fades as their profile fills up.
4. **Diversity + discovery** — results are re-ranked with Maximal Marginal
   Relevance so they aren't all the same type, and one slot is reserved for a
   “discovery” pick outside the traveler's usual categories.

Places the traveler already saved or wrote about are never re-suggested, and
every suggestion carries a plain-language reason (“You keep exploring beach
destinations”, “Because you saved Sajek Valley”, …).

**Where it appears**

- **Home** — a “Picked for you” row for signed-in users
- **/for-you** — what the AI has learned (type/region/theme breakdown and
  activity counts), more suggestions, and saved places
- **Destination page** — a Save button and “You might also like”

**Upgrading an existing database.** Two tables were added (`favorites`,
`user_events`). Re-run the schema — it is safe on an existing database:

```bash
mysql -u root -p < backend/database/schema.sql
```

**Try it.** `npm run seed:demo` creates `beach@trexplore.com`,
`heritage@trexplore.com` and `nature@trexplore.com` (password `Demo@123`).
Log in as each and compare their “For You” pages.

**Tests.** `npm test` (in `backend/`) runs unit tests for the engine — cold
start, taste separation, time decay, collaborative filtering, diversity, and
edge cases.

**Tuning.** Signal weights, decay half-life and diversity strength are in the
`CONFIG` object at the top of `recommender.js`. Recommendations are computed on
each request, which is fine at this project's scale; for a large user base,
cache the result per user for a few minutes.

## 7. API overview

| Method | Route                            | Auth        | Description                               |
| ------ | -------------------------------- | ----------- | ----------------------------------------- |
| POST   | /api/auth/register               | —           | Create an account                         |
| POST   | /api/auth/login                  | —           | Log in, returns a JWT                     |
| GET    | /api/auth/me                     | user        | Current user                              |
| GET    | /api/destinations                | —           | List/filter destinations                  |
| GET    | /api/destinations/:slug          | —           | Destination detail                        |
| POST   | /api/destinations                | admin       | Create a destination                      |
| PUT    | /api/destinations/:id            | admin       | Update a destination                      |
| DELETE | /api/destinations/:id            | admin       | Delete a destination                      |
| GET    | /api/blogs                       | —           | List blogs (filter by user/destination)   |
| GET    | /api/blogs/:slug                 | —           | Blog detail                               |
| POST   | /api/blogs                       | user        | Publish a blog                            |
| PUT    | /api/blogs/:id                   | owner/admin | Edit a blog                               |
| DELETE | /api/blogs/:id                   | owner/admin | Delete a blog                             |
| PUT    | /api/users/me                    | user        | Update your profile                       |
| GET    | /api/favorites                   | user        | Your saved destinations (+ ids)           |
| POST   | /api/favorites/:destinationId    | user        | Save a destination                        |
| DELETE | /api/favorites/:destinationId    | user        | Remove a saved destination                |
| GET    | /api/recommendations             | optional    | AI picks (popular if not signed in / new) |
| GET    | /api/recommendations/profile     | user        | What the AI has learned about you         |
| GET    | /api/recommendations/similar/:id | —           | Places similar to a destination           |

## 8. Notes for extending this

- Destination photos aren't wired up to real uploads yet — `image_url` and
  `cover_image_url` columns exist in the schema, ready for a file-upload
  route (the `multer` dependency is already in `backend/package.json`) or an
  external image URL.
- The proposal's "future work" list (online booking, interactive maps,
  weather updates, structured reviews) is a natural next milestone once the
  core CRUD flows above are stable.
- The recommender gets better with richer destination data: fuller
  `description` text and accurate categories give it more to match on.
- `frontend/dist/` is a build output; run `npm run build` in `frontend/` to
  regenerate it after these changes.
