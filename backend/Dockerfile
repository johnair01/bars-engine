FROM python:3.12-slim

WORKDIR /app

COPY backend/ .
RUN pip install uv && \
    uv pip install --system -r requirements.txt .

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
