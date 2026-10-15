import sqlite3 as sq  # noqa: F401

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.routine_service import (
    create_routine,
    create_routine_days,
    fetch_routine,
    fetch_routine_days,
)

app = FastAPI()



#routine createvalidator

class RoutineCreateValidator(BaseModel):
    title_name:str

@app.post("/createroutine", status_code= status.HTTP_201_CREATED)
def create_routinebase(validator:RoutineCreateValidator):
    new_routine = create_routine(validator.title_name)

    return{"new_routine": new_routine}
