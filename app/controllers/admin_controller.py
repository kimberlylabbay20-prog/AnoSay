from app.models.user import User


def get_dashboard_data(admin: User) -> dict:
    return {
        "message": "Admin access confirmed",
        "admin_id": admin.id,
        "admin_username": admin.username,
        "is_admin": admin.is_admin,
    }