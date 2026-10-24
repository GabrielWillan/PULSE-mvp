import sqlite3 as sq  # noqa: F401

from api.customerror import RoutineIDNotFoundError
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field  # noqa: F401
from services.exercise_service import add_workout, show_workouts
from services.routine_service import (
    CreateRoutine,
    FetchRoutine,
    delete_routines,
    fetch_all_routines,
)
from services.session_service import fetch_days

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

#routine createvalidator
class RoutineCreateValidator(BaseModel):
    title_name:str

class RoutineidValidator(BaseModel):
   routine_id:int

class ExerciseidValidator(BaseModel):
   exercise_id:int

@app.post("/createroutine", status_code= status.HTTP_201_CREATED)
def create_routinebase(validator:RoutineCreateValidator):
    routine_id = CreateRoutine(validator.title_name)._createroutine
    routine = FetchRoutine(routine_id)
    if not routine._fetchroutine:
     raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)
    return routine._fetchroutine

@app.get("/fetchallroutines")
def fetchall_routine():
   all_routines = fetch_all_routines()
   return all_routines



@app.delete("/deleteroutine", status_code=status.HTTP_200_OK)
def deleted_routine(routines:RoutineidValidator):
   try:
      delete_routines(routines.routine_id)
   except RoutineIDNotFoundError:
      raise RoutineIDNotFoundError(f"Routine id {routines.routine_id} is not available")
   


@app.get("/fetchroutinedays", status_code=status.HTTP_200_OK)
def fetch_routine_days(routine_days:RoutineidValidator):
   try:
    days_data = fetch_days(routine_days.routine_id)
   except RoutineIDNotFoundError:
      raise RoutineIDNotFoundError(f"Routine id {routine_days.routine_id} is not available")
   
   return days_data


@app.post("/addworkout", status_code= status.HTTP_200_OK)
def added_workouts():
   pass



@app.get("/showworkout", status_code= status.HTTP_200_OK)
def showing_workouts():
   pass