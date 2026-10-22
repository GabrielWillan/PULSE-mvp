import sqlite3 as sq  # noqa: F401

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field  # noqa: F401
from services.routine_service import CreateRoutine, FetchRoutine, fetch_all_routines

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
   

