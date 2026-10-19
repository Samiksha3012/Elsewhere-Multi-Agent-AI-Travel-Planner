# Elsewhere Travel Planner

Elsewhere is an AI-assisted travel-planning web application. Travellers can provide a destination, dates, trip length, budget, group size, departure city, and personal preferences, then request flight research, hotel research, a day-by-day itinerary, or a combined travel plan. The interface brings those results together while making clear that provider data and AI-generated cost suggestions are not confirmed bookings or live quotes.

## What the project uses

### Frontend

- **React 19** builds the interactive single-page application.
- **Vite 7** provides the frontend development server and production bundler.
- **Lucide React** supplies interface icons.
- **React Markdown** renders the planner's formatted text responses.
- **Browser storage** keeps trip details and saved plans on the current browser.

### Backend and AI workflow

- **Python 3.10+** runs the backend.
- **FastAPI** exposes the HTTP API; **Uvicorn** serves it.
- **Pydantic** validates and normalizes trip requests.
- **LangGraph** builds and executes the sequential travel-planning workflow.
- **LangChain Core** supplies message and model interfaces.
- **Groq via `langchain-groq`** runs the LLM steps using the `openai/gpt-oss-20b` model.
- **Aviationstack** provides flight-feed records through the flight connector.
- **Tavily** searches the web for hotel references.
- **PostgreSQL**, accessed with **Psycopg 3** and `langgraph-checkpoint-postgres`, stores LangGraph checkpoints.
- **python-dotenv** loads local environment configuration.

## Architecture

```text
React + Vite browser app
        |  JSON over HTTP
        v
FastAPI API (Pydantic validation, CORS, response formatting)
        |  LangGraph state and selected workflow
        v
  Flight agent ------> Aviationstack flight feed
  Hotel agent -------> Tavily hotel web search
  Itinerary agent ---> Groq-hosted LLM
        |
        +-- all sections selected --> Final response agent (Groq-hosted LLM)
        |
        +-- graph checkpoints -----> PostgreSQL via PostgresSaver
```

The frontend sends trip details to `POST /plan-trip`. The API validates required values and date ranges, builds a normalized travel query, and invokes the planner with a unique thread ID. LangGraph shares a typed travel state across the selected agents and runs them in sequence. Flight and hotel agents call their provider integrations; the itinerary agent uses the LLM to produce a daily plan that considers the trip details and gathered research. When all sections are selected, the final agent composes the results into an integrated response. The API parses provider text into structured flight and hotel records and returns those together with the itinerary and, for the combined workflow, the complete plan.

The API supports focused requests as well as the full workflow. `sections` can include `flights`, `hotels`, and/or `itinerary`; if omitted, all are selected and the final response agent also runs. Each request gets its own graph thread ID. The PostgreSQL checkpointer is set up when the API starts and shared by compiled planner graphs during that API process. The same graph can also be invoked through the command-line entry point, `python main.py`.

## API example

`POST /plan-trip` accepts JSON such as:

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
  "sections": ["flights", "hotels", "itinerary"]
}
```

The API also provides `GET /health`. When running locally, interactive API documentation is available at `http://localhost:8000/docs`.

## Data and integration limitations

- The Aviationstack connector currently returns flight-feed records without filtering them by the requested route or dates. The provider response used here does not include fares.
- The Tavily integration returns hotel-related web-search references; it does not verify hotel availability, room rates, or property images.
- Itinerary activities and expense amounts are AI-generated suggestions and estimates, not confirmed prices or bookings.
- Trip details and saved plans are stored in the visitor's browser, not in a user-account or trip-history service.

## Setup

### Requirements

- Python 3.10 or newer
- A reachable PostgreSQL database
- Node.js 20.19+ (or 22.12+) and npm
- API credentials for Groq, Aviationstack, and Tavily

### Backend

From the project root in PowerShell, create and activate a virtual environment, then install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create a root `.env` file with your local credentials and database connection string. Do not commit real credentials. The root `.gitignore` excludes `.env` files.

```text
GROQ_API_KEY=your_groq_key
AVIATIONSTACK_API_KEY=your_aviationstack_key
TAVILY_API_KEY=your_tavily_key
DATABASE_URL=your_postgresql_connection_string
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the API from the project root:

```powershell
uvicorn api:app --reload
```

The API runs at `http://localhost:8000`. Startup initializes the PostgreSQL checkpointer. The frontend origin can be changed in `FRONTEND_ORIGINS`; restart the API after changing it.

### Frontend

In a separate terminal:

```powershell
Set-Location .\frontend
npm install
```

Create `frontend/.env` with the API URL:

```text
VITE_API_URL=http://localhost:8000
```

Start the Vite development server:

```powershell
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). To generate a production bundle, run `npm run build` from the `frontend` directory; Vite writes the bundle to `frontend/dist`.
