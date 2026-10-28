import sqlite3 as sq

DAY_NAMES = ["Day1", "Day2", "Day3", "Day4", "Day5", "Day6", "Day7"]

class CreateRoutine:
    def __init__(self, title_name:str):
        self._createroutine = self.create_routine(title_name=title_name)

    def create_routine(self, title_name: str, db_path = "database/main/pulse.db"):
        if not title_name:
         raise ValueError("Routine name cannot be empty")
        
        
        with sq.connect(db_path) as db:
            db.execute("PRAGMA foreign_keys = ON")
            
            cursor = db.execute(
                """
                INSERT INTO routinebase(name)
                VALUES(?)
                """,
                (title_name,)
            ) 
            routine_id = cursor.lastrowid
            db.commit()
        
        self.create_routine_days(routine_id= routine_id)
        
        return routine_id

    def create_routine_days(self, routine_id: int, db_path = "database/main/pulse.db"):
        days_id = []
        with sq.connect(db_path) as db:
            db.execute("PRAGMA foreign_keys = ON")
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
        
class FetchRoutine:
    def __init__(self, routine_id:int):
        self._fetchroutine = self.fetch_routine(routine_id= routine_id)
        

    def fetch_routine(self, routine_id: int,db_path = "database/main/pulse.db"):
        with sq.connect(db_path) as db:
            db.execute("PRAGMA foreign_keys = ON")
            routine_result = db.execute(
                """
                SELECT id, name FROM routinebase
                WHERE id = ?
                """,
                (routine_id,)
            ).fetchone()

        days_result = self.fetch_routine_days(routine_id=routine_id)
        
        return {"routine_id": routine_result, "day_names": days_result}
        

    def fetch_routine_days(self, routine_id: int,db_path = "database/main/pulse.db"):
        with sq.connect(db_path) as db:
            db.execute("PRAGMA foreign_keys = ON")
            days = db.execute(
                """
                SELECT id, routine_id, day_name FROM routinedays
                WHERE routine_id = ?
                """,
                (routine_id, )
            ).fetchall()
        
        return days
    

def fetch_all_routines(db_path="database/main/pulse.db"):
    with sq.connect(db_path) as db:
        db.execute("PRAGMA foreign_keys = ON")
        routines = db.execute(
            """
            SELECT id, name 
            FROM routinebase
            """
        ).fetchall()

    return [
        {"id": routine[0], "name": routine[1]}
        for routine in routines
    ]

def delete_routines(routine_id: int):
    db = sq.connect("database/main/pulse.db")
    db.execute("PRAGMA foreign_keys = ON")
    print(db.execute("PRAGMA foreign_keys").fetchone())
    try:
        db.execute(
            """
            DELETE FROM routinebase
            WHERE id = ?
            """,
            (routine_id, )
        )
        db.commit()
    finally:
        db.close()
    
