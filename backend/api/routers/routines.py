from fastapi import APIRouter, HTTPException, status
from services.routine_service import (
    CreateRoutine,
    FetchRoutine,
    delete_routines,
    fetch_all_routines,
)