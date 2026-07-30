from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, problems, lists, user_problems, solve_logs, reviews, search, analytics, admin, portability

app = FastAPI(title="kingfisher API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(lists.router, prefix="/api/v1/lists", tags=["lists"])
app.include_router(user_problems.router, prefix="/api/v1/user/problems", tags=["user_problems"])
app.include_router(solve_logs.router, prefix="/api/v1/user/problems", tags=["solve_logs"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(search.router, prefix="/api/v1/user/search", tags=["search"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(portability.router, prefix="/api/v1/user", tags=["portability"])

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
