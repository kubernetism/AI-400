# Software Project Planning Reference

Use this reference when the plan involves building software: apps, APIs, tools, platforms, or SaaS products.

---

## Standard Software Project Phases

### Phase 0: Discovery & Definition (10-15% of timeline)
- Define problem statement and target users
- Research existing solutions (competitive analysis)
- Write user stories / use cases
- Define MVP scope vs. future features
- Choose tech stack
- Set up development environment, repos, CI/CD basics

### Phase 1: Architecture & Design (10-15%)
- System architecture diagram
- Database schema / data model
- API contract design (OpenAPI/Swagger)
- UI wireframes or mockups
- Security considerations (auth, data privacy)

### Phase 2: Core Development (40-50%)
- Implement core features (P0 only)
- Unit + integration tests
- Code reviews
- Daily standups / async updates

### Phase 3: Integration & Testing (15-20%)
- End-to-end testing
- Performance testing
- Security audit
- Bug fixing
- Staging deployment

### Phase 4: Launch (5-10%)
- Production deployment
- Monitoring setup (logs, alerts)
- Documentation
- Onboarding flow
- Launch announcement

### Phase 5: Post-Launch (ongoing)
- Collect user feedback
- Track key metrics (DAU, retention, errors)
- Prioritize next sprint

---

## Task Estimation Guide

| Task Type | Typical Range |
|---|---|
| Simple CRUD endpoint | 2–4 hours |
| Complex business logic | 1–3 days |
| Authentication system | 2–5 days |
| Third-party API integration | 1–3 days |
| Database migration | 4–8 hours |
| UI component (simple) | 2–4 hours |
| Full page/screen | 1–2 days |
| Testing (unit + integration) | 30% of dev time |
| Bug fix (unknown cause) | 4–16 hours |

---

## For Agentic AI / LLM Projects (Safdar's Domain)

Additional phases to include:
- **Prompt Engineering**: 3–5 days per agent
- **Tool Integration** (MCP, APIs): 1–2 days per tool
- **Agent Orchestration**: 2–5 days (LangGraph/CrewAI/OpenAI SDK)
- **Evaluation & Red-teaming**: 3–7 days
- **Guardrails & Safety**: 2–3 days
- **Deployment** (Docker + K8s): 1–3 days
