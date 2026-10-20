import os
from typing import TypedDict, Annotated
import operator

import psycopg
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import (
        AnyMessage, 
        HumanMessage, 
        SystemMessage
)

from langchain_groq import ChatGroq

# here we are creating these tool packages
# We created tools folder inside which tavily_tool file is there with tavily_search function
from tools.tavily_tool import tavily_search
from tools.flight_tool import search_flights
from dotenv import load_dotenv

load_dotenv()

class TravelState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    user_query: str
    flight_results: str
    hotel_results: str
    itinerary: str
    llm_calls: Annotated[int, operator.add]

def flight_agent(state: TravelState):
    query = state["user_query"]
    flight_data = search_flights(query)
    return {
        "flight_results": flight_data,
        "llm_calls": 1
    }

def hotel_agent(state: TravelState):
    query = f"Best hotels for {state['user_query']}"
    hotel_results = tavily_search(query)

    return {
        "hotel_results": hotel_results,
        "llm_calls": 1
    }

def itinerary_agent(state: TravelState):

    prompt = f"""
    Create a travel itinerary.
    User Query:
    {state['user_query']}

    Flight Results:
    {state['flight_results']}

    Hotel Results:
    {state['hotel_results']}

    Format the itinerary with a clear heading for each day (for example, "Day 1: ...").
    For each day, include morning, afternoon, and evening suggestions, named
    attractions and restaurant ideas when relevant, and clearly labeled
    approximate activity or meal expenses in the destination's local currency.
    Return readable Markdown using a short bullet list for each day. Put each
    activity on its own bullet and label it Morning, Afternoon, or Evening.
    Do not use tables, pipe characters, code fences, or HTML. Do not add a
    combined trip-cost table or totals. Flight fares and accommodation rates
    are unavailable; never invent or estimate them. Only give approximate
    activity and meal costs, clearly labeled as AI estimates rather than live
    quotes or confirmed prices.
    """

    response = ChatGroq(model="openai/gpt-oss-20b").invoke([
        SystemMessage(
            content="You are an expert travel planner"
        ),
        HumanMessage(content=prompt)
    ])

    return {
        "itinerary": response.content,
        "messages": [response],
        "llm_calls": 1
    }

# Final Response Agent
def final_agent(state: TravelState):

    final_prompt = f"""
    Generate final best recommended itinerary plan.

    Flights:
    {state['flight_results']}

    Hotels:
    {state['hotel_results']}

    Itinerary:
    {state['itinerary']}

    Give best recommended itenary plan using the above information.
    This is a recommendation or suggestion for the user based on the above information.
    Do not include any other information or make up any information.
    Make sure to include all the information in a well formatted manner.
    """

    response = ChatGroq(model="openai/gpt-oss-20b").invoke([
        HumanMessage(content=final_prompt)
    ])

    return {
        "messages": [response],
        "llm_calls": 1
    }

def connect_database() -> tuple[psycopg.Connection, PostgresSaver]:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set before connecting to PostgreSQL")

    connection = psycopg.connect(database_url, autocommit=True)
    try:
        checkpointer = PostgresSaver(connection)
        checkpointer.setup()
    except Exception:
        connection.close()
        raise
    return connection, checkpointer



def build_app(
    checkpointer: PostgresSaver,
    sections: tuple[str, ...] | None = None,
):
    graph = StateGraph(TravelState)

    agent_nodes = {
        "flights": ("flight_agent", flight_agent),
        "hotels": ("hotel_agent", hotel_agent),
        "itinerary": ("itinerary_agent", itinerary_agent),
    }

    selected_sections = set(
        agent_nodes if sections is None else sections
    )

    unknown_sections = selected_sections.difference(agent_nodes)

    if unknown_sections or not selected_sections:
        raise ValueError(
            f"Unsupported planner sections: {sorted(unknown_sections)}"
        )

    # Register only the requested agents
    for section, (name, node) in agent_nodes.items():
        if section in selected_sections:
            graph.add_node(name, node)

    # Include final_agent only when all sections are selected
    include_final = (
        sections is None
        or selected_sections == set(agent_nodes)
    )

    if include_final:
        graph.add_node("final_agent", final_agent)

    search_nodes = [
        agent_nodes[section][0]
        for section in ("flights", "hotels")
        if section in selected_sections
    ]
    for node_name in search_nodes:
        graph.add_edge(START, node_name)

    # Run itinerary after the selected search agents finish
    if "itinerary" in selected_sections:
        if search_nodes:
            graph.add_edge(search_nodes, "itinerary_agent")
        else:
            graph.add_edge(START, "itinerary_agent")

        if include_final:
            graph.add_edge("itinerary_agent", "final_agent")
            graph.add_edge("final_agent", END)
        else:
            graph.add_edge("itinerary_agent", END)

    else:
        # No itinerary requested: finish after the search agents
        for node_name in search_nodes:
            graph.add_edge(node_name, END)

    return graph.compile(checkpointer=checkpointer)

if __name__ == "__main__":
    user_input = input("Enter travel request: ")
    connection, checkpointer = connect_database()
    config = {
        "configurable": {
            "thread_id": "user_samiksha"
        }
    }

    try:
        app = build_app(checkpointer)
        result = app.invoke(
            {
                "messages": [HumanMessage(content=user_input)],
                "user_query": user_input,
                "flight_results": "",
                "hotel_results": "",
                "itinerary": "",
                "llm_calls": 0
            },
            config=config
        )

        print("\nFINAL RESPONSE:\n")
        for msg in result["messages"]:
            print(msg.content)
    finally:
        connection.close()