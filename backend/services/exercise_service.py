import sqlite3 as sq


def create_workout(
    day_id: int,
    name: str,
    sets: int,
    reps: int,
    rest_time: int,
    note: str | None = None,
    db_path: str = "../database/main/pulse.db"
):
    with sq.connect(db_path) as db:
        db.execute("PRAGMA foreign_keys = ON")
        db.execute(
            """
            INSERT INTO exercisedetails
                (day_id, name, sets, reps, rest_time, note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (day_id, name, sets, reps, rest_time, note)
        )
        db.commit()
    


def show_workouts(db_path: str = "../database/main/pulse.db"):
    with sq.connect(db_path) as db:
        cursor = db.execute(
            """SELECT * FROM exercisedetails;"""
        )
        result = cursor.fetchall()
        db.close()
        return result


create_workout(day_id= 1, name="Bench", sets=2, reps=8, rest_time=2, note=None)

print(show_workouts())

