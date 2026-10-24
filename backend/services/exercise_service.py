import sqlite3 as sq


def create_workout(
    day_id: int,
    name: str,
    sets: int,
    reps: int,
    rest_time: int,
    note: str | None = None
):
    with sq.connect("../database/main/pulse.db") as db:
        db.execute(
            """
            INSERT INTO exercisedetails
                (day_id, name, sets, reps, rest_time, note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (day_id, name, sets, reps, rest_time, note)
        )
        db.commit()
    


def show_workouts():
    db= sq.connect("../database/main/pulse.db")
    cursor = db.execute(
        """SELECT name, sets, reps, rest_time FROM exercisedetails;"""
    )
    result = cursor.fetchall()
    db.close()
    return result



def add_workout(day_id:int, exercise_id:int, sets:int, reps:int, rest_time:int, note:str | None = None):
   with sq.connect("../database/main/pulse.db") as db:
    routine_days = db.execute(
        """
        SELECT id 
        FROM routinedays
        WHERE id = ?
        """,
        (day_id,)
    ).fetchone()

    if routine_days is None:
        raise KeyError("placeholder")
    
    exercise = db.execute(
       """
       SELECT id
       FROM catalog
       WHERE id = ?
       """,
       (exercise_id, )
    ).fetchone()

    if exercise is None:
       raise KeyError("placeholder fix custom error")
    
    
