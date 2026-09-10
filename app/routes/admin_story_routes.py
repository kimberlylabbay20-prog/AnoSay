from fastapi import APIRouter, Depends

from app.controllers.admin_story_controller import (
    approve_story,
    delete_story,
    get_approved_stories,
    get_pending_stories,
    get_rejected_stories,
    reject_story,
)
from app.models.user import User
from app.schemas.story import StoryResponse
from app.security import require_admin

router = APIRouter(prefix="/admin/stories", tags=["admin-stories"])


@router.get("/pending", response_model=list[StoryResponse])
def list_pending_stories(admin: User = Depends(require_admin)):
    return get_pending_stories()


@router.get("/approved", response_model=list[StoryResponse])
def list_approved_stories(admin: User = Depends(require_admin)):
    return get_approved_stories()


@router.get("/rejected", response_model=list[StoryResponse])
def list_rejected_stories(admin: User = Depends(require_admin)):
    return get_rejected_stories()


@router.put("/{story_id}/approve", response_model=StoryResponse)
def approve(story_id: str, admin: User = Depends(require_admin)):
    return approve_story(story_id)


@router.put("/{story_id}/reject", response_model=StoryResponse)
def reject(story_id: str, admin: User = Depends(require_admin)):
    return reject_story(story_id)


@router.delete("/{story_id}")
def delete(story_id: str, admin: User = Depends(require_admin)):
    return delete_story(story_id)