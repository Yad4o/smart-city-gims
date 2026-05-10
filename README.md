# Smart City Grievance & Infrastructure Management System

An AI-powered platform for unified citizen grievance management. Complaints submitted via REST API, email, or WhatsApp are automatically categorized, prioritized, and routed to the right ward officer — with SLA enforcement, real-time tracking, and analytics.

**Inspired by:** 305 Hackathon Fall 2025 (Smart Cities) + SIH 2024 (Smart Automation)

**Stack:** FastAPI · PostgreSQL + PostGIS · SQLAlchemy · Alembic · Celery + Redis · OpenAI · Resend · React 18 + TypeScript

---

## Features

- **Multi-channel ingestion** — REST API, email webhook, WhatsApp webhook (simulated)
- **AI categorization** — LLM (OpenAI GPT-4o-mini) classifies complaint into category + severity (P1–P4). Falls back to keyword classifier if no API key.
- **Smart assignment** — PostGIS ST_Within finds the ward for a complaint's location; picks the officer with lowest current workload
- **SLA engine** — P1: 4h, P2: 24h, P3: 72h, P4: 7 days. Celery Beat checks every 5 minutes and auto-escalates P1/P2 breaches
- **Real-time tracking** — WebSocket endpoint lets citizens watch their complaint status live
- **Officer dashboard** — view assigned complaints, update status, upload photo proof
- **Analytics** — resolution rate by category, SLA breach rate by ward, officer performance scores
- **Email notifications** — Resend API sends status updates to citizens on every change

---

## Quick Start

### Prerequisites

- Python 3.11
- PostgreSQL with PostGIS extension (`CREATE EXTENSION IF NOT EXISTS postgis;`)
- Redis

### 1. Clone and set up

```bash
git clone https://github.com/Yad4o/smart-city-gims.git
cd smart-city-gims

bash setup.sh          # creates venv, installs deps
source ./activate      # activate venv (Windows: activate.bat)
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, OPENAI_API_KEY (optional), RESEND_API_KEY (optional)
```

Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Run migrations

```bash
alembic upgrade head
```

### 4. Start the API

```bash
uvicorn app.main:app --reload
```

Docs at http://localhost:8000/docs

### 5. Start the Celery worker + scheduler

```bash
celery -A app.worker worker --loglevel=info
celery -A app.worker beat --loglevel=info
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register citizen or officer |
| POST | /auth/login | Get JWT access token |
| GET | /auth/me | Current user profile |
| POST | /complaints | Submit a complaint (auto-categorized + assigned) |
| GET | /complaints/{ticket_id} | Track complaint — full history |
| PATCH | /complaints/{ticket_id}/status | Officer: update status + note |
| POST | /complaints/{ticket_id}/photo | Officer: upload photo proof |
| GET | /complaints | List complaints (filtered by role) |
| WS | /complaints/ws/{ticket_id} | Real-time status updates (WebSocket) |
| POST | /webhooks/email | Simulate inbound email complaint |
| POST | /webhooks/whatsapp | Simulate inbound WhatsApp complaint |
| GET | /analytics | Full analytics dashboard (admin only) |

---

## Real-Time Demo (WebSocket)

```javascript
const ws = new WebSocket("ws://localhost:8000/complaints/ws/GRV-2025-00042");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
// {"ticket_id": "GRV-2025-00042", "status": "resolved", "note": "Pothole filled"}
```

---

## Running Tests

```bash
pytest --cov=app --cov-report=term-missing
```

Tests use SQLite in-memory — no Postgres or Redis needed.

---

## Project Structure

```
smart-city-gims/
├── app/
│   ├── main.py              # FastAPI app, router registration
│   ├── config.py            # Pydantic settings
│   ├── database.py          # SQLAlchemy engine + session
│   ├── worker.py            # Celery app + Beat schedule
│   ├── models/              # ORM models
│   │   ├── user.py          # User (citizen, officer, admin)
│   │   ├── ward.py          # Ward + PostGIS boundary
│   │   └── complaint.py     # Complaint, ComplaintEvent, Notification
│   ├── routers/             # FastAPI route handlers
│   │   ├── auth.py
│   │   ├── complaints.py    # Submit, track, update, WebSocket
│   │   ├── webhooks.py      # Email + WhatsApp simulation
│   │   └── analytics.py
│   ├── services/            # Business logic
│   │   ├── categorization.py  # LLM + keyword fallback
│   │   ├── assignment.py      # Ward routing + officer assignment
│   │   ├── sla.py             # Deadline calculation + breach check
│   │   └── notification.py    # Resend email
│   ├── schemas/             # Pydantic request/response models
│   ├── tasks/               # Celery tasks
│   │   └── sla_monitor.py   # Runs every 5 min via Beat
│   └── utils/               # JWT auth, WebSocket manager, ticket ID
├── alembic/                 # DB migrations
├── tests/                   # pytest test suite
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_categorization.py
│   └── test_sla.py
├── frontend/                # React 18 + TypeScript (see frontend/README.md)
├── .env.example
├── requirements.txt
├── setup.sh
└── activate / activate.bat
```

---

## SLA Policy

| Priority | Response Time | Auto-Escalate on Breach |
|----------|--------------|------------------------|
| P1 — Critical | 4 hours | Yes |
| P2 — High | 24 hours | Yes |
| P3 — Medium | 72 hours | No |
| P4 — Low | 7 days | No |

---

## Contributing

- Backend tasks: assigned to `Yad4o`
- Frontend tasks: assigned to `prajwal5065`
- All PRs reviewed before merge
