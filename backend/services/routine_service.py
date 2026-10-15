import sqlite3 as sq


def create_routine(title_name: str, db_path = "../database/main/pulse.db"):
    with sq.connect(db_path) as db:

        cursor = db.execute(
            """
            INSERT INTO routinebase(name)
            VALUES(?)
            """,
            (title_name,)
        )

        if not title_name:
            raise ValueError("Routine name cannot be empty")
    
        routine_id = cursor.lastrowid
        db.commit()
    
    return routine_id


def create_routine_days(routine_id: int):
    # Insert the seven days
    ...


def fetch_routine(routine_id: int):
    # Retrieve the routine
    ...


def fetch_routine_days(routine_id: int):
    # Retrieve its associated days
    ...