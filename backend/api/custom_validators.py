from pydantic import BaseModel


class RoutineCreateValidator(BaseModel):
    title_name:str

class RoutineidValidator(BaseModel):
   routine_id:int

class WorkoutAddValidator(BaseModel):
   day_id:int
   exercise_id:int
   sets:int
   reps:int
   rest_time:int
   note: str | None = None

class WorkoutTitleValidator(BaseModel):
   day_id:int
   workout_title:str | None = None