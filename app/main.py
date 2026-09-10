from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from app.database import check_postgres
from app.database_init import init_postgres_tables
from app.mongo import connect_mongo, close_mongo, check_mongo
from app.routes.story_routes import router as story_router
from app.routes.auth_routes import router as auth_router
from app.routes.admin_routes import router as admin_router
from app.routes.admin_story_routes import router as admin_story_router
from app.routes.category_routes import router as category_router
from app.routes.report_routes import router as report_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_postgres_tables()
    connect_mongo()
    yield
    close_mongo()


app = FastAPI(title="AnoSay API", version="1.0.0", lifespan=lifespan)

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

app.include_router(story_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(admin_story_router)
app.include_router(category_router)
app.include_router(report_router)


@app.get("/")
def root():
    return {"message": "AnoSay API is running"}


@app.get("/ui/", include_in_schema=False)
def ui_home(request: Request):
    return templates.TemplateResponse(
        request,
        "public/index.html",
        {"title": "AnoSay — Say it without the name"},
    )


@app.get("/ui/stories", include_in_schema=False)
def ui_stories(request: Request):
    return templates.TemplateResponse(
        request,
        "public/stories.html",
        {"title": "Stories | AnoSay"},
    )


@app.get("/ui/stories/{story_id}", include_in_schema=False)
def ui_story_detail(request: Request, story_id: str):
    return templates.TemplateResponse(
        request,
        "public/story_detail.html",
        {"title": "Story | AnoSay"},
    )


@app.get("/ui/submit", include_in_schema=False)
def ui_submit(request: Request):
    return templates.TemplateResponse(
        request,
        "public/submit.html",
        {"title": "Submit a Story | AnoSay"},
    )


@app.get("/ui/admin/dashboard", include_in_schema=False)
def ui_admin_dashboard(request: Request):
    return templates.TemplateResponse(
        request,
        "admin/dashboard.html",
        {"title": "Admin Dashboard"},
    )


@app.get("/ui/admin/login", include_in_schema=False)
def ui_admin_login(request: Request):
    return templates.TemplateResponse(
        request,
        "admin/login.html",
        {"title": "Admin Login"},
    )


@app.get("/ui/admin/stories", include_in_schema=False)
def ui_admin_stories(request: Request):
    return templates.TemplateResponse(
        request,
        "admin/stories.html",
        {"title": "Admin Stories"},
    )


@app.get("/ui/admin/reports", include_in_schema=False)
def ui_admin_reports(request: Request):
    return templates.TemplateResponse(
        request,
        "admin/reports.html",
        {"title": "Admin Reports"},
    )


@app.get("/ui/admin/categories", include_in_schema=False)
def ui_admin_categories(request: Request):
    return templates.TemplateResponse(
        request,
        "admin/categories.html",
        {"title": "Admin Categories"},
    )


@app.get("/health")
def health():
    try:
        check_postgres()
        pg_status = "ok"
    except Exception:
        pg_status = "error"

    try:
        check_mongo()
        mongo_status = "ok"
    except Exception:
        mongo_status = "error"

    return {
        "status": "ok",
        "postgres": pg_status,
        "mongodb": mongo_status,
    }
