from fastapi import APIRouter, HTTPException, status
from services.session_service import fetch_days

router = APIRouter()


@router.get("/fetchroutinedays", status_code=status.HTTP_200_OK)
def fetch_routine_days(routine_id: int):
    try:
        days_data = fetch_days(routine_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine id {routine_id} is not available",
        )

    return days_data