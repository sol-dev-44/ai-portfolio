# agent_langchain.py
# LangChain Agent with Ollama - integrates with existing main.py
# Implements: check_ollama_status(), stream_langchain_response()

import json
import asyncio
import urllib.request
import urllib.parse
import re
from typing import AsyncGenerator, Dict, Any

# =============================================================================
# OLLAMA STATUS CHECK
# =============================================================================

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3"


def check_ollama_status() -> Dict[str, Any]:
    """
    Check if Ollama is running and has the required model.
    Called by main.py health check and agent endpoints.
    """
    try:
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/tags",
            headers={"Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
        
        models = data.get("models", [])
        model_names = [m.get("name", "").split(":")[0] for m in models]
        has_model = OLLAMA_MODEL in model_names
        
        return {
            "available": True,
            "has_llama3": has_model,
            "models": model_names,
            "message": f"Ollama running with {len(models)} models" if has_model else f"Ollama running but {OLLAMA_MODEL} not found. Run: ollama pull {OLLAMA_MODEL}"
        }
    except urllib.error.URLError:
        return {
            "available": False,
            "has_llama3": False,
            "message": "Ollama not running. Start with: ollama serve"
        }
    except Exception as e:
        return {
            "available": False,
            "has_llama3": False,
            "message": f"Ollama check failed: {str(e)}"
        }


# =============================================================================
# TOOLS - Same as Claude version for feature parity
# =============================================================================

def tool_get_weather(city: str, unit: str = "celsius") -> str:
    """Get current weather for a city."""
    try:
        # Geocode
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city)}&count=1&language=en"
        with urllib.request.urlopen(geo_url, timeout=10) as response:
            geo_data = json.loads(response.read().decode())
        
        if not geo_data.get("results"):
            return f"Could not find city: {city}"
        
        result = geo_data["results"][0]
        lat, lon = result["latitude"], result["longitude"]
        name, country = result["name"], result.get("country", "")
        
        # Weather
        temp_unit = "fahrenheit" if unit.lower() == "fahrenheit" else "celsius"
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit={temp_unit}"
        
        with urllib.request.urlopen(weather_url, timeout=10) as response:
            weather = json.loads(response.read().decode())
        
        if not weather.get("current"):
            return f"No weather data for {name}"
        
        current = weather["current"]
        
        conditions = {
            0: "Clear sky ☀️", 1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
            45: "Foggy 🌫️", 48: "Rime fog 🌫️", 51: "Light drizzle 🌧️", 53: "Drizzle 🌧️",
            55: "Dense drizzle 🌧️", 61: "Slight rain 🌧️", 63: "Rain 🌧️", 65: "Heavy rain 🌧️",
            71: "Light snow ❄️", 73: "Snow ❄️", 75: "Heavy snow ❄️", 95: "Thunderstorm ⛈️"
        }
        
        code = current.get("weather_code", 0)
        condition = conditions.get(code, "Unknown")
        unit_symbol = "°F" if temp_unit == "fahrenheit" else "°C"
        
        return f"**{name}, {country}**\n- {condition}\n- Temperature: {current['temperature_2m']}{unit_symbol}\n- Humidity: {current['relative_humidity_2m']}%\n- Wind: {current['wind_speed_10m']} km/h"
    
    except Exception as e:
        return f"Error fetching weather: {str(e)}"


