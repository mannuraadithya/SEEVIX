import pandas as pd

files = [
    "runs/detect/seevix_runs/pothole_fast/results.csv",
    "runs/detect/seevix_runs/pothole_v1-2/results.csv"
]

for file in files:
    df = pd.read_csv(file)

    print("\n" + "=" * 60)
    print("MODEL:", file)
    print("=" * 60)

    print("Total epochs:", len(df))

    print("\nLast 5 training epochs:")
    print(df.tail(5).to_string(index=False))