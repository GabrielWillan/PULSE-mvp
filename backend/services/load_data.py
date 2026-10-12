#communicate with workout data + add csv file to database
import sqlite3 as sq

import pandas as pd


#Run load_Dataset once 
def load_dataset():
    df = pd.read_csv("../database/catalog_data/Updated_ExerciseDataset.csv")
    catalog = df[["Exercise_Name", "muscle_gp" ,"Equipment"]].copy()
    rows = catalog.itertuples(index=False, name=None)
    db = sq.connect("../database/main/pulse.db")
    try:
        db.executemany(
            """
            INSERT INTO catalog(name, target, equipment)
            VALUES(?, ?, ?)
            """,
            rows,
        )
        db.commit()
    finally:
        db.close()


#exercises row checker
def show_database():
    db = sq.connect("../database/main/pulse.db")

    cursor = db.execute(
        """ 
        SELECT name, target, equipment FROM catalog;
        """
    )
    
    results = cursor.fetchall()
    db.close()
    return results

load_dataset()
print(show_database()) 