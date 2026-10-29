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

def fetch_days(routine_id: int):
    with sq.connect("database/main/pulse.db") as db:
        db.row_factory = sq.Row

        routine = db.execute(
            """
            SELECT id
            FROM routinebase
            WHERE id = ?
            """,
            (routine_id,),
        ).fetchone()

        if routine is None:
            raise KeyError(f"Routine id {routine_id} was not found")

        days = db.execute(
            """
            SELECT
                rd.id AS day_id,
                rd.day_name,
                rd.workout_title,
                ed.id AS exercise_detail_id,
                ed.exercise_id,
                c.name AS exercise_name,
                ed.sets,
                ed.reps,
                ed.rest_time,
                ed.note
            FROM routinedays AS rd
            LEFT JOIN exercisedetails AS ed
                ON ed.day_id = rd.id
            LEFT JOIN catalog AS c
                ON c.id = ed.exercise_id
            WHERE rd.routine_id = ?
            ORDER BY rd.id;
            """,
            (routine_id,),
        ).fetchall()

        result = {}

        for day in days:
            day_id = day["day_id"]
            day_name = day["day_name"]
            workout_title = day["workout_title"]

            if day_id not in result:
                result[day_id] = {
                    "id": day_id,
                    "day_name": day_name,
                    "workout_title":workout_title,
                    "exercises": [],
                }

            if day["exercise_id"] is not None:
                result[day_id]["exercises"].append(
                    {
                        "id": day["exercise_id"],
                        "name": day["exercise_name"],
                        "sets": day["sets"],
                        "reps": day["reps"],
                        "rest_time": day["rest_time"],
                        "note": day["note"],
                    }
                )

        return list(result.values())


def delete_exercise(exercise_id:int):
    db = sq.connect("database/main/pulse.db")
    
    try:
        cursor = db.execute(
            """
            SELECT id 
            FROM exercisedetails
            WHERE id = ?
            """,
            (exercise_id,)
        )
        db.commit()
        return cursor
    finally:
        db.close()

