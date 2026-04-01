---
name: universal-planner
description: >
  A comprehensive planning skill for ANY type of plan — project plans, event plans, learning roadmaps,
  business plans, travel itineraries, content calendars, product launches, career plans, daily/weekly
  schedules, study plans, startup plans, and more. Always use this skill whenever the user says things
  like "help me plan", "create a plan", "make a roadmap", "I want to organize X", "how do I prepare for Y",
  "build a schedule", "I need a strategy for Z", "plan my week/month/year", "outline a project",
  "project timeline", "action plan", or anything that implies turning an intention or goal into a
  structured, actionable sequence of steps. Use even for seemingly simple requests like "plan my day"
  or "plan my study session." This skill should trigger for ALL planning-related intents without exception.
compatibility: "bash, create_file, present_files; python packages: reportlab, python-docx (optional for document output)"
---

# Universal Planner Skill

A master planning skill that turns any goal, idea, or intention into a structured, executable plan —
regardless of domain, complexity, or timescale.

---

## Phase 1: Understand Before Planning

**Never jump straight to a plan.** Before writing a single bullet point, gather enough context to make the plan genuinely useful. Ask (or infer from context):

### Required Context
| Question | Why It Matters |
|---|---|
| **What is the goal?** | The north star for every decision in the plan |
| **What is the timescale?** | Day / Week / Month / Quarter / Year / Open-ended |
| **Who is this plan for?** | Individual, team, organization, event guests |
| **What resources are available?** | Time, budget, people, tools, expertise |
| **What constraints exist?** | Deadlines, dependencies, limitations |
| **What does success look like?** | Measurable outcomes vs. vague aspirations |

### Smart Context Extraction
If the user provides a rich description (e.g., "I want to launch a SaaS product in 3 months with a team of 3"), **extract answers from their message first** before asking follow-up questions. Only ask about missing critical information. Never interrogate the user with a form of 6+ questions — prioritize the most important unknown.

---

## Phase 2: Classify the Plan Type

Once you understand the goal, identify the **plan archetype**. Each has a different optimal structure.

| Archetype | Examples | Key Structure |
|---|---|---|
| **Project Plan** | App launch, home renovation, hiring campaign | Phases → Tasks → Owners → Deadlines |
| **Learning Roadmap** | Learn Kubernetes, become a data scientist | Milestones → Topics → Resources → Practice |
| **Event Plan** | Conference, wedding, workshop, eid gathering | Pre-event → Day-of → Post-event → Checklist |
| **Business Plan** | Startup, freelance, side project | Market → Product → Operations → Finance → Growth |
| **Personal Development** | Career change, fitness goal, habits | Assessment → Goals → Weekly routines → Checkpoints |
| **Travel Itinerary** | Trip planning, destination research | Days → Activities → Logistics → Budget |
| **Content/Marketing Plan** | Blog, social media, launch campaign | Calendar → Themes → Channels → Metrics |
| **Daily/Weekly Schedule** | Time-blocking, productivity | Time slots → Priorities → Buffer time |
| **Study Plan** | Exam prep, course completion | Syllabus → Sessions → Review cycles → Mock tests |
| **Crisis/Recovery Plan** | Debt reduction, recovery, rebuilding | Assessment → Immediate actions → Milestones → Support |

If the plan spans multiple archetypes, use a **hybrid structure** with clearly labeled sections.

---

## Phase 3: Build the Plan

### Universal Plan Anatomy

Every plan — regardless of type — must include these elements:

```
1. EXECUTIVE SUMMARY (2–4 sentences)
   - What this plan achieves, by when, and for whom

2. GOALS & SUCCESS METRICS
   - Specific, measurable outcomes (not vague aspirations)
   - "Launch MVP with 100 beta users" not "make a product"

3. CONSTRAINTS & ASSUMPTIONS
   - Time, budget, team size, known risks
   - Dependencies (what must be true for this to work)

4. PHASES / MILESTONES (the spine of the plan)
   - Logical groupings of work with clear start/end
   - Each phase has: name, duration, deliverables, dependencies

5. DETAILED ACTION STEPS
   - Broken down to the level where someone can START TODAY
   - Each action: What, Who, When, How long, Priority

6. RESOURCE ALLOCATION
   - Time budget per phase
   - Money/budget if applicable
   - Tools and skills needed

7. RISK REGISTER (for complex plans)
   - Top 3–5 risks with likelihood, impact, mitigation

8. REVIEW & CHECKPOINT SCHEDULE
   - When to check progress
   - What triggers a plan revision

9. QUICK START (the most important section for execution)
   - The single next action the user should take TODAY
   - The 3 things to do in the next 7 days
```

### Formatting Rules

- **Use tables** for timelines, resource allocation, and risk registers
- **Use numbered lists** for sequential steps
- **Use checkboxes** (- [ ]) for actionable task lists
- **Use bold** for phase names and critical milestones
- **Use ⚠️ warnings** for risks, blockers, and critical path items
- **Use ✅ indicators** for completed phases (if updating an existing plan)
- **Timescale headers**: Use Week 1, Week 2 OR Month 1, Month 2 depending on plan length
- For plans > 6 months, **quarterly grouping** works better than weekly

---

## Phase 4: Plan Quality Checklist

Before presenting the plan, verify:

