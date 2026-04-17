FROM python:3.12

WORKDIR /app

# Install uv for fast package management
RUN pip install uv

# Copy source
COPY . .

# Install dependencies from pyproject.toml
RUN uv pip install --system .

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
