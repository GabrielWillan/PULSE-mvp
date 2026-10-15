import sqlite3 as sq

DAY_NAMES = ["Day1", "Day2", "Day3", "Day4", "Day5", "Day6", "Day7"]

def create_routine(title_name: str, db_path = "database/main/pulse.db"):
    if not title_name:
     raise ValueError("Routine name cannot be empty")
    
    
    with sq.connect(db_path) as db:
        
        cursor = db.execute(
            """
            INSERT INTO routinebase(name)
            VALUES(?)
            """,
            (title_name,)
        ) 
        routine_id = cursor.lastrowid
        db.commit()
    
    return routine_id


def create_routine_days(routine_id: int, db_path = "database/main/pulse.db"):
    days_id = []
    with sq.connect(db_path) as db:
        for day in DAY_NAMES:
            cursor = db.execute(
                """
                INSERT INTO routinedays(routine_id, day_name)
                VALUES(?, ?)
                """,
                (routine_id, day,)
            )
            days_id.append(cursor.lastrowid)

    
    return days_id
        

def fetch_routine(routine_id: int, db_path = "database/main/pulse.db"):
    with sq.connect(db_path) as db:
        routine_result = db.execute(
            """
            SELECT id FROM routinebase
            WHERE id = ?
            """,
            (routine_id,)
        ).fetchone()
    
    return routine_result
    



def fetch_routine_days(routine_id: int, db_path = "database/main/pulse.db"):
    with sq.connect(db_path) as db:
        days = db.execute(
            """
            SELECT id, routine_id, day_name FROM routinedays
            WHERE routine_id = ?
            """,
            (routine_id, )
        ).fetchall()
    
    return days