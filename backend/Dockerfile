FROM python:3.12-slim

WORKDIR /app

COPY . .
RUN pip install uv && \
    uv pip install --system -r requirements.txt .

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]
