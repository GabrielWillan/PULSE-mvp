#log, start,end,pause sessions
import sqlite3 as sq


def create_sesssions(day_id: int):
    with sq.connect("../database/main/pulse.db") as db:
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
    with sq.connect("../database/main/pulse.db") as db:
        db.execute(
            """
            INSERT INTO logsessions(sessions_id, exercise_name, sets, reps)
            VALUES(?, ?, ?, ?)
            """,
            (sessions_id, exercise_name, sets, reps,)
        )
        db.commit()

def pause_sessions(sessions_id:int):
    with sq.connect("../database/main/pulse.db") as db:
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
    with sq.connect("../database/main/pulse.db") as db:
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
    with sq.connect("../database/main/pulse.db") as db:
        db.execute(
            """
            UPDATE sessions
            SET ended_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (sessions_id,)
        )
        db.commit()


