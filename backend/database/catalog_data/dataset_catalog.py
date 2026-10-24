
import pandas as pd

df = pd.read_csv("ExercisesDataset.csv")

df = df[["Exercise_Name", "muscle_gp", "*Equipment*"]].copy()

df = df.sort_values(
    "Exercise_Name",
    key=lambda names: names.str.casefold(),
    na_position="last",
).reset_index(drop=True)

df = df.fillna("NONE")

df.to_csv("Updated_ExerciseDataset.csv", index=False)
