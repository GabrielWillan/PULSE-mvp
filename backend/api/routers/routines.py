from api.custom_validators import (
    RoutineCreateValidator,
    RoutineidValidator,
)
from api.customerror import RoutineIDNotFoundError
from fastapi import APIRouter, HTTPException, status
from services.routine_service import (
    CreateRoutine,
    FetchRoutine,
    delete_routines,
    fetch_all_routines,
)

router = APIRouter()


@router.post("/createroutine", status_code= status.HTTP_201_CREATED)
def create_routinebase(validator:RoutineCreateValidator):
    routine_id = CreateRoutine(validator.title_name)._createroutine
    routine = FetchRoutine(routine_id)
    if not routine._fetchroutine:
     raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)
    return routine._fetchroutine

@router.get("/fetchallroutines")
def fetchall_routine():
   all_routines = fetch_all_routines()
   return all_routines


@router.delete("/deleteroutine", status_code=status.HTTP_200_OK)
def deleted_routine(routines:RoutineidValidator):
   try:
      delete_routines(routines.routine_id)
   except RoutineIDNotFoundError:
      raise RoutineIDNotFoundError(f"Routine id {routines.routine_id} is not available")