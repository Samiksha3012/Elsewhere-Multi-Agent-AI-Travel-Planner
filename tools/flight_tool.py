import os

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("AVIATIONSTACK_API_KEY")

def search_flights(_query: str) -> str:
    # The current Aviationstack integration returns its feed without route/date filters.
    _ = _query
    if not API_KEY:
        raise RuntimeError("AVIATIONSTACK_API_KEY is not configured.")

    url = "http://api.aviationstack.com/v1/flights"

    params = {
        "access_key": API_KEY,
        "limit": 5,
    }

    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()
    data = response.json()
    if data.get("error"):
        raise RuntimeError(f"Aviationstack request failed: {data['error']}")
    if "data" not in data:
        raise RuntimeError("Aviationstack returned no flight data.")

    flights = []

    for flight in data["data"][:5]:
        airline = (flight.get("airline") or {}).get("name") or "Unknown"
        flight_details = flight.get("flight") or {}
        departure_details = flight.get("departure") or {}
        arrival_details = flight.get("arrival") or {}
        departure = departure_details.get("airport") or "Unknown"
        arrival = arrival_details.get("airport") or "Unknown"
        status = flight.get("flight_status") or "Unknown"
        flight_number = flight_details.get("iata") or flight_details.get("number")
        departure_time = departure_details.get("scheduled")
        arrival_time = arrival_details.get("scheduled")
        flights.append(
            f"""
Flight: {flight_number or 'Not provided'}
Airline: {airline}
Departure: {departure}
Arrival: {arrival}
Status: {status}
Departure time: {departure_time or 'Not provided'}
Arrival time: {arrival_time or 'Not provided'}
""".strip()
        )

    return "\n\n".join(flights)