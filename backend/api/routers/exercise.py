from fastapi import APIRouter, HTTPException, status
from services.exercise_service import (
    add_workout,
    edit_workout,
    search_workouts,
    show_workouts,
)