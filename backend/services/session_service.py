#log, start,end,pause sessions
import sqlite3 as sq


def create_sesssions(day_id: int):
    with sq.connect("database/main/pulse.db") as db:
        cursor =db.execute(
            """
            INSERT INTO sessions(day_id)
            VALUES(?)
            """,
            (day_id,)
        )
        sessions_id = cursor.lastrowid
        db.commit()

    return sessions_id
    

def log_sessions(sessions_id:int, exercise_name:str, sets:int, reps: int,):
    with sq.connect("database/main/pulse.db") as db:
        db.execute(
            """
            INSERT INTO logsessions(sessions_id, exercise_name, sets, reps)
            VALUES(?, ?, ?, ?)
            """,
            (sessions_id, exercise_name, sets, reps,)
        )
        db.commit()

def pause_sessions(sessions_id:int):
    with sq.connect("database/main/pulse.db") as db:
        db.execute(
            """
            UPDATE sessions
            SET paused_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (sessions_id,)
        )
        db.commit()


def resume_sessions(sessions_id:int):
    with sq.connect("database/main/pulse.db") as db:
        db.execute(
            """
            UPDATE sessions
            SET resumed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
            """,
            (sessions_id,)
        )
        db.commit()

def end_sessions(sessions_id:int):
    with sq.connect("database/main/pulse.db") as db:
        db.execute(
            """
            UPDATE sessions
            SET ended_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (sessions_id,)
        )
        db.commit()

def fetch_days(routine_id:int):
    with sq.connect("database/main/pulse.db") as db:
        db.row_factory = sq.Row
        routine = db.execute(
            """
            SELECT id 
            FROM routinebase
            WHERE id = ?
            """,
            (routine_id, )
        ).fetchone()

        days = db.execute(
            """
            SELECT 
                rd.id,
                rd.day_name,
                ed.id AS exercise_id
                ed.name AS exercise_name
                ed.sets,
                ed.reps,
                ed.rest_time
                ed.note
            FROM routinedays as rd
            LEFT JOIN exercisedetails as ed
            ON ed.day_id = ed.id
            WHERE ed.routine_id = ?
            ORDERD BY ed.id
            """,
            (routine_id, )
        ).fetchone()

        result = {}
        for day in days:
            day_name = day["name"]

            if day_name not in result:
                result[day_name] = {
                    "id": day["id"],
                    "day_name":day_name,
                    "exercises": [],
                }
            
            if day["exercise_id"] is not None:
                result[day_name] = {
                    "id": day["exercise_id"],
                    "name": day["exercise_name"],
                    "sets": day["sets"],
                    "reps": day["reps"],
                    "rest_time": day["rest_time"],
                    "note": day["note"],
                }
        
        return (result.values)

        