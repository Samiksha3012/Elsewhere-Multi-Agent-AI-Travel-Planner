import logging
import os
import re
from contextlib import asynccontextmanager
from datetime import date
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field, field_validator, model_validator

from main import build_app, connect_database

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


class PlanTripRequest(BaseModel):
    query: str = Field(min_length=2, max_length=300)
    duration_days: int = Field(ge=1, le=30)
    budget: float = Field(gt=0)
    traveller_count: int = Field(ge=1, le=12)
    departure_city: str | None = Field(default=None, max_length=120)
    destination_city: str | None = Field(default=None, max_length=120)
    destination_country: str | None = Field(default=None, max_length=120)
    departure_date: date | None = None
    return_date: date | None = None
    preferences: str | None = Field(default=None, max_length=500)
    sections: list[Literal["flights", "hotels", "itinerary"]] = Field(
        default_factory=lambda: ["flights", "hotels", "itinerary"]
    )

    @field_validator("query")
    @classmethod
    def query_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("query must not be blank")
        return value

    @field_validator("sections")
    @classmethod
    def sections_must_be_unique_and_nonempty(
        cls,
        value: list[str],
    ) -> list[str]:
        if not value or len(value) != len(set(value)):
            raise ValueError("sections must contain unique planner sections")
        return value

    @model_validator(mode="after")
    def dates_must_be_a_valid_range(self):
        if (self.departure_date is None) != (self.return_date is None):
            raise ValueError("departure_date and return_date must be provided together")
        if (
            self.departure_date is not None
            and self.return_date is not None
            and self.return_date < self.departure_date
        ):
            raise ValueError("return_date must be on or after departure_date")
        return self


def parse_flights(raw_results: str) -> list[dict[str, str]]:
    flights = []
    for block in raw_results.strip().split("\n\n"):
        fields = {}
        for line in block.splitlines():
            key, separator, value = line.partition(":")
            if separator:
                fields[key.strip().lower()] = value.strip()
        if fields:
            flights.append(
                {
                    "flight_number": fields.get("flight", "Unknown flight"),
                    "airline": fields.get("airline", "Unknown airline"),
                    "departure": fields.get("departure", "Unknown"),
                    "arrival": fields.get("arrival", "Unknown"),
                    "status": fields.get("status", "Unknown"),
                    "departure_time": fields.get("departure time", ""),
                    "arrival_time": fields.get("arrival time", ""),
                    "duration": fields.get("duration", ""),
                }
            )
    return flights


def parse_hotels(raw_results: str) -> list[dict[str, str]]:
    hotels = []
    chunks = re.split(r"(?m)(?=^\d+\.\s+\*\*)", raw_results.strip())
    for chunk in chunks:
        lines = chunk.strip().splitlines()
        if not lines:
            continue
        title = re.match(r"^\d+\.\s+\*\*(.*?)\*\*", lines[0])
        if not title:
            continue
        url = lines[1].strip() if len(lines) > 1 else ""
        description = " ".join(line.strip() for line in lines[2:]).strip()
        hotels.append(
            {
                "name": title.group(1).strip(),
                "url": url,
                "description": description,
            }
        )
    return hotels


@asynccontextmanager
async def lifespan(application: FastAPI):
    connection, checkpointer = connect_database()
    try:
        application.state.checkpointer = checkpointer
        application.state.planner = build_app(checkpointer)
        yield
    finally:
        connection.close()


app = FastAPI(title="Travel Planner API", version="1.0.0", lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/plan-trip")
def plan_trip(payload: PlanTripRequest, request: Request) -> dict:
    trip_details = [payload.query.strip()]
    if payload.departure_city:
        trip_details.append(f"departing from {payload.departure_city.strip()}")
    if payload.destination_city and payload.destination_country:
        trip_details.append(
            f"destination city {payload.destination_city.strip()}, "
            f"{payload.destination_country.strip()}"
        )
    if payload.departure_date and payload.return_date:
        trip_details.append(
            f"travel dates {payload.departure_date.isoformat()} to "
            f"{payload.return_date.isoformat()}"
        )
    if payload.preferences:
        trip_details.append(f"preferences: {payload.preferences.strip()}")
    travel_query = (
        "; ".join(trip_details)
        + f"; {payload.duration_days} days, {payload.traveller_count} traveller(s), "
        f"total budget USD ${payload.budget:,.2f}."
    )
    initial_state = {
        "messages": [HumanMessage(content=travel_query)],
        "user_query": travel_query,
        "flight_results": "",
        "hotel_results": "",
        "itinerary": "",
        "llm_calls": 0,
    }
    config = {"configurable": {"thread_id": str(uuid4())}}

    try:
        all_sections = {"flights", "hotels", "itinerary"}
        planner = (
            request.app.state.planner
            if set(payload.sections) == all_sections
            else build_app(request.app.state.checkpointer, tuple(payload.sections))
        )
        result = planner.invoke(initial_state, config=config)
    except Exception as error:
        logger.exception("Trip planning failed")
        raise HTTPException(
            status_code=502,
            detail="The travel planner could not complete this request.",
        ) from error

    messages = result.get("messages", [])
    complete_plan = (
        messages[-1].content
        if set(payload.sections) == {"flights", "hotels", "itinerary"} and messages
        else ""
    )
    return {
        "query": payload.query.strip(),
        "duration_days": payload.duration_days,
        "budget": payload.budget,
        "traveller_count": payload.traveller_count,
        "departure_city": payload.departure_city,
        "destination_city": payload.destination_city,
        "destination_country": payload.destination_country,
        "departure_date": payload.departure_date,
        "return_date": payload.return_date,
        "preferences": payload.preferences,
        "sections": payload.sections,
        "flights": parse_flights(result.get("flight_results", "")),
        "hotels": parse_hotels(result.get("hotel_results", "")),
        "itinerary": result.get("itinerary", ""),
        "complete_plan": complete_plan,
    }