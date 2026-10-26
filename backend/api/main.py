from api.customerror import RoutineIDNotFoundError
from custom_validators import (
    RoutineCreateValidator,
    RoutineidValidator,
    WorkoutAddValidator,
)
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services.exercise_service import add_workout, search_workouts, show_workouts
from services.routine_service import (
    CreateRoutine,
    FetchRoutine,
    delete_routines,
    fetch_all_routines,
)
from services.session_service import fetch_days

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
      "http://localhost:5173",
      "http://127.0.0.1:5173",
   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
def fetch_routine_days(routine_id: int):
    try:
        days_data = fetch_days(routine_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine id {routine_id} is not available",
        )

    return days_data

@app.post("/addworkout", status_code= status.HTTP_200_OK)
def added_workouts(workouts: WorkoutAddValidator):

   new_workout =add_workout(
      day_id = workouts.day_id, 
      exercise_id = workouts.exercise_id,
      sets = workouts.sets,
      reps = workouts.reps,
      rest_time = workouts.rest_time,
      note = workouts.note
   )

   return new_workout

@app.get("/showworkout", status_code= status.HTTP_200_OK)
def showing_workouts(routine_id:int):
   try:
      get_workout = show_workouts(routine_id)
   except KeyError:
      raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail= "This routine dose not exist")
   
   return get_workout

@app.get("/searchworkout")
def searched_exercises(exercise_name: str):
    result_query = search_workouts(exercise_name)
    return result_query