# CardAlpha

Trading card investment analytics platform. Identify undervalued MLB, NFL, and Pokémon cards with an AI-powered Alpha Score.

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts, React Query → Deploy on Vercel
- **Backend**: Python FastAPI, SQLAlchemy, PostgreSQL → Deploy on Railway or Render
- **Auth**: JWT (python-jose + passlib bcrypt)

## Quick Start (Local)

### Option 1: Docker Compose (recommended)

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your PostgreSQL connection string
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

The backend auto-seeds mock data on startup including 18 cards across MLB, NFL, and Pokémon.

**Default accounts:**
- Admin: `admin@cardalpha.com` / `admin123`
- Test: `test@cardalpha.com` / `test123`

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import repo in Vercel dashboard → select `frontend/` as root directory
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
4. Deploy

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Set root directory to `backend/`
3. Add a PostgreSQL plugin (Railway provides one)
4. Set environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL plugin>
   SECRET_KEY=<generate a strong random key>
   ```
5. Deploy — Railway uses the `Procfile` automatically

### Backend → Render

1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (DATABASE_URL, SECRET_KEY)
6. Add a PostgreSQL database from Render dashboard

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/token` | Login, get JWT |
| GET | `/auth/me` | Current user |
| GET | `/dashboard/summary` | Stats overview |
| GET | `/dashboard/top-undervalued` | Top 10 by Alpha Score |
| GET | `/dashboard/high-momentum` | Top 10 by volume momentum |
| GET | `/dashboard/rookie-opportunities` | Rookie cards |
| GET | `/dashboard/low-pop-breakouts` | Pop < 50 |
| GET | `/dashboard/pokemon-movers` | Pokémon cards |
| GET | `/cards` | List with filters |
| GET | `/cards/{id}` | Card detail + analysis |
| GET | `/watchlist` | User watchlist (auth) |
| POST | `/watchlist` | Add to watchlist (auth) |
| GET | `/portfolio` | User portfolio (auth) |
| POST | `/portfolio` | Add position (auth) |
| GET | `/admin/scoring-weights` | Get weights (admin) |
| PUT | `/admin/scoring-weights` | Update weights (admin) |

Full interactive docs at `/docs` when running locally.

## Alpha Score Algorithm

Scores each card 0–100:

| Factor | Max Points |
|--------|-----------|
| Below 90-day average | 25 |
| Below all-time high | 20 |
| Volume momentum (7d vs prior 7d) | 15 |
| Rookie status | 10 |
| Low population | 10 |
| Serial number scarcity | 10 |
| Performance momentum | 5 |
| Set popularity | 5 |

**Tiers:** Strong Buy (80+), Buy (65–79), Watch (50–64), Avoid (<50)

## Plugging in Live Data

The backend is structured for future API integrations:

- **eBay**: Replace `seed_data.py` price history with eBay Finding API calls
- **130point**: Parse 130point CSVs into `MarketData` records
- **PSA Pop Report**: Feed population counts into `card.population`
- **ML model**: Add a `/cards/{id}/predict` endpoint in `routers/cards.py` calling a scikit-learn or PyTorch model

## Project Structure

```
CardAlpha/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS + startup
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── auth.py          # JWT + password hashing
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic (scoring, projection)
│   │   └── seed_data.py     # Mock dataset + seeder
│   ├── requirements.txt
│   └── Procfile
└── frontend/
    └── src/
        ├── app/             # Next.js App Router pages
        ├── components/      # React components
        └── lib/             # API client + TypeScript types
```
