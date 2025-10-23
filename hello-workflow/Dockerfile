FROM python:3.12-slim

WORKDIR /app

RUN pip install fastapi uvicorn

COPY container/main.py .

EXPOSE 8080

CMD ["python", "-u", "main.py"]
