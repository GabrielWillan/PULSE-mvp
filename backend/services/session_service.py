import sqlite3 as sq

from api.customerror import RoutineIDNotFoundError


def create_sesssions(day_id:int):
       db = sq.connect("database/main/pulse.db")
       day = db.execute(
           """
           SELECT id
           FROM routinedays
           WHERE id = ?
           """,
           (day_id, )
        ).fetchone()
       
       if day is None:
           raise KeyError(f"day id: {day_id}dosen't not exist")
       
       cursor =db.execute(
           """
           INSERT INTO sessions(day_id)
           VALUES(?);
           """,
           (day[0], )
        )
       
       session_id = cursor.lastrowid
       
       started_at = db.execute(
           """
           SELECT started_at
           FROM sessions
           WHERE id = ?
           """,
           (session_id, )
        ).fetchone()
       db.commit()
       db.close()

       
       return {"session_id":session_id, "started_at":started_at[0]}
       
def log_sessions(sessions_id:int, exercise_id:int, sets:int, reps: int, weight:int, rest_time:int):
    with sq.connect("database/main/pulse.db") as db:
        session = db.execute(
            """
            SELECT id
            FROM sessions
            WHERE id = ?
            """,
            (sessions_id, )
        ).fetchone()
        if session is None:
            raise KeyError("Session is not available")
        
        
        cursor = db.execute(
            """
            INSERT INTO logsessions(sessions_id, exercise_id, sets, reps, weight, rest_time)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
            (session[0], exercise_id, sets, reps, weight, rest_time )
        )
        log_id = cursor.lastrowid
        db.commit()
        return {"log_id":log_id}


def update_log_session(log_id: int, sessions_id: int, exercise_id: int, sets: int, reps: int, weight: float, rest_time: int):
    with sq.connect("database/main/pulse.db") as db:
        session = db.execute(
            "SELECT id FROM sessions WHERE id = ?",
            (sessions_id,),
        ).fetchone()
        if session is None:
            raise KeyError("Session is not available")

        existing_log = db.execute(
            "SELECT sessions_id, exercise_id FROM logsessions WHERE id = ?",
            (log_id,),
        ).fetchone()
        if existing_log is None:
            raise KeyError("Set log is not available")
        if existing_log[0] != sessions_id or existing_log[1] != exercise_id:
            raise KeyError("Set log does not belong to this session and exercise")

        db.execute(
            """
            UPDATE logsessions
            SET sets = ?, reps = ?, weight = ?, rest_time = ?
            WHERE id = ?
            """,
            (sets, reps, weight, rest_time, log_id),
        )
        return {"log_id": log_id}
    


def show_log_sessions(routine_id:int):
    with sq.connect("database/main/pulse.db") as db:
        db.row_factory = sq.Row

        routine = db.execute(
            """
            SELECT id
            FROM routinebase
            WHERE id = ?;
            """,
            (routine_id, )
        ).fetchone()

        if routine is None:
            raise RoutineIDNotFoundError(f"Routine id {routine_id} dosen't exist")

        db.execute(
            """
            SELECT
            sess.id,
            log.sessions_id,
            log.exercise_id,
            log.sets,
            log.reps,
            log.weight,
            log.rest_time
            FROM sessions AS sess
            JOIN logsessions AS log
            ON log.sessions_id = sess.id
            """
        ).fetchone()

        logs = db.execute(
            """
            SELECT
            log.id,
            log.sessions_id,
            log.exercise_id,
            log.sets,
            log.reps,
            log.weight,
            log.rest_time
            FROM sessions AS sess
            JOIN logsessions AS log
            ON log.sessions_id = sess.id
            JOIN routinedays AS rd
            ON sess.day_id = rd.id
            WHERE rd.routine_id = ? 
            """,
            (routine_id, )
        ).fetchall()
        db.commit()

        return{"logged_sessions": [dict(log) for log in logs]}

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
        session = db.execute(
            "SELECT ended_at FROM sessions WHERE id = ?",
            (sessions_id,),
        ).fetchone()
        if session is None:
            raise KeyError(f"Session id {sessions_id} was not found")

        ended_at = session[0]
        if ended_at is None:
            db.execute(
                "UPDATE sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?",
                (sessions_id,),
            )
            ended_at = db.execute(
                "SELECT ended_at FROM sessions WHERE id = ?",
                (sessions_id,),
            ).fetchone()[0]

        return {"session_id": sessions_id, "ended_at": ended_at}

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
            exercise_detail_id = day["exercise_detail_id"]
            day_name = day["day_name"]
            workout_title = day["workout_title"]

            if day_id not in result:
                result[day_id] = {
                    "id": day_id,
                    "exercise_detail_id": exercise_detail_id,
                    "day_name": day_name,
                    "workout_title":workout_title,
                    "exercises": [],
                }

            if day["exercise_id"] is not None:
                result[day_id]["exercises"].append(
                    {
                        "id": day["exercise_id"],
                        "exercise_detail_id": day["exercise_detail_id"],
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

