# taskr

three tiers. no noise.

a minimal task manager built for one: manual tier control, revenue-first ordering, recurring tasks, decay scoring, and weekly review mode.

---

## deploy to railway

### 1. create the project

```bash
# install railway cli
npm install -g @railway/cli
railway login

# init from this directory
railway init
```

### 2. add a postgres database

in the railway dashboard:
- click **New** → **Database** → **Add PostgreSQL**
- railway will auto-inject `DATABASE_URL` into your service

### 3. set environment variables

in your service's **Variables** tab, railway will auto-populate `DATABASE_URL` from the linked postgres instance. that's the only variable you need.

### 4. deploy

```bash
railway up
```

or connect your github repo and railway will auto-deploy on every push.

---

## local development

```bash
cp .env.example .env.local
# edit .env.local with your local postgres credentials

npm install
npm run dev
```

open [http://localhost:3000](http://localhost:3000)

---

## how it works

| tier | label | cap | behavior |
|------|-------|-----|----------|
| 1 | do it now | 4 | manual order, revenue tasks float to top |
| 2 | do it soon | unlimited | decay score increments daily |
| 3 | backlog | unlimited | parked, no pressure |

**quick capture**: type + enter from the top bar. expands to set tier, tag, and flags inline.

**tags**: sales · admin · personal · revenue

**recurring tasks**: set a recurrence interval in days. when completed, the next instance auto-spawns in tier 2. if a recurrence window is missed, it surfaces in weekly review.

**weekly review**: opens a focused triage mode showing aging tier 2 tasks, skipped recurrings, and tier drift. one action per item: promote, demote, keep, or delete.

**decay score**: every tier 2 task increments by 1 each time the weekly review is opened. tasks with score > 3 appear muted; score > 6 appear dimmed. surfaces in review automatically.
