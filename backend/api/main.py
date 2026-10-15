import sqlite3

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.routine_service import RoutineCreate

app = FastAPI()



#routine createvalidator

class RoutineCreateValidator(BaseModel):
    title_name:str

@app.post("/createroutine", status_code= status.HTTP_201_CREATED)
def create_routine(validator:RoutineCreateValidator):
    new_routine = RoutineCreate(title_name= validator.title_name)

    return{"new_routine": new_routine}
