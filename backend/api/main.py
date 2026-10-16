import sqlite3 as sq  # noqa: F401

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.routine_service import (
    create_routine,
    fetch_routine,
)

app = FastAPI()



#routine createvalidator

class RoutineCreateValidator(BaseModel):
    title_name:str

@app.post("/createroutine", status_code= status.HTTP_201_CREATED)
def create_routinebase(validator:RoutineCreateValidator):
    routine_id = create_routine(validator.title_name)
    routine = fetch_routine(routine_id)
    return routine


#Connect your api to your front end  using the endpoint you made
