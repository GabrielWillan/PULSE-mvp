#create a routine & days 
import sqlite3 as sq


class RoutineCreate:
    DAY_NAMES = (
        "Day1", "Day2", "Day3", "Day4",
        "Day5", "Day6", "Day7",
    )

    def __init__(self, title_name:str, dayname = DAY_NAMES):
        self._database = sq.connect("../database/main/pulse.db")
        self._daynames = dayname
        self.CreateRoutine = self.create_routine(name= title_name)


    def create_routine(self, name: str):
        db = self._database
        cursor = db.execute(
            """
            INSERT INTO routinebase(name)
            VALUES(?)
            """,
            (name, )
        )
        routine_id = cursor.lastrowid
        db.commit() 
        return self.fetch_days(routine_id= routine_id)
    
    
    def fetch_days(self, routine_id: int):
        db = self._database
        for day in self._daynames:
            db.execute(
                """
                INSERT INTO routinedays(routine_id, day_name)
                VALUES(?, ?)
                """,
                (routine_id, day )
            )
        
        db.commit()
    

