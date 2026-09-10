from pymongo import ReturnDocument

from fastapi import HTTPException

from app.controllers.story_controller import _story_response, parse_story_id
from app.mongo import get_mongo
from app.schemas.story import StoryResponse


def _get_story_or_404(story_id: str) -> dict:
    db = get_mongo()
    object_id = parse_story_id(story_id)

    doc = db.stories.find_one({"_id": object_id})
    if doc is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return doc


def _stories_by_status(status: str) -> list[StoryResponse]:
    db = get_mongo()
    stories = []
    for doc in db.stories.find({"status": status}).sort("created_at", -1):
        stories.append(_story_response(doc))
    return stories


def get_pending_stories() -> list[StoryResponse]:
    """Return all stories whose status is exactly 'pending', newest first."""
    return _stories_by_status("pending")


def get_approved_stories() -> list[StoryResponse]:
    """Return all stories whose status is exactly 'approved', newest first."""
    return _stories_by_status("approved")


def get_rejected_stories() -> list[StoryResponse]:
    """Return all stories whose status is exactly 'rejected', newest first."""
    return _stories_by_status("rejected")


def approve_story(story_id: str) -> StoryResponse:
    """Set a story's status to 'approved' and return the updated story."""
    db = get_mongo()
    doc = _get_story_or_404(story_id)

    updated = db.stories.find_one_and_update(
        {"_id": doc["_id"]},
        {"$set": {"status": "approved"}},
        return_document=ReturnDocument.AFTER,
    )
    return _story_response(updated)


def reject_story(story_id: str) -> StoryResponse:
    """Set a story's status to 'rejected' and return the updated story."""
    db = get_mongo()
    doc = _get_story_or_404(story_id)

    updated = db.stories.find_one_and_update(
        {"_id": doc["_id"]},
        {"$set": {"status": "rejected"}},
        return_document=ReturnDocument.AFTER,
    )
    return _story_response(updated)


def delete_story(story_id: str) -> dict:
    """Delete a story from MongoDB and return a simple success message."""
    db = get_mongo()
    doc = _get_story_or_404(story_id)

    db.stories.delete_one({"_id": doc["_id"]})
    return {"message": "Story deleted"}