from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserTierUpdate
from app.auth import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

# In-memory scoring weights (could be moved to DB for persistence)
SCORING_WEIGHTS = {
    "below_90d_avg": 25,
    "below_ath": 20,
    "volume_momentum": 15,
    "rookie_status": 10,
    "low_population": 10,
    "serial_scarcity": 10,
    "performance_momentum": 5,
    "set_popularity": 5,
}


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return db.query(User).all()


@router.put("/users/{user_id}/tier", response_model=UserResponse)
def update_user_tier(
    user_id: int,
    data: UserTierUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.tier not in ("free", "pro"):
        raise HTTPException(status_code=400, detail="Tier must be 'free' or 'pro'")
    user.tier = data.tier
    db.commit()
    db.refresh(user)
    return user


@router.get("/scoring-weights")
def get_scoring_weights(admin: User = Depends(get_current_admin_user)):
    return SCORING_WEIGHTS


@router.put("/scoring-weights")
def update_scoring_weights(
    weights: dict,
    admin: User = Depends(get_current_admin_user),
):
    valid_keys = set(SCORING_WEIGHTS.keys())
    for key in weights:
        if key not in valid_keys:
            raise HTTPException(status_code=400, detail=f"Invalid weight key: {key}")
    SCORING_WEIGHTS.update(weights)
    return SCORING_WEIGHTS


@router.post("/seed")
def trigger_seed(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    from app.seed_data import seed
    seed(db)
    return {"message": "Seed data loaded successfully"}
