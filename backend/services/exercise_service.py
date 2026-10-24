import sqlite3 as sq


def add_workout(day_id:int, exercise_id:int, sets:int, reps:int, rest_time:int, note:str | None = None):
   with sq.connect("../database/main/pulse.db") as db:
    routine_days = db.execute(
        """
        SELECT id 
        FROM routinedays
        WHERE id = ?
        """,
        (day_id,)
    )

    if routine_days is None:
        raise KeyError("placeholder")
    
    exercise = db.execute(
       """
       SELECT id
       FROM catalog
       WHERE id = ?
       """,
       (exercise_id, )
    )

    if exercise is None:
       raise KeyError("placeholder fix custom error")
    

    db.execute(
       """
       INSERT INTO exercisedetails(day_id, exercise_id, sets, reps, rest_time, note )
       VALUES(?, ?, ?, ?, ?, ?)
       """,
       (routine_days, exercise, sets, reps, rest_time, note)
    ).fetchone()
    db.commit()


def show_workouts():
    db= sq.connect("../database/main/pulse.db")
    cursor = db.execute(
        """SELECT name, sets, reps, rest_time FROM exercisedetails;"""
    )
    result = cursor.fetchall()
    db.close()
    return result
