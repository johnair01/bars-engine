FROM python:3.12-slim

# Install uv for fast package management
RUN pip install uv

WORKDIR /app

# Copy source for install
COPY . .

# Install dependencies (non-editable for production)
RUN uv pip install --system .

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
