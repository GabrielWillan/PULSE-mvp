from api.custom_validators import SessionEndValidator, SessionsLogValidator
from fastapi import APIRouter, HTTPException, status
from services.session_service import (
    create_sesssions,
    end_sessions,
    fetch_days,
    log_sessions,
    show_log_sessions,
)

router = APIRouter()


@router.get("/fetchroutinedays", status_code=status.HTTP_200_OK)
def fetch_routine_days(routine_id: int):
    try:
        days_data = fetch_days(routine_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine id {routine_id} is not available",
        )

    return days_data

@router.post("/createsession", status_code = status.HTTP_201_CREATED)
def create_session(day_id:int):
    new_session = create_sesssions(day_id)

    return new_session


@router.post("/logsession",status_code = status.HTTP_202_ACCEPTED)
def log_session(session:SessionsLogValidator):
    try:
        new_log = log_sessions(
            session.sessions_id,
            session.exercise_id,
            session.sets,
            session.reps,
            session.weight,
            session.rest_time,
        )

        return new_log
    except KeyError:
        raise KeyError("There is an invalid input ")
    

@router.get("/showsessions", status_code= status.HTTP_200_OK)
def shown_sessions(routine_id:int):
    return show_log_sessions(routine_id)


@router.patch("/endsession", status_code= status.HTTP_200_OK)
def ended_session(session: SessionEndValidator):
    try:
       return end_sessions(session.sessions_id  ) 
    except KeyError:
        raise KeyError("This session dosen't exist") 
        