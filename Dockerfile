FROM node:24-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.14-slim AS runtime
ENV LUMA_FRONTEND_DIST=/app/frontend/dist \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/ /app/backend/
RUN python -m pip install --no-cache-dir /app/backend
COPY --from=frontend-build /build/frontend/dist /app/frontend/dist
EXPOSE 8000
CMD ["sh", "-c", "python -m uvicorn luma_api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

