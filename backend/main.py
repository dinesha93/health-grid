import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv(Path(__file__).parent / ".env")

from database import init_db  # noqa: E402
from routes import alerts, ambulances, analytics, health, hospitals, response, zones  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("healthgrid")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    logger.info("HealthGrid backend ready (SQLite initialized & seeded)")
    yield


app = FastAPI(
    title="HealthGrid API",
    description="City-Wide Predictive Healthcare & Emergency Intelligence Platform — synthetic demo data only.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid request", "errors": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


for router in (health.router, zones.router, alerts.router, hospitals.router, ambulances.router, response.router, analytics.router):
    app.include_router(router, prefix="/api")
