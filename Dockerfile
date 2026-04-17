FROM python:3.12-slim

WORKDIR /app

# Copy only the backend source
COPY backend/ .

# Install dependencies (non-editable)
RUN pip install uv && uv pip install --system -r requirements.txt .

EXPOSE 8080

CMD [\"python\", \"-m\", \"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8080\"]