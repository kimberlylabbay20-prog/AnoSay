from fastapi import APIRouter, Query

from app.controllers.story_controller import (
    create_story,
    get_all_stories,
    get_latest_stories,
    get_stories_by_category,
    get_stories_by_tag,
    get_story_by_id,
    search_stories,
)
from app.schemas.story import StoryCreate, StoryResponse

router = APIRouter(prefix="/stories", tags=["stories"])


@router.post("/", response_model=StoryResponse, status_code=201)
def create(data: StoryCreate):
    return create_story(data)


@router.get("/", response_model=list[StoryResponse])
def list_stories():
    return get_all_stories()


@router.get("/search", response_model=list[StoryResponse])
def search(keyword: str = Query(..., min_length=1)):
    return search_stories(keyword)


@router.get("/category/{category}", response_model=list[StoryResponse])
def by_category(category: str):
    return get_stories_by_category(category)


@router.get("/tag/{tag}", response_model=list[StoryResponse])
def by_tag(tag: str):
    return get_stories_by_tag(tag)


@router.get("/latest", response_model=list[StoryResponse])
def latest():
    return get_latest_stories()


@router.get("/{story_id}", response_model=StoryResponse)
def get_story(story_id: str):
    return get_story_by_id(story_id)