- [ ] Is the first action something the user can do TODAY?
- [ ] Are milestones concrete and verifiable (not vague)?
- [ ] Does the plan account for the stated constraints?
- [ ] Are dependencies identified? (Can't do B before A)
- [ ] Is there buffer time built in? (Parkinson's Law is real)
- [ ] Is the scope realistic for the time/resources available?
- [ ] Does it answer "what do I do on Monday morning?"
- [ ] Are there review points to course-correct?

If any answers are "no", fix the plan before presenting.

---

## Phase 5: Delivery Format

### Choose the Right Output Format

| Plan Complexity | Best Format |
|---|---|
| Simple (1–2 week, personal) | Inline markdown in chat |
| Medium (1–3 month, team/project) | Detailed markdown with tables |
| Complex (3+ months, business/product) | PDF or Word document |
| Visual (roadmap, timeline) | Mermaid diagram + markdown |

### For Document Output (PDF/Word)

Read the appropriate skill first:
- **PDF**: `/mnt/skills/public/pdf/SKILL.md` or `/mnt/skills/user/structured-pdf-creator/SKILL.md`
- **Word Doc**: `/mnt/skills/public/docx/SKILL.md`

Apply these planning-specific document conventions:
- Cover page with: Plan Title, Date, Version, Owner
- Color-coded phases (use consistent colors throughout)
- Gantt-style timeline if applicable
- Executive summary on page 2
- Appendix for reference materials, templates, resources

### For Mermaid/Visual Output

Use Gantt diagrams for project timelines:
```
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task A :a1, 2025-01-01, 7d
    Task B :after a1, 5d
```

---

## Phase 6: Adaptive Planning Principles

These principles make plans actually work (not just look good):

### 1. The 80/20 Rule of Planning
Identify the 20% of tasks that deliver 80% of results. Make those **non-negotiable core tasks**. Everything else is "nice to have."

### 2. Time Boxing
Every task needs a time estimate AND a deadline. Without both, tasks expand infinitely.

### 3. Buffer Planning
- Add 20% buffer to any estimate given by the user
- Add 30% buffer for tasks involving external dependencies
- Always have at least 1 "slack week" per month in a multi-month plan

### 4. The Minimum Viable Plan
For overwhelmed users or short timescales, offer a **Minimum Viable Plan (MVP)** — the smallest set of actions that still achieves the core goal. Label it clearly: "If you can only do 3 things..."

### 5. Context-Aware Adjustments
- **For students**: Include study sessions, break schedules, exam countdowns
- **For professionals**: Account for meetings, deep work blocks, commute
- **For entrepreneurs**: Include validation steps before building
- **For learners**: Include practice/project milestones, not just "read chapter X"
- **For teams**: Assign clear owners, define handoff points
- **For Islamic contexts**: Account for prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha), Friday Jumu'ah, Ramadan schedule changes, Eid preparations

---

## Domain Reference Files

For deep domain-specific planning, read the relevant reference file:

| Domain | Reference File |
|---|---|
| Software Projects | `references/software-project.md` |
| Learning & Education | `references/learning-roadmap.md` |
| Business & Startup | `references/business-plan.md` |
| Personal Productivity | `references/personal-productivity.md` |
| Events & Gatherings | `references/event-planning.md` |

Read these only when the plan is primarily in that domain and you need additional depth.

---

## Quick Templates

### Template: Weekly Plan
```
## Week of [DATE]

### Goal for the Week
[1 sentence]

### Top 3 Priorities
1. [Most important — must finish]
2. [Should finish]
3. [Nice to have]

### Daily Breakdown
| Day | Morning | Afternoon | Evening |
|-----|---------|-----------|---------|
| Mon | | | |
| Tue | | | |
| ...

### End-of-Week Review (Friday)
- What did I finish?
- What's carrying over?
- What's blocking me?
```

### Template: Project Phase
```
## Phase [N]: [Phase Name]
**Duration**: [X weeks]  
**Goal**: [Deliverable]  
**Dependencies**: [What must be done first]

### Tasks
- [ ] [Task 1] — [Owner] — [Due date] — [Est. time]
- [ ] [Task 2] — [Owner] — [Due date] — [Est. time]

### Definition of Done
[How we know this phase is complete]
```

### Template: Learning Milestone
```
## Milestone [N]: [Topic/Skill]
**Target Date**: [Date]  
**Resources**: [Books, courses, docs]

### Study Sessions
- [ ] Session 1: [Topic] — [X hours]
- [ ] Session 2: [Topic] — [X hours]

### Practice Project
[What to build/do to solidify learning]

### Checkpoint
[How to verify you've actually learned this]
```

---

## Common Planning Anti-Patterns to Avoid

| ❌ Anti-Pattern | ✅ Better Approach |
|---|---|
| "Study Kubernetes" as a task | "Read Kubernetes docs Chapter 3 + do 2 practice exercises" |
| No time estimates | Every task has a time box |
| 50+ tasks in week 1 | Max 5 high-priority tasks per week |
| No review schedule | Weekly/bi-weekly review built into plan |
| Planning in isolation | Identify 1 accountability check-in |
| Optimistic timelines | Add 20-30% buffer to all estimates |
| No MVP identified | Always identify the minimum viable outcome |
| Ignoring energy levels | Schedule deep work during peak energy hours |
