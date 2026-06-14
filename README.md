# MotherCare — Maternity Hospital Management System
**Shakuntala Hospital** | *Compassionate Care, Advanced Technology*

MotherCare is a purpose-built, SaaS-ready Hospital Information System (HIS) for dedicated maternity care facilities. It covers the full maternity journey — from patient registration through pregnancy tracking, delivery, newborn care, and discharge.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Django 4.2 LTS |
| API Layer | Django REST Framework 3.14+ |
| Database | PostgreSQL 15+ |
| Auth | DRF Token Auth + custom UserSession |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Task Queue | Celery + Redis (Phase 2) |

---

## Repository Structure

```
mothercare/
├── backend/          ← Django project (uv managed)
├── frontend/         ← React 18 / Vite / TypeScript
├── docs/             ← PRD, Architecture, Business Rules
├── scripts/          ← DB seed scripts, utilities
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Development)

### Prerequisites
- Docker Desktop
- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (`pip install uv` or `irm https://astral.sh/uv/install.ps1 | iex` on Windows)

### 1. Start Database & Redis
```bash
docker-compose up db redis -d
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
uv sync

# Apply migrations
uv run python manage.py migrate

# Create superuser
uv run python manage.py createsuperuser

# Seed roles, permissions, and hospital config
uv run python manage.py seed_data

# Run dev server
uv run python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend

npm install
npm run dev
```

### 4. Access
| Service | URL |
|---|---|
| Backend API | http://localhost:8000/api/v1/ |
| API Docs (Swagger) | http://localhost:8000/api/schema/swagger-ui/ |
| Django Admin | http://localhost:8000/admin/ |
| Frontend | http://localhost:5173/ |

---

## Development Workflow

```bash
# Run backend tests
cd backend && uv run pytest

# Run linter
cd backend && uv run ruff check .

# Run frontend type check
cd frontend && npm run type-check

# Run full Docker stack
docker-compose up --build
```

---

## Documentation

| Document | Location |
|---|---|
| Product Requirements | [docs/PRD.md](docs/PRD.md) |
| Engineering Guide | [docs/CLAUDE.md](docs/CLAUDE.md) |
| Business Rules | [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) |
| Database Architecture | [docs/mothercare_final_architecture_v2.md](docs/mothercare_final_architecture_v2.md) |

---

*MotherCare v1.0 MVP — Shakuntala Hospital*
