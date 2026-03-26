FROM python:3.12-slim AS dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=wsgi:app

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000", "--reload"]

FROM dev AS prod

CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "wsgi:app"]
