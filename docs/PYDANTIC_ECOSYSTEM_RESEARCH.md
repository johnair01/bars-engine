# The Pydantic Ecosystem: A Plain-English Field Guide

> Written like a workshop handout at the Apple Store Genius Bar — for people who
> know their way around a computer but have never touched this particular stack.

---

## Table of Contents

1. [The Big Picture — What Are We Looking At?](#1-the-big-picture)
2. [Pydantic (The Foundation) — Your Data's Spell-Checker](#2-pydantic-the-foundation)
3. [Pydantic AI (The Agent Framework) — Teaching Your App to Think](#3-pydantic-ai-the-agent-framework)
4. [The Friends of Pydantic — FastAPI, UV, and the Modern Python Toolbox](#4-friends-of-pydantic)
5. [Canonical Patterns — The Recipes That Matter](#5-canonical-patterns)
6. [The Ontology — How It All Fits Together](#6-the-ontology)
7. [Quick-Reference Cheat Sheet](#7-cheat-sheet)

---

## 1. The Big Picture

Imagine you're building a house. You need:

- **Bricks that always fit** — that's **Pydantic** (data validation)
- **A smart foreman who can talk to suppliers** — that's **Pydantic AI** (AI agent framework)
- **The plumbing and electrical** — that's **FastAPI** (web server)
- **A really fast delivery truck** — that's **UV** (Python package manager)
- **A security camera system** — that's **Logfire** (observability)

The Pydantic team built all of these (except UV, which is by Astral, close allies).
They share the same philosophy: **Python's type hints should run the show.**
You declare what shape your data should be, and the tools enforce it, generate
schemas, build APIs, and even tell AI models what to return.

### Who Made This?

**Samuel Colvin** and the Pydantic team. Pydantic is downloaded **360+ million times per month**.
It's used by every FAANG company, inside the OpenAI SDK, the Anthropic SDK, the Google
ADK, LangChain, Hugging Face Transformers, and about 8,000 other packages. If you've
used Python in the last three years, you've probably used Pydantic without knowing it.

---

## 2. Pydantic (The Foundation) — Your Data's Spell-Checker

**What it does:** You describe the shape of your data using Python type hints,
and Pydantic makes sure real-world data matches that shape. If it doesn't match,
you get a clear error explaining exactly what went wrong and where.

**Think of it like:** A very strict but helpful receptionist. You hand them a form,
they check every field, fix obvious mistakes (a string `"42"` becomes the number `42`),
and hand you back a clean, guaranteed-correct version.

### The Core Pattern: BaseModel

```python
from pydantic import BaseModel

class Customer(BaseModel):
    name: str
    age: int
    email: str

# This works — even though age is a string, Pydantic converts it:
customer = Customer(name="Linda", age="67", email="linda@aol.com")
print(customer.age)       # 67 (an actual integer now)
print(type(customer.age)) # <class 'int'>

# This fails — "not a number" can't become an int:
# Customer(name="Linda", age="not a number", email="linda@aol.com")
# → ValidationError: Input should be a valid integer
```

**Key concept:** Pydantic doesn't just *check* your data — it *coerces* it.
A string `"67"` becomes the integer `67`. A date string `"2024-01-15"` becomes
a real Python `datetime` object. This is extremely useful when data comes from
JSON APIs, form submissions, or databases where everything starts as text.

### Fields — Adding Rules to Your Data

Fields let you add constraints — minimum values, maximum lengths, required vs. optional:

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(max_length=100)           # No more than 100 characters
    price: float = Field(gt=0)                  # Must be greater than zero
    quantity: int = Field(ge=0, default=0)       # Can't be negative, defaults to 0
    description: str = Field(default="No description provided")
```

**Think of Field() like the fine print on a form** — "This box must be filled in",
"Numbers only", "Maximum 100 characters."

### Validators — Custom Rules

Sometimes the built-in checks aren't enough. Validators let you write your own:

```python
from pydantic import BaseModel, field_validator

class SignupForm(BaseModel):
    username: str
    password: str
    confirm_password: str

    @field_validator('username')
    @classmethod
    def username_must_be_lowercase(cls, v):
        if v != v.lower():
            raise ValueError('Username must be lowercase')
        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_must_match(cls, v, info):
        if v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v
```

There are four flavors of validators:

| Type | When It Runs | Plain English |
|------|-------------|---------------|
| **After** | After Pydantic's built-in checks | "Check the clean data" (most common) |
| **Before** | Before any checks | "Clean up the raw input first" |
| **Plain** | Replaces Pydantic's checks entirely | "I'll handle everything myself" |
| **Wrap** | Wraps around Pydantic's checks | "Let me intervene before AND after" |

### Serialization — Getting Data Back Out

Once data is in a model, you often need to send it somewhere (an API response,
a database, a JSON file). Pydantic gives you clean export methods:

```python
customer = Customer(name="Linda", age=67, email="linda@aol.com")

# To a Python dictionary:
customer.model_dump()
# → {'name': 'Linda', 'age': 67, 'email': 'linda@aol.com'}

# Directly to a JSON string (faster than json.dumps):
customer.model_dump_json()
# → '{"name":"Linda","age":67,"email":"linda@aol.com"}'

# Skip fields you don't want:
customer.model_dump(exclude={'email'})
# → {'name': 'Linda', 'age': 67}
```

### Nested Models — Models Inside Models

Models compose naturally, like Russian nesting dolls:

```python
from pydantic import BaseModel

class Address(BaseModel):
    street: str
    city: str
    state: str

class Customer(BaseModel):
    name: str
    home_address: Address
    work_address: Address | None = None  # Optional

# Pydantic auto-converts nested dicts into the right model:
customer = Customer(
    name="Linda",
    home_address={"street": "123 Main St", "city": "Portland", "state": "OR"}
)
```

### Generic Models — Reusable Templates

```python
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    data: T
    success: bool

# Now you can use it with any type:
response = ApiResponse[int](data=42, success=True)
response = ApiResponse[list[str]](data=["a", "b"], success=True)
```

### The Mental Model

> Pydantic is the **universal translator** between messy real-world data and
> clean Python objects. JSON in? Clean objects out. Objects in? Clean JSON out.
> Type hints are the Rosetta Stone.

---

## 3. Pydantic AI (The Agent Framework) — Teaching Your App to Think

**What it does:** Pydantic AI lets you build "agents" — Python programs that can
talk to AI models (GPT, Claude, Gemini, etc.), use tools, and return structured,
validated data. It's the Pydantic team's answer to LangChain, but designed to feel
like FastAPI: clean, typed, minimal boilerplate.

**Think of it like:** If Pydantic is a strict receptionist, Pydantic AI is that
receptionist *plus* a whole office of specialists the receptionist can call on —
a researcher, a calculator, a database clerk — and the receptionist makes sure
everything that comes back to you is properly formatted.

### The Five Key Concepts

#### Concept 1: The Agent

An Agent is the main character. It wraps an AI model and gives it instructions,
tools, and output expectations:

```python
from pydantic_ai import Agent

agent = Agent(
    'openai:gpt-4o',                                    # Which AI model to use
    instructions='Be concise. Reply in one sentence.',   # Standing orders
)

result = agent.run_sync('What is the capital of France?')
print(result.output)
# → "The capital of France is Paris."
```

**Key insight:** Agents are designed to be **created once and reused everywhere**,
like a FastAPI app. You don't create a new agent per request.

Three ways to run an agent:
- `agent.run_sync(...)` — simple synchronous call (easiest)
- `await agent.run(...)` — async call (for web servers)
- `agent.run_stream(...)` — streaming (words arrive as they're generated)

#### Concept 2: Structured Output

Instead of getting raw text back, you can force the AI to return data in a
specific shape — verified by Pydantic:

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class CityInfo(BaseModel):
    city: str
    country: str
    population: int

agent = Agent('openai:gpt-4o', output_type=CityInfo)
result = agent.run_sync('Tell me about Paris')
print(result.output)
# → city='Paris' country='France' population=2161000
print(result.output.country)
# → 'France'
```

**This is the killer feature.** The AI's free-form response is automatically
parsed, validated, and returned as a typed Python object. If the AI returns
bad data, Pydantic AI tells the model to try again (up to a retry limit).

Three modes for structured output:
- **Tool Output** (default) — uses the model's function-calling API
- **Native Output** — uses the model's "structured output" feature
- **Prompted Output** — injects the schema into the instructions as text

#### Concept 3: Tools — Giving the Agent Superpowers

Tools are Python functions the AI can call to get information or perform actions.
The AI decides *when* to call them based on the conversation:

```python
from pydantic_ai import Agent, RunContext

agent = Agent(
    'openai:gpt-4o',
    instructions='Help the user check their account balance.',
)

@agent.tool
async def get_balance(ctx: RunContext, account_id: str) -> float:
    """Look up the account balance in our database."""
    # In real life, this would hit a database
    balances = {"ACC-001": 1542.50, "ACC-002": 89.00}
    return balances.get(account_id, 0.0)

result = agent.run_sync('What is the balance for ACC-001?')
print(result.output)
# → "The balance for account ACC-001 is $1,542.50."
```

**How it works behind the scenes:**
1. You ask the agent a question
2. The AI reads your question and the available tool descriptions
3. The AI decides to call `get_balance` with `account_id="ACC-001"`
4. Pydantic AI runs your Python function and sends the result back to the AI
5. The AI writes a human-friendly response using the tool's result

**Two decorator flavors:**
- `@agent.tool` — function receives `RunContext` (access to dependencies)
- `@agent.tool_plain` — function has no context (simpler)

Pydantic AI automatically extracts the function's parameter names, types, and
docstring to build the tool's schema. The AI sees this schema and knows how to
call your function correctly.

#### Concept 4: Dependencies — Giving the Agent Real-World Connections

Dependencies are objects your agent's tools and prompts need at runtime — database
connections, API keys, HTTP clients. They're injected cleanly, like FastAPI's
dependency injection:

```python
from dataclasses import dataclass
import httpx
from pydantic_ai import Agent, RunContext

@dataclass
class AppDeps:
    api_key: str
    http_client: httpx.AsyncClient

agent = Agent('openai:gpt-4o', deps_type=AppDeps)

@agent.tool
async def fetch_weather(ctx: RunContext[AppDeps], city: str) -> str:
    """Get the current weather for a city."""
    response = await ctx.deps.http_client.get(
        f'https://weather-api.example.com/{city}',
        headers={'Authorization': f'Bearer {ctx.deps.api_key}'}
    )
    return response.text

# At runtime, pass the concrete dependencies:
async def main():
    async with httpx.AsyncClient() as client:
        deps = AppDeps(api_key='sk-...', http_client=client)
        result = await agent.run('Weather in Portland?', deps=deps)
```

**Why this matters:** Your tools never hardcode connections. In tests, you swap
in fake dependencies. In production, you pass real ones. The agent code never changes.

#### Concept 5: Instructions (System Prompts)

Instructions tell the AI *how to behave*. They can be static strings or dynamic
functions that pull from context:

```python
from datetime import date
from pydantic_ai import Agent, RunContext

agent = Agent(
    'openai:gpt-4o',
    deps_type=str,
    instructions="You are a friendly customer service agent. Always use the customer's name.",
)

@agent.instructions
def add_customer_context(ctx: RunContext[str]) -> str:
    return f"The customer's name is {ctx.deps}. Today is {date.today()}."

result = agent.run_sync("When does my subscription renew?", deps="Linda")
```

**Instructions vs. System Prompts:** Use `instructions` (preferred) — they're
re-evaluated fresh each run. Use `system_prompt` only when you want prompts to
persist across conversation turns.

---

### Multi-Agent Patterns — When One Agent Isn't Enough

Pydantic AI defines a **progressive complexity ladder**:

#### Level 1: Single Agent
One agent, one model, some tools. Handles most use cases.

#### Level 2: Agent Delegation
One agent calls another via a tool. The "boss" agent decides when to delegate:

```python
joke_selection_agent = Agent('openai:gpt-4o',
    instructions='Use joke_factory to generate jokes, then pick the best one.')
joke_generation_agent = Agent('openai:gpt-4o-mini', output_type=list[str])

@joke_selection_agent.tool
async def joke_factory(ctx: RunContext, count: int) -> list[str]:
    result = await joke_generation_agent.run(
        f'Generate {count} jokes.',
        usage=ctx.usage,  # Share token tracking with parent
    )
    return result.output
```

#### Level 3: Programmatic Hand-Off
Your application code decides which agent to call next — like a receptionist
routing calls to different departments:

```python
# First: the flight search agent finds a flight
flight_result = await flight_agent.run("NYC to LAX", deps=deps)

# Then: the seat selection agent handles seating
seat_result = await seat_agent.run(
    "Window seat please",
    message_history=flight_result.new_messages()  # Pass conversation context
)
```

#### Level 4: Graph-Based Workflows
For complex flows with loops, branches, and human-in-the-loop steps, Pydantic
provides `pydantic-graph` — a state machine library:

```python
from pydantic_graph import BaseNode, End, Graph, GraphRunContext

@dataclass
class WriteEmail(BaseNode[State]):
    async def run(self, ctx: GraphRunContext[State]) -> ReviewEmail:
        # AI writes an email
        return ReviewEmail(email)

@dataclass
class ReviewEmail(BaseNode[State, None, Email]):
    email: Email
    async def run(self, ctx: GraphRunContext[State]) -> WriteEmail | End[Email]:
        # AI reviews — approve or send back for rewrite
        if approved:
            return End(self.email)
        else:
            return WriteEmail(feedback="Make it more personal")

graph = Graph(nodes=[WriteEmail, ReviewEmail])
result = await graph.run(WriteEmail(), state=state)
```

**The graph philosophy:** Nodes are dataclasses. The return type annotation of
each node's `run()` method defines which nodes it can transition to. Type hints
literally define the edges of your state machine.

---

### Testing — No AI Bills During Development

Pydantic AI provides two fake models for testing:

**TestModel** — generates dummy data that satisfies your schemas:
```python
from pydantic_ai.models.test import TestModel

with weather_agent.override(model=TestModel()):
    result = await weather_agent.run("What's the weather?", deps=fake_deps)
    # Tools get called with dummy args, output is schema-valid but generic
```

**FunctionModel** — you control exactly what the "AI" returns:
```python
from pydantic_ai.models.function import FunctionModel

def my_fake_model(messages, info):
    return ModelResponse(parts=[TextPart("Sunny and 72°F")])

with agent.override(model=FunctionModel(my_fake_model)):
    result = agent.run_sync("Weather?")
```

**Safety net:** Set `models.ALLOW_MODEL_REQUESTS = False` in your test suite to
guarantee no real API calls slip through.

---

### Evals — Grading Your Agent's Homework

`pydantic-evals` is a separate package for systematically testing AI output quality:

```python
from pydantic_evals import Case, Dataset

dataset = Dataset(cases=[
    Case(name='capital_question',
         inputs='What is the capital of France?',
         expected_output='Paris'),
    Case(name='math_question',
         inputs='What is 2+2?',
         expected_output='4'),
])

report = dataset.evaluate_sync(my_agent_function)
report.print()
```

Evaluators can be deterministic (exact match), custom scorers, or even LLM judges
that use another AI to grade the output.

---

### Observability — X-Ray Vision for Your Agents

**Pydantic Logfire** gives you a visual trace of everything that happens during
an agent run — every message to/from the AI, every tool call, token usage, latency:

```python
import logfire
logfire.configure()
logfire.instrument_pydantic_ai()

# That's it. Now every agent.run() produces detailed traces.
```

Built on **OpenTelemetry**, so you can also send traces to Datadog, New Relic,
Grafana, or any OTel-compatible backend instead.

---

### MCP — The Universal Tool Protocol

**Model Context Protocol (MCP)** is a standard (championed by Anthropic) that lets
AI apps connect to external tools via a common interface. Pydantic AI supports it
three ways:

1. **Direct client** — `MCPServer` connects to any MCP-compliant server
2. **FastMCP client** — `FastMCPToolset` wraps the FastMCP library
3. **Built-in model tool** — some providers (like Anthropic) can connect to MCP
   servers natively

Think of MCP like USB-C for AI tools — one standard plug, many devices.

---

## 4. Friends of Pydantic

### FastAPI — The Web Framework

FastAPI is the web framework that made Pydantic famous. It uses Pydantic models
to automatically:
- Validate incoming request data
- Generate OpenAPI/Swagger documentation
- Serialize response data

Pydantic AI agents plug directly into FastAPI endpoints:

```python
from fastapi import FastAPI
from pydantic_ai import Agent

app = FastAPI()
agent = Agent('openai:gpt-4o', output_type=CityInfo)

@app.get("/city/{name}")
async def get_city(name: str):
    result = await agent.run(f"Tell me about {name}")
    return result.output  # Already a Pydantic model → auto-serialized to JSON
```

### UV — The Fast Package Manager

UV (by Astral, who also make Ruff) is a **Rust-powered Python package manager**
that replaces pip, virtualenv, and pyenv. It's 10-100x faster than pip.

```bash
uv pip install pydantic-ai          # Installs in ~1 second
uv run python my_agent.py           # Runs in a managed virtual environment
```

The Pydantic team recommends UV as the default installation method.

### The Full Stack

| Layer | Tool | Role |
|-------|------|------|
| Package Management | **UV** | Install packages, manage environments (blazing fast) |
| Data Validation | **Pydantic** | Define and validate data shapes |
| Web Framework | **FastAPI** | HTTP endpoints, auto-docs |
| AI Agents | **Pydantic AI** | LLM orchestration, tools, structured output |
| Observability | **Logfire** | Tracing, debugging, monitoring |
| Code Quality | **Ruff** | Linting and formatting (also by Astral) |

---

## 5. Canonical Patterns — The Recipes That Matter

### Pattern 1: The Structured Extractor

**Use case:** Pull structured data from unstructured text.

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class ContactInfo(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None

extractor = Agent('openai:gpt-4o', output_type=ContactInfo)
result = extractor.run_sync(
    "Hi, I'm Bob Smith from Acme Corp. Reach me at bob@acme.com or 555-0123."
)
print(result.output)
# → name='Bob Smith' email='bob@acme.com' phone='555-0123' company='Acme Corp'
```

### Pattern 2: The Tool-Augmented Agent

**Use case:** Agent that looks things up before answering.

```python
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext

@dataclass
class SearchDeps:
    db_connection: DatabaseConn

agent = Agent('openai:gpt-4o', deps_type=SearchDeps,
    instructions='Answer questions using the search tool. Cite your sources.')

@agent.tool
async def search_knowledge_base(ctx: RunContext[SearchDeps], query: str) -> str:
    """Search our internal knowledge base."""
    results = await ctx.deps.db_connection.search(query)
    return "\n".join(results)
```

### Pattern 3: The Validated Pipeline

**Use case:** AI generates data, custom validator checks it, retry if wrong.

```python
from pydantic_ai import Agent, RunContext, ModelRetry

agent = Agent('openai:gpt-4o', output_type=SQLQuery)

@agent.output_validator
async def validate_sql(ctx: RunContext, output: SQLQuery) -> SQLQuery:
    try:
        await ctx.deps.db.execute(f"EXPLAIN {output.query}")
    except QueryError as e:
        raise ModelRetry(f"Invalid SQL: {e}")  # AI tries again
    return output
```

### Pattern 4: The Delegation Chain

**Use case:** Router agent delegates to specialist agents.

```python
router = Agent('openai:gpt-4o',
    output_type=[hand_off_to_billing, hand_off_to_technical, GeneralResponse],
    instructions='Route the customer to the right department.')

@router.tool
async def hand_off_to_billing(ctx: RunContext, query: str) -> str:
    result = await billing_agent.run(query, deps=ctx.deps, usage=ctx.usage)
    return result.output
```

### Pattern 5: The Streaming UI

**Use case:** Show AI responses word-by-word (like ChatGPT).

```python
async with agent.run_stream('Write me a story') as result:
    async for chunk in result.stream_text():
        print(chunk, end='', flush=True)  # Words appear as they arrive
```

### Pattern 6: The Conversation

**Use case:** Multi-turn chat with memory.

```python
agent = Agent('openai:gpt-4o')

result1 = agent.run_sync("My name is Linda.")
result2 = agent.run_sync(
    "What's my name?",
    message_history=result1.new_messages()  # Pass previous context
)
# → "Your name is Linda."
```

### Pattern 7: The Graph Workflow

**Use case:** Complex process with loops, approvals, branching.

```python
# Define nodes as dataclasses, edges as return types
@dataclass
class Draft(BaseNode[State]):
    async def run(self, ctx) -> Review:
        ...

@dataclass
class Review(BaseNode[State, None, FinalDoc]):
    async def run(self, ctx) -> Draft | End[FinalDoc]:
        if approved: return End(doc)
        else: return Draft(feedback=notes)

graph = Graph(nodes=[Draft, Review])
```

---

## 6. The Ontology — How It All Fits Together

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI (or any Python app)                         │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │  Pydantic AI Agent                           │    │   │
│  │  │                                              │    │   │
│  │  │  ┌─────────┐  ┌──────────┐  ┌───────────┐   │    │   │
│  │  │  │ Instruct│  │  Tools   │  │  Output   │   │    │   │
│  │  │  │  ions   │  │ (funcs)  │  │  Type     │   │    │   │
│  │  │  └─────────┘  └──────────┘  └───────────┘   │    │   │
│  │  │       │              │             │         │    │   │
│  │  │       └──────────────┼─────────────┘         │    │   │
│  │  │                      │                       │    │   │
│  │  │              ┌───────▼────────┐              │    │   │
│  │  │              │  LLM Provider  │              │    │   │
│  │  │              │ (OpenAI, etc.) │              │    │   │
│  │  │              └───────┬────────┘              │    │   │
│  │  │                      │                       │    │   │
│  │  │              ┌───────▼────────┐              │    │   │
│  │  │              │   Pydantic     │              │    │   │
│  │  │              │  Validation    │              │    │   │
│  │  │              └────────────────┘              │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │  Dependencies (DB, HTTP, API keys) ◄─── injected     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Logfire / OpenTelemetry ◄──── traces everything            │
└─────────────────────────────────────────────────────────────┘
```

### The Design Philosophy (In One Sentence Each)

1. **Type hints are the source of truth.** Everything — validation, serialization, tool schemas, graph edges — derives from Python type annotations.

2. **"FastAPI feeling" for AI.** Minimal boilerplate. Decorators for registration. Dependency injection for real-world connections. Type safety for confidence.

3. **Model-agnostic by design.** Swap OpenAI for Anthropic for Gemini with one string change. Your business logic never touches provider-specific code.

4. **Validation is the superpower you already had.** Pydantic was already the validation layer inside the OpenAI SDK, Anthropic SDK, LangChain, etc. Pydantic AI cuts out the middleman.

5. **Progressive complexity.** Start with a 5-line agent. Add tools when needed. Add dependencies for production. Add graphs only for genuinely complex workflows. Never pay for complexity you don't use.

6. **Test without AI.** `TestModel` and `FunctionModel` mean you can unit-test everything without making a single API call or spending a single token.

7. **Observe everything.** Two lines of Logfire setup gives you full tracing. Built on OpenTelemetry so you're never locked in.

---

## 7. Quick-Reference Cheat Sheet

### Pydantic (Data Validation)

| What | How |
|------|-----|
| Define a model | `class User(BaseModel): name: str; age: int` |
| Validate a dict | `User.model_validate({"name": "Lin", "age": 42})` |
| Validate JSON | `User.model_validate_json('{"name":"Lin","age":42}')` |
| Export to dict | `user.model_dump()` |
| Export to JSON | `user.model_dump_json()` |
| Add constraints | `Field(gt=0, max_length=100)` |
| Custom validator | `@field_validator('name')` decorator |
| Skip validation | `User.model_construct(**data)` (trusted data only!) |
| JSON Schema | `User.model_json_schema()` |
| Immutable model | `model_config = ConfigDict(frozen=True)` |

### Pydantic AI (Agent Framework)

| What | How |
|------|-----|
| Create an agent | `Agent('openai:gpt-4o', output_type=MyModel)` |
| Run synchronously | `agent.run_sync('prompt')` |
| Run async | `await agent.run('prompt')` |
| Stream output | `async with agent.run_stream('prompt') as r:` |
| Add a tool | `@agent.tool` decorator on a function |
| Plain tool (no ctx) | `@agent.tool_plain` decorator |
| Set instructions | `Agent(..., instructions='Be helpful.')` |
| Dynamic instructions | `@agent.instructions` decorator |
| Inject dependencies | `Agent(..., deps_type=MyDeps)` + `run(deps=deps)` |
| Access deps in tool | `ctx.deps` inside `RunContext[MyDeps]` |
| Force structured output | `Agent(..., output_type=MyPydanticModel)` |
| Validate output | `@agent.output_validator` decorator |
| Retry on bad output | `raise ModelRetry('try again')` inside tool/validator |
| Test without AI | `agent.override(model=TestModel())` |
| Block real API calls | `models.ALLOW_MODEL_REQUESTS = False` |
| Multi-turn chat | `run(..., message_history=prev_result.new_messages())` |
| Delegate to sub-agent | Call another `agent.run()` inside a `@tool` |
| Share token tracking | Pass `usage=ctx.usage` to delegate agent |
| Limit costs | `UsageLimits(request_limit=10, total_tokens_limit=1000)` |
| Trace with Logfire | `logfire.configure()` + `logfire.instrument_pydantic_ai()` |
| Evaluate quality | `pydantic_evals.Dataset(...).evaluate_sync(fn)` |
| Graph workflow | `pydantic_graph.Graph(nodes=[NodeA, NodeB])` |
| MCP tool server | `MCPServer` / `FastMCPToolset` |

### Installation (2026 recommended)

```bash
# Using UV (recommended — fast)
uv pip install pydantic-ai

# Or traditional pip
pip install pydantic-ai

# With extras
pip install "pydantic-ai[logfire]"    # Observability
pip install pydantic-evals             # Evaluation framework
pip install pydantic-graph             # Graph/state machine (included in pydantic-ai)
```

---

## Glossary for the Acronym-Averse

| Term | What It Actually Means |
|------|----------------------|
| **LLM** | Large Language Model — the AI brain (GPT, Claude, Gemini) |
| **Agent** | A program that uses an LLM + tools to accomplish tasks |
| **Tool** | A Python function the AI can choose to call |
| **Structured Output** | Forcing the AI to return data in a specific shape |
| **Dependency Injection** | Passing database connections and API keys into your code cleanly |
| **Validation** | Checking (and auto-fixing) that data matches expected types |
| **Serialization** | Converting a Python object to JSON/dict for storage or transmission |
| **MCP** | Model Context Protocol — a standard way for AI apps to connect to tools |
| **OpenTelemetry (OTel)** | An industry standard for application monitoring/tracing |
| **Logfire** | Pydantic's monitoring dashboard (built on OTel) |
| **BaseModel** | The main Pydantic class you inherit from to define data shapes |
| **RunContext** | The "bag of stuff" passed to tools/prompts during an agent run |
| **Graph** | A state machine where nodes are steps and edges are transitions |
| **Evals** | Systematic tests that score AI output quality |
| **FastAPI** | A web framework that uses Pydantic for request/response validation |
| **UV** | A very fast Python package manager (replaces pip) |
| **Ruff** | A very fast Python linter/formatter (same team as UV) |

---

*Last updated: March 12, 2026*
*Sources: https://ai.pydantic.dev/, https://docs.pydantic.dev/latest/, and subpages*
