import sqlite3 as sq

def create_workout(day_id:int, name:str, sets:int, reps:int, rest_time:int, note: str | None = None, db_path = "../database/main/pulse.db"):
    db = sq.connect(db_path)
    