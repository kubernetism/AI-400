# Building Custom Agents: Fastapi For Agents

> Downloaded from Agent Factory on 2/19/2026
> Total lessons: 16

## Table of Contents

1. [Build Your FastAPI Skill](#build-your-fastapi-skill)
2. [Hello FastAPI](#hello-fastapi)
3. [Pytest Fundamentals](#pytest-fundamentals)
4. [POST and Pydantic Models](#post-and-pydantic-models)
5. [Full CRUD Operations](#full-crud-operations)
6. [Error Handling](#error-handling)
7. [Dependency Injection](#dependency-injection)
8. [Environment Variables](#environment-variables)
9. [SQLModel + Neon Setup](#sqlmodel-neon-setup)
10. [User Management & Password Hashing](#user-management-password-hashing)
11. [JWT Authentication](#jwt-authentication)
12. [Middleware & CORS](#middleware-cors)
13. [Lifespan Events](#lifespan-events)
14. [Streaming with SSE](#streaming-with-sse)
15. [Agent Integration](#agent-integration)
16. [Capstone: Agent-Powered Task Service](#capstone-agent-powered-task-service)

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Build Your FastAPI Skill

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/00-build-your-fastapi-skill.md)

# Build Your FastAPI Skill

Before learning FastAPI—the Python framework for building production APIs—you'll **own** a FastAPI skill.

* * *

## Step 1: Get the Skills Lab

1.  Go to [github.com/panaversity/claude-code-skills-lab](https://github.com/panaversity/claude-code-skills-lab)
2.  Click the green **Code** button
3.  Select **Download ZIP**
4.  Extract the ZIP file
5.  Open the extracted folder in your terminal

```
cd claude-code-skills-labclaude
```

* * *

## Step 2: Create Your Skill

Copy and paste this prompt:

```
Using your skill creator skill create a new skill for FastAPI. I will useit to build projects with FastAPI from hello world to professional productionAPIs. Use context7 skill to study official documentation and then build itso no self assumed knowledge.
```

Claude will:

1.  Fetch official FastAPI documentation via Context7
2.  Ask you clarifying questions (database preferences, auth patterns, deployment target)
3.  Create the complete skill with references, templates, and starter code

Your skill appears at `.claude/skills/fastapi-dev/`.

* * *

## Done

You now own a FastAPI skill built from official documentation. The rest of this chapter teaches you what it knows—and how to make it better.

**Next: Lesson 1 — Hello FastAPI**

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Hello FastAPI

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/01-hello-fastapi.md)

# Hello FastAPI

You've built MCP servers with HTTP transports. You've seen how tools communicate over HTTP. Now you'll learn FastAPI—the Python framework that makes building HTTP APIs straightforward and enjoyable.

By the end of this lesson, you'll have a running API with endpoints you can test in your browser. More importantly, you'll understand *why* FastAPI works the way it does—knowledge you'll need when exposing AI agents as services in Lesson 7.

## Why FastAPI for Agents?

In Chapter 38, you built MCP servers that communicate over HTTP. Those servers handle specific MCP protocol messages. FastAPI takes the same HTTP concepts and makes them general-purpose—you can build any kind of API.

But here's the deeper reason: **agents need HTTP interfaces**.

When you build an agent with the OpenAI Agents SDK (Chapter 34), it runs in your Python process. But how do other systems call it? How does a web app trigger your agent? How do multiple users share the same agent?

The answer is HTTP. FastAPI lets you wrap your agents in REST endpoints so any client—browser, mobile app, another service—can send requests and receive responses. Lesson 7 shows exactly how. This lesson builds the foundation.

FastAPI stands out for three reasons:

**1\. Automatic Documentation** — Every endpoint you create appears in an interactive Swagger UI. When you expose agents, clients can explore your API without reading code.

**2\. Type-Safe Validation** — FastAPI uses Python type hints to validate incoming data. When an agent endpoint receives malformed JSON, FastAPI rejects it before your code runs.

**3\. Async-First** — Built on Starlette, FastAPI handles async/await natively. This matters because `Runner.run()` from the Agents SDK is async. Your endpoints need to be async too.

## Creating Your First Application

Let's build a Task API step by step. This same structure will later wrap your agents.

### Step 1: Create a Project with UV

```
uv init task-apicd task-api
```

Output:

```
Initialized project `task-api`
```

This creates a proper Python project with `pyproject.toml` for dependency management.

### Step 2: Create and Activate the Virtual Environment

```
uv venv
```

Activate the virtual environment:

-   macOS
-   Linux
-   Windows

```
source .venv/bin/activate
```

```
source .venv/bin/activate
```

```
.venv\Scripts\activate
```

**Note**: With recent Python versions, `uv` commands work without manual activation, but activating ensures your shell recognizes project dependencies.

### Step 3: Add Dependencies

```
uv add "fastapi[standard]"
```

Output:

```
Resolved 14 packages in 1.2sInstalled 14 packages in 50ms + fastapi==0.115.6 + uvicorn==0.34.0 ...
```

**What does `[standard]` include?** The `fastapi[standard]` package bundles essential dependencies:

-   **fastapi**: The web framework itself
-   **uvicorn**: The ASGI server that runs your app (more on this below)
-   **httpx**: An HTTP client useful for testing endpoints

For testing (which we'll cover later), add development dependencies:

```
uv add --dev pytest pytest-asyncio
```

This updates your `pyproject.toml`:

```
[project]name = "task-api"version = "0.1.0"requires-python = ">=3.13"dependencies = [    "fastapi[standard]>=0.115.0"][dependency-groups]dev = [    "pytest>=8.3.0",    "pytest-asyncio>=0.24.0",]
```

### What is Uvicorn and Why Do We Need It?

FastAPI doesn't run by itself—it needs a **server** to handle incoming HTTP requests.

**Uvicorn** is an ASGI (Asynchronous Server Gateway Interface) server. Think of it as the bridge:

```
Browser Request → Uvicorn → FastAPI → Your Code → FastAPI → Uvicorn → Browser Response
```

-   **Uvicorn** handles the networking: listening on ports, accepting connections, parsing HTTP
-   **FastAPI** handles the application logic: routing, validation, your code

You never interact with uvicorn directly in code—it just runs your FastAPI app. But understanding this separation matters: in production, you might swap uvicorn for another ASGI server (like hypercorn) without changing your FastAPI code.

### Step 4: Create Your First Endpoint

Create `main.py`:

```
from fastapi import FastAPIapp = FastAPI(    title="Task API",    description="A simple task management API")@app.get("/")def read_root():    return {"message": "Task API is running"}
```

That's a complete FastAPI application. Let's break it down:

-   `FastAPI()` creates the application instance. The `title` and `description` appear in the auto-generated documentation.
-   `@app.get("/")` is a **decorator** that tells FastAPI "when someone makes a GET request to `/`, call this function."
-   The function returns a dictionary, which FastAPI automatically converts to JSON.

### Step 5: Run Your Application

You have two options for running the server in development:

**Option A: FastAPI CLI (Recommended for development)**

```
fastapi dev main.py
```

Output:

```
INFO     Using path main.pyINFO     Resolved absolute path /path/to/task-api/main.pyINFO     Searching for package file structure from directories with __init__.py filesINFO     Importing from /path/to/task-api ╭─ Python module file ─╮ │  main.py             │ ╰──────────────────────╯INFO     Importing module mainINFO     Found importable FastAPI appINFO     Using import string main:appINFO     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

This command (introduced in FastAPI 0.100.0+) runs your app in development mode with automatic reloading. It's the simplest approach.

**Option B: Uvicorn directly**

```
uv run uvicorn main:app --reload
```

-   `main:app` means "the `app` object in `main.py`"
-   `--reload` restarts the server when you change code

**When to use which?**

-   Use `fastapi dev` for quick development—it handles defaults for you
-   Use `uvicorn` directly when you need control over host/port:
    
    ```
    uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    

**Troubleshooting**: If `fastapi dev` fails, ensure FastAPI isn't installed globally (conflicting with your virtual environment). The explicit `uv run uvicorn` command always works.

Open [http://localhost:8000](http://localhost:8000) in your browser. You'll see:

```
{"message": "Task API is running"}
```

Your API is live.

## What Just Happened?

You typed ~10 lines of Python. The FastAPI + Uvicorn combination gave you:

-   **A running web server** — Uvicorn listens on port 8000, handles connections, and routes requests to FastAPI
-   **JSON serialization** — Your Python dict → JSON automatically
-   **Interactive documentation** — Swagger UI at /docs
-   **Request validation** — Try /tasks/abc later → automatic 422 error
-   **OpenAPI spec generation** — View at /openapi.json
-   **Auto-reload** — Change code, server restarts automatically

You didn't write networking code, serialization, or documentation. This is why FastAPI is called "batteries included."

This matters for agents: when you expose agent capabilities (Lesson 7), you'll get all this infrastructure automatically. Clients will see your agent's endpoints in Swagger UI, send validated requests, and receive JSON responses—without you writing serialization code.

## The Swagger UI Playground

Open [http://localhost:8000/docs](http://localhost:8000/docs)

You'll see an interactive documentation page. Every endpoint you create appears here automatically. Click on `GET /` to expand it, then click "Try it out" and "Execute."

This is your API playground. No need to use curl or write test scripts—Swagger UI lets you test everything visually.

There's also:

-   [http://localhost:8000/redoc](http://localhost:8000/redoc) — Alternative documentation style
-   [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) — Raw OpenAPI specification (what tools like Swagger consume)

## Path Parameters

Real APIs need dynamic routes. Let's add an endpoint that accepts a task ID:

```
@app.get("/tasks/{task_id}")def read_task(task_id: int):    return {"task_id": task_id, "title": f"Task {task_id}"}
```

The `{task_id}` in the path becomes a **path parameter**. FastAPI:

1.  Extracts the value from the URL
2.  Converts it to the type you specified (`int`)
3.  Passes it to your function

Try it:

-   [http://localhost:8000/tasks/1](http://localhost:8000/tasks/1) → `{"task_id": 1, "title": "Task 1"}`
-   [http://localhost:8000/tasks/42](http://localhost:8000/tasks/42) → `{"task_id": 42, "title": "Task 42"}`
-   [http://localhost:8000/tasks/abc](http://localhost:8000/tasks/abc) → 422 error (not a valid integer)

That last one shows automatic validation. FastAPI rejects invalid data *before your code runs*. This is crucial—when agents receive bad input, they fail gracefully instead of crashing.

Check Swagger UI—the new endpoint appears with documentation showing the parameter type.

## Query Parameters

Sometimes you want optional parameters. Query parameters appear after `?` in the URL:

```
@app.get("/tasks/{task_id}")def read_task(task_id: int, include_details: bool = False):    task = {"task_id": task_id, "title": f"Task {task_id}"}    if include_details:        task["details"] = "This task has additional details"    return task
```

Now you can:

-   [http://localhost:8000/tasks/1](http://localhost:8000/tasks/1) → Basic task info
-   [http://localhost:8000/tasks/1?include\_details=true](http://localhost:8000/tasks/1?include_details=true) → Task with details

**The rule**: Parameters with default values are optional. Parameters without defaults are required:

```
@app.get("/search")def search_tasks(query: str, limit: int = 10):    return {"query": query, "limit": limit}
```

-   [http://localhost:8000/search](http://localhost:8000/search) → 422 error (query is required)
-   [http://localhost:8000/search?query=urgent](http://localhost:8000/search?query=urgent) → Works, limit defaults to 10
-   [http://localhost:8000/search?query=urgent&limit=5](http://localhost:8000/search?query=urgent&limit=5) → Both parameters provided

## Sync vs Async: When Does It Matter?

You might notice we used `def read_root()` not `async def`. FastAPI supports both. Here's when each matters:

**Use `def` (synchronous)** when:

-   Just returning data from memory (like our examples)
-   Calling synchronous libraries

**Use `async def` (asynchronous)** when:

-   Calling external APIs (like LLM providers)
-   Database queries with async drivers
-   Any I/O that might take time

For now, `def` works because we're returning dictionaries from memory. In Lesson 7, when you call `Runner.run()` to execute agents, you'll need `async def` because agent execution is asynchronous.

```
# Lesson 7 preview - you'll write this later@app.post("/chat")async def chat(message: str):    result = await runner.run(agent, messages=[...])  # async call    return {"response": result.final_output}
```

Don't worry about async yet—just know it exists and why it matters.

## Hands-On Exercise

Build a Task API with these endpoints:

1.  `GET /` — Returns a welcome message with version
2.  `GET /tasks/{task_id}` — Returns a task with the given ID
3.  `GET /tasks/{task_id}?details=true` — Returns extra information when details is true

Create the complete `main.py`:

```
from fastapi import FastAPIapp = FastAPI(title="Task API")@app.get("/")def read_root():    return {"message": "Task API is running", "version": "1.0.0"}@app.get("/tasks/{task_id}")def read_task(task_id: int, details: bool = False):    task = {        "id": task_id,        "title": f"Task {task_id}",        "status": "pending"    }    if details:        task["description"] = "This is a detailed description"        task["created_at"] = "2025-01-01T00:00:00Z"    return task
```

Run it:

```
fastapi dev main.py
```

Then test in Swagger UI:

1.  Open [http://localhost:8000/docs](http://localhost:8000/docs)
2.  Try each endpoint using "Try it out"
3.  Toggle the `details` parameter and observe the response change
4.  Try an invalid task\_id (like "abc") and observe the 422 error

## Challenge: Design Your Own Endpoint

Now apply what you've learned. **Before looking at any solution**, design an endpoint yourself:

**The Problem**: You need an endpoint that filters tasks by status. Users should be able to request only "pending" tasks, only "completed" tasks, or all tasks.

Think about:

-   Should status be a path parameter or query parameter?
-   What happens if no status is provided?
-   What should the URL look like?

Try implementing it. Then compare your design with AI:

> "I designed a task filtering endpoint like this: \[paste your code\]. I chose \[path/query\] parameter because \[your reasoning\]. What would you suggest differently?"

Notice: You're not asking AI to write code for you. You're asking it to *review* your design decision. This is how engineers actually use AI—as a sounding board for ideas, not a code generator.

## Common Mistakes

**Mistake 1**: Forgetting to return a value

```
# Wrong - returns None, client gets empty response@app.get("/")def read_root():    message = "Hello"    # Forgot to return!# Correct - explicit return@app.get("/")def read_root():    return {"message": "Hello"}
```

**Mistake 2**: Expecting FastAPI to catch all type errors

```
# FastAPI validates that task_id is an integer@app.get("/tasks/{task_id}")def read_task(task_id: int):    return {"task_id": task_id}# But it doesn't validate business logic# task_id = -1 is a valid int, even if it makes no sense# You'll handle this in Lesson 4 (Error Handling)
```

**Mistake 3**: Confusing path and query parameters

```
# Path parameter - identifies a specific resource@app.get("/tasks/{task_id}")  # /tasks/123# Query parameter - filters or modifies the request@app.get("/tasks")def list_tasks(status: str | None = None):  # /tasks?status=pending
```

**When to use which?**

-   Path: "Give me task 123" → `/tasks/123`
-   Query: "Give me tasks filtered by pending status" → `/tasks?status=pending`

## Try With AI

Now that you've built your first FastAPI application, deepen your understanding through these AI-assisted explorations.

**Prompt 1: Debug a Real Problem**

```
My FastAPI endpoint returns `null` instead of my data. Here's my code:@app.get("/tasks/{task_id}")def read_task(task_id: int):    task = {"id": task_id, "title": f"Task {task_id}"}    # Something's wrong here...I expected it to return a task object. What's wrong and why does Python behave that way?
```

**What you're learning:** This prompt teaches you to recognize a common mistake—forgetting to return values. Understanding *why* Python returns `None` implicitly builds debugging intuition you'll use throughout API development.

**Prompt 2: Evaluate a Design Trade-off**

```
I'm deciding between `/tasks/{status}` and `/tasks?status={status}` for filtering. My endpoint needs to support filtering by status AND by priority. Which design scales better for multiple filters? Show me how real production APIs like GitHub or Stripe handle this pattern.
```

**What you're learning:** This prompt develops your API design judgment. You'll discover that query parameters compose better for filtering, while path parameters identify specific resources—a distinction that matters when agents need to construct URLs programmatically.

**Prompt 3: Design for Your Domain**

```
I'm building an API for [your domain - recipes, inventory, bookings]. Design a resource endpoint that:1. Retrieves a single item by ID (path parameter)2. Supports optional filtering by two attributes (query parameters)3. Returns a sensible JSON structureThen show me what the Swagger UI documentation would look like for this endpoint.
```

**What you're learning:** This prompt bridges theory to your real work. By designing for your own domain, you internalize when to use path vs query parameters—knowledge that transfers directly when you expose agent capabilities as API endpoints.

* * *

## Reflect on Your Skill

You built a `fastapi-agent-api` skill in Lesson 0. Now let's test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent-api skill, generate a FastAPI app with:- A root endpoint that returns a welcome message- A /tasks/{task_id} endpoint with path parameter- A /search endpoint with query parametersDoes my skill generate valid, runnable code?
```

### Identify Gaps

Ask yourself:

-   Did my skill include proper type hints (`task_id: int`)?
-   Did it use `@app.get()` decorators correctly?
-   Did it return dictionaries that serialize to JSON?

### Improve Your Skill

If you found gaps, update your skill:

```
My fastapi-agent-api skill is missing [what you noticed].Update the skill to include:1. Always use type hints for path/query parameters2. Always return dictionaries (not None)3. Use descriptive function names matching the endpoint purposeShow me the updated SKILL.md principles section.
```

**Your skill just got better.** Each lesson builds on this pattern.

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Pytest Fundamentals

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/02-pytest-fundamentals.md)

# Pytest Fundamentals

Before you build APIs, you need to know if they work. Testing isn't something you add later—it's how you verify your code does what you think it does. In this lesson, you'll write tests by hand. No AI assistance. No shortcuts. You need to feel the red-green cycle in your bones.

Why manual first? Because when you ask AI to help with tests later, you need to recognize good tests from bad ones. You need to know what a failing test tells you. You can't evaluate AI suggestions if you've never written tests yourself.

## Why Testing Matters for Agent APIs

When you build APIs that agents call, testing becomes even more critical:

-   **Agents can't guess** - They call exactly what your API exposes
-   **Errors cascade** - A broken endpoint breaks every agent that uses it
-   **Debugging is hard** - Agent failures often trace back to API changes
-   **Confidence enables iteration** - Tests let you refactor without fear

By the end of this chapter, every endpoint you build will have tests. This lesson teaches you how.

## Your First Test

Create `test_main.py` in your project:

```
from fastapi.testclient import TestClientfrom main import appclient = TestClient(app)def test_read_root():    response = client.get("/")    assert response.status_code == 200    assert response.json() == {"message": "Hello, World!"}
```

**Breaking this down:**

1.  **TestClient** wraps your FastAPI app for testing
2.  **client.get("/")** makes a GET request to the root endpoint
3.  **assert** statements verify the response

If any assert fails, the test fails. That's the entire mechanism.

## Running Tests

Install pytest if you haven't:

```
uv add --dev pytest
```

Run your tests:

```
pytest test_main.py -v
```

**Output:**

```
========================= test session starts ==========================collected 1 itemtest_main.py::test_read_root PASSED                               [100%]========================= 1 passed in 0.15s ============================
```

The `-v` flag shows verbose output—which tests ran, which passed.

## The Red-Green Cycle

This is the fundamental rhythm of test-driven development:

1.  **Write a failing test (RED)** - Test something that doesn't exist yet
2.  **Make it pass (GREEN)** - Write the minimum code to pass
3.  **Refactor** - Clean up while tests stay green

Let's practice. Write a test for an endpoint that doesn't exist:

```
def test_health_check():    response = client.get("/health")    assert response.status_code == 200    assert response.json()["status"] == "healthy"
```

Run it:

```
pytest test_main.py::test_health_check -v
```

**Output:**

```
test_main.py::test_health_check FAILED                            [100%]========================= FAILURES =========================_________________ test_health_check _________________    def test_health_check():        response = client.get("/health")>       assert response.status_code == 200E       assert 404 == 200========================= 1 failed in 0.12s ============================
```

**RED.** The test fails because `/health` doesn't exist. Now make it pass.

Add to `main.py`:

```
@app.get("/health")def health_check():    return {"status": "healthy"}
```

Run the test again:

```
pytest test_main.py::test_health_check -v
```

**Output:**

```
test_main.py::test_health_check PASSED                            [100%]========================= 1 passed in 0.14s ============================
```

**GREEN.** You've completed one red-green cycle.

## Testing POST Requests

POST requests send data. Here's how to test them:

```
def test_create_item():    response = client.post(        "/items",        json={"name": "Widget", "price": 9.99}    )    assert response.status_code == 201    assert response.json()["name"] == "Widget"    assert "id" in response.json()
```

The `json=` parameter sends JSON data in the request body. FastAPI's TestClient handles serialization.

## Checking Response Details

Tests can verify any part of the response:

```
def test_response_structure():    response = client.get("/items/1")    # Status code    assert response.status_code == 200    # Response body    data = response.json()    assert "id" in data    assert "name" in data    assert isinstance(data["price"], float)    # Headers    assert response.headers["content-type"] == "application/json"
```

## Testing Error Responses

Good tests verify error cases too:

```
def test_item_not_found():    response = client.get("/items/99999")    assert response.status_code == 404    assert "not found" in response.json()["detail"].lower()def test_invalid_input():    response = client.post(        "/items",        json={"name": ""}  # Empty name should fail    )    assert response.status_code == 422  # Validation error
```

Testing the unhappy path is just as important as testing success.

## Complete Test Example

Here's a test file for the Task API you'll build. Create `test_tasks.py`:

```
from fastapi.testclient import TestClientfrom main import appclient = TestClient(app)class TestTaskAPI:    """Tests for task endpoints."""    def test_create_task(self):        """POST /tasks creates a new task."""        response = client.post(            "/tasks",            json={"title": "Learn testing", "description": "Write tests first"}        )        assert response.status_code == 201        assert response.json()["title"] == "Learn testing"        assert response.json()["status"] == "pending"    def test_list_tasks(self):        """GET /tasks returns all tasks."""        response = client.get("/tasks")        assert response.status_code == 200        assert isinstance(response.json(), list)    def test_get_task(self):        """GET /tasks/{id} returns single task."""        # First create a task        create_response = client.post(            "/tasks",            json={"title": "Fetch me"}        )        task_id = create_response.json()["id"]        # Then fetch it        response = client.get(f"/tasks/{task_id}")        assert response.status_code == 200        assert response.json()["title"] == "Fetch me"    def test_task_not_found(self):        """GET /tasks/{id} returns 404 for missing task."""        response = client.get("/tasks/99999")        assert response.status_code == 404    def test_create_task_without_title(self):        """POST /tasks without title returns 422."""        response = client.post(            "/tasks",            json={"description": "Missing title"}        )        assert response.status_code == 422
```

**Output:**

```
$ pytest test_tasks.py -v========================= test session starts ==========================test_tasks.py::TestTaskAPI::test_create_task PASSEDtest_tasks.py::TestTaskAPI::test_list_tasks PASSEDtest_tasks.py::TestTaskAPI::test_get_task PASSEDtest_tasks.py::TestTaskAPI::test_task_not_found PASSEDtest_tasks.py::TestTaskAPI::test_create_task_without_title PASSED========================= 5 passed in 0.23s ============================
```

## Test Organization Tips

**Name tests clearly:**

```
# Good - describes what's being testeddef test_create_task_with_description():# Bad - vaguedef test_task():
```

**One assertion per concept:**

```
# Good - focuseddef test_create_returns_201():    response = client.post("/tasks", json={"title": "Test"})    assert response.status_code == 201def test_create_returns_task_with_id():    response = client.post("/tasks", json={"title": "Test"})    assert "id" in response.json()# Acceptable - related assertionsdef test_create_task():    response = client.post("/tasks", json={"title": "Test"})    assert response.status_code == 201    assert "id" in response.json()
```

**Use classes to group related tests:**

```
class TestTaskCreation:    def test_with_title_only(self): ...    def test_with_description(self): ...    def test_without_title_fails(self): ...class TestTaskRetrieval:    def test_get_existing(self): ...    def test_get_missing(self): ...
```

## Hands-On Exercise

Write tests for the `/` endpoint from Lesson 1:

**Step 1:** Create `test_main.py`:

```
from fastapi.testclient import TestClientfrom main import appclient = TestClient(app)def test_root_returns_200():    """GET / returns 200 status."""    response = client.get("/")    assert response.status_code == 200def test_root_returns_message():    """GET / returns greeting message."""    response = client.get("/")    assert "message" in response.json()
```

**Step 2:** Run the tests:

```
pytest test_main.py -v
```

**Step 3:** Add a failing test (RED):

```
def test_greeting_with_name():    """GET /greet/{name} returns personalized greeting."""    response = client.get("/greet/Alice")    assert response.status_code == 200    assert response.json()["message"] == "Hello, Alice!"
```

**Step 4:** Make it pass (GREEN) by adding the endpoint to `main.py`

**Step 5:** Run all tests to confirm nothing broke

## Common Mistakes

**Mistake 1:** Forgetting to import the app

```
# Wrong - app not importeddef test_something():    response = client.get("/")  # client is undefined# Correctfrom main import appclient = TestClient(app)
```

**Mistake 2:** Testing response.json() on non-JSON responses

```
# Wrong - 204 has no bodydef test_delete():    response = client.delete("/items/1")    assert response.json()["deleted"] == True  # Fails!# Correctdef test_delete():    response = client.delete("/items/1")    assert response.status_code == 204
```

**Mistake 3:** Tests that depend on each other

```
# Wrong - test_get assumes test_create ran firstdef test_create():    client.post("/items", json={"name": "Widget"})def test_get():    response = client.get("/items/1")  # Assumes ID 1 exists# Correct - each test is self-containeddef test_get():    # Create first    create_response = client.post("/items", json={"name": "Widget"})    item_id = create_response.json()["id"]    # Then get    response = client.get(f"/items/{item_id}")    assert response.status_code == 200
```

## Why Write Tests Manually?

You're building a skill, not just running commands. When you write tests by hand:

-   You understand what makes a test useful
-   You recognize edge cases to cover
-   You can evaluate AI-generated tests critically
-   You debug failing tests confidently

In later lessons, you'll use AI to help generate tests. But you'll be the judge of quality, not a passive consumer.

## Try With AI

After completing the manual exercises above, practice evaluating AI assistance.

**Prompt 1: Review Your Tests**

```
Here are my tests for a Task API:[paste your test_tasks.py]What edge cases am I missing? Don't write the tests for me—just list what scenarios I should consider adding.
```

**What you're learning:** You wrote tests manually. Now use AI to find gaps in your coverage—but you'll write the additional tests yourself.

**Prompt 2: Understand a Failure**

```
My test is failing with this error:AssertionError: assert 404 == 200Here's my test:def test_get_task():    response = client.get("/tasks/1")    assert response.status_code == 200What's happening and how do I debug it?
```

**What you're learning:** Interpreting test failures is a core skill. AI can explain what the error means, but you need to understand the fix.

**Prompt 3: Refactoring Tests**

```
I have tests that repeat setup code:def test_create():    client.post("/tasks", json={"title": "Test"})    ...def test_get():    client.post("/tasks", json={"title": "Test"})    ...How can I use pytest fixtures to reduce duplication?Explain the concept before showing code.
```

**What you're learning:** Fixtures are a pytest pattern for shared setup. Understanding why they exist helps you use them correctly.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me write pytest tests for a FastAPI endpoint.Does my skill include patterns for TestClient usage, fixtures, and conftest.py setup?
```

### Identify Gaps

Ask yourself:

-   Did my skill include pytest test structure and naming conventions?
-   Did it handle fixture patterns for shared setup and teardown?
-   Did it cover the red-green testing cycle?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing pytest testing patterns.Update it to include TestClient usage, fixture patterns, conftest.py organization,and the red-green testing cycle for TDD.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   POST and Pydantic Models

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/03-post-and-pydantic-models.md)

# POST and Pydantic Models

GET endpoints retrieve data. POST endpoints create data. To create a task, you need to send data in the request body. FastAPI uses Pydantic models to define what that data should look like and validate it automatically.

This matters for agents: when clients send requests to your agent endpoints (Lesson 7), Pydantic ensures the input is valid *before* your agent sees it. Bad data gets rejected at the door, not halfway through an expensive LLM call.

## Why Pydantic Matters for Agents

In Chapter 37, you built MCP servers that validate tool parameters. Pydantic does the same thing for HTTP APIs. When an agent endpoint receives JSON, Pydantic:

1.  Parses the raw JSON bytes
2.  Validates data types match your model
3.  Checks required fields are present
4.  Rejects invalid data with helpful error messages

This validation layer is critical when agents compose tools. One agent's output becomes another's input. Type safety at every boundary prevents cascading failures.

```
from pydantic import BaseModelclass TaskCreate(BaseModel):    title: str    description: str | None = None
```

This model says:

-   `title` is required and must be a string
-   `description` is optional (can be `None`) and defaults to `None`

## How Pydantic Validates (Under the Hood)

When you write `title: str`, Pydantic:

1.  **Checks existence** — Is there a "title" key in the JSON? Missing → `Field required` error
2.  **Checks type** — Is the value a string? Wrong type → `string_type` error
3.  **Attempts coercion** — `"123"` (string) passes. `123` (int) gets coerced to `"123"`
4.  **Passes validated data** — Your function receives a guaranteed string

This is why `task.title` in your function is GUARANTEED to be a string. No defensive `if isinstance(title, str)` checks needed.

But what if you need custom validation? Title must be 3-100 characters:

```
from pydantic import BaseModel, Fieldclass TaskCreate(BaseModel):    title: str = Field(min_length=3, max_length=100)    description: str | None = None
```

Now Pydantic enforces length constraints automatically. You'll explore more validation in the exercises.

## Defining Task Models

For our Task API, we need two models:

1.  **TaskCreate** — What the client sends when creating a task
2.  **TaskResponse** — What the API returns

```
from pydantic import BaseModelclass TaskCreate(BaseModel):    title: str    description: str | None = Noneclass TaskResponse(BaseModel):    id: int    title: str    description: str | None    status: str
```

**Why two models?** The client shouldn't provide `id` or `status`—those are set by the server. Separating models keeps responsibilities clear:

-   Client says: "Create a task with this title"
-   Server says: "Here's your task with ID 1, status pending"

This separation matters more as your API grows. You might have `TaskCreate`, `TaskUpdate`, `TaskResponse`, `TaskSummary`—each exposing exactly what that operation needs.

## Creating a POST Endpoint

Add these to your `main.py`:

```
from fastapi import FastAPIfrom pydantic import BaseModelapp = FastAPI(title="Task API")# Pydantic modelsclass TaskCreate(BaseModel):    title: str    description: str | None = Noneclass TaskResponse(BaseModel):    id: int    title: str    description: str | None    status: str# In-memory storagetasks: list[dict] = []@app.post("/tasks", response_model=TaskResponse, status_code=201)def create_task(task: TaskCreate):    new_task = {        "id": len(tasks) + 1,        "title": task.title,        "description": task.description,        "status": "pending"    }    tasks.append(new_task)    return new_task
```

Let's break down the key elements:

-   `@app.post("/tasks")` — This endpoint handles POST requests
-   `task: TaskCreate` — FastAPI parses the request body as a `TaskCreate` model
-   `response_model=TaskResponse` — FastAPI validates the response matches this model
-   `status_code=201` — Return 201 Created instead of default 200

## Testing in Swagger UI

Open [http://localhost:8000/docs](http://localhost:8000/docs) and find the POST endpoint.

1.  Click "Try it out"
2.  In the request body, enter:
    
    ```
    {  "title": "Learn FastAPI",  "description": "Complete the tutorial"}
    ```
    
3.  Click "Execute"

Output:

```
HTTP/1.1 201 Createdcontent-type: application/json{  "id": 1,  "title": "Learn FastAPI",  "description": "Complete the tutorial",  "status": "pending"}
```

The 201 status code confirms the resource was created successfully.

## Validation Errors: What Students Find Confusing

This is where many students get stuck. Let's work through it carefully.

**Try posting with missing title:**

```
{  "description": "Missing title"}
```

Output:

```
HTTP/1.1 422 Unprocessable Entitycontent-type: application/json{  "detail": [    {      "type": "missing",      "loc": ["body", "title"],      "msg": "Field required",      "input": {"description": "Missing title"}    }  ]}
```

**Reading this error:**

-   `type: "missing"` — What kind of validation failure
-   `loc: ["body", "title"]` — Where the error is: in the body, at field "title"
-   `msg: "Field required"` — Human-readable explanation
-   `input` — What you actually sent

**Why 422 and not 400?**

This confuses people. Here's the distinction:

-   **422 Unprocessable Entity** — The JSON is valid, but data doesn't match the schema. Pydantic catches these.
-   **400 Bad Request** — Business logic validation failed (e.g., "title can't be empty whitespace"). You handle these in your code.

FastAPI automatically returns 422 for schema violations. You'll add 400 errors in Lesson 4.

**Try posting with wrong type:**

```
{  "title": 123}
```

Output:

```
HTTP/1.1 422 Unprocessable Entitycontent-type: application/json{  "detail": [    {      "type": "string_type",      "loc": ["body", "title"],      "msg": "Input should be a valid string",      "input": 123    }  ]}
```

Pydantic caught that `title` should be a string, not a number.

## Response Model Filtering

The `response_model` parameter does more than validation—it filters the output. If your internal data has extra fields, only the model's fields are returned.

```
@app.post("/tasks", response_model=TaskResponse)def create_task(task: TaskCreate):    new_task = {        "id": len(tasks) + 1,        "title": task.title,        "description": task.description,        "status": "pending",        "internal_flag": True,  # Won't appear in response        "debug_info": "extra data"  # Neither will this    }    tasks.append(new_task)    return new_task
```

Only `id`, `title`, `description`, and `status` appear in the response because those are the fields in `TaskResponse`. This is a security feature—you won't accidentally leak internal data.

## In-Memory Storage: A Reality Check

We're using a simple list to store tasks:

```
tasks: list[dict] = []
```

This works for learning but has real limitations:

-   **Resets when you restart** — All tasks disappear
-   **No persistence** — Nothing saved to disk
-   **No concurrency safety** — Two simultaneous requests could corrupt data
-   **Single process only** — Multiple workers don't share the list

These aren't problems for learning. They're problems you'll solve with databases in Chapter 47. For now, understand the CRUD pattern—the storage mechanism is secondary.

## Hands-On Exercise

Build the complete task creation flow:

```
from fastapi import FastAPIfrom pydantic import BaseModelapp = FastAPI(title="Task API")class TaskCreate(BaseModel):    title: str    description: str | None = Noneclass TaskResponse(BaseModel):    id: int    title: str    description: str | None    status: strtasks: list[dict] = []@app.get("/")def read_root():    return {"message": "Task API", "task_count": len(tasks)}@app.post("/tasks", response_model=TaskResponse, status_code=201)def create_task(task: TaskCreate):    new_task = {        "id": len(tasks) + 1,        "title": task.title,        "description": task.description,        "status": "pending"    }    tasks.append(new_task)    return new_task@app.get("/tasks")def list_tasks():    return tasks
```

Test this workflow:

1.  POST a task with title "First task"
2.  POST another task with title and description
3.  GET /tasks to see both tasks
4.  GET / to see the task count
5.  Try posting without a title and observe the 422 error

## Challenge: Design a Model with Constraints

**Before looking at any solution**, design a model yourself:

**The Problem**: You need a `TaskCreate` model where:

-   `title` is required, 3-100 characters
-   `description` is optional, max 500 characters
-   `priority` is optional, must be "low", "medium", or "high", defaults to "medium"

Think about:

-   How do you enforce character limits?
-   How do you restrict to specific values?
-   What should the error message say if someone sends "urgent" as priority?

Implement it. Then test with intentionally invalid data. Then compare with AI:

> "I designed a TaskCreate model with these constraints: \[paste your code\]. I used \[approach\] for the priority field. Does Pydantic have a better pattern for enum-like fields?"

## Common Mistakes

**Mistake 1**: Using one model for everything

```
# Wrong - client shouldn't provide id and statusclass Task(BaseModel):    id: int    title: str    status: str@app.post("/tasks")def create_task(task: Task):  # Client must provide id?    ...
```

Create separate models for input (TaskCreate) and output (TaskResponse).

**Mistake 2**: Forgetting `response_model`

```
# Without response_model, you might leak internal data@app.post("/tasks")def create_task(task: TaskCreate):    new_task = {..., "password_hash": "secret123"}  # Oops, exposed!    return new_task
```

Always use `response_model` to control what's returned.

**Mistake 3**: Optional field without default

```
# Wrong - this makes description requireddescription: str | None  # No default!# Correct - union type with default Nonedescription: str | None = None
```

The `= None` is crucial. Without it, the field is required (just nullable).

## Try With AI

Now that you understand Pydantic validation, explore these advanced patterns with AI assistance.

**Prompt 1: Trace the Validation Pipeline**

```
Trace what happens when I POST this JSON to my FastAPI endpoint:{"title": 123, "extra_field": "ignored"}My model is:class TaskCreate(BaseModel):    title: str    description: str | None = NoneShow me each step from raw HTTP request bytes to my function receiving a validated TaskCreate object. What happens to the extra_field? What happens to the integer 123?
```

**What you're learning:** This prompt reveals Pydantic's internals—how it coerces types (123 becomes "123"), ignores extra fields by default, and validates required fields. Understanding this pipeline helps you predict validation behavior and debug unexpected 422 errors.

**Prompt 2: Design a Complex Model**

```
I need a Pydantic model for creating a Meeting with:- title: required string, 3-100 characters- attendees: list of email addresses (must validate email format)- duration_minutes: must be exactly 15, 30, 60, or 90- is_recurring: boolean, defaults to falseShow me two implementations: one using Literal and one using Enum for duration_minutes. Which produces better OpenAPI documentation for JavaScript clients?
```

**What you're learning:** This prompt teaches you to evaluate trade-offs in model design. You'll discover that Literal types produce cleaner OpenAPI specs for frontend consumers, while Enums provide better IDE support in Python—a real decision you'll face when designing agent API contracts.

**Prompt 3: Handle Edge Cases**

```
I want my TaskCreate model to REJECT requests with extra fields instead of ignoring them. I also want custom error messages when validation fails.Show me how to configure these behaviors in Pydantic v2, and explain when rejecting extra fields is a good idea vs when it causes problems for API evolution.
```

**What you're learning:** This prompt develops your API versioning intuition. Strict validation catches bugs early but makes backward-compatible changes harder. You'll learn to choose the right strictness level for your agent's API lifecycle.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me create Pydantic models for request and response validation.Does my skill handle POST endpoints, request body validation, and field constraints?
```

### Identify Gaps

Ask yourself:

-   Did my skill include Pydantic model patterns (BaseModel, Field constraints)?
-   Did it cover separating request models from response models?
-   Did it handle validation errors (422 vs 400) appropriately?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing Pydantic validation patterns.Update it to include request/response model separation, Field constraints,validation error handling, and the difference between 422 and 400 status codes.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Full CRUD Operations

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/04-full-crud-operations.md)

# Full CRUD Operations

You've created tasks with POST. Now you complete the picture with Read, Update, and Delete. Together—Create, Read, Update, Delete—these form CRUD, the foundation of data-driven APIs.

This matters for agents: every agent that manages state needs CRUD. When you build agent endpoints (Lesson 7), agents will create conversation sessions, read past messages, update conversation metadata, and delete expired sessions. The patterns you learn here transfer directly.

## Why CRUD Is the Foundation

Consider what agents actually do:

-   **Memory agents** create memories, read relevant ones, update importance scores, delete stale entries
-   **Task agents** create tasks, read pending work, update status, delete completed items
-   **Session agents** create conversations, read context, update metadata, delete expired sessions

Every one of these is CRUD. Master these four operations, and you can build the data layer for any agent.

## HTTP Methods and CRUD

Each CRUD operation maps to an HTTP method:

Operation

HTTP Method

Endpoint Example

Description

Create

POST

POST /tasks

Create a new task

Read (all)

GET

GET /tasks

List all tasks

Read (one)

GET

GET /tasks/1

Get task with ID 1

Update

PUT

PUT /tasks/1

Update task with ID 1

Delete

DELETE

DELETE /tasks/1

Delete task with ID 1

**Why these specific mappings?** HTTP methods have semantics:

-   **GET** is *safe*—it doesn't change server state. Browsers can cache GET responses.
-   **POST** creates new resources. Not safe, not idempotent.
-   **PUT** replaces a resource. Idempotent—calling it twice has the same effect as once.
-   **DELETE** removes a resource. Also idempotent.

These semantics matter for agents. If an agent's HTTP call fails partway through, idempotent operations (PUT, DELETE) can be safely retried. Non-idempotent operations (POST) require more careful handling.

## List All Tasks

The simplest read operation—return everything:

```
@app.get("/tasks")def list_tasks():    return tasks
```

But agents rarely want *everything*. Add filtering:

```
@app.get("/tasks")def list_tasks(status: str | None = None):    if status:        return [t for t in tasks if t["status"] == status]    return tasks
```

Now clients can:

-   `GET /tasks` — All tasks
-   `GET /tasks?status=pending` — Only pending tasks
-   `GET /tasks?status=completed` — Only completed tasks

Output (GET /tasks?status=pending):

```
[  {"id": 1, "title": "Learn FastAPI", "status": "pending"},  {"id": 3, "title": "Deploy app", "status": "pending"}]
```

For agents, this filtering is essential. A task agent doesn't want to process completed items—it filters for pending work.

## Get Single Task

Retrieve one task by ID:

```
from fastapi import HTTPException@app.get("/tasks/{task_id}")def get_task(task_id: int):    for task in tasks:        if task["id"] == task_id:            return task    raise HTTPException(status_code=404, detail="Task not found")
```

**What happens when the task doesn't exist?** We raise `HTTPException` with status 404. This is the standard HTTP response for "resource not found."

Test it:

-   `GET /tasks/1` → Returns task 1 (if it exists)
-   `GET /tasks/999` → Returns 404 error

Output (GET /tasks/999):

```
HTTP/1.1 404 Not Foundcontent-type: application/json{"detail": "Task not found"}
```

## Update Task: The Subtle Complexity

This is where students often get confused. Let's work through it carefully.

**PUT replaces the entire resource.** The client sends the complete new version:

```
class TaskUpdate(BaseModel):    title: str    description: str | None = None    status: str | None = None@app.put("/tasks/{task_id}")def update_task(task_id: int, task_update: TaskUpdate):    for task in tasks:        if task["id"] == task_id:            task["title"] = task_update.title            if task_update.description is not None:                task["description"] = task_update.description            if task_update.status is not None:                task["status"] = task_update.status            return task    raise HTTPException(status_code=404, detail="Task not found")
```

**Why a new model `TaskUpdate`?** It allows updating `status`, which `TaskCreate` doesn't include. The client sends:

```
{  "title": "Updated title",  "description": "New description",  "status": "completed"}
```

**The confusing part**: Why check `if task_update.description is not None`?

Without this check, sending `{"title": "New"}` would set `description` to `None`, erasing the existing description. We only update fields the client explicitly provides.

**But wait—isn't that PATCH behavior?** Yes, this is actually partial update logic. True PUT would require ALL fields. In practice, most APIs use PUT for what should be PATCH because PATCH has browser support issues historically. You'll see both patterns.

## Delete Task

Remove a task from our list:

```
@app.delete("/tasks/{task_id}")def delete_task(task_id: int):    for i, task in enumerate(tasks):        if task["id"] == task_id:            tasks.pop(i)            return {"message": "Task deleted", "id": task_id}    raise HTTPException(status_code=404, detail="Task not found")
```

Some APIs return 204 No Content for deletes. We're returning a confirmation message, which helps with debugging.

## The In-Memory Mutation Problem

Look at our update code:

```
task["title"] = task_update.title
```

We're mutating a dictionary inside a list. This works, but has problems:

**Problem 1: No atomic updates.** If two requests try to update the same task simultaneously, they might interleave:

```
Request A: reads task with status="pending"Request B: reads task with status="pending"Request A: sets status="in_progress"Request B: sets status="completed" (expected: in_progress -> completed, actual: pending -> completed)
```

**Problem 2: No rollback.** If we update title, then description fails validation, the title change persists.

**Problem 3: The delete index bug.** Our delete uses `tasks.pop(i)`. If two deletes run simultaneously on IDs 1 and 3, the indices shift and we might delete the wrong item.

These are real problems that databases solve. For learning CRUD, they don't matter. But when you build production agents, you'll use a database with proper transaction support. We cover this in Chapter 47.

## Complete Implementation

Here's the full `main.py` with all CRUD operations:

```
from fastapi import FastAPI, HTTPExceptionfrom pydantic import BaseModelapp = FastAPI(title="Task API")# Modelsclass TaskCreate(BaseModel):    title: str    description: str | None = Noneclass TaskUpdate(BaseModel):    title: str    description: str | None = None    status: str | None = Noneclass TaskResponse(BaseModel):    id: int    title: str    description: str | None    status: str# Storagetasks: list[dict] = []task_counter = 0# CREATE@app.post("/tasks", response_model=TaskResponse, status_code=201)def create_task(task: TaskCreate):    global task_counter    task_counter += 1    new_task = {        "id": task_counter,        "title": task.title,        "description": task.description,        "status": "pending"    }    tasks.append(new_task)    return new_task# READ (all)@app.get("/tasks")def list_tasks(status: str | None = None):    if status:        return [t for t in tasks if t["status"] == status]    return tasks# READ (one)@app.get("/tasks/{task_id}", response_model=TaskResponse)def get_task(task_id: int):    for task in tasks:        if task["id"] == task_id:            return task    raise HTTPException(status_code=404, detail="Task not found")# UPDATE@app.put("/tasks/{task_id}", response_model=TaskResponse)def update_task(task_id: int, task_update: TaskUpdate):    for task in tasks:        if task["id"] == task_id:            task["title"] = task_update.title            if task_update.description is not None:                task["description"] = task_update.description            if task_update.status is not None:                task["status"] = task_update.status            return task    raise HTTPException(status_code=404, detail="Task not found")# DELETE@app.delete("/tasks/{task_id}")def delete_task(task_id: int):    for i, task in enumerate(tasks):        if task["id"] == task_id:            tasks.pop(i)            return {"message": "Task deleted", "id": task_id}    raise HTTPException(status_code=404, detail="Task not found")
```

## Hands-On Exercise

Test the complete CRUD cycle in Swagger UI:

**Step 1: Create Tasks**

```
POST /tasks{"title": "Learn CRUD", "description": "Complete this lesson"}POST /tasks{"title": "Build API", "description": "Create a complete REST API"}POST /tasks{"title": "Test API", "description": "Verify all endpoints work"}
```

**Step 2: List and Filter**

```
GET /tasks           # See all 3 tasksGET /tasks?status=pending  # All should be pending
```

**Step 3: Read Single**

```
GET /tasks/1         # First taskGET /tasks/999       # Should return 404
```

**Step 4: Update**

```
PUT /tasks/1{"title": "Learn CRUD", "status": "completed"}
```

**Step 5: Verify Update**

```
GET /tasks/1         # Status should be "completed"GET /tasks?status=completed  # Should show task 1GET /tasks?status=pending    # Should show tasks 2 and 3
```

**Step 6: Delete**

```
DELETE /tasks/3      # Delete task 3GET /tasks           # Should only show tasks 1 and 2
```

## Challenge: Design a Status Workflow

**Before looking at any solution**, design validation rules yourself:

**The Problem**: Tasks should follow a workflow:

-   New tasks start as `pending`
-   `pending` → `in_progress` → `completed` (normal flow)
-   Can go back from `in_progress` → `pending` (blocked)
-   Cannot go from `completed` → anything (final state)
-   Cannot skip states (`pending` → `completed` directly)

Think about:

-   Where do you validate this? In the Pydantic model or the endpoint?
-   What error message helps the user understand what went wrong?
-   How do you store valid transitions in a maintainable way?

Implement it. Test with invalid transitions. Then compare with AI:

> "I implemented task status workflow validation like this: \[paste your code\]. I put the logic in \[model/endpoint\] because \[your reasoning\]. Would a state machine pattern be cleaner?"

## Common Mistakes

**Mistake 1**: Not returning the updated resource

```
# Wrong - returns nothing useful@app.put("/tasks/{task_id}")def update_task(task_id: int, task_update: TaskUpdate):    for task in tasks:        if task["id"] == task_id:            task["title"] = task_update.title            return {"message": "Updated"}  # Client doesn't know the new state# Correct - return the updated resource@app.put("/tasks/{task_id}")def update_task(task_id: int, task_update: TaskUpdate):    for task in tasks:        if task["id"] == task_id:            task["title"] = task_update.title            return task  # Client sees the result
```

**Why return the updated resource?** The client might have stale data. Returning the current state avoids a follow-up GET.

**Mistake 2**: Using wrong HTTP method

```
# Wrong - POST shouldn't be used for updates@app.post("/tasks/{task_id}/update")# Correct - PUT for updates@app.put("/tasks/{task_id}")# Wrong - GET with side effects@app.get("/tasks/{task_id}/delete")# Correct - DELETE for deletion@app.delete("/tasks/{task_id}")
```

**Why this matters**: HTTP semantics have meaning. Browsers might prefetch GET requests. Proxies might cache them. If your GET deletes data, you'll have mysterious data loss.

**Mistake 3**: Not handling not-found cases

```
# Wrong - returns None, causes errors@app.get("/tasks/{task_id}")def get_task(task_id: int):    for task in tasks:        if task["id"] == task_id:            return task    # Falls through, returns None# Correct - explicit 404@app.get("/tasks/{task_id}")def get_task(task_id: int):    for task in tasks:        if task["id"] == task_id:            return task    raise HTTPException(status_code=404, detail="Task not found")
```

## Try With AI

Now that you've implemented full CRUD, deepen your understanding with these explorations.

**Prompt 1: Understand PUT vs PATCH**

```
My FastAPI PUT endpoint acts like PATCH—it only updates fields that are provided:@app.put("/tasks/{task_id}")def update_task(task_id: int, task_update: TaskUpdate):    task["title"] = task_update.title    if task_update.status is not None:        task["status"] = task_update.statusIs this technically wrong according to HTTP semantics? Show me what strict PUT would look like, then explain why most APIs choose partial updates anyway.
```

**What you're learning:** This prompt clarifies the PUT vs PATCH debate. You'll discover that strict PUT requires the full resource representation, but practical APIs use PUT for partial updates because PATCH had browser support issues historically. Understanding this helps you make informed API design decisions.

**Prompt 2: Optimize Lookup Performance**

```
My current task lookup is O(n):for task in tasks:    if task["id"] == task_id:        return taskShow me how to restructure this using a dictionary for O(1) lookups. But I also need to list tasks in creation order—how do I maintain ordering while getting O(1) lookups? Compare the trade-offs.
```

**What you're learning:** This prompt develops your data structure intuition. You'll learn that `dict` gives O(1) access but loses ordering, while `collections.OrderedDict` or separate list+dict structures maintain both. This matters when agent systems need fast lookups AND chronological listings.

**Prompt 3: Handle Race Conditions**

```
I'm building an endpoint for agents to claim tasks:@app.post("/tasks/{task_id}/claim")def claim_task(task_id: int, worker_id: str):    task = find_task(task_id)    if task["status"] != "pending":        raise HTTPException(400, "Task already claimed")    task["status"] = "in_progress"    task["worker_id"] = worker_idTwo agents call this simultaneously for the same task. What happens? Show me how to prevent both from claiming the same task.
```

**What you're learning:** This prompt introduces concurrency challenges. You'll discover that in-memory operations aren't atomic—two requests can both read "pending" before either writes. This is why production agent systems use databases with proper locking or optimistic concurrency control.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me implement full CRUD operations for a resource.Does my skill include proper HTTP methods (GET, POST, PUT, DELETE) and status codes?
```

### Identify Gaps

Ask yourself:

-   Did my skill include all CRUD operations with correct HTTP methods?
-   Did it handle resource lookup patterns and 404 errors?
-   Did it use appropriate status codes (200, 201, 204, 404)?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing complete CRUD patterns.Update it to include GET (list and single), POST, PUT, DELETE operations,proper HTTP status codes, and resource not-found handling.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Error Handling

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/05-error-handling.md)

# Error Handling

When things go wrong, your API needs to communicate clearly. A missing task should return 404, not crash the server. Invalid input should return 422, not accept garbage. Good error handling makes APIs predictable—and predictability matters enormously for agents.

## Why Error Handling Matters for Agents

When humans use an API, they read error messages and adjust. When agents call your API, they need to programmatically decide what to do. Clear, consistent errors enable agents to:

-   **Retry on transient failures** (5xx errors)
-   **Report bad input to users** (4xx errors with helpful messages)
-   **Handle missing resources gracefully** (404 → create new one? skip?)
-   **Never retry on business rule violations** (400 → input fundamentally wrong)

An agent that can't distinguish "try again later" from "your request is wrong" will either waste resources retrying or fail silently on fixable problems.

## HTTP Status Codes: The Communication Layer

HTTP status codes are a shared language between server and client:

Range

Category

Meaning

Agent Should

2xx

Success

Request worked

Proceed normally

4xx

Client Error

Client sent something wrong

Fix request, don't retry

5xx

Server Error

Server failed internally

Retry with backoff

**Common codes you'll use**:

Code

Name

When to Use

200

OK

Request succeeded (default)

201

Created

Resource created successfully

204

No Content

Success, nothing to return

400

Bad Request

Client sent invalid data (business rules)

404

Not Found

Resource doesn't exist

422

Unprocessable Entity

Validation failed (Pydantic)

500

Internal Server Error

Something broke on the server

**The agent perspective**: A well-designed agent inspects the status code FIRST, then reads the body. This is more reliable than parsing error messages:

```
# Agent-side code (not your server, but how agents consume your API)response = await client.get("/tasks/999")if response.status_code == 404:    # Resource doesn't exist - create it or skip    ...elif response.status_code >= 500:    # Server problem - retry with exponential backoff    ...
```

## The HTTPException Class

FastAPI provides `HTTPException` for returning error responses:

```
from fastapi import HTTPException@app.get("/tasks/{task_id}")def get_task(task_id: int):    task = find_task(task_id)    if not task:        raise HTTPException(            status_code=404,            detail="Task not found"        )    return task
```

**What happens when you raise?**

1.  FastAPI stops executing your function
2.  Returns the specified status code
3.  Sends the detail as JSON

Output:

```
HTTP/1.1 404 Not Foundcontent-type: application/json{  "detail": "Task not found"}
```

**Why `raise`, not `return`?** Exceptions bubble up through your code. If you have helper functions, they can raise HTTPException directly without needing to propagate error codes back up the call chain.

## Using the status Module

Magic numbers like `404` work, but are harder to read. FastAPI provides named constants:

```
from fastapi import HTTPException, status@app.get("/tasks/{task_id}")def get_task(task_id: int):    task = find_task(task_id)    if not task:        raise HTTPException(            status_code=status.HTTP_404_NOT_FOUND,            detail=f"Task with id {task_id} not found"        )    return task
```

Now the code is self-documenting. Common constants:

```
status.HTTP_200_OKstatus.HTTP_201_CREATEDstatus.HTTP_204_NO_CONTENTstatus.HTTP_400_BAD_REQUESTstatus.HTTP_404_NOT_FOUNDstatus.HTTP_422_UNPROCESSABLE_ENTITYstatus.HTTP_500_INTERNAL_SERVER_ERROR
```

**A subtlety**: Python's autocomplete works with `status.HTTP_...`, making it easy to discover available codes. With magic numbers, you'd need to look them up.

## Setting Success Status Codes

Override the default 200 for specific endpoints:

```
# Return 201 for resource creation@app.post("/tasks", status_code=status.HTTP_201_CREATED)def create_task(task: TaskCreate):    # ...    return new_task# Return 204 for deletion (no body)@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)def delete_task(task_id: int):    # ... delete logic    return None  # No response body with 204
```

**Why 201 for create?** It signals "resource was created" vs "here's a resource that existed." Agents can distinguish between idempotent retrieval and actual creation.

**Why 204 for delete?** The resource is gone—there's nothing meaningful to return. Some APIs return 200 with confirmation; 204 is more semantically correct.

## 400 vs 422: The Distinction That Confuses Everyone

This trips up almost every developer. Let's be precise:

**422 Unprocessable Entity** — Pydantic validation failed. The JSON is valid, but the data doesn't match your schema.

```
# Pydantic returns 422 automatically when:# - Required field missing# - Wrong data type# - Field constraint violatedclass TaskCreate(BaseModel):    title: str  # If missing, 422# POST with {"description": "no title"} → 422
```

**400 Bad Request** — Business logic validation failed. The data is valid according to the schema, but it breaks your rules.

```
@app.post("/tasks")def create_task(task: TaskCreate):    # Business rule: title can't be empty whitespace    if not task.title.strip():        raise HTTPException(            status_code=status.HTTP_400_BAD_REQUEST,            detail="Title cannot be empty or whitespace"        )    # ...
```

**The way to think about it**:

-   422: "Your JSON doesn't match my schema" (Pydantic catches this)
-   400: "Your data passed schema validation but violates business rules" (you catch this)

**For agents**: Both mean "don't retry with the same input." But 422 suggests a type/format problem, while 400 suggests a logical problem. An agent might use this distinction to give users more specific guidance.

## Complete Error Handling Example

```
from fastapi import FastAPI, HTTPException, statusfrom pydantic import BaseModelapp = FastAPI(title="Task API")class TaskCreate(BaseModel):    title: str    description: str | None = Noneclass TaskUpdate(BaseModel):    title: str    description: str | None = None    status: str | None = Nonetasks: list[dict] = []task_counter = 0VALID_STATUSES = {"pending", "in_progress", "completed"}def find_task(task_id: int) -> dict | None:    """Helper to find a task by ID."""    for task in tasks:        if task["id"] == task_id:            return task    return None@app.post("/tasks", status_code=status.HTTP_201_CREATED)def create_task(task: TaskCreate):    global task_counter    # Business validation    if not task.title.strip():        raise HTTPException(            status_code=status.HTTP_400_BAD_REQUEST,            detail="Title cannot be empty or whitespace"        )    task_counter += 1    new_task = {        "id": task_counter,        "title": task.title.strip(),        "description": task.description,        "status": "pending"    }    tasks.append(new_task)    return new_task@app.get("/tasks/{task_id}")def get_task(task_id: int):    task = find_task(task_id)    if not task:        raise HTTPException(            status_code=status.HTTP_404_NOT_FOUND,            detail=f"Task with id {task_id} not found"        )    return task@app.put("/tasks/{task_id}")def update_task(task_id: int, task_update: TaskUpdate):    task = find_task(task_id)    if not task:        raise HTTPException(            status_code=status.HTTP_404_NOT_FOUND,            detail=f"Task with id {task_id} not found"        )    # Validate title    if not task_update.title.strip():        raise HTTPException(            status_code=status.HTTP_400_BAD_REQUEST,            detail="Title cannot be empty or whitespace"        )    # Validate status    if task_update.status and task_update.status not in VALID_STATUSES:        raise HTTPException(            status_code=status.HTTP_400_BAD_REQUEST,            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"        )    task["title"] = task_update.title.strip()    if task_update.description is not None:        task["description"] = task_update.description    if task_update.status:        task["status"] = task_update.status    return task@app.delete("/tasks/{task_id}")def delete_task(task_id: int):    task = find_task(task_id)    if not task:        raise HTTPException(            status_code=status.HTTP_404_NOT_FOUND,            detail=f"Task with id {task_id} not found"        )    tasks.remove(task)    return {"message": "Task deleted", "id": task_id}
```

## Error Message Design: Helping Agents Help Users

Error messages aren't just for debugging—agents will parse them to inform users. Design them carefully:

**Be specific**:

```
# Vague - agent can't help userdetail="Error"# Specific - agent knows what to tell userdetail=f"Task with id {task_id} not found"
```

**Include context**:

```
# Missing context - what status IS valid?detail="Invalid status"# With context - agent can suggest valid optionsdetail=f"Invalid status '{task_update.status}'. Must be one of: pending, in_progress, completed"
```

**Don't expose internals**:

```
# Exposes implementation - security risk, unhelpfuldetail=f"KeyError: 'tasks' at line 47"# User-friendly - agent can relay appropriatelydetail="An internal error occurred. Please try again."
```

**Consider structured errors for agents**:

```
# Simple string (works)detail="Task not found"# Structured (better for agents)detail={    "code": "TASK_NOT_FOUND",    "message": "Task with id 999 not found",    "task_id": 999}
```

The structured format gives agents machine-readable codes while preserving human-readable messages.

## Hands-On Exercise

Test each error scenario in Swagger UI:

**1\. Test 404 Not Found**

```
GET /tasks/999# Expected: 404 with "Task with id 999 not found"
```

**2\. Test 422 Validation Error**

```
POST /tasks{"description": "Missing title"}# Expected: 422 with "Field required" for title
```

**3\. Test 400 Business Error**

```
POST /tasks{"title": "   "}# Expected: 400 with "Title cannot be empty or whitespace"
```

**4\. Test Invalid Status**

```
# First create a taskPOST /tasks{"title": "Test task"}# Then try invalid statusPUT /tasks/1{"title": "Test", "status": "invalid"}# Expected: 400 with "Invalid status. Must be one of..."
```

**5\. Test 201 Created**

```
POST /tasks{"title": "Valid task"}# Expected: 201 status (check response headers)
```

## Challenge: Design a Complete Error Response Format

**Before looking at any solution**, design your own error format:

**The Problem**: You want error responses that include:

-   A machine-readable error code (like `TASK_NOT_FOUND`)
-   A human-readable message
-   Relevant context (task ID, valid options, etc.)
-   Consistent structure across all errors

Think about:

-   How do you make HTTPException return structured data?
-   How do you ensure ALL your endpoints use this format?
-   What error codes do you need for a task API?

Implement it for 404 and 400 errors. Then compare with AI:

> "I designed a structured error format like this: \[paste your code\]. I'm using \[approach\] to ensure consistency. How would you handle cases where Pydantic returns 422 errors—can I customize those to match my format?"

## Common Mistakes

**Mistake 1**: Forgetting to raise the exception

```
# Wrong - creates exception but doesn't raise it@app.get("/tasks/{task_id}")def get_task(task_id: int):    if not find_task(task_id):        HTTPException(status_code=404, detail="Not found")  # Does nothing!    return task# Correct - raise the exception@app.get("/tasks/{task_id}")def get_task(task_id: int):    if not find_task(task_id):        raise HTTPException(status_code=404, detail="Not found")    return task
```

This is a subtle bug—your code runs without errors but returns wrong data.

**Mistake 2**: Using 200 for errors

```
# Wrong - 200 for missing resource@app.get("/tasks/{task_id}")def get_task(task_id: int):    task = find_task(task_id)    if not task:        return {"error": "Not found"}  # Still 200!# Correct - 404 for missingraise HTTPException(status_code=404, detail="Not found")
```

Agents check status codes first. A 200 with an error in the body is confusing and breaks retry logic.

**Mistake 3**: Mixing exception types

```
# Wrong - raises Python exception, becomes 500@app.get("/tasks/{task_id}")def get_task(task_id: int):    task = find_task(task_id)    if not task:        raise ValueError("Not found")  # 500 Internal Server Error# Correct - use HTTPException for HTTP errorsraise HTTPException(status_code=404, detail="Not found")
```

Python exceptions that escape your function become 500 errors. Users see "Internal Server Error," which is unhelpful and suggests your server is broken (even though the logic is correct).

## Try With AI

Now that you understand error handling, explore advanced patterns for building agent-friendly APIs.

**Prompt 1: Design Error Hierarchies**

```
I want custom exception classes for my Task API:- TaskNotFoundError- InvalidStatusError- DuplicateTaskErrorShow me how to:1. Create these exception classes2. Register exception handlers that convert them to proper HTTP responses3. Handle unknown exceptions gracefully so my API never exposes stack tracesWhat's the pattern for ensuring I don't forget to register a new exception type?
```

**What you're learning:** This prompt teaches you to design exception hierarchies. You'll discover that a base class like `TaskAPIError` with common fields lets you handle all custom exceptions with one handler, preventing the "forgot to register" problem. This pattern scales as your API grows.

**Prompt 2: Add Structured Logging**

```
I want to log all 4xx and 5xx errors with request context:- Request path and method- Error details and status code- A correlation ID that links related logsShow me how to add this to FastAPI middleware. Also, how do I include additional context from inside endpoint functions—like which specific task_id caused the error?
```

**What you're learning:** This prompt develops your observability skills. You'll learn about middleware for cross-cutting concerns, context variables for request-scoped data, and correlation IDs for tracing requests across logs. Essential for debugging agent systems in production.

**Prompt 3: Design Agent-Friendly Errors**

```
When an agent calls my API, I want error responses that help it recover automatically:{  "error_code": "TASK_NOT_FOUND",  "message": "Task 42 not found",  "retry_after": null,  "suggestions": ["create the task first", "check the task ID"]}Design this error format and show me how to implement it for 404, 400, and 429 (rate limit) errors. How can an agent use the retry_after field?
```

**What you're learning:** This prompt teaches you to design for machine consumers. Agents can programmatically check `error_code` for decision logic, use `retry_after` for backoff, and potentially surface `suggestions` to users. This structured approach makes your API a better citizen in agent workflows.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me implement error handling for my endpoints.Does my skill include HTTPException, proper status codes, and helpful error messages?
```

### Identify Gaps

Ask yourself:

-   Did my skill include HTTPException patterns for different error types?
-   Did it handle the distinction between 400, 404, 422, and 500 errors?
-   Did it provide structured error responses with helpful detail messages?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing comprehensive error handling.Update it to include HTTPException usage, status module constants,custom exception handlers, and the difference between client (4xx) and server (5xx) errors.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Dependency Injection

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/06-dependency-injection.md)

# Dependency Injection

Every endpoint in your API needs shared resources: configuration, connections, services. You could create these inside each function, but that's repetitive and makes testing hard. Dependency injection solves this—FastAPI creates what your endpoint needs and passes it in.

This pattern powers everything in the rest of this chapter. Settings, database sessions, authentication—all use `Depends()`.

## The Problem: Repeated Setup

Without dependency injection:

```
@app.get("/tasks")def list_tasks():    # Setup code repeated in EVERY endpoint    config = load_config_from_env()    logger = setup_logger("tasks")    return {"config": config.app_name}@app.get("/users")def list_users():    # Same setup, repeated again    config = load_config_from_env()    logger = setup_logger("users")    return {"config": config.app_name}
```

Problems:

-   Same code in every function
-   Hard to test (can't swap config for test config)
-   If setup logic changes, you update everywhere

## The Solution: Depends()

With dependency injection:

```
from fastapi import FastAPI, Dependsapp = FastAPI()def get_config():    """Provide configuration to endpoints."""    return {"app_name": "Task API", "version": "1.0"}@app.get("/tasks")def list_tasks(config: dict = Depends(get_config)):    return {"app": config["app_name"]}@app.get("/users")def list_users(config: dict = Depends(get_config)):    return {"app": config["app_name"]}
```

FastAPI:

1.  Sees `Depends(get_config)`
2.  Calls `get_config()` automatically
3.  Passes the result to your function

**Output:**

```
{"app": "Task API"}
```

## A Dependency Is Just a Function

Any callable works as a dependency:

```
def get_request_id() -> str:    """Generate unique ID for this request."""    import uuid    return str(uuid.uuid4())@app.get("/debug")def debug_info(request_id: str = Depends(get_request_id)):    return {"request_id": request_id}
```

**Output:**

```
{"request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}
```

Each request gets a new UUID. The dependency runs fresh for every request.

## Caching with lru\_cache

Some dependencies are expensive—reading config files, creating connections. You want them created once, not per-request:

```
from functools import lru_cache@lru_cachedef get_settings():    """Load settings once, reuse forever."""    print("Loading settings...")  # Only prints once!    return {        "app_name": "Task API",        "debug": True    }@app.get("/info")def app_info(settings: dict = Depends(get_settings)):    return {"app": settings["app_name"]}
```

Call `/info` ten times—you'll see "Loading settings..." printed only once.

**When to use `@lru_cache`:**

-   Configuration that doesn't change
-   Expensive initialization (parsing files, creating clients)
-   Anything you'd normally put in a global variable

## Yield Dependencies for Cleanup

Some resources need cleanup—file handles, connections, temporary files. Use `yield` instead of `return`:

```
def get_temp_file():    """Provide a temporary file that gets cleaned up."""    import tempfile    import os    # Setup: create the file    fd, path = tempfile.mkstemp()    file = os.fdopen(fd, 'w')    try:        yield file  # Provide to endpoint    finally:        # Cleanup: runs after endpoint completes        file.close()        os.unlink(path)@app.post("/upload")def process_upload(temp: file = Depends(get_temp_file)):    temp.write("data")    return {"status": "processed"}
```

The `finally` block runs after your endpoint finishes—even if it raises an exception. This is how database sessions will work in later lessons.

## Complete Example: Request Logger

Here's a practical dependency that logs every request:

```
from fastapi import FastAPI, Depends, Requestfrom datetime import datetimeapp = FastAPI()def get_request_logger(request: Request):    """Log request details and provide logger to endpoint."""    start = datetime.now()    method = request.method    path = request.url.path    print(f"[{start}] {method} {path} - started")    yield {"method": method, "path": path, "start": start}    end = datetime.now()    duration = (end - start).total_seconds()    print(f"[{end}] {method} {path} - completed in {duration:.3f}s")@app.get("/tasks")def list_tasks(log: dict = Depends(get_request_logger)):    return {"tasks": [], "logged_path": log["path"]}@app.post("/tasks")def create_task(log: dict = Depends(get_request_logger)):    return {"id": 1, "logged_method": log["method"]}
```

**Console output:**

```
[2024-01-15 10:30:00] GET /tasks - started[2024-01-15 10:30:00] GET /tasks - completed in 0.002s
```

Notice how `Request` is also injected—FastAPI provides it automatically.

## Why This Matters

In the next lessons, you'll use `Depends()` for:

Lesson

Dependency

Purpose

Environment Variables

`get_settings()`

Configuration from .env

SQLModel

`get_session()`

Database connection

Authentication

`get_current_user()`

Verify JWT tokens

Understanding `Depends()` now means these patterns will make sense immediately.

## Hands-On Exercise

Build a simple API with dependencies:

**Step 1:** Create the app with a config dependency:

```
from fastapi import FastAPI, Dependsfrom functools import lru_cacheapp = FastAPI()@lru_cachedef get_config():    return {        "app_name": "My API",        "max_items": 100,        "debug": True    }@app.get("/config")def show_config(config: dict = Depends(get_config)):    return config
```

**Step 2:** Add a request counter (using a class for state):

```
class RequestCounter:    def __init__(self):        self.count = 0    def increment(self) -> int:        self.count += 1        return self.countcounter = RequestCounter()def get_request_count() -> int:    return counter.increment()@app.get("/count")def show_count(count: int = Depends(get_request_count)):    return {"request_number": count}
```

**Step 3:** Test it:

```
# First requestcurl http://localhost:8000/count# {"request_number": 1}# Second requestcurl http://localhost:8000/count# {"request_number": 2}
```

## Common Mistakes

**Mistake 1:** Calling the function instead of passing it

```
# Wrong - function called at import time!@app.get("/tasks")def list_tasks(config = Depends(get_config())):  # () is wrong!    ...# Correct - pass the function itself@app.get("/tasks")def list_tasks(config = Depends(get_config)):  # No ()    ...
```

**Mistake 2:** Forgetting to yield in cleanup dependencies

```
# Wrong - return doesn't allow cleanup codedef get_file():    f = open("data.txt")    return f  # File never closed!# Correct - yield allows cleanupdef get_file():    f = open("data.txt")    try:        yield f    finally:        f.close()
```

**Mistake 3:** Caching things that should be fresh

```
# Wrong - request ID should be different each time!@lru_cachedef get_request_id():    return str(uuid.uuid4())# Correct - no cache for per-request valuesdef get_request_id():    return str(uuid.uuid4())
```

## Try With AI

After completing the exercise, explore these patterns.

**Prompt 1: Dependency Chains**

```
I have a config dependency and want to create a logger dependencythat uses the config. How do dependencies depend on other dependencies?Show me how to chain get_logger(config = Depends(get_config)).
```

**What you're learning:** Dependencies can depend on other dependencies. FastAPI resolves the chain automatically.

**Prompt 2: Testing Dependencies**

```
I want to test my endpoints without using the real config.How do I override a dependency in tests? Show meapp.dependency_overrides and how to use it.
```

**What you're learning:** The power of DI is testability. Override any dependency with a mock for testing.

**Prompt 3: Class Dependencies**

```
Instead of functions, can I use a class as a dependency?I want TaskService with methods like list() and create().Show me how Depends() works with classes.
```

**What you're learning:** Classes with `__init__` parameters work as dependencies. FastAPI resolves the constructor parameters.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me organize code with dependencies.Does my skill include Depends() patterns, caching, and yield for cleanup?
```

### Identify Gaps

Ask yourself:

-   Did my skill include creating custom dependency functions with Depends()?
-   Did it explain when to use lru\_cache vs fresh per-request?
-   Did it cover yield dependencies for resource cleanup?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing dependency injection basics.Update it to include Depends() pattern, lru_cache for configuration,and yield dependencies for cleanup.
```

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Environment Variables

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/07-environment-variables.md)

# Environment Variables

Your API needs configuration: database URLs, API keys, secret tokens. Hardcoding these values is a security risk and makes deployment painful. Environment variables solve this—they let you configure your app differently in development, staging, and production without changing code.

This lesson teaches the pattern you'll use throughout the chapter. Every lesson from here forward uses settings from environment variables.

## Why Environment Variables Matter

**The problem with hardcoding:**

```
# NEVER DO THISdatabase_url = "postgresql://admin:password123@db.example.com/prod"api_key = "sk-secret-key-that-leaks-to-github"
```

If this code gets committed:

-   Secrets leak to version control
-   You can't use different databases in dev vs prod
-   Rotating secrets requires code changes and redeployment

**The environment variable solution:**

```
import osdatabase_url = os.getenv("DATABASE_URL")api_key = os.getenv("API_KEY")
```

Now configuration lives outside your code. Different environments set different values.

## pydantic-settings: Type-Safe Configuration

Raw `os.getenv()` works but has problems:

-   Returns strings only (need to convert `"30"` to `30`)
-   No validation (missing variables fail silently)
-   No documentation of required variables

pydantic-settings fixes all of this:

```
uv add pydantic-settings
```

Create `config.py`:

```
from pydantic_settings import BaseSettingsclass Settings(BaseSettings):    """Application configuration from environment variables."""    database_url: str    api_key: str    debug: bool = False    max_connections: int = 10
```

**What this gives you:**

-   **Type conversion**: `"10"` becomes `10`, `"true"` becomes `True`
-   **Validation**: Missing required variables raise clear errors
-   **Defaults**: Optional variables have default values
-   **Documentation**: The class itself documents what's configurable

## Using Settings in Your App

Create `main.py`:

```
from fastapi import FastAPI, Dependsfrom config import Settingsapp = FastAPI()def get_settings() -> Settings:    return Settings()@app.get("/config")def show_config(settings: Settings = Depends(get_settings)):    return {        "debug": settings.debug,        "max_connections": settings.max_connections    }
```

**Output (with DEBUG=true set):**

```
{  "debug": true,  "max_connections": 10}
```

## The .env File

Typing `export DATABASE_URL=...` every time is tedious. Use a `.env` file:

```
# .envDATABASE_URL=postgresql://localhost/devdbAPI_KEY=dev-key-not-for-productionDEBUG=trueMAX_CONNECTIONS=5
```

Tell pydantic-settings to load it:

```
class Settings(BaseSettings):    database_url: str    api_key: str    debug: bool = False    max_connections: int = 10    class Config:        env_file = ".env"
```

Now `Settings()` reads from `.env` automatically.

## Critical: Gitignore Your Secrets

**Never commit .env files with real secrets.**

Create `.gitignore`:

```
# .gitignore.env*.env.env.*!.env.example
```

Create `.env.example` (this one IS committed):

```
# .env.example - Copy to .env and fill in valuesDATABASE_URL=postgresql://user:pass@host/databaseAPI_KEY=your-api-key-hereDEBUG=falseMAX_CONNECTIONS=10
```

This pattern:

1.  Documents what variables are needed
2.  Keeps actual secrets out of version control
3.  Makes onboarding new developers easy

## Caching Settings

Creating `Settings()` reads from disk each time. Cache it:

```
from functools import lru_cache@lru_cachedef get_settings() -> Settings:    return Settings()
```

Now settings load once and reuse the same instance. This is more efficient and ensures consistency.

## Complete Settings Example

Here's the pattern you'll use throughout this chapter. Create `config.py`:

```
from pydantic_settings import BaseSettingsfrom functools import lru_cacheclass Settings(BaseSettings):    """Application settings loaded from environment."""    # Database    database_url: str    # Authentication    secret_key: str    algorithm: str = "HS256"    access_token_expire_minutes: int = 30    # API Keys    anthropic_api_key: str    # Development    debug: bool = False    class Config:        env_file = ".env"@lru_cachedef get_settings() -> Settings:    """Cached settings instance."""    return Settings()
```

Create `main.py`:

```
from fastapi import FastAPI, Dependsfrom config import Settings, get_settingsapp = FastAPI()@app.get("/health")def health_check(settings: Settings = Depends(get_settings)):    return {        "status": "healthy",        "debug_mode": settings.debug    }
```

**Output:**

```
{  "status": "healthy",  "debug_mode": false}
```

## Validation Errors

What happens with missing or invalid values?

```
# .env is empty or missing DATABASE_URLsettings = Settings()
```

**Output:**

```
pydantic_settings.sources.SettingsError: error loading settings  database_url    Field required [type=missing]
```

Clear error message telling you exactly what's missing.

```
# .env has MAX_CONNECTIONS=not_a_numbersettings = Settings()
```

**Output:**

```
pydantic_settings.sources.SettingsError: error loading settings  max_connections    Input should be a valid integer [type=int_parsing]
```

These errors happen at startup, not during a request. Fail fast.

## Hands-On Exercise

Set up configuration for your Task API:

**Step 1:** Install pydantic-settings:

```
uv add pydantic-settings
```

**Step 2:** Create `config.py`:

```
from pydantic_settings import BaseSettingsfrom functools import lru_cacheclass Settings(BaseSettings):    app_name: str = "Task API"    debug: bool = False    max_tasks_per_user: int = 100    class Config:        env_file = ".env"@lru_cachedef get_settings() -> Settings:    return Settings()
```

**Step 3:** Create `.env`:

```
APP_NAME=My Task APIDEBUG=trueMAX_TASKS_PER_USER=50
```

**Step 4:** Create `.gitignore`:

```
.env
```

**Step 5:** Create `.env.example`:

```
APP_NAME=Task APIDEBUG=falseMAX_TASKS_PER_USER=100
```

**Step 6:** Use settings in your app:

```
from fastapi import FastAPI, Dependsfrom config import Settings, get_settingsapp = FastAPI()@app.get("/info")def app_info(settings: Settings = Depends(get_settings)):    return {        "app_name": settings.app_name,        "debug": settings.debug,        "max_tasks": settings.max_tasks_per_user    }
```

**Step 7:** Test it:

```
curl http://localhost:8000/info
```

**Output:**

```
{  "app_name": "My Task API",  "debug": true,  "max_tasks": 50}
```

## Common Mistakes

**Mistake 1:** Committing .env with secrets

```
# Check if .env is trackedgit status# If it shows .env, remove it from trackinggit rm --cached .envecho ".env" >> .gitignoregit commit -m "Remove .env from tracking"
```

**Mistake 2:** Wrong variable names

```
class Settings(BaseSettings):    database_url: str  # Expects DATABASE_URL in environment
```

Environment variables are case-insensitive but conventionally UPPER\_CASE. pydantic-settings converts `database_url` to look for `DATABASE_URL`.

**Mistake 3:** Forgetting the Config class

```
# Wrong - won't read from .envclass Settings(BaseSettings):    database_url: str# Correctclass Settings(BaseSettings):    database_url: str    class Config:        env_file = ".env"
```

**Mistake 4:** Not caching settings

```
# Wrong - reads file on every calldef get_settings():    return Settings()# Correct - reads once@lru_cachedef get_settings():    return Settings()
```

## Security Checklist

Before deploying any API:

-    `.env` is in `.gitignore`
-    `.env.example` documents required variables
-    No secrets appear in code or comments
-    Production uses different secrets than development
-    Secret rotation doesn't require code changes

## Try With AI

After completing the exercise, explore these scenarios.

**Prompt 1: Environment-Specific Settings**

```
I have Settings that work for development. How do I handle differentconfigurations for production? For example:- Development: DEBUG=true, local database- Production: DEBUG=false, remote databaseShould I use multiple .env files or conditional logic in Settings?
```

**What you're learning:** Real deployments need environment-specific configuration. There are several patterns—AI can explain tradeoffs.

**Prompt 2: Validating Settings**

```
I want to validate that my DATABASE_URL is a valid PostgreSQLconnection string, not just any string. Can pydantic-settingsvalidate the format of environment variables?
```

**What you're learning:** pydantic validators work with settings too. You can enforce URL formats, string patterns, and more.

**Prompt 3: Secrets in Production**

```
In development, I use .env files. In production on Railway orFly.io, how do I set environment variables? What's the bestpractice for managing production secrets?
```

**What you're learning:** .env is for local development. Production platforms have their own secrets management—understanding this completes the picture.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me set up environment variable configuration.Does my skill include Settings class with pydantic-settings and .env file handling?
```

### Identify Gaps

Ask yourself:

-   Did my skill include BaseSettings class with pydantic-settings?
-   Did it handle .env file loading and .gitignore configuration?
-   Did it use lru\_cache for settings and Depends() for injection?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing environment configuration patterns.Update it to include pydantic-settings BaseSettings, .env file usage,.gitignore for secrets, and cached dependency injection for configuration.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   SQLModel + Neon Setup

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/08-sqlmodel-neon-setup.md)

# SQLModel + Neon Setup

Your Task API currently stores data in a Python list. Restart the server—everything's gone. Real APIs need persistent storage. This lesson connects your FastAPI app to Neon PostgreSQL using SQLModel.

Why this combination?

-   **SQLModel** = Pydantic + SQLAlchemy in one. Your models work for both validation AND database.
-   **Neon** = PostgreSQL as a service. No installation, free tier, instant setup.

This is the "fast track" approach. No migrations, no complex setup. Get persistent data working, then add complexity later if needed.

## Setting Up Neon

**Step 1:** Go to [neon.tech](https://neon.tech) and create a free account

**Step 2:** Create a new project (default settings are fine)

**Step 3:** Copy your connection string:

```
postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Step 4:** Add to your `.env`:

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

That's it. You have a PostgreSQL database.

## Installing SQLModel

```
uv add sqlmodel psycopg2-binary
```

-   `sqlmodel` - The ORM that combines Pydantic and SQLAlchemy
-   `psycopg2-binary` - PostgreSQL driver

## Defining Your Model

SQLModel classes with `table=True` become database tables. Create `models.py`:

```
from sqlmodel import SQLModel, Fieldfrom typing import Optionalfrom datetime import datetimeclass Task(SQLModel, table=True):    """Task stored in database."""    id: Optional[int] = Field(default=None, primary_key=True)    title: str = Field(min_length=1, max_length=200)    description: Optional[str] = None    status: str = Field(default="pending")    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**What each part means:**

-   `table=True` - This model maps to a database table
-   `primary_key=True` - Auto-incrementing ID
-   `Field(default=...)` - Column defaults
-   `Optional[int] = None` - ID is None until database assigns it

## Connecting to the Database

Create `database.py`:

```
from sqlmodel import SQLModel, create_engine, Sessionfrom config import get_settingssettings = get_settings()engine = create_engine(settings.database_url, echo=True)def create_db_and_tables():    """Create all tables in the database."""    SQLModel.metadata.create_all(engine)def get_session():    """Dependency that provides database sessions."""    with Session(engine) as session:        yield session
```

**Key concepts:**

-   `create_engine()` - Establishes connection to Neon
-   `echo=True` - Logs SQL queries (helpful for debugging)
-   `Session` - Context for database operations
-   `yield session` - Provides session to endpoint, closes when done

## Creating Tables on Startup

Call `create_db_and_tables()` when the app starts. Update your `main.py`:

```
from fastapi import FastAPIfrom database import create_db_and_tablesapp = FastAPI()@app.on_event("startup")def on_startup():    create_db_and_tables()
```

First time you run the app, the table is created in Neon.

## CRUD Operations with Session

### Create

```
from fastapi import Dependsfrom sqlmodel import Sessionfrom models import Taskfrom database import get_session@app.post("/tasks", status_code=201)def create_task(    task: Task,    session: Session = Depends(get_session)):    session.add(task)    session.commit()    session.refresh(task)  # Get the assigned ID    return task
```

**Output:**

```
{  "id": 1,  "title": "Learn SQLModel",  "description": null,  "status": "pending",  "created_at": "2024-01-15T10:30:00"}
```

### Read (List)

```
from sqlmodel import select@app.get("/tasks")def list_tasks(session: Session = Depends(get_session)):    tasks = session.exec(select(Task)).all()    return tasks
```

### Read (Single)

```
from fastapi import HTTPException@app.get("/tasks/{task_id}")def get_task(task_id: int, session: Session = Depends(get_session)):    task = session.get(Task, task_id)    if not task:        raise HTTPException(status_code=404, detail="Task not found")    return task
```

### Update

```
@app.put("/tasks/{task_id}")def update_task(    task_id: int,    task_update: Task,    session: Session = Depends(get_session)):    task = session.get(Task, task_id)    if not task:        raise HTTPException(status_code=404, detail="Task not found")    task.title = task_update.title    task.description = task_update.description    task.status = task_update.status    session.add(task)    session.commit()    session.refresh(task)    return task
```

### Delete

```
@app.delete("/tasks/{task_id}", status_code=204)def delete_task(task_id: int, session: Session = Depends(get_session)):    task = session.get(Task, task_id)    if not task:        raise HTTPException(status_code=404, detail="Task not found")    session.delete(task)    session.commit()    return None
```

## Complete Example

Here's everything together. Create `models.py`:

```
from sqlmodel import SQLModel, Fieldfrom typing import Optionalfrom datetime import datetimeclass Task(SQLModel, table=True):    id: Optional[int] = Field(default=None, primary_key=True)    title: str = Field(min_length=1, max_length=200)    description: Optional[str] = None    status: str = Field(default="pending")    created_at: datetime = Field(default_factory=datetime.utcnow)
```

Create `database.py`:

```
from sqlmodel import SQLModel, create_engine, Sessionfrom config import get_settingssettings = get_settings()engine = create_engine(settings.database_url, echo=False)def create_db_and_tables():    SQLModel.metadata.create_all(engine)def get_session():    with Session(engine) as session:        yield session
```

Create `main.py`:

```
from fastapi import FastAPI, Depends, HTTPExceptionfrom sqlmodel import Session, selectfrom models import Taskfrom database import create_db_and_tables, get_sessionapp = FastAPI(title="Task API")@app.on_event("startup")def on_startup():    create_db_and_tables()@app.post("/tasks", status_code=201)def create_task(task: Task, session: Session = Depends(get_session)):    session.add(task)    session.commit()    session.refresh(task)    return task@app.get("/tasks")def list_tasks(session: Session = Depends(get_session)):    return session.exec(select(Task)).all()@app.get("/tasks/{task_id}")def get_task(task_id: int, session: Session = Depends(get_session)):    task = session.get(Task, task_id)    if not task:        raise HTTPException(status_code=404, detail="Task not found")    return task@app.put("/tasks/{task_id}")def update_task(    task_id: int,    task_update: Task,    session: Session = Depends(get_session)):    task = session.get(Task, task_id)    if not task:        raise HTTPException(status_code=404, detail="Task not found")    task.title = task_update.title    task.description = task_update.description    task.status = task_update.status    session.add(task)    session.commit()    session.refresh(task)    return task@app.delete("/tasks/{task_id}", status_code=204)def delete_task(task_id: int, session: Session = Depends(get_session)):    task = session.get(Task, task_id)    if not task:        raise HTTPException(status_code=404, detail="Task not found")    session.delete(task)    session.commit()
```

**Output:**

```
$ curl -X POST http://localhost:8000/tasks \  -H "Content-Type: application/json" \  -d '{"title": "Learn SQLModel"}'{"id":1,"title":"Learn SQLModel","description":null,"status":"pending","created_at":"2024-01-15T10:30:00"}$ curl http://localhost:8000/tasks[{"id":1,"title":"Learn SQLModel","description":null,"status":"pending","created_at":"2024-01-15T10:30:00"}]
```

Restart the server. The data persists. That's the difference a database makes.

## Hands-On Exercise

**Step 1:** Create a Neon account and get your connection string

**Step 2:** Add DATABASE\_URL to your .env

**Step 3:** Create models.py and database.py as shown above

**Step 4:** Update main.py to use the database

**Step 5:** Test CRUD operations through Swagger UI

**Step 6:** Restart the server and verify data persists

## Common Mistakes

**Mistake 1:** Forgetting `table=True`

```
# Wrong - just a Pydantic model, no database tableclass Task(SQLModel):    title: str# Correct - creates database tableclass Task(SQLModel, table=True):    title: str
```

**Mistake 2:** Missing primary key

```
# Wrong - no primary key definedclass Task(SQLModel, table=True):    title: str# Correct - has primary keyclass Task(SQLModel, table=True):    id: Optional[int] = Field(default=None, primary_key=True)    title: str
```

**Mistake 3:** Not calling session.commit()

```
# Wrong - changes not savedsession.add(task)return task  # ID is still None!# Correct - commit saves to databasesession.add(task)session.commit()session.refresh(task)  # Now has IDreturn task
```

**Mistake 4:** Using wrong connection string

```
# Wrong - missing sslmode for NeonDATABASE_URL=postgresql://user:pass@host/db# Correct - SSL required for NeonDATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

## What About Migrations?

This "fast track" approach uses `create_all()` which:

-   Creates tables that don't exist
-   Does NOT modify existing tables

If you change your model (add a column), you need to either:

1.  Drop and recreate the table (loses data)
2.  Use Alembic migrations (covered in Chapter 47)

For learning, the fast track is fine. For production, you'll add migrations.

## Try With AI

After completing the exercise, explore these scenarios.

**Prompt 1: Filtering Queries**

```
I have tasks in my database. How do I filter them?For example, get only tasks with status="pending"or tasks created in the last 7 days.Show me SQLModel select() with where() clauses.
```

**What you're learning:** Select queries can filter, sort, and limit results. This is essential for real-world APIs.

**Prompt 2: Separate Request/Response Models**

```
My Task model has table=True for the database, but I wantdifferent fields for API requests and responses.For example, I don't want clients to set created_at.How do I separate database models from API models in SQLModel?
```

**What you're learning:** Real APIs often have TaskCreate, TaskRead, and Task (database) as separate models. SQLModel supports this pattern.

**Prompt 3: Connection Pooling**

```
My API might get many concurrent requests. Each requestcreates a new database connection with get_session().Is this efficient? Should I use connection pooling?
```

**What you're learning:** Production databases use connection pools. SQLAlchemy (which SQLModel uses) has pooling built in—understanding when it matters is important.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me set up database integration with SQLModel and Neon.Does my skill include model definitions, create_engine, Session management, and CRUD operations?
```

### Identify Gaps

Ask yourself:

-   Did my skill include SQLModel table definitions with table=True?
-   Did it handle database connection setup and Session dependency injection?
-   Did it cover CRUD operations using Session (add, exec, get, commit, refresh)?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing database integration patterns.Update it to include SQLModel table definitions, Neon connection setup,Session management with yield dependencies, and proper CRUD operations.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   User Management & Password Hashing

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/09-user-management-password-hashing.md)

# User Management & Password Hashing

Your API has tasks. Now it needs users. Before anyone can log in, they need an account. And before you store passwords, you need to understand why **you never store passwords**.

You store *hashes*.

## Why Password Hashing Matters

If your database leaks (and breaches happen), what does the attacker get?

Storage Method

What Attacker Gets

Plaintext passwords

Every password instantly. Users compromised everywhere they reused it.

Hashed passwords

Useless strings. Each hash must be cracked individually—expensive and slow.

**Argon2** is the current gold standard for password hashing:

-   Memory-hard (expensive to parallelize on GPUs)
-   Winner of the Password Hashing Competition (2015)
-   Configurable difficulty (can increase over time)

This lesson implements user signup with proper password hashing. The next lesson adds JWT authentication for login.

## Installing Dependencies

```
uv add pwdlib[argon2]
```

-   `pwdlib` - Modern password hashing library
-   `[argon2]` - Argon2 algorithm support

## Password Hashing Functions

Create `security.py`:

```
from pwdlib import PasswordHashfrom pwdlib.hashers.argon2 import Argon2Hasherpassword_hash = PasswordHash((Argon2Hasher(),))def hash_password(password: str) -> str:    """Hash a password with Argon2."""    return password_hash.hash(password)def verify_password(plain_password: str, hashed_password: str) -> bool:    """Verify a password against its hash."""    return password_hash.verify(plain_password, hashed_password)
```

**Test it in Python:**

```
>>> from security import hash_password, verify_password>>> hashed = hash_password("mysecret")>>> hashed'$argon2id$v=19$m=65536,t=3,p=4$randomsalt$longhashstring'>>> verify_password("mysecret", hashed)True>>> verify_password("wrongpassword", hashed)False
```

Notice the hash includes algorithm parameters (`m=65536,t=3,p=4`). This means you can upgrade security settings over time without breaking existing hashes.

## User Model

Add to `models.py`:

```
from sqlmodel import SQLModel, Fieldfrom typing import Optionalfrom datetime import datetimeclass User(SQLModel, table=True):    """User account with hashed password."""    id: Optional[int] = Field(default=None, primary_key=True)    email: str = Field(unique=True, index=True)    hashed_password: str    created_at: datetime = Field(default_factory=datetime.utcnow)class UserCreate(SQLModel):    """Request model for user signup."""    email: str    password: str
```

**Key design decisions:**

Field

Why

`hashed_password`

Named explicitly—never confuse with plaintext

`unique=True`

One account per email

`index=True`

Fast lookup during login

`UserCreate`

Separate model for requests (has `password`, not `hashed_password`)

## Signup Endpoint

Add to `main.py`:

```
from fastapi import FastAPI, Depends, HTTPException, statusfrom sqlmodel import Session, selectfrom models import User, UserCreatefrom security import hash_passwordfrom database import get_session, create_db_and_tablesapp = FastAPI(title="Task API")@app.on_event("startup")def on_startup():    create_db_and_tables()@app.post("/users/signup", status_code=201)def signup(    user_data: UserCreate,    session: Session = Depends(get_session)):    """Create a new user account."""    # Check if email already exists    existing = session.exec(        select(User).where(User.email == user_data.email)    ).first()    if existing:        raise HTTPException(            status_code=status.HTTP_400_BAD_REQUEST,            detail="Email already registered"        )    # Create user with hashed password    user = User(        email=user_data.email,        hashed_password=hash_password(user_data.password)    )    session.add(user)    session.commit()    session.refresh(user)    # Return safe fields only    return {"id": user.id, "email": user.email}
```

**Test the endpoint:**

```
curl -X POST http://localhost:8000/users/signup \  -H "Content-Type: application/json" \  -d '{"email": "alice@example.com", "password": "SecurePass123"}'
```

**Output:**

```
{"id": 1, "email": "alice@example.com"}
```

Try the same email again:

```
curl -X POST http://localhost:8000/users/signup \  -H "Content-Type: application/json" \  -d '{"email": "alice@example.com", "password": "DifferentPass"}'
```

**Output:**

```
{"detail": "Email already registered"}
```

## Security Principles Applied

Principle

Implementation

Never store plaintext

`hash_password()` before saving

Never return hashes

Response only includes `id` and `email`

Prevent enumeration

Duplicate check before creation

Use modern algorithms

Argon2id (memory-hard, GPU-resistant)

## Hands-On Exercise

**Step 1:** Install pwdlib:

```
uv add pwdlib[argon2]
```

**Step 2:** Create `security.py` with hash/verify functions

**Step 3:** Add User and UserCreate models to `models.py`

**Step 4:** Add signup endpoint to `main.py`

**Step 5:** Test the flow:

```
# Create a usercurl -X POST http://localhost:8000/users/signup \  -H "Content-Type: application/json" \  -d '{"email": "test@example.com", "password": "MySecure123"}'# Verify duplicate preventioncurl -X POST http://localhost:8000/users/signup \  -H "Content-Type: application/json" \  -d '{"email": "test@example.com", "password": "Different"}'
```

**Step 6:** Check the database—verify passwords are hashed, not plaintext

## Common Mistakes

**Mistake 1:** Storing plaintext passwords

```
# NEVER do thisuser = User(email=email, password=password)# ALWAYS hashuser = User(email=email, hashed_password=hash_password(password))
```

**Mistake 2:** Returning the hash in responses

```
# Wrong - exposes hashreturn user# Correct - only safe fieldsreturn {"id": user.id, "email": user.email}
```

**Mistake 3:** Using weak hashing algorithms

```
# Wrong - MD5 and SHA are not password hashing algorithmsimport hashlibhashed = hashlib.md5(password.encode()).hexdigest()# Correct - use Argon2from security import hash_passwordhashed = hash_password(password)
```

**Mistake 4:** Naming the field `password` instead of `hashed_password`

```
# Misleading - suggests it might be plaintextclass User(SQLModel, table=True):    password: str# Clear - obviously a hashclass User(SQLModel, table=True):    hashed_password: str
```

## What's Next?

You have users. They can sign up. But they can't *do* anything yet—no login, no sessions, no protected routes.

The next lesson adds JWT authentication:

-   Login endpoint that verifies passwords
-   Token generation for authenticated sessions
-   Protected routes that require tokens

## Try With AI

**Prompt 1: Password Strength Validation**

```
I want to enforce password requirements before hashing:- Minimum 8 characters- At least one uppercase, one lowercase, one numberShould I validate in the Pydantic model or security.py?Show me both approaches with tradeoffs.
```

**What you're learning:** Input validation location matters. Pydantic validates at API boundary (user-friendly errors); security module validates at hashing time (defense in depth).

**Prompt 2: Email Validation**

```
How do I validate that emails are properly formatted before signup?I want to reject "not-an-email" but accept "user@example.com".Show me Pydantic EmailStr and explain when it's enoughvs when you need external validation.
```

**What you're learning:** Pydantic's `EmailStr` validates format. Real email verification requires sending a confirmation link—different problem.

**Prompt 3: Password Reset Flow**

```
A user forgot their password. Walk me through the securepassword reset flow:1. What endpoint do they call?2. How do I generate a reset token?3. How long should it be valid?4. What happens when they use it?
```

**What you're learning:** Password reset is a common security-critical feature. Understanding the token-based flow prepares you for production systems.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me implement user signup with password hashing.Does my skill include Argon2 hashing with pwdlib and proper User model design?
```

### Identify Gaps

Ask yourself:

-   Did my skill include password hashing with pwdlib and Argon2Hasher?
-   Did it create separate User (database) and UserCreate (request) models?
-   Did it check for duplicate emails before creating users?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing user management patterns.Update it to include password hashing with pwdlib/Argon2,User model with hashed_password field, and signup endpointwith duplicate email prevention.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   JWT Authentication

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/10-jwt-authentication.md)

# JWT Authentication

Users can sign up. Now they need to log in. HTTP is stateless—every request is independent. How does the server know who's making a request?

**Tokens.**

The user logs in once, gets a token, and includes it in every subsequent request. The server validates the token to identify the user. No session storage needed.

## How JWT Works

```
1. User sends email/password to /token2. Server verifies password (using verify_password from L08)3. Server creates a signed JWT containing user identity4. User includes token in Authorization header5. Server validates signature, extracts user
```

**Key insight:** JWTs are *signed*, not encrypted. Anyone can read the payload. But only your server can create valid signatures.

## Installing Dependencies

```
uv add python-jose[cryptography]
```

-   `python-jose` - JWT encoding/decoding library
-   `[cryptography]` - Cryptographic backend for signing

## JWT Configuration

Add to `config.py`:

```
class Settings(BaseSettings):    # ... existing settings ...    secret_key: str  # For signing tokens    algorithm: str = "HS256"    access_token_expire_minutes: int = 30
```

Add to `.env`:

```
SECRET_KEY=your-secret-key-here
```

Generate a secure key:

```
openssl rand -hex 32
```

## Token Functions

Add to `auth.py`:

```
from datetime import datetime, timedeltafrom typing import Optionalfrom jose import jwt, JWTErrorfrom config import get_settingssettings = get_settings()def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:    """Create a signed JWT token."""    to_encode = data.copy()    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))    to_encode.update({"exp": expire})    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)def decode_token(token: str) -> Optional[dict]:    """Decode and validate a JWT token."""    try:        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])    except JWTError:        return None
```

**Test token creation:**

```
>>> from auth import create_access_token, decode_token>>> token = create_access_token({"sub": "alice@example.com"})>>> token'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZUBleGFtcGxlLmNvbSIsImV4cCI6MTcwNTMxODIwMH0.xxxxx'>>> decode_token(token){'sub': 'alice@example.com', 'exp': 1705318200}
```

The token has three parts (separated by dots):

1.  **Header** - Algorithm info (`{"alg": "HS256"}`)
2.  **Payload** - Your data (`{"sub": "alice@example.com", "exp": ...}`)
3.  **Signature** - Proves the token is authentic

## Login Endpoint

OAuth2 expects a specific request format. Add to `main.py`:

```
from fastapi import FastAPI, Depends, HTTPException, statusfrom fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestFormfrom sqlmodel import Session, selectfrom datetime import timedeltafrom models import Userfrom security import verify_passwordfrom auth import create_access_tokenfrom database import get_sessionfrom config import get_settingsapp = FastAPI(title="Task API")settings = get_settings()oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")@app.post("/token")def login(    form_data: OAuth2PasswordRequestForm = Depends(),    session: Session = Depends(get_session)):    """Authenticate user and return JWT token."""    # Find user by email    user = session.exec(        select(User).where(User.email == form_data.username)    ).first()    # Verify credentials    if not user or not verify_password(form_data.password, user.hashed_password):        raise HTTPException(            status_code=status.HTTP_401_UNAUTHORIZED,            detail="Incorrect email or password",            headers={"WWW-Authenticate": "Bearer"},        )    # Create token    access_token = create_access_token(        data={"sub": user.email},        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)    )    return {"access_token": access_token, "token_type": "bearer"}
```

**Security note:** The error message is intentionally generic. "Incorrect email or password" doesn't reveal whether the email exists—preventing enumeration attacks.

**Test the login:**

```
curl -X POST http://localhost:8000/token \  -d "username=alice@example.com&password=SecurePass123"
```

**Output:**

```
{  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  "token_type": "bearer"}
```

Note: OAuth2 uses form data (not JSON) and the field is called `username` even though we're using email.

## Protecting Routes

Create a dependency that extracts the current user from the token:

```
from auth import decode_tokenasync def get_current_user(    token: str = Depends(oauth2_scheme),    session: Session = Depends(get_session)) -> User:    """Extract and validate user from JWT token."""    credentials_exception = HTTPException(        status_code=status.HTTP_401_UNAUTHORIZED,        detail="Could not validate credentials",        headers={"WWW-Authenticate": "Bearer"},    )    payload = decode_token(token)    if payload is None:        raise credentials_exception    email: str = payload.get("sub")    if email is None:        raise credentials_exception    user = session.exec(select(User).where(User.email == email)).first()    if user is None:        raise credentials_exception    return user
```

Now use it to protect routes:

```
@app.get("/users/me")def read_current_user(current_user: User = Depends(get_current_user)):    """Return current user info."""    return {"id": current_user.id, "email": current_user.email}
```

**Test protected route:**

```
# Without token - failscurl http://localhost:8000/users/me# {"detail":"Not authenticated"}# With token - succeedscurl http://localhost:8000/users/me \  -H "Authorization: Bearer eyJhbGci..."# {"id": 1, "email": "alice@example.com"}
```

## Protecting Task Routes

Associate tasks with users:

```
@app.post("/tasks", status_code=201)def create_task(    task: TaskCreate,    session: Session = Depends(get_session),    current_user: User = Depends(get_current_user)):    """Create a task for the current user."""    db_task = Task(**task.dict(), owner_id=current_user.id)    session.add(db_task)    session.commit()    session.refresh(db_task)    return db_task@app.get("/tasks")def list_tasks(    session: Session = Depends(get_session),    current_user: User = Depends(get_current_user)):    """List tasks belonging to current user."""    return session.exec(        select(Task).where(Task.owner_id == current_user.id)    ).all()
```

Now users only see their own tasks.

## Swagger UI Integration

FastAPI's Swagger UI has built-in OAuth2 support:

1.  Open `/docs`
2.  Click the "Authorize" button (lock icon)
3.  Enter email and password
4.  Click "Authorize"
5.  All requests now include the token automatically

This makes testing protected endpoints easy without manually copying tokens.

## Hands-On Exercise

**Step 1:** Install python-jose:

```
uv add python-jose[cryptography]
```

**Step 2:** Add JWT settings to `config.py` and `.env`

**Step 3:** Create `auth.py` with token functions

**Step 4:** Add `/token` endpoint to `main.py`

**Step 5:** Create `get_current_user` dependency

**Step 6:** Add `/users/me` protected route

**Step 7:** Test the complete flow:

```
# Create a user (from L08)curl -X POST http://localhost:8000/users/signup \  -H "Content-Type: application/json" \  -d '{"email": "bob@example.com", "password": "SecurePass123"}'# Login to get tokencurl -X POST http://localhost:8000/token \  -d "username=bob@example.com&password=SecurePass123"# Use token to access protected routecurl http://localhost:8000/users/me \  -H "Authorization: Bearer <your-token>"
```

## Common Mistakes

**Mistake 1:** Using JSON for /token

```
# Wrong - OAuth2 expects form datacurl -X POST http://localhost:8000/token \  -H "Content-Type: application/json" \  -d '{"username": "test", "password": "secret"}'# Correct - form datacurl -X POST http://localhost:8000/token \  -d "username=test&password=secret"
```

**Mistake 2:** Forgetting WWW-Authenticate header

```
# Wrong - browsers won't prompt for credentialsraise HTTPException(status_code=401, detail="Not authenticated")# Correct - proper headerraise HTTPException(    status_code=status.HTTP_401_UNAUTHORIZED,    detail="Not authenticated",    headers={"WWW-Authenticate": "Bearer"},)
```

**Mistake 3:** Putting sensitive data in tokens

```
# Wrong - anyone can decode JWTs!create_access_token({"sub": email, "password": password})# Correct - only identifierscreate_access_token({"sub": email})
```

**Mistake 4:** Hardcoding the secret key

```
# Wrong - exposed in codeSECRET_KEY = "my-secret-key"# Correct - from environmentsettings.secret_key
```

## The Authentication Flow

Here's the complete picture:

```
┌─────────────┐     POST /users/signup      ┌─────────────┐│   Client    │ ───────────────────────────►│   Server    ││             │     {"email", "password"}   │             ││             │◄─────────────────────────── │  (hashes &  ││             │     {"id", "email"}         │   stores)   │└─────────────┘                             └─────────────┘┌─────────────┐     POST /token             ┌─────────────┐│   Client    │ ───────────────────────────►│   Server    ││             │     username=&password=     │             ││             │◄─────────────────────────── │ (verifies & ││             │     {"access_token": ...}   │  signs JWT) │└─────────────┘                             └─────────────┘┌─────────────┐     GET /tasks              ┌─────────────┐│   Client    │ ───────────────────────────►│   Server    ││             │     Authorization: Bearer   │             ││             │◄─────────────────────────── │ (validates  ││             │     [user's tasks]          │   & serves) │└─────────────┘                             └─────────────┘
```

## Try With AI

**Prompt 1: Token Expiration**

```
My JWT tokens expire after 30 minutes. What happens when auser's token expires mid-session? How should my frontendhandle this? Should I implement refresh tokens?
```

**What you're learning:** Token expiration is a UX and security tradeoff. Short-lived tokens are more secure but require refresh logic.

**Prompt 2: Custom Token Claims**

```
I want to include user roles in my JWT so I can check permissionswithout a database query. What are the tradeoffs?What claims should vs shouldn't go in a JWT?
```

**What you're learning:** JWTs can carry any data, but there are size and staleness tradeoffs. Roles cached in JWTs can't be revoked instantly.

**Prompt 3: Testing Authentication**

```
How do I write pytest tests for my protected endpoints?I need to:1. Create a test user2. Get a token in the test3. Include it in requests4. Test both authenticated and unauthenticated cases
```

**What you're learning:** Testing auth requires fixtures and patterns. Understanding these makes your test suite reliable.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me implement JWT authentication.Does my skill include token generation, validation, protected routes, and OAuth2 password flow?
```

### Identify Gaps

Ask yourself:

-   Did my skill include JWT token creation with python-jose?
-   Did it handle OAuth2PasswordBearer and get\_current\_user dependency?
-   Did it cover protected endpoints and token validation?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing JWT authentication patterns.Update it to include token creation/validation with python-jose,OAuth2PasswordBearer setup, get_current_user dependency,and protected route implementation with Depends().
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Middleware & CORS

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/11-middleware-and-cors.md)

# Middleware & CORS

Every request to your API passes through the same door. Every response leaves through the same door. Middleware sits at that door—inspecting, modifying, logging, timing.

For agent APIs, middleware solves two critical problems:

1.  **CORS** — Frontends on different domains need permission to call your API
2.  **Observability** — You need to know how long requests take and what's happening

## What Is Middleware?

Middleware intercepts every request before it reaches your endpoints and every response before it returns to the client:

```
Client Request      ↓┌─────────────────┐│   Middleware    │ ← Log request, start timer└────────┬────────┘         ↓┌─────────────────┐│   Your Route    │ ← /tasks, /users/me, etc.└────────┬────────┘         ↓┌─────────────────┐│   Middleware    │ ← Add headers, log response time└────────┬────────┘         ↓   Client Response
```

This is powerful because you write the logic once and it applies to ALL endpoints.

## Creating Custom Middleware

Use the `@app.middleware("http")` decorator:

```
import timefrom fastapi import FastAPI, Requestapp = FastAPI()@app.middleware("http")async def add_process_time_header(request: Request, call_next):    """Add processing time to every response."""    start_time = time.perf_counter()    response = await call_next(request)  # Pass to route    process_time = time.perf_counter() - start_time    response.headers["X-Process-Time"] = str(process_time)    return response
```

**Key components:**

Component

Purpose

`request: Request`

The incoming HTTP request

`call_next`

Function that passes request to the route (or next middleware)

`await call_next(request)`

Execute the route and get the response

`response.headers[...]`

Modify the response before returning

**Test it:**

```
curl -i http://localhost:8000/tasks
```

**Output:**

```
HTTP/1.1 200 OKx-process-time: 0.0023456content-type: application/json...
```

Every response now includes timing information.

## Request Logging Middleware

Log every request for debugging and monitoring:

```
import logginglogging.basicConfig(level=logging.INFO)logger = logging.getLogger(__name__)@app.middleware("http")async def log_requests(request: Request, call_next):    """Log all incoming requests."""    logger.info(f"{request.method} {request.url.path}")    response = await call_next(request)    logger.info(f"{request.method} {request.url.path} → {response.status_code}")    return response
```

**Output (server logs):**

```
INFO: GET /tasksINFO: GET /tasks → 200INFO: POST /tasksINFO: POST /tasks → 201INFO: GET /tasks/999INFO: GET /tasks/999 → 404
```

Now you can see every request flowing through your API.

## Middleware Execution Order

When you have multiple middlewares, order matters. They form a **stack**:

```
@app.middleware("http")async def middleware_a(request: Request, call_next):    print("A: before")    response = await call_next(request)    print("A: after")    return response@app.middleware("http")async def middleware_b(request: Request, call_next):    print("B: before")    response = await call_next(request)    print("B: after")    return response
```

**Output:**

```
B: beforeA: before[route executes]A: afterB: after
```

The **last added** middleware is the **outermost** (first to receive request, last to process response).

## CORS: Cross-Origin Resource Sharing

When your frontend (e.g., `http://localhost:3000`) calls your API (e.g., `http://localhost:8000`), the browser blocks it by default. Different ports = different origins = blocked.

CORS tells browsers: "Yes, this frontend is allowed to call me."

### What Is an Origin?

An origin is: **protocol + domain + port**

URL

Origin

`http://localhost:3000`

`http://localhost:3000`

`http://localhost:8000`

`http://localhost:8000`

`https://myapp.com`

`https://myapp.com`

`https://api.myapp.com`

`https://api.myapp.com`

These are ALL different origins. Cross-origin requests are blocked unless you explicitly allow them.

### Configuring CORSMiddleware

```
from fastapi import FastAPIfrom fastapi.middleware.cors import CORSMiddlewareapp = FastAPI()origins = [    "http://localhost:3000",      # React dev server    "http://localhost:5173",      # Vite dev server    "https://myapp.com",          # Production frontend]app.add_middleware(    CORSMiddleware,    allow_origins=origins,    allow_credentials=True,    allow_methods=["*"],    allow_headers=["*"],)
```

Now frontends on those origins can call your API.

### CORS Parameters

Parameter

Purpose

Common Value

`allow_origins`

Which origins can call the API

List of URLs

`allow_methods`

Which HTTP methods are allowed

`["*"]` for all

`allow_headers`

Which request headers are allowed

`["*"]` for all

`allow_credentials`

Allow cookies/auth headers

`True`

`expose_headers`

Which response headers browser can access

`["X-Process-Time"]`

`max_age`

How long to cache CORS response

`600` (10 minutes)

### Development vs Production

**Development** (allow everything):

```
app.add_middleware(    CORSMiddleware,    allow_origins=["*"],  # Any origin    allow_methods=["*"],    allow_headers=["*"],)
```

**Production** (explicit origins):

```
from config import get_settingssettings = get_settings()app.add_middleware(    CORSMiddleware,    allow_origins=settings.cors_origins,  # From environment    allow_credentials=True,    allow_methods=["GET", "POST", "PUT", "DELETE"],    allow_headers=["Authorization", "Content-Type"],)
```

Add to `.env`:

```
CORS_ORIGINS=["https://myapp.com","https://admin.myapp.com"]
```

### Important CORS Rule

If `allow_credentials=True`, you **cannot** use `["*"]` for origins. You must list specific origins. This prevents credential leakage to malicious sites.

## Complete Middleware Setup

Here's a production-ready middleware configuration:

```
import timeimport loggingfrom fastapi import FastAPI, Requestfrom fastapi.middleware.cors import CORSMiddlewarefrom config import get_settingslogging.basicConfig(level=logging.INFO)logger = logging.getLogger(__name__)settings = get_settings()app = FastAPI(title="Task API")# CORS - must be added first (outermost)app.add_middleware(    CORSMiddleware,    allow_origins=settings.cors_origins,    allow_credentials=True,    allow_methods=["*"],    allow_headers=["*"],    expose_headers=["X-Process-Time"],)@app.middleware("http")async def add_process_time(request: Request, call_next):    """Add processing time header."""    start = time.perf_counter()    response = await call_next(request)    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"    return response@app.middleware("http")async def log_requests(request: Request, call_next):    """Log all requests."""    logger.info(f"→ {request.method} {request.url.path}")    response = await call_next(request)    logger.info(f"← {request.method} {request.url.path} [{response.status_code}]")    return response
```

**Execution order for a request:**

1.  `log_requests` (logs incoming)
2.  `add_process_time` (starts timer)
3.  `CORSMiddleware` (adds CORS headers)
4.  Route executes
5.  `CORSMiddleware` (response)
6.  `add_process_time` (adds header)
7.  `log_requests` (logs outgoing)

## Hands-On Exercise

**Step 1:** Add timing middleware to your Task API

**Step 2:** Add request logging middleware

**Step 3:** Configure CORS for `http://localhost:3000`

**Step 4:** Test with curl:

```
# Check timing headercurl -i http://localhost:8000/tasks# Simulate CORS preflightcurl -X OPTIONS http://localhost:8000/tasks \  -H "Origin: http://localhost:3000" \  -H "Access-Control-Request-Method: POST" \  -i
```

**Step 5:** Verify CORS headers in response:

```
Access-Control-Allow-Origin: http://localhost:3000Access-Control-Allow-Methods: *Access-Control-Allow-Headers: *
```

## Common Mistakes

**Mistake 1:** Forgetting to await call\_next

```
# Wrong - blocks foreverresponse = call_next(request)# Correctresponse = await call_next(request)
```

**Mistake 2:** Using credentials with wildcard origin

```
# Wrong - browser rejects thisapp.add_middleware(    CORSMiddleware,    allow_origins=["*"],    allow_credentials=True,  # Can't use with wildcard!)# Correct - explicit originsapp.add_middleware(    CORSMiddleware,    allow_origins=["http://localhost:3000"],    allow_credentials=True,)
```

**Mistake 3:** Not returning the response

```
# Wrong - returns None@app.middleware("http")async def bad_middleware(request: Request, call_next):    response = await call_next(request)    # Forgot to return!# Correct@app.middleware("http")async def good_middleware(request: Request, call_next):    response = await call_next(request)    return response
```

## Why This Matters for Agents

When you expose agent endpoints:

1.  **Frontends need CORS** — A React app calling your `/agent/chat` endpoint
2.  **Timing matters** — Know if agent responses are slow
3.  **Logging helps debug** — See what's being sent to agents
4.  **Consistent headers** — All responses get the same treatment

Middleware ensures every request to your agent API is tracked, timed, and accessible.

## Try With AI

**Prompt 1: Error Handling Middleware**

```
I want middleware that catches exceptions and returnsconsistent JSON error responses instead of HTML error pages.Show me how to wrap call_next in try/except and format errors.
```

**What you're learning:** Middleware can normalize error responses across all endpoints.

**Prompt 2: Rate Limit Headers**

```
I'm adding rate limiting to my API. How do I addX-RateLimit-Remaining and X-RateLimit-Reset headersvia middleware so all endpoints show rate limit status?
```

**What you're learning:** Middleware can add information from external systems (like rate limiters) to responses.

**Prompt 3: Request ID Tracing**

```
I want to add a unique X-Request-ID header to every requestfor distributed tracing. Show me how to generate a UUIDin middleware and add it to both the request (for logging)and the response (for client correlation).
```

**What you're learning:** Request IDs enable tracing requests across microservices and logs.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me add middleware for timing and CORS.Does my skill include @app.middleware patterns and CORSMiddleware configuration?
```

### Identify Gaps

Ask yourself:

-   Did my skill include custom middleware with call\_next?
-   Did it configure CORS for frontend access?
-   Did it handle middleware execution order?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing middleware patterns.Update it to include timing middleware with @app.middleware,CORSMiddleware configuration with explicit origins,and request logging for observability.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Lifespan Events

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/12-lifespan-events.md)

# Lifespan Events

Your agent API needs resources ready before it handles requests. A database connection pool. A loaded ML model. An initialized cache. Loading these on-demand wastes the first request's time.

Lifespan events let you run code at startup (before any request) and shutdown (after the last response). Think of it as opening and closing a restaurant—prep the kitchen before customers arrive, clean up after they leave.

## The Lifespan Pattern

FastAPI uses Python's `@asynccontextmanager` to define lifespan:

```
from contextlib import asynccontextmanagerfrom fastapi import FastAPI@asynccontextmanagerasync def lifespan(app: FastAPI):    # STARTUP: Code here runs before the first request    print("Starting up...")    yield  # Server runs and handles requests    # SHUTDOWN: Code here runs after the server stops    print("Shutting down...")app = FastAPI(lifespan=lifespan)
```

**The pattern explained:**

1.  Everything **before** `yield` runs at startup
2.  The `yield` statement is where the app runs and serves requests
3.  Everything **after** `yield` runs at shutdown

**Output (when server starts and stops):**

```
Starting up...INFO:     Application startup complete.INFO:     Uvicorn running on http://127.0.0.1:8000# ... server handles requests ...# (Ctrl+C to stop)INFO:     Shutting downShutting down...INFO:     Application shutdown complete.
```

## Sharing State with Endpoints

Resources initialized at startup need to be accessible in endpoints. Use `app.state`:

```
from contextlib import asynccontextmanagerfrom fastapi import FastAPI, Request@asynccontextmanagerasync def lifespan(app: FastAPI):    # Load at startup    app.state.settings = {"version": "1.0", "debug": True}    yield    # Cleanup (nothing to clean for a dict)app = FastAPI(lifespan=lifespan)@app.get("/info")async def get_info(request: Request):    """Access shared state via request.app.state."""    return {        "version": request.app.state.settings["version"],        "debug": request.app.state.settings["debug"],    }
```

**Output:**

```
{  "version": "1.0",  "debug": true}
```

Access `app.state` through `request.app` in endpoints.

## Database Connection Pool

The most common use case—create a connection pool at startup, close it at shutdown:

```
from contextlib import asynccontextmanagerfrom sqlalchemy.ext.asyncio import create_async_engine, async_sessionmakerfrom sqlmodel.ext.asyncio.session import AsyncSessionfrom fastapi import FastAPI, Depends, Requestfrom config import get_settingssettings = get_settings()@asynccontextmanagerasync def lifespan(app: FastAPI):    # STARTUP: Create engine and session factory    engine = create_async_engine(        settings.database_url,        pool_pre_ping=True,        pool_size=5,    )    app.state.async_session = async_sessionmaker(        engine,        class_=AsyncSession,        expire_on_commit=False,    )    print("Database pool created")    yield    # SHUTDOWN: Dispose of the engine    await engine.dispose()    print("Database pool closed")app = FastAPI(lifespan=lifespan)async def get_session(request: Request):    """Dependency that yields sessions from the pool."""    async with request.app.state.async_session() as session:        yield session@app.get("/tasks")async def get_tasks(session: AsyncSession = Depends(get_session)):    result = await session.exec(select(Task))    return result.all()
```

**Why this matters for agents:**

-   Connection pool is ready before first request
-   No cold-start delay when agent calls `/tasks`
-   Pool closes gracefully—no leaked connections

## Preloading ML Models

Agents often use ML models for embeddings, classification, or generation. Load them once at startup:

```
from contextlib import asynccontextmanagerfrom fastapi import FastAPI, Requestfrom sentence_transformers import SentenceTransformer@asynccontextmanagerasync def lifespan(app: FastAPI):    # STARTUP: Load embedding model (slow operation)    print("Loading embedding model...")    app.state.embedder = SentenceTransformer("all-MiniLM-L6-v2")    print("Model loaded!")    yield    # SHUTDOWN: Free memory    del app.state.embedder    print("Model unloaded")app = FastAPI(lifespan=lifespan)@app.post("/embed")async def create_embedding(request: Request, text: str):    """Generate embeddings using preloaded model."""    embedding = request.app.state.embedder.encode(text)    return {"embedding": embedding.tolist()}
```

**Output (server startup):**

```
Loading embedding model...Model loaded!INFO:     Application startup complete.
```

The first `/embed` request responds immediately—no model loading delay.

## Initializing External Clients

Connect to external services at startup:

```
from contextlib import asynccontextmanagerfrom fastapi import FastAPI, Requestimport httpxfrom anthropic import AsyncAnthropic@asynccontextmanagerasync def lifespan(app: FastAPI):    # STARTUP: Initialize clients    app.state.http_client = httpx.AsyncClient(timeout=30.0)    app.state.anthropic = AsyncAnthropic()    print("Clients initialized")    yield    # SHUTDOWN: Close connections    await app.state.http_client.aclose()    print("Clients closed")app = FastAPI(lifespan=lifespan)@app.post("/agent/chat")async def agent_chat(request: Request, message: str):    """Use preinitialized Anthropic client."""    response = await request.app.state.anthropic.messages.create(        model="claude-sonnet-4-20250514",        max_tokens=1024,        messages=[{"role": "user", "content": message}],    )    return {"response": response.content[0].text}
```

## Complete Lifespan Example

Production-ready lifespan combining multiple resources:

```
from contextlib import asynccontextmanagerfrom sqlalchemy.ext.asyncio import create_async_engine, async_sessionmakerfrom sqlmodel.ext.asyncio.session import AsyncSessionfrom fastapi import FastAPIimport httpximport loggingfrom config import get_settingslogging.basicConfig(level=logging.INFO)logger = logging.getLogger(__name__)settings = get_settings()@asynccontextmanagerasync def lifespan(app: FastAPI):    """Initialize and cleanup application resources."""    # === STARTUP ===    logger.info("Starting application...")    # Database    engine = create_async_engine(settings.database_url, pool_pre_ping=True)    app.state.async_session = async_sessionmaker(        engine, class_=AsyncSession, expire_on_commit=False    )    app.state.engine = engine    logger.info("Database pool created")    # HTTP client for external calls    app.state.http_client = httpx.AsyncClient(timeout=30.0)    logger.info("HTTP client initialized")    # Cache or other state    app.state.cache = {}    logger.info("Cache initialized")    yield  # Application runs here    # === SHUTDOWN ===    logger.info("Shutting down application...")    # Close HTTP client    await app.state.http_client.aclose()    logger.info("HTTP client closed")    # Dispose database engine    await app.state.engine.dispose()    logger.info("Database pool closed")app = FastAPI(    title="Task API",    lifespan=lifespan,)
```

**Output (startup):**

```
INFO:     Starting application...INFO:     Database pool createdINFO:     HTTP client initializedINFO:     Cache initializedINFO:     Application startup complete.
```

**Output (shutdown with Ctrl+C):**

```
INFO:     Shutting down application...INFO:     HTTP client closedINFO:     Database pool closedINFO:     Application shutdown complete.
```

## Deprecated: on\_event Decorator

You may see older code using `@app.on_event()`:

```
# DEPRECATED - don't use in new code@app.on_event("startup")async def startup():    print("Starting...")@app.on_event("shutdown")async def shutdown():    print("Stopping...")
```

**Why lifespan is better:**

on\_event (deprecated)

lifespan (recommended)

Separate functions for startup/shutdown

Single function with yield

No easy way to share state

`app.state` flows naturally

Can't pass resources from startup to shutdown

Variables persist across yield

Being removed in future versions

Official recommended approach

## Hands-On Exercise

**Step 1:** Add lifespan to your Task API with database pool

**Step 2:** Preload a simple cache at startup:

```
app.state.rate_limits = {}  # user_id -> request_count
```

**Step 3:** Add cleanup logging to verify shutdown runs

**Step 4:** Test startup/shutdown:

```
# Start serveruvicorn main:app --reload# In another terminal, verify startup rancurl http://localhost:8000/info# Stop server (Ctrl+C) and verify shutdown logs
```

## Common Mistakes

**Mistake 1:** Forgetting to yield

```
# Wrong - server never starts@asynccontextmanagerasync def lifespan(app: FastAPI):    print("Starting...")    # Missing yield!# Correct@asynccontextmanagerasync def lifespan(app: FastAPI):    print("Starting...")    yield
```

**Mistake 2:** Not passing lifespan to FastAPI

```
# Wrong - lifespan never runsapp = FastAPI()# Correctapp = FastAPI(lifespan=lifespan)
```

**Mistake 3:** Accessing app.state without request

```
# Wrong - can't access app.state directly in endpoint@app.get("/data")async def get_data():    return app.state.settings  # May work but wrong pattern# Correct - access through request@app.get("/data")async def get_data(request: Request):    return request.app.state.settings
```

## Why This Matters for Agents

Agent APIs benefit from lifespan in three ways:

1.  **No cold starts** — Embedding models, database pools, LLM clients ready before first request
2.  **Graceful shutdown** — Finish pending requests, close connections cleanly
3.  **Resource sharing** — One model instance serves all requests efficiently

When your agent needs to respond in milliseconds, loading resources lazily on first request isn't acceptable.

## Try With AI

**Prompt 1: Health Check with Lifespan State**

```
I want to add a /health endpoint that returns the status ofresources initialized in lifespan. Show me how to trackdatabase connection status and cache size in app.state,then expose them in a health check endpoint.
```

**What you're learning:** Health checks that reflect actual resource status, not just "OK".

**Prompt 2: Graceful Shutdown with Pending Requests**

```
My agent API sometimes gets shutdown signals whileprocessing requests. How do I ensure pending requestscomplete before shutdown runs? Show me the patternfor graceful shutdown with a timeout.
```

**What you're learning:** Production shutdown handling—don't cut off users mid-request.

**Prompt 3: Conditional Resource Loading**

```
I want to load an ML model only in production (not in tests).How do I check the environment in lifespan and conditionallyinitialize resources? Include the pattern for mockingapp.state in tests.
```

**What you're learning:** Environment-aware initialization for faster test runs.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me set up lifespan eventsfor a database connection pool and HTTP client.Does my skill include @asynccontextmanager lifespan patterns?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the lifespan function with yield?
-   Did it use app.state for sharing resources?
-   Did it include cleanup after yield?
-   Did it pass lifespan to FastAPI()?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing lifespan event patterns.Update it to include a lifespan function using @asynccontextmanager,app.state for database pool and HTTP clients,and proper cleanup after yield.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Streaming with SSE

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/13-streaming-with-sse.md)

# Streaming with SSE

Some operations take time. When an AI agent generates a response, you don't want users staring at a loading spinner for 30 seconds. Streaming sends data as it becomes available—token by token for LLMs, update by update for long-running tasks.

This is the lesson that connects everything to agents. In Lesson 7, you'll stream actual agent responses. Here, you build the foundation with simulated data.

## Why Streaming Changes Everything

**Traditional request-response** (what you've built so far):

1.  Client sends request
2.  Server processes (30 seconds for agent response)
3.  Client waits with no feedback...
4.  Server sends complete response

**Streaming**:

1.  Client sends request
2.  Server starts processing
3.  Server sends first token immediately
4.  Server sends more tokens as available
5.  Client sees response forming in real-time

You've experienced this in ChatGPT—words appearing as the model generates them. That's streaming.

**For agents, streaming means**:

-   Users see responses forming, not waiting
-   Long tool calls show progress
-   Failed operations fail fast, not after timeout
-   Better perceived performance (first byte matters)

## How SSE Works (Under the Hood)

Server-Sent Events is a simple protocol. The server sends text in a specific format:

Output (raw SSE stream):

```
event: task_updatedata: {"task_id": 1, "status": "in_progress"}event: task_updatedata: {"task_id": 1, "status": "completed"}
```

Each event has:

-   `event`: Event type (optional, defaults to "message")
-   `data`: The payload (must be a string, usually JSON)
-   Blank line: Separates events

**Why SSE over WebSockets?**

-   SSE is simpler—just HTTP with a special content type
-   Works through proxies and load balancers without configuration
-   Browser handles reconnection automatically
-   One-directional (server → client) which is exactly what streaming needs

WebSockets are bidirectional, which adds complexity you don't need for agent responses.

## Installing sse-starlette

FastAPI doesn't include SSE by default. Add the package:

```
uv add sse-starlette
```

This provides `EventSourceResponse`, which handles SSE formatting automatically.

## Your First Streaming Endpoint

```
from fastapi import FastAPIfrom sse_starlette.sse import EventSourceResponseimport asyncioimport jsonapp = FastAPI(title="Task API")async def task_updates_generator():    """Simulates task status updates over time."""    for i in range(5):        yield {            "event": "task_update",            "data": json.dumps({                "task_id": i + 1,                "status": "processing",                "progress": (i + 1) * 20            })        }        await asyncio.sleep(1)  # Simulate work    yield {        "event": "complete",        "data": json.dumps({"message": "All tasks processed"})    }@app.get("/tasks/stream")async def stream_task_updates():    return EventSourceResponse(task_updates_generator())
```

**Breaking this down**:

1.  **`async def` with `yield`** creates an **async generator**—a function that produces values over time
2.  **Each `yield`** sends one SSE event to the client
3.  **`await asyncio.sleep(1)`** simulates work (in Lesson 7, this is where the agent generates tokens)
4.  **`EventSourceResponse`** wraps the generator and handles SSE formatting

**The key insight**: `yield` doesn't end the function. It pauses, sends data, then continues. This is fundamentally different from `return`.

## Why Async Generators Matter for Agents

In Lesson 7, you'll stream agent responses like this:

```
async def agent_response_generator(message: str):    result = Runner.run_streamed(agent, message)    async for event in result.stream_events():        if event.type == "raw_response_event":            # Extract token text from the response delta            if hasattr(event.data, 'delta') and hasattr(event.data.delta, 'text'):                yield {                    "event": "token",                    "data": event.data.delta.text                }
```

The pattern is identical:

-   Async generator yields data
-   `EventSourceResponse` sends it
-   Client receives tokens as they generate

Master the pattern here with simulated data. Lesson 7 plugs in the real agent.

## Testing in Browser

Swagger UI doesn't work for SSE—it expects regular responses. Open your browser's console:

```
const source = new EventSource('http://localhost:8000/tasks/stream');source.onmessage = (event) => {    console.log('Message:', event.data);};source.addEventListener('task_update', (event) => {    console.log('Task update:', JSON.parse(event.data));});source.addEventListener('complete', (event) => {    console.log('Complete:', JSON.parse(event.data));    source.close();});source.onerror = (error) => {    console.error('Error:', error);    source.close();};
```

You'll see events arriving one second apart.

**Important**: The browser automatically reconnects if the connection drops. That's a feature of `EventSource`. For agent responses, you might want to disable this (handled in the client code).

## Streaming with Context

Let's add streaming that relates to a specific task:

```
from fastapi import Depends, HTTPException, statusfrom repository import TaskRepository, get_task_repoasync def task_progress_generator(task_id: int, task_title: str):    """Streams progress updates for a specific task."""    steps = [        "Analyzing task...",        "Processing requirements...",        "Generating output...",        "Validating results...",        "Finalizing...",    ]    for i, step in enumerate(steps, 1):        yield {            "event": "progress",            "data": json.dumps({                "task_id": task_id,                "task_title": task_title,                "step": i,                "total_steps": len(steps),                "message": step,                "percentage": int((i / len(steps)) * 100)            })        }        await asyncio.sleep(0.8)    yield {        "event": "complete",        "data": json.dumps({            "task_id": task_id,            "status": "completed"        })    }@app.post("/tasks/{task_id}/execute")async def execute_task(    task_id: int,    repo: TaskRepository = Depends(get_task_repo)):    # Verify task exists before streaming    task = repo.get_by_id(task_id)    if not task:        raise HTTPException(            status_code=status.HTTP_404_NOT_FOUND,            detail=f"Task with id {task_id} not found"        )    return EventSourceResponse(        task_progress_generator(task_id, task["title"])    )
```

**Notice the pattern**:

1.  Validate input BEFORE returning the stream
2.  Pass context (task\_id, task\_title) to the generator
3.  Generator doesn't need to access the repository—it just yields data

This matters for agents: you'll validate the conversation exists, then stream the response.

## Error Handling in Streams

What happens when an error occurs mid-stream? The client has already received some data.

```
async def risky_generator():    try:        for i in range(10):            if i == 5:                raise ValueError("Something went wrong at step 5!")            yield {                "event": "step",                "data": json.dumps({"step": i})            }            await asyncio.sleep(0.5)    except Exception as e:        # Send error as an event, don't raise        yield {            "event": "error",            "data": json.dumps({"error": str(e)})        }
```

**The key insight**: Once streaming starts, you can't change the HTTP status code. It's already been sent as 200. So you send an error EVENT, and the client handles it.

For agents, this means:

-   Agent starts generating
-   Tool call fails mid-response
-   Stream an error event
-   Client shows error in the UI

## The Complete Streaming Example

```
from fastapi import FastAPI, Depends, HTTPException, statusfrom sse_starlette.sse import EventSourceResponseimport asyncioimport jsonfrom repository import TaskRepository, get_task_repoapp = FastAPI(title="Task API")# Stream 1: System-wide updatesasync def system_updates_generator():    """Simulates system-wide events."""    events = [        ("info", {"message": "System started"}),        ("task_created", {"task_id": 1}),        ("task_updated", {"task_id": 1, "status": "in_progress"}),        ("task_completed", {"task_id": 1}),        ("info", {"message": "Batch complete"}),    ]    for event_type, data in events:        yield {            "event": event_type,            "data": json.dumps(data)        }        await asyncio.sleep(1)@app.get("/stream/system")async def stream_system_updates():    return EventSourceResponse(system_updates_generator())# Stream 2: Task-specific progressasync def task_work_generator(task_id: int, task_title: str):    """Simulates work on a specific task."""    steps = [        "Starting task...",        "Analyzing requirements...",        "Processing data...",        "Generating output...",        "Finalizing...",    ]    for i, step in enumerate(steps, 1):        yield {            "event": "step",            "data": json.dumps({                "task_id": task_id,                "task_title": task_title,                "step": i,                "message": step,                "progress": int((i / len(steps)) * 100)            })        }        await asyncio.sleep(0.8)    yield {        "event": "done",        "data": json.dumps({            "task_id": task_id,            "message": "Task completed successfully"        })    }@app.post("/tasks/{task_id}/execute")async def execute_task(    task_id: int,    repo: TaskRepository = Depends(get_task_repo)):    task = repo.get_by_id(task_id)    if not task:        raise HTTPException(            status_code=status.HTTP_404_NOT_FOUND,            detail=f"Task {task_id} not found"        )    return EventSourceResponse(        task_work_generator(task_id, task["title"])    )# Stream 3: Countdown (simple demo)async def countdown_generator(seconds: int):    """Simple countdown stream."""    for i in range(seconds, 0, -1):        yield {            "event": "tick",            "data": json.dumps({"remaining": i})        }        await asyncio.sleep(1)    yield {        "event": "complete",        "data": json.dumps({"message": "Countdown finished!"})    }@app.get("/stream/countdown/{seconds}")async def stream_countdown(seconds: int):    if seconds < 1 or seconds > 60:        raise HTTPException(            status_code=status.HTTP_400_BAD_REQUEST,            detail="Seconds must be between 1 and 60"        )    return EventSourceResponse(countdown_generator(seconds))
```

## Hands-On Exercise

Build a streaming endpoint for task processing:

**Step 1**: Add sse-starlette to your project

```
uv add sse-starlette
```

**Step 2**: Create a streaming endpoint that validates the task exists first

**Step 3**: Test in browser console

```
const source = new EventSource('http://localhost:8000/tasks/1/execute', {    method: 'POST'  // Note: EventSource is GET-only by default});
```

Wait—`EventSource` only supports GET! For POST, you need a different approach:

```
// For POST endpoints, use fetch with streamingasync function streamTask(taskId) {    const response = await fetch(`http://localhost:8000/tasks/${taskId}/execute`, {        method: 'POST'    });    const reader = response.body.getReader();    const decoder = new TextDecoder();    while (true) {        const {done, value} = await reader.read();        if (done) break;        console.log(decoder.decode(value));    }}streamTask(1);
```

**Step 4**: Observe events arriving in real-time

## Challenge: Build a Progress Tracker

**Before looking at any solution**, design a streaming endpoint:

**The Problem**: Build an endpoint that simulates an AI agent "thinking":

-   Starts with "Analyzing request..."
-   Shows 3-5 intermediate "thoughts"
-   Ends with a "conclusion"
-   Takes about 5 seconds total

Think about:

-   What events do you need? (thinking, thought, conclusion?)
-   How do you structure the data for each event?
-   How would a frontend render this progressively?

Implement it. Then compare with AI:

> "I built a thinking stream like this: \[paste your code\]. The frontend will need to render each thought in sequence. Is there a better event structure for progressive rendering?"

## Common Mistakes

**Mistake 1**: Forgetting to import json for data serialization

```
# Wrong - data must be a stringyield {"data": {"task_id": 1}}# Correct - serialize to JSON stringyield {"data": json.dumps({"task_id": 1})}
```

SSE data must be a string. If you pass a dict, you'll get errors.

**Mistake 2**: Not closing the connection on the client

```
// Wrong - connection stays open foreverconst source = new EventSource('/stream');// Correct - close when donesource.addEventListener('complete', () => source.close());
```

Open connections consume server resources. Always close when done.

**Mistake 3**: Blocking the event loop

```
# Wrong - blocks other requestsimport timetime.sleep(1)  # This is synchronous!# Correct - use async sleepawait asyncio.sleep(1)
```

Synchronous `time.sleep()` blocks the entire event loop. Other requests can't be processed. Always use `await asyncio.sleep()`.

**Mistake 4**: Returning instead of yielding

```
# Wrong - sends nothingasync def generator():    return {"data": "hello"}  # Not a generator!# Correct - yield makes it a generatorasync def generator():    yield {"data": "hello"}
```

`return` ends the function. `yield` makes it a generator that produces values.

## Try With AI

Now that you understand SSE streaming, explore advanced patterns for production agent systems.

**Prompt 1: Understand the Protocol**

```
Explain the SSE protocol format in detail:1. What are all the optional fields besides 'event' and 'data'?2. How does the 'id' field enable automatic reconnection?3. What is the 'retry' field for?Then show me how to implement resumable streams—if my server crashes mid-stream and the client reconnects, how do I resume from where I left off?
```

**What you're learning:** This prompt reveals SSE's built-in resilience features. You'll discover that `id` enables `Last-Event-ID` headers on reconnect, letting your server resume from the right position. The `retry` field controls reconnection timing. These features are crucial for reliable agent streaming over unreliable networks.

**Prompt 2: Handle Client Disconnection**

```
When a client disconnects mid-stream, my async generator might keep running, wasting resources:async def agent_stream():    async for token in expensive_agent_call():        yield {"data": token}        # What if client disconnected here?How do I detect disconnection and clean up? What if I have database cursors or API connections that need proper cleanup?
```

**What you're learning:** This prompt teaches resource management in async contexts. You'll learn about `asyncio.CancelledError`, context managers for cleanup, and how to structure generators that release resources properly. Essential for agent systems where each stream might hold LLM API connections.

**Prompt 3: Choose the Right Technology**

```
Compare SSE vs WebSockets vs HTTP/2 Server Push for my use case:- Agent streams token-by-token responses (server → client)- Users can click "Stop" to interrupt generation (client → server)- Need to work through corporate proxiesWhich technology best fits? Can I handle user interrupts with SSE, or do I need WebSockets?
```

**What you're learning:** This prompt develops your architecture judgment. You'll discover that SSE handles most agent streaming needs elegantly—the "stop" button can be a separate HTTP request that cancels the stream server-side. WebSockets add complexity you rarely need for unidirectional agent output.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me implement streaming responses with Server-Sent Events.Does my skill include async generators, EventSourceResponse, and proper SSE event formatting?
```

### Identify Gaps

Ask yourself:

-   Did my skill include async generator patterns with yield?
-   Did it handle EventSourceResponse from sse-starlette?
-   Did it cover SSE event format (event type, data as JSON string, error handling)?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing streaming patterns.Update it to include async generators for streaming data, EventSourceResponse usage,SSE event format with event/data fields, and error handling mid-stream.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Agent Integration

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/14-agent-integration.md)

# Agent Integration

You've built a complete API: CRUD, authentication, database, streaming. Now the payoff—turning those endpoints into tools that AI agents can use. This is where FastAPI meets AI agents.

The pattern is straightforward:

1.  Your API endpoints define capabilities
2.  Wrap them as functions agents can call
3.  Create an agent that orchestrates the tools
4.  Expose the agent via an SSE endpoint

After this lesson, natural language requests become API operations.

## The Pattern: APIs → Functions → Tools

Your Task API has these operations:

Endpoint

Operation

`POST /tasks`

Create task

`GET /tasks`

List tasks

`GET /tasks/{id}`

Get task

`PUT /tasks/{id}`

Update task

`DELETE /tasks/{id}`

Delete task

Each becomes a function an agent can call. The agent decides WHEN to call them based on natural language requests.

## Creating Tool Functions

Start with simple wrappers around your existing code. Create `tools.py`:

```
from sqlmodel import Session, selectfrom models import Task, TaskCreatefrom database import enginedef create_task(title: str, description: str | None = None) -> dict:    """Create a new task with the given title and optional description."""    with Session(engine) as session:        task = Task(title=title, description=description)        session.add(task)        session.commit()        session.refresh(task)        return {"id": task.id, "title": task.title, "status": task.status}def list_tasks() -> list[dict]:    """List all tasks."""    with Session(engine) as session:        tasks = session.exec(select(Task)).all()        return [{"id": t.id, "title": t.title, "status": t.status} for t in tasks]def get_task(task_id: int) -> dict | None:    """Get a specific task by ID."""    with Session(engine) as session:        task = session.get(Task, task_id)        if task:            return {"id": task.id, "title": task.title, "description": task.description, "status": task.status}        return Nonedef update_task_status(task_id: int, status: str) -> dict | None:    """Update a task's status. Status must be: pending, in_progress, or completed."""    with Session(engine) as session:        task = session.get(Task, task_id)        if not task:            return None        task.status = status        session.add(task)        session.commit()        session.refresh(task)        return {"id": task.id, "title": task.title, "status": task.status}def delete_task(task_id: int) -> bool:    """Delete a task by ID. Returns True if deleted, False if not found."""    with Session(engine) as session:        task = session.get(Task, task_id)        if not task:            return False        session.delete(task)        session.commit()        return True
```

**Key points:**

-   Each function has a clear docstring (becomes tool description)
-   Parameters have type hints (agents use these)
-   Returns simple dicts (JSON-serializable)
-   Manages its own session (independent of HTTP request)

## Creating the Agent

Using OpenAI Agents SDK:

```
uv add openai-agents
```

Create `agent.py`:

```
from agents import Agent, Runner, function_toolfrom tools import create_task, list_tasks, get_task, update_task_status, delete_task# Wrap functions as tools@function_tooldef tool_create_task(title: str, description: str | None = None) -> str:    """Create a new task with the given title and optional description."""    result = create_task(title, description)    return f"Created task {result['id']}: {result['title']}"@function_tooldef tool_list_tasks() -> str:    """List all tasks."""    tasks = list_tasks()    if not tasks:        return "No tasks found."    return "\n".join([f"[{t['id']}] {t['title']} ({t['status']})" for t in tasks])@function_tooldef tool_get_task(task_id: int) -> str:    """Get details of a specific task by ID."""    task = get_task(task_id)    if not task:        return f"Task {task_id} not found."    return f"Task {task['id']}: {task['title']}\nDescription: {task['description']}\nStatus: {task['status']}"@function_tooldef tool_update_status(task_id: int, status: str) -> str:    """Update a task's status. Status must be: pending, in_progress, or completed."""    result = update_task_status(task_id, status)    if not result:        return f"Task {task_id} not found."    return f"Updated task {result['id']} to {result['status']}"@function_tooldef tool_delete_task(task_id: int) -> str:    """Delete a task by ID."""    if delete_task(task_id):        return f"Task {task_id} deleted."    return f"Task {task_id} not found."# Create the agenttask_agent = Agent(    name="Task Manager",    instructions="""You are a task management assistant. Help users manage their tasks.You can:- Create new tasks- List all tasks- Get details of specific tasks- Update task status (pending, in_progress, completed)- Delete tasksBe helpful and concise. When creating tasks, confirm what you created.When listing tasks, format them clearly.""",    tools=[        tool_create_task,        tool_list_tasks,        tool_get_task,        tool_update_status,        tool_delete_task,    ],)
```

## Non-Streaming Agent Endpoint

Start with a simple endpoint that waits for the complete response. Add to `main.py`:

```
from fastapi import FastAPIfrom pydantic import BaseModelfrom agents import Runnerfrom agent import task_agentapp = FastAPI()class ChatRequest(BaseModel):    message: strclass ChatResponse(BaseModel):    response: str@app.post("/agent/chat", response_model=ChatResponse)async def chat_with_agent(request: ChatRequest):    """Send a message to the task agent and get a response."""    result = await Runner.run(task_agent, request.message)    return ChatResponse(response=result.final_output)
```

**Testing:**

```
curl -X POST http://localhost:8000/agent/chat \  -H "Content-Type: application/json" \  -d '{"message": "Create a task called Learn FastAPI"}'{"response": "Created task 1: Learn FastAPI"}
```

```
curl -X POST http://localhost:8000/agent/chat \  -H "Content-Type: application/json" \  -d '{"message": "List all my tasks"}'{"response": "[1] Learn FastAPI (pending)"}
```

## Streaming Agent Endpoint

For better UX, stream the response as it generates. Add to `main.py`:

```
from fastapi.responses import StreamingResponsefrom sse_starlette.sse import EventSourceResponseimport jsonasync def agent_stream_generator(message: str):    """Generate SSE events from agent response."""    result = Runner.run_streamed(task_agent, message)    async for event in result.stream_events():        if event.type == "raw_response_event":            # Extract text from the response            if hasattr(event.data, 'delta') and hasattr(event.data.delta, 'text'):                text = event.data.delta.text                if text:                    yield {                        "event": "token",                        "data": json.dumps({"text": text})                    }    # Final event with complete response    yield {        "event": "complete",        "data": json.dumps({"response": result.final_output})    }@app.post("/agent/chat/stream")async def chat_with_agent_stream(request: ChatRequest):    """Stream agent response via SSE."""    return EventSourceResponse(agent_stream_generator(request.message))
```

**Testing in browser console:**

```
const response = await fetch('http://localhost:8000/agent/chat/stream', {    method: 'POST',    headers: {'Content-Type': 'application/json'},    body: JSON.stringify({message: 'Create a task called Test streaming'})});const reader = response.body.getReader();const decoder = new TextDecoder();while (true) {    const {done, value} = await reader.read();    if (done) break;    console.log(decoder.decode(value));}
```

## Complete Agent Integration

Here's everything together for reference.

**tools.py:**

```
from sqlmodel import Session, selectfrom models import Taskfrom database import enginedef create_task(title: str, description: str | None = None) -> dict:    with Session(engine) as session:        task = Task(title=title, description=description)        session.add(task)        session.commit()        session.refresh(task)        return {"id": task.id, "title": task.title, "status": task.status}def list_tasks() -> list[dict]:    with Session(engine) as session:        tasks = session.exec(select(Task)).all()        return [{"id": t.id, "title": t.title, "status": t.status} for t in tasks]def get_task(task_id: int) -> dict | None:    with Session(engine) as session:        task = session.get(Task, task_id)        if task:            return {"id": task.id, "title": task.title, "description": task.description, "status": task.status}        return Nonedef update_task_status(task_id: int, status: str) -> dict | None:    with Session(engine) as session:        task = session.get(Task, task_id)        if not task:            return None        task.status = status        session.add(task)        session.commit()        session.refresh(task)        return {"id": task.id, "title": task.title, "status": task.status}def delete_task(task_id: int) -> bool:    with Session(engine) as session:        task = session.get(Task, task_id)        if not task:            return False        session.delete(task)        session.commit()        return True
```

**agent.py:**

```
from agents import Agent, function_toolfrom tools import create_task, list_tasks, get_task, update_task_status, delete_task@function_tooldef tool_create_task(title: str, description: str | None = None) -> str:    """Create a new task."""    result = create_task(title, description)    return f"Created task {result['id']}: {result['title']}"@function_tooldef tool_list_tasks() -> str:    """List all tasks."""    tasks = list_tasks()    if not tasks:        return "No tasks found."    return "\n".join([f"[{t['id']}] {t['title']} ({t['status']})" for t in tasks])@function_tooldef tool_get_task(task_id: int) -> str:    """Get a specific task."""    task = get_task(task_id)    if not task:        return f"Task {task_id} not found."    return f"Task {task['id']}: {task['title']}\nStatus: {task['status']}"@function_tooldef tool_update_status(task_id: int, status: str) -> str:    """Update task status (pending/in_progress/completed)."""    result = update_task_status(task_id, status)    if not result:        return f"Task {task_id} not found."    return f"Updated task {result['id']} to {result['status']}"@function_tooldef tool_delete_task(task_id: int) -> str:    """Delete a task."""    if delete_task(task_id):        return f"Task {task_id} deleted."    return f"Task {task_id} not found."task_agent = Agent(    name="Task Manager",    instructions="You help manage tasks. Create, list, update, and delete tasks as requested.",    tools=[tool_create_task, tool_list_tasks, tool_get_task, tool_update_status, tool_delete_task],)
```

**main.py (agent routes):**

```
from fastapi import FastAPIfrom pydantic import BaseModelfrom sse_starlette.sse import EventSourceResponsefrom agents import Runnerfrom agent import task_agentimport jsonapp = FastAPI()class ChatRequest(BaseModel):    message: str@app.post("/agent/chat")async def chat_with_agent(request: ChatRequest):    result = await Runner.run(task_agent, request.message)    return {"response": result.final_output}async def agent_stream_generator(message: str):    result = Runner.run_streamed(task_agent, message)    async for event in result.stream_events():        if event.type == "raw_response_event":            if hasattr(event.data, 'delta') and hasattr(event.data.delta, 'text'):                text = event.data.delta.text                if text:                    yield {"event": "token", "data": json.dumps({"text": text})}    yield {"event": "complete", "data": json.dumps({"response": result.final_output})}@app.post("/agent/chat/stream")async def chat_with_agent_stream(request: ChatRequest):    return EventSourceResponse(agent_stream_generator(request.message))
```

## Hands-On Exercise

**Step 1:** Create tools.py with CRUD wrapper functions

**Step 2:** Create agent.py with tool decorators and agent definition

**Step 3:** Add /agent/chat endpoint to main.py

**Step 4:** Test with natural language:

```
# Createcurl -X POST http://localhost:8000/agent/chat \  -d '{"message": "Add a task: Review pull request"}'# Listcurl -X POST http://localhost:8000/agent/chat \  -d '{"message": "What tasks do I have?"}'# Updatecurl -X POST http://localhost:8000/agent/chat \  -d '{"message": "Mark task 1 as completed"}'# Deletecurl -X POST http://localhost:8000/agent/chat \  -d '{"message": "Remove task 1"}'
```

**Step 5:** Add the streaming endpoint and test in browser

## Common Mistakes

**Mistake 1:** Forgetting docstrings on tools

```
# Wrong - agent doesn't know what this does@function_tooldef tool_create_task(title: str) -> str:    ...# Correct - docstring becomes tool description@function_tooldef tool_create_task(title: str) -> str:    """Create a new task with the given title."""    ...
```

**Mistake 2:** Returning complex objects

```
# Wrong - returns SQLModel objectdef get_task(task_id: int) -> Task:    ...# Correct - returns serializable dictdef get_task(task_id: int) -> dict:    ...
```

**Mistake 3:** Not handling missing resources

```
# Wrong - crashes on missing taskdef get_task(task_id: int) -> dict:    task = session.get(Task, task_id)    return {"id": task.id}  # AttributeError if None!# Correct - handle not founddef get_task(task_id: int) -> dict | None:    task = session.get(Task, task_id)    if task:        return {"id": task.id}    return None
```

## What You've Achieved

You've completed the core loop:

1.  **L1-L5**: Built REST API with CRUD
2.  **L6-L9**: Added configuration, database, authentication
3.  **L10**: Organized with dependency injection
4.  **L11**: Added streaming
5.  **L12**: Integrated AI agent

Your API is now both:

-   **Machine-callable** (REST endpoints for direct integration)
-   **Natural language accessible** (agent endpoint for conversational use)

This is the foundation of a Digital FTE service.

## Try With AI

After completing the exercise, explore these scenarios.

**Prompt 1: Adding Context to Tools**

```
My tools work, but the agent doesn't know about the current user.How do I pass user context to tools so the agent only managesTHEIR tasks, not everyone's?
```

**What you're learning:** Tool functions can receive context beyond their explicit parameters. Understanding this enables multi-user agent systems.

**Prompt 2: Error Handling in Tools**

```
When a tool fails (database down, invalid input), what should itreturn? Should I raise an exception or return an error string?How does the agent handle tool failures?
```

**What you're learning:** Agents react to tool outputs. Clear error messages help agents recover gracefully.

**Prompt 3: Adding More Agents**

```
I want to add a second agent that helps with scheduling tasks(setting due dates, suggesting priorities). How do I structuremultiple specialized agents that can work together?
```

**What you're learning:** Multi-agent architectures enable specialization. This extends to triage agents, handoffs, and agent collaboration—covered in the capstone.

* * *

## Reflect on Your Skill

You built a `fastapi-agent` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my fastapi-agent skill, help me integrate AI agents with my API endpoints.Does my skill include wrapping API functions as agent tools, creating agents with function_tool,and streaming agent responses via SSE?
```

### Identify Gaps

Ask yourself:

-   Did my skill include converting API endpoints to callable functions for agents?
-   Did it handle function\_tool decorator and Agent creation with tools?
-   Did it cover streaming agent responses using Runner.run\_streamed() and EventSourceResponse?

### Improve Your Skill

If you found gaps:

```
My fastapi-agent skill is missing agent integration patterns.Update it to include API-to-function conversion for tools, function_tool decorator usage,Agent creation with instructions and tools, Runner.run() for non-streaming,and Runner.run_streamed() with SSE for streaming agent responses.
```

Checking access...

---

-   [](/)
-   [Part 5: Building Custom Agents](/docs/Building-Custom-Agents)
-   [Chapter 40: FastAPI for Agents](/docs/Building-Custom-Agents/fastapi-for-agents)
-   Capstone: Agent-Powered Task Service

Updated Feb 18, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/05-Building-Custom-Agents/40-fastapi-for-agents/15-capstone-agent-powered-task-service.md)

# Capstone: Agent-Powered Task Service

You've spent twelve lessons building individual capabilities: routing, validation, database persistence, authentication, rate limiting, agent integration, and streaming. Now it's time to compose them all.

This capstone follows the specification-driven approach that defines AI-native development. You'll write the specification first, then implement against it, and finally validate that your implementation meets every success criterion. This is how professional agent-powered services are built—and how you'll package your own Digital FTE products.

The result? A deployable API that exposes multi-agent task management capabilities. The kind of service you could sell to teams who need AI-powered productivity tools without building their own infrastructure.

## The Specification-First Approach

Before writing any code, we define what success looks like. This specification becomes the contract that your implementation must fulfill.

### Complete API Specification

Create a file called `spec.md` in your project root:

```
# Task Agent Service Specification## OverviewMulti-agent task management API with authentication, rate limiting,and streaming agent responses.## Success CriteriaEvery criterion must pass for the implementation to be complete.### Authentication (from L8-L9)- [ ] POST /users/signup creates user with Argon2-hashed password- [ ] POST /token returns JWT for valid credentials- [ ] Invalid credentials return 401 with generic message- [ ] JWT expires after configured duration### Task CRUD (from L1-L5)- [ ] POST /tasks creates task in Neon PostgreSQL- [ ] GET /tasks returns all tasks for authenticated user- [ ] GET /tasks/{id} returns single task or 404- [ ] PUT /tasks/{id} updates task fields- [ ] DELETE /tasks/{id} removes task and returns 204### Agent Endpoints (from L12)- [ ] POST /tasks/{id}/help requires valid JWT- [ ] Triage agent routes to correct specialist- [ ] Streaming response shows agent handoffs- [ ] POST /tasks/{id}/schedule calls scheduler directly- [ ] GET /agents/status returns available agents### Rate Limiting (from L9)- [ ] Token endpoint limited to 5 requests/minute- [ ] Agent endpoints limited to 10 requests/minute- [ ] Rate limit headers present in responses### Configuration (from L6)- [ ] All secrets from environment variables- [ ] No hardcoded credentials in source- [ ] .env.example documents required variables## API Endpoints| Endpoint | Method | Auth | Rate Limit | Description ||----------|--------|------|------------|-------------|| /users/signup | POST | None | 5/min | Create account || /token | POST | None | 5/min | Get JWT token || /tasks | POST | JWT | None | Create task || /tasks | GET | JWT | None | List user tasks || /tasks/{id} | GET | JWT | None | Get single task || /tasks/{id} | PUT | JWT | None | Update task || /tasks/{id} | DELETE | JWT | None | Delete task || /tasks/{id}/help | POST | JWT | 10/min | Agent assistance || /tasks/{id}/schedule | POST | JWT | 10/min | Schedule task || /agents/status | GET | None | None | List agents |
```

**Output:**

```
spec.md created - 65 linesThis becomes your implementation contract
```

This specification captures every pattern you've learned. The checkboxes become your testing checklist. The table becomes your routing implementation guide.

## Project Structure

Organize your capstone project to reflect the separation of concerns you've practiced:

```
task_agent_service/├── app/│   ├── __init__.py│   ├── main.py              # FastAPI app with all routers│   ├── config.py            # Environment configuration│   ├── database.py          # Neon PostgreSQL connection│   ├── models.py            # SQLModel definitions│   ├── auth/│   │   ├── __init__.py│   │   ├── routes.py        # /users and /token endpoints│   │   ├── security.py      # JWT and password hashing│   │   └── dependencies.py  # get_current_user│   ├── tasks/│   │   ├── __init__.py│   │   ├── routes.py        # CRUD endpoints│   │   └── service.py       # Database operations│   └── agents/│       ├── __init__.py│       ├── routes.py        # Agent endpoints│       ├── triage.py        # Routing logic│       └── specialists.py   # Individual agents├── tests/│   └── test_spec.py         # Tests against specification├── spec.md                   # Your contract├── .env.example              # Required variables└── requirements.txt
```

## Configuration Layer

All secrets come from environment variables. Create your configuration module:

```
# app/config.pyfrom pydantic_settings import BaseSettingsfrom functools import lru_cacheclass Settings(BaseSettings):    """Application settings from environment variables."""    # Database (Neon PostgreSQL)    database_url: str    # Authentication    secret_key: str    algorithm: str = "HS256"    access_token_expire_minutes: int = 30    # Rate Limiting    token_rate_limit: int = 5    agent_rate_limit: int = 10    # AI Provider    anthropic_api_key: str    class Config:        env_file = ".env"@lru_cachedef get_settings() -> Settings:    """Cached settings instance."""    return Settings()
```

**Output:**

```
>>> from app.config import get_settings>>> settings = get_settings()>>> settings.algorithm'HS256'>>> settings.agent_rate_limit10
```

Create the `.env.example` that documents required variables:

```
# .env.example - Copy to .env and fill in values# Neon PostgreSQL connection stringDATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require# JWT ConfigurationSECRET_KEY=your-secret-key-generate-with-openssl-rand-hex-32ALGORITHM=HS256ACCESS_TOKEN_EXPIRE_MINUTES=30# Rate Limits (requests per minute)TOKEN_RATE_LIMIT=5AGENT_RATE_LIMIT=10# Anthropic APIANTHROPIC_API_KEY=sk-ant-...
```

## Database Layer

Your Neon PostgreSQL integration persists tasks with user ownership:

```
# app/database.pyfrom sqlmodel import SQLModel, create_engine, Sessionfrom app.config import get_settingssettings = get_settings()engine = create_engine(settings.database_url, echo=False)def create_db_and_tables():    """Initialize database schema."""    SQLModel.metadata.create_all(engine)def get_session():    """Dependency for database sessions."""    with Session(engine) as session:        yield session
```

```
# app/models.pyfrom sqlmodel import SQLModel, Fieldfrom datetime import datetimefrom typing import Optionalfrom enum import Enumclass TaskStatus(str, Enum):    pending = "pending"    in_progress = "in_progress"    completed = "completed"class TaskBase(SQLModel):    """Shared task fields."""    title: str = Field(min_length=1, max_length=200)    description: Optional[str] = None    status: TaskStatus = TaskStatus.pending    due_date: Optional[datetime] = Noneclass Task(TaskBase, table=True):    """Database model with ownership."""    id: Optional[int] = Field(default=None, primary_key=True)    owner_id: int = Field(foreign_key="user.id")    created_at: datetime = Field(default_factory=datetime.utcnow)class TaskCreate(TaskBase):    """Request model for task creation."""    passclass TaskRead(TaskBase):    """Response model with all fields."""    id: int    owner_id: int    created_at: datetimeclass User(SQLModel, table=True):    """User account for authentication."""    id: Optional[int] = Field(default=None, primary_key=True)    email: str = Field(unique=True, index=True)    hashed_password: str    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Output:**

```
>>> from app.models import Task, TaskStatus>>> task = Task(title="Review PR", owner_id=1)>>> task.status<TaskStatus.pending: 'pending'>
```

## Authentication Layer

JWT authentication with Argon2 password hashing:

```
# app/auth/security.pyfrom datetime import datetime, timedeltafrom typing import Optionalfrom jose import JWTError, jwtfrom pwdlib import PasswordHashfrom pwdlib.hashers.argon2 import Argon2Hasherfrom app.config import get_settingssettings = get_settings()password_hash = PasswordHash((Argon2Hasher(),))def hash_password(password: str) -> str:    """Hash password with Argon2."""    return password_hash.hash(password)def verify_password(plain: str, hashed: str) -> bool:    """Verify password against hash."""    return password_hash.verify(plain, hashed)def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:    """Create JWT with expiration."""    to_encode = data.copy()    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))    to_encode.update({"exp": expire})    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)def decode_token(token: str) -> Optional[dict]:    """Decode and validate JWT."""    try:        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])        return payload    except JWTError:        return None
```

```
# app/auth/dependencies.pyfrom fastapi import Depends, HTTPException, statusfrom fastapi.security import OAuth2PasswordBearerfrom sqlmodel import Session, selectfrom app.database import get_sessionfrom app.models import Userfrom app.auth.security import decode_tokenoauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")async def get_current_user(    token: str = Depends(oauth2_scheme),    session: Session = Depends(get_session)) -> User:    """Extract and validate user from JWT."""    credentials_exception = HTTPException(        status_code=status.HTTP_401_UNAUTHORIZED,        detail="Could not validate credentials",        headers={"WWW-Authenticate": "Bearer"},    )    payload = decode_token(token)    if payload is None:        raise credentials_exception    email: str = payload.get("sub")    if email is None:        raise credentials_exception    user = session.exec(select(User).where(User.email == email)).first()    if user is None:        raise credentials_exception    return user
```

**Output:**

```
>>> from app.auth.security import hash_password, verify_password>>> hashed = hash_password("secure123")>>> verify_password("secure123", hashed)True>>> verify_password("wrong", hashed)False
```

## Agent Layer

The triage agent routes requests to specialists:

```
# app/agents/specialists.pyfrom anthropic import Anthropicclient = Anthropic()SPECIALISTS = {    "scheduler": {        "name": "Scheduler Agent",        "description": "Helps schedule and prioritize tasks",        "system": """You are a scheduling specialist. Help users:- Set realistic deadlines- Prioritize tasks by urgency and importance- Break large tasks into smaller steps- Identify dependencies between tasks"""    },    "breakdown": {        "name": "Breakdown Agent",        "description": "Breaks complex tasks into subtasks",        "system": """You are a task breakdown specialist. Help users:- Decompose complex tasks into actionable steps- Identify the first concrete action- Estimate effort for each subtask- Suggest parallel vs sequential work"""    },    "blocker": {        "name": "Blocker Resolution Agent",        "description": "Helps overcome obstacles and blockers",        "system": """You are a blocker resolution specialist. Help users:- Identify root causes of blockers- Suggest workarounds and alternatives- Recommend who to ask for help- Reframe problems as opportunities"""    }}async def call_specialist(specialist_id: str, task_context: str, user_query: str):    """Stream response from a specialist agent."""    if specialist_id not in SPECIALISTS:        raise ValueError(f"Unknown specialist: {specialist_id}")    specialist = SPECIALISTS[specialist_id]    with client.messages.stream(        model="claude-sonnet-4-20250514",        max_tokens=1024,        system=specialist["system"],        messages=[{            "role": "user",            "content": f"Task: {task_context}\n\nUser request: {user_query}"        }]    ) as stream:        for text in stream.text_stream:            yield text
```

```
# app/agents/triage.pyfrom anthropic import Anthropicfrom app.agents.specialists import SPECIALISTSclient = Anthropic()TRIAGE_SYSTEM = """You are a triage agent for a task management system.Your job is to route user requests to the appropriate specialist.Available specialists:{specialists}Respond with ONLY the specialist ID (scheduler, breakdown, or blocker).If unsure, choose the most relevant based on the user's intent."""def format_specialists() -> str:    """Format specialists for triage prompt."""    lines = []    for id, spec in SPECIALISTS.items():        lines.append(f"- {id}: {spec['description']}")    return "\n".join(lines)async def triage_request(task_context: str, user_query: str) -> str:    """Determine which specialist should handle this request."""    response = client.messages.create(        model="claude-sonnet-4-20250514",        max_tokens=50,        system=TRIAGE_SYSTEM.format(specialists=format_specialists()),        messages=[{            "role": "user",            "content": f"Task: {task_context}\n\nUser request: {user_query}"        }]    )    specialist_id = response.content[0].text.strip().lower()    if specialist_id not in SPECIALISTS:        specialist_id = "breakdown"  # Safe default    return specialist_id
```

## Agent Routes with Streaming

The agent endpoints combine authentication, rate limiting, and streaming:

```
# app/agents/routes.pyfrom fastapi import APIRouter, Depends, HTTPException, Requestfrom fastapi.responses import StreamingResponsefrom sqlmodel import Session, selectfrom slowapi import Limiterfrom slowapi.util import get_remote_addressfrom app.database import get_sessionfrom app.models import Task, Userfrom app.auth.dependencies import get_current_userfrom app.agents.triage import triage_requestfrom app.agents.specialists import call_specialist, SPECIALISTSfrom app.config import get_settingsrouter = APIRouter(prefix="/tasks", tags=["agents"])settings = get_settings()limiter = Limiter(key_func=get_remote_address)@router.post("/{task_id}/help")@limiter.limit(f"{settings.agent_rate_limit}/minute")async def get_agent_help(    request: Request,    task_id: int,    query: str,    session: Session = Depends(get_session),    current_user: User = Depends(get_current_user)):    """Get AI agent help for a task with streaming response."""    task = session.exec(        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)    ).first()    if not task:        raise HTTPException(status_code=404, detail="Task not found")    task_context = f"{task.title}: {task.description or 'No description'}"    specialist_id = await triage_request(task_context, query)    async def generate():        yield f"[Routing to {SPECIALISTS[specialist_id]['name']}]\n\n"        async for chunk in call_specialist(specialist_id, task_context, query):            yield chunk    return StreamingResponse(generate(), media_type="text/plain")@router.get("/agents/status")async def get_agents_status():    """List available agents and their capabilities."""    return {        "agents": [            {"id": id, "name": spec["name"], "description": spec["description"]}            for id, spec in SPECIALISTS.items()        ],        "triage_enabled": True    }
```

## Main Application Assembly

Bring all the layers together:

```
# app/main.pyfrom fastapi import FastAPIfrom slowapi import _rate_limit_exceeded_handlerfrom slowapi.errors import RateLimitExceededfrom app.database import create_db_and_tablesfrom app.middleware.rate_limit import limiterfrom app.auth.routes import router as auth_routerfrom app.tasks.routes import router as tasks_routerfrom app.agents.routes import router as agents_routerapp = FastAPI(    title="Task Agent Service",    description="Multi-agent task management API",    version="1.0.0")app.state.limiter = limiterapp.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)app.include_router(auth_router)app.include_router(tasks_router)app.include_router(agents_router)@app.on_event("startup")def on_startup():    """Initialize database on startup."""    create_db_and_tables()@app.get("/health")def health_check():    """Health check endpoint."""    return {"status": "healthy", "service": "task-agent-service"}
```

**Output:**

```
$ uvicorn app.main:app --reloadINFO:     Started server processINFO:     Application startup completeINFO:     Uvicorn running on http://127.0.0.1:8000
```

## Specification Validation

Create tests that verify your implementation meets every specification criterion:

```
# tests/test_spec.pyimport pytestfrom fastapi.testclient import TestClientfrom app.main import appclient = TestClient(app)class TestAuthentication:    """Spec: Authentication criteria"""    def test_signup_creates_user_with_hashed_password(self):        """POST /users/signup creates user with Argon2-hashed password"""        response = client.post("/users/signup", json={            "email": "test@example.com",            "password": "SecurePass123"        })        assert response.status_code == 201        assert "password" not in response.json()    def test_token_returns_jwt(self):        """POST /token returns JWT for valid credentials"""        client.post("/users/signup", json={            "email": "jwt@example.com",            "password": "SecurePass123"        })        response = client.post("/token", data={            "username": "jwt@example.com",            "password": "SecurePass123"        })        assert response.status_code == 200        assert "access_token" in response.json()    def test_invalid_credentials_return_401(self):        """Invalid credentials return 401 with generic message"""        response = client.post("/token", data={            "username": "wrong@example.com",            "password": "WrongPass"        })        assert response.status_code == 401class TestTaskCRUD:    """Spec: Task CRUD criteria"""    @pytest.fixture    def auth_headers(self):        """Get authenticated headers."""        client.post("/users/signup", json={            "email": "crud@example.com",            "password": "SecurePass123"        })        token_response = client.post("/token", data={            "username": "crud@example.com",            "password": "SecurePass123"        })        token = token_response.json()["access_token"]        return {"Authorization": f"Bearer {token}"}    def test_create_task(self, auth_headers):        """POST /tasks creates task in database"""        response = client.post("/tasks", json={            "title": "Test Task",            "description": "Testing CRUD"        }, headers=auth_headers)        assert response.status_code == 201        assert "id" in response.json()class TestAgentEndpoints:    """Spec: Agent endpoint criteria"""    def test_help_requires_jwt(self):        """POST /tasks/{id}/help requires valid JWT"""        response = client.post("/tasks/1/help?query=test")        assert response.status_code == 401    def test_agents_status_lists_specialists(self):        """GET /agents/status returns available agents"""        response = client.get("/tasks/agents/status")        assert response.status_code == 200        assert "agents" in response.json()
```

**Output:**

```
$ pytest tests/test_spec.py -v========================= test session starts ==========================tests/test_spec.py::TestAuthentication::test_signup_creates_user PASSEDtests/test_spec.py::TestAuthentication::test_token_returns_jwt PASSEDtests/test_spec.py::TestAuthentication::test_invalid_credentials PASSEDtests/test_spec.py::TestTaskCRUD::test_create_task PASSEDtests/test_spec.py::TestAgentEndpoints::test_help_requires_jwt PASSEDtests/test_spec.py::TestAgentEndpoints::test_agents_status PASSED========================= 6 passed in 2.34s ============================
```

## What You've Built

This capstone composes every pattern from Chapter 40:

Lesson

Pattern

Used In

L1

FastAPI basics

App structure

L2

Pytest fundamentals

Tests

L3

Request validation

Pydantic models

L4

CRUD operations

Task endpoints

L5

Error handling

HTTPException

L6

Environment config

Settings

L7

Neon PostgreSQL

Persistence

L8

JWT authentication

Protected routes

L9

Password + Rate limit

Security

L10

Dependency injection

Database, Auth

L11

SSE streaming

Agent responses

L12

Agent integration

Specialists

The result is a **deployable agent-powered service**—the foundation of a Digital FTE product.

## Digital FTE Packaging

Your capstone becomes sellable when you:

1.  **Add documentation** - OpenAPI spec auto-generated at `/docs`
2.  **Add monitoring** - Health checks, error tracking
3.  **Add deployment config** - Docker, Railway, or Fly.io
4.  **Define pricing tiers** - Based on agent calls/month

This is how domain experts package AI capabilities for their industry.

Safety Note

Before deploying to production:

-   Rotate all secrets from development
-   Enable HTTPS only
-   Add request logging for audit trails
-   Set up error alerting
-   Review rate limits for your expected load

## Try With AI

You've built a complete agent service. Now extend it with AI collaboration.

**Prompt 1: Add Agent Memory**

```
I want my agents to remember previous interactions with the same task.Here's my current specialist call:async def call_specialist(specialist_id: str, task_context: str, user_query: str):    specialist = SPECIALISTS[specialist_id]    with client.messages.stream(...) as stream:        for text in stream.text_stream:            yield textHow do I add conversation history per task?Consider: Where should history be stored? How much to include?
```

**What you're learning:** Persistent agent memory transforms one-shot responses into ongoing conversations.

**Prompt 2: Add OpenTelemetry Tracing**

```
I want to trace requests through my multi-agent system:- How long does triage take?- Which specialist was chosen?- How long did the specialist response take?What's the minimal OpenTelemetry setup for FastAPI?
```

**What you're learning:** Observability becomes critical when you have multiple agents.

**Prompt 3: Custom Specialist for Your Domain**

```
I'm building task management for [YOUR INDUSTRY].I want to add a specialist agent that understands domain-specific terminology.Current specialists: scheduler, breakdown, blockerHelp me design a new specialist for my domain that:1. Has a focused system prompt2. Knows industry-specific workflows3. Can reference domain terminologyWhat should the system prompt include?
```

**What you're learning:** Adding specialists is how you customize agent services for specific industries—the core of Digital FTE value creation.

Checking access...

---

Source: https://agentfactory.panaversity.org/docs/05-Building-Custom-Agents/40-fastapi-for-agents