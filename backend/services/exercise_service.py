import sqlite3 as sq


def add_workout(day_id:int, exercise_id:int, sets:int, reps:int, rest_time:int, note:str | None = None):
    db = sq.connect("database/main/pulse.db")
    routine_days = db.execute(
        """
        SELECT id 
        FROM routinedays
        WHERE id = ?
        """,
        (day_id,)
    ).fetchone()
   

    if routine_days is None:
        raise KeyError("Routine days is not available")
    
    exercise = db.execute(
       """
       SELECT id
       FROM catalog
       WHERE id = ?
       """,
       (exercise_id, )
    ).fetchone()

    if exercise is None:
       raise KeyError("exercise is not available")
    

    db.execute(
       """
       INSERT INTO exercisedetails(day_id, exercise_id, sets, reps, rest_time, note )
       VALUES(?, ?, ?, ?, ?, ?)
       """,
       (routine_days[0], exercise[0], sets, reps, rest_time, note, )
    )
    db.commit()
    db.close()


def show_workouts():
    db= sq.connect("database/main/pulse.db")
    cursor = db.execute(
        """SELECT 
        c.name, 
        ed.sets, 
        ed.reps, 
        ed.rest_time 
        FROM exercisedetails AS ed
        JOIN catalog as c
        ON ed.exercise_id = c.id;"""
    )
    result = cursor.fetchall()
    db.commit()
    return result



def search_workouts(exercise_name: str):
    db = sq.connect("database/main/pulse.db")

    search_param = f"%{exercise_name.lower()}%"

    try:
        search_result = db.execute(
            """
            SELECT id, name
            FROM catalog
            WHERE lower(name) LIKE ?
            LIMIT 20;
            """,
            (search_param,)
        ).fetchall()

        return [
            {"id": row[0], "name": row[1]}
            for row in search_result
        ]

    finally:
        db.close()