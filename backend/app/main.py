from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    admin,
    analytics,
    auth,
    lists,
    portability,
    problems,
    reviews,
    search,
    solve_logs,
    user_problems,
)

app = FastAPI(title="kingfisher API", version="0.1.0")

_STATUS_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "error": {
                "code": _STATUS_CODES.get(exc.status_code, "ERROR"),
                "message": exc.detail,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "data": None,
            "error": {"code": "VALIDATION_ERROR", "message": str(exc.errors())},
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "error": {"code": "INTERNAL_ERROR", "message": "Internal server error"},
        },
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(lists.router, prefix="/api/v1/lists", tags=["lists"])
app.include_router(
    user_problems.router, prefix="/api/v1/user/problems", tags=["user_problems"]
)
app.include_router(
    solve_logs.router, prefix="/api/v1/user/problems", tags=["solve_logs"]
)
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(search.router, prefix="/api/v1/user/search", tags=["search"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(portability.router, prefix="/api/v1/user", tags=["portability"])


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