def tool_web_search(query: str, max_results: int = 3) -> str:
    """Search the web for information."""
    results = []
    
    try:
        # Google News RSS
        news_url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
        
        try:
            req = urllib.request.Request(news_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                xml = response.read().decode()
            
            items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)
            for item_xml in items[:max_results]:
                title_match = re.search(r'<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>', item_xml)
                source_match = re.search(r'<source[^>]*>(.*?)</source>', item_xml)
                
                if title_match:
                    title = title_match.group(1).strip()
                    title = title.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
                    source = source_match.group(1).strip() if source_match else ""
                    
                    if title and "<?xml" not in title:
                        results.append(f"**{title}**\n_{source}_" if source else f"**{title}**")
        except:
            pass
        
        # Wikipedia fallback
        if len(results) < 2:
            try:
                wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(query.replace(' ', '_'))}"
                req = urllib.request.Request(wiki_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as response:
                    wiki = json.loads(response.read().decode())
                
                if wiki.get("extract") and len(wiki["extract"]) > 50:
                    extract = wiki["extract"][:300] + ("..." if len(wiki["extract"]) > 300 else "")
                    results.append(f"**{wiki['title']}** (Wikipedia)\n{extract}")
            except:
                pass
        
        if not results:
            return f'No results found for "{query}".'
        
        return f'**Search: "{query}"**\n\n' + "\n\n---\n\n".join(results[:max_results])
    
    except Exception as e:
        return f"Search error: {str(e)}"


def tool_calculate(expression: str) -> str:
    """Perform mathematical calculations."""
    if not re.match(r'^[0-9+\-*/().%\s]+$', expression):
        return "Error: Invalid characters. Only numbers and +, -, *, /, %, () allowed."
    
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        if isinstance(result, float):
            result = int(result) if result == int(result) else round(result, 6)
        return f"`{expression}` = **{result}**"
    except Exception as e:
        return f"Calculation error: {str(e)}"


def tool_get_time() -> str:
    """Get the current date and time."""
    from datetime import datetime
    now = datetime.now()
    date_str = now.strftime("%A, %B %d, %Y")
    time_str = now.strftime("%I:%M %p").lstrip("0")
    return f"**{date_str}** at **{time_str}**"


# Tool registry
TOOLS = {
    "get_weather": {
        "func": tool_get_weather,
        "description": "Get current weather for a city. Args: city (required), unit (optional: celsius/fahrenheit)",
        "source": "Open-Meteo API",
        "source_url": "https://open-meteo.com"
    },
    "web_search": {
        "func": tool_web_search,
        "description": "Search the web for news and information. Args: query (required)",
        "source": "Google News + Wikipedia",
        "source_url": "https://news.google.com"
    },
    "calculate": {
        "func": tool_calculate,
        "description": "Calculate math expressions. Args: expression (required, e.g., '18/100*94.50')",
        "source": "Python Math Engine",
        "source_url": ""
    },
    "get_time": {
        "func": tool_get_time,
        "description": "Get current date and time. No args required.",
        "source": "Server System Clock",
        "source_url": ""
    }
}


# =============================================================================
# LANGCHAIN AGENT
# =============================================================================

def create_langchain_agent():
    """Create a LangChain agent with Ollama."""
    try:
        from langchain_community.chat_models import ChatOllama
        from langchain.agents import initialize_agent, AgentType
        from langchain.tools import tool as langchain_tool
        
        # Create LangChain tool wrappers
        @langchain_tool
        def get_weather(city: str) -> str:
            """Get current weather for a city."""
            return tool_get_weather(city)
        
        @langchain_tool
        def web_search(query: str) -> str:
            """Search the web for news and information."""
            return tool_web_search(query)
        
        @langchain_tool
        def calculate(expression: str) -> str:
            """Calculate math expressions like '18/100*94.50'."""
            return tool_calculate(expression)
        
        @langchain_tool
        def get_time() -> str:
            """Get current date and time."""
            return tool_get_time()
        
        llm = ChatOllama(
            model=OLLAMA_MODEL,
            temperature=0,
            base_url=OLLAMA_BASE_URL
        )
        
        tools = [get_weather, web_search, calculate, get_time]
        
        agent = initialize_agent(
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5
        )
        
        return agent, tools
    
    except ImportError as e:
        print(f"⚠️ LangChain not installed: {e}")
        return None, None


# =============================================================================
# STREAMING RESPONSE
# =============================================================================

async def stream_langchain_response(message: str) -> AsyncGenerator[str, None]:
    """
    Stream agent response in NDJSON format matching Claude endpoint.
    Called by main.py POST /api/agent/langchain
    """
    
    # Check dependencies
    try:
        from langchain_community.chat_models import ChatOllama
        from langchain.agents import initialize_agent, AgentType
        from langchain.tools import tool as langchain_tool
        from langchain.callbacks.base import BaseCallbackHandler
    except ImportError:
        yield json.dumps({
            "type": "error",
            "content": "LangChain not installed. Run: pip install langchain langchain-community"
        }) + "\n"
        return
    
    # Check Ollama
    status = check_ollama_status()
    if not status["available"]:
        yield json.dumps({
            "type": "error",
            "content": f"Ollama not available: {status['message']}"
        }) + "\n"
        return
    
    # Custom callback to capture tool calls
    class StreamingCallback(BaseCallbackHandler):
        def __init__(self):
            self.events = []
            self.current_tool = None
        
        def on_tool_start(self, serialized, input_str, **kwargs):
            tool_name = serialized.get("name", "unknown")
            self.current_tool = tool_name
            
            # Parse args
            if isinstance(input_str, str):
                try:
                    args = json.loads(input_str)
                except:
                    args = {"input": input_str}
            else:
                args = dict(input_str) if input_str else {}
            
            self.events.append({
                "type": "tool_call",
                "id": f"tool-{len(self.events)}",
                "tool": tool_name,
                "args": args
            })
        
        def on_tool_end(self, output, **kwargs):
            tool_info = TOOLS.get(self.current_tool, {})
            self.events.append({
                "type": "tool_result",
                "id": f"tool-{len(self.events) - 1}",
                "tool": self.current_tool,
                "result": str(output),
                "source": tool_info.get("source", "Unknown"),
                "source_url": tool_info.get("source_url", "")
            })
    
    try:
        # Create tools with LangChain decorators
        @langchain_tool
        def get_weather(city: str) -> str:
            """Get current weather for a city."""
            return tool_get_weather(city)
        
        @langchain_tool
        def web_search(query: str) -> str:
            """Search the web for news and information."""
            return tool_web_search(query)
        
        @langchain_tool
        def calculate(expression: str) -> str:
            """Calculate math expressions."""
            return tool_calculate(expression)
        
        @langchain_tool
        def get_time() -> str:
            """Get current date and time."""
            return tool_get_time()
        
        # Initialize
        llm = ChatOllama(
            model=OLLAMA_MODEL,
            temperature=0,
            base_url=OLLAMA_BASE_URL
        )
        
        callback = StreamingCallback()
        
        agent = initialize_agent(
            [get_weather, web_search, calculate, get_time],
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=False,
            handle_parsing_errors=True,
            max_iterations=5
        )
        
        # Run agent (blocking, in thread)
        result = await asyncio.to_thread(
            agent.invoke,
            {"input": message},
            {"callbacks": [callback]}
        )
        
        # Stream captured events
        for event in callback.events:
            yield json.dumps(event) + "\n"
            await asyncio.sleep(0.05)  # Small delay for UI
        
        # Stream final answer
        output = result.get("output", "I couldn't generate a response.")
        yield json.dumps({
            "type": "text",
            "content": output
        }) + "\n"
        
        yield json.dumps({"type": "complete"}) + "\n"
        
    except Exception as e:
        yield json.dumps({
            "type": "error",
            "content": str(e)
        }) + "\n"


# =============================================================================
# TESTING
# =============================================================================

if __name__ == "__main__":
    # Quick test
    print("Testing Ollama status...")
    status = check_ollama_status()
    print(f"Status: {status}")
    
    if status["available"]:
        print("\nTesting tools...")
        print(f"Weather: {tool_get_weather('Tokyo')[:100]}...")
        print(f"Calculate: {tool_calculate('18/100*94.50')}")
        print(f"Time: {tool_get_time()}")