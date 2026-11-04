from pathlib import Path

base = Path("dataset/pothole/Pothole detection.v1-seevix-pothole-v1.yolov11")

for split in ["train", "valid", "test"]:
    for file in (base / split / "labels").glob("*.txt"):
        for line_no, line in enumerate(file.read_text().splitlines(), 1):
            if not line.strip():
                continue

            try:
                values = list(map(float, line.split()))
                coords = values[1:]

                if len(values) < 7:
                    raise ValueError("Too few coordinates")
                if (len(coords) % 2) != 0:
                    raise ValueError("Unpaired coordinates")
                if values[0] != 0:
                    raise ValueError("Unexpected class ID")
                if any(v < 0 or v > 1 for v in coords):
                    raise ValueError("Coordinate outside 0-1")

            except ValueError as e:
                print(f"{split}/{file.name} | Line {line_no} | {e}")
                print(line[:250])
                print("-" * 50)
