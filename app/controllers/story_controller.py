import re
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.mongo import get_mongo
from app.schemas.story import StoryCreate, StoryResponse


def _story_response(doc: dict) -> StoryResponse:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return StoryResponse(**doc)


def _approved_stories(query: dict, limit: int | None = None) -> list[StoryResponse]:
    db = get_mongo()
    cursor = db.stories.find({"status": "approved", **query}).sort("created_at", -1)
    if limit is not None:
        cursor = cursor.limit(limit)
    return [_story_response(doc) for doc in cursor]


def parse_story_id(story_id: str) -> ObjectId:
    try:
        return ObjectId(story_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid story id")


def create_story(data: StoryCreate) -> StoryResponse:
    db = get_mongo()
    doc = {
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "tags": data.tags,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    result = db.stories.insert_one(doc)
    return StoryResponse(
        id=str(result.inserted_id),
        **doc,
    )


def get_all_stories() -> list[StoryResponse]:
    """Public listing: only return stories with status 'approved'."""
    return _approved_stories({})


def search_stories(keyword: str) -> list[StoryResponse]:
    """Public search: approved stories matching keyword in title or content."""
    pattern = re.escape(keyword)
    query = {
        "$or": [
            {"title": {"$regex": pattern, "$options": "i"}},
            {"content": {"$regex": pattern, "$options": "i"}},
        ]
    }
    return _approved_stories(query)


def get_stories_by_category(category: str) -> list[StoryResponse]:
    """Public category filter: approved stories with a case-insensitive match."""
    pattern = f"^{re.escape(category)}$"
    return _approved_stories({"category": {"$regex": pattern, "$options": "i"}})


def get_stories_by_tag(tag: str) -> list[StoryResponse]:
    """Public tag filter: approved stories with a case-insensitive tag match."""
    pattern = f"^{re.escape(tag)}$"
    return _approved_stories({"tags": {"$regex": pattern, "$options": "i"}})


def get_latest_stories(limit: int = 10) -> list[StoryResponse]:
    """Public latest: approved stories sorted newest first, limited."""
    return _approved_stories({}, limit=limit)


def get_story_by_id(story_id: str) -> StoryResponse:
    """Public detail: only return the story if it exists and is 'approved'."""
    db = get_mongo()
    object_id = parse_story_id(story_id)

    doc = db.stories.find_one({"_id": object_id})
    if doc is None or doc.get("status") != "approved":
        raise HTTPException(status_code=404, detail="Story not found")

    return _story_response(doc)