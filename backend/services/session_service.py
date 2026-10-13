#log, start,end,pause sessions
import sqlite3 as sq


def create_sesssions(day_id: int, date:int, notes: str | None = None):
    with sq.connect("../database/main/pulse.db") as db:
        db.execute(
            """
            INSERT INTO sessions(day_id, date, notes)
            VALUES(?, ?, ?)
            """,
            (day_id, date, notes)
        )
        db.commit()

    
