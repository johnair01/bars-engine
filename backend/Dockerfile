FROM python:3.12-slim

# Install uv for fast package management
RUN pip install uv

WORKDIR /app

# Copy source for install
COPY . .

# Install dependencies (non-editable for production)
RUN uv pip install --system .

# Expose Railway's expected port (8080, not 8000)
EXPOSE 8080

# Run with uvicorn — Railway injects PORT env var (8080)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
