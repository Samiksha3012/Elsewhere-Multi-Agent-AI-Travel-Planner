# Elsewhere Travel Planner

Elsewhere is a React/Vite travel-planning interface backed by the existing FastAPI service and LangGraph agents. PostgreSQL remains the LangGraph checkpoint store.

## Backend setup

Use Python 3.10 or newer and a reachable PostgreSQL database. From the project root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create a root `.env` file locally and set your credentials and database URL there. Keep this file private; none of these credentials belong in the frontend. `.env` and `frontend/.env` are ignored by Git.

```text
GROQ_API_KEY=your_groq_key
AVIATIONSTACK_API_KEY=your_aviationstack_key
TAVILY_API_KEY=your_tavily_key
DATABASE_URL=postgresql://user:password@host:5432/database
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the API from the project root:

```powershell
uvicorn api:app --reload
```

The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`. Startup initializes the PostgreSQL checkpointer. `POST /plan-trip` accepts JSON shaped like:

```json
{
  "query": "Kyoto, Japan",
  "duration_days": 5,
  "budget": 2500,
  "traveller_count": 2,
  "departure_city": "San Francisco",
  "destination_city": "Kyoto",
  "destination_country": "Japan",
  "departure_date": "2026-11-01",
  "return_date": "2026-11-06",
  "preferences": "Food and gardens",
  "sections": ["flights"]
}
```

`sections` accepts `flights`, `hotels`, and/or `itinerary`; the default is all three, which also runs the existing final agent. Each focused selection runs only its corresponding graph node. All graph paths use the same PostgreSQL checkpointer. The response includes flight and hotel arrays, an itinerary, and `complete_plan` for the integrated workflow. The original CLI remains available with `python main.py`.

The flight connector currently returns Aviationstack feed records without filtering by the requested route or dates, and the provider response does not include fares. The hotel connector returns Tavily web-search references, not verified availability, room rates, or property images. The interface labels these limitations rather than presenting estimates as live results.

## Frontend setup

Install Node.js 20.19+ (or 22.12+) and npm. In a separate terminal:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Create `frontend/.env` locally with `VITE_API_URL=http://localhost:8000`. Open the local URL printed by Vite (usually `http://localhost:5173`). Update `FRONTEND_ORIGINS` in the root `.env` if the frontend uses a different origin, then restart the backend. Trip details and saved complete plans are stored in the current browser.

To create a production bundle, run `npm run build` inside `frontend`; Vite writes it to `frontend/dist`.

## Graph reuse

Importing `main.py` defines the existing state and agents without connecting to PostgreSQL or invoking the graph. `connect_database()` sets up and returns the PostgreSQL connection and saver; `build_app(checkpointer, sections=...)` compiles the existing nodes and edges against that saver. The API owns these resources for its lifespan, while the command-line entry point retains its interactive invocation behavior.