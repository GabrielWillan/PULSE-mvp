from api.custom_validators import (
   WorkoutAddValidator,
   WorkoutEditValidator,
   WorkoutTitleValidator,
)
from fastapi import APIRouter, HTTPException, status
from services.exercise_service import (
   add_workout,
   edit_workout,
   search_workouts,
   show_workouts,
   update_workout_title,
)

router = APIRouter()


@router.post("/addworkout", status_code= status.HTTP_200_OK)
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

@router.get("/showworkout", status_code= status.HTTP_200_OK)
def showing_workouts(routine_id:int):
   try:
      get_workout = show_workouts(routine_id)
   except KeyError:
      raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail= "This routine dose not exist")
   
   return get_workout

@router.patch("/editworkout", status_code= status.HTTP_202_ACCEPTED)
def edited_workout(workouts:WorkoutEditValidator):
   new_workout = edit_workout(
      day_id = workouts.day_id,
      exercise_detail_id= workouts.exercise_detail_id,
      exercise_id = workouts.exercise_id,
      sets = workouts.sets,
      reps = workouts.reps,
      rest_time = workouts.rest_time,
      note = workouts.note
   )

   return new_workout


@router.get("/searchworkout")
def searched_exercises(exercise_name: str):
    result_query = search_workouts(exercise_name)
    return result_query


@router.patch("/days/{day_id}/title", status_code=status.HTTP_202_ACCEPTED)
def updated_workout_title(workout: WorkoutTitleValidator):
   new_title = update_workout_title(
      workout.day_id, workout.workout_title
   )

   return new_title

