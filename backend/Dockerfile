FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first (layer caching)
COPY pyproject.toml uv.lock .python-version ./

# Install production dependencies only
RUN uv sync --no-dev --frozen

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY . .

# Create non-root user
RUN addgroup --system app && adduser --system --group app
RUN chown -R app:app /app
USER app

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Production: run migrations, create superuser, and start server
CMD sh -c "python manage.py migrate && python manage.py createsuperuser --noinput --username admin --email admin@example.com || true && python manage.py runserver 0.0.0.0:8000"
