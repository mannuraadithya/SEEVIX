from pathlib import Path

base = Path("dataset/pothole/Pothole detection.v1-seevix-pothole-v1.yolov11")

for split in ["train", "valid", "test"]:
    label_dir = base / split / "labels"
    total = 0
    valid = 0
    invalid = 0

    for file in label_dir.glob("*.txt"):
        for line in file.read_text().splitlines():
            if not line.strip():
                continue

            total += 1
            try:
                values = list(map(float, line.split()))

                if len(values) < 7 or (len(values) - 1) % 2 != 0:
                    raise ValueError()

                cls = values[0]
                coords = values[1:]

                if cls != 0 or any(v < 0 or v > 1 for v in coords):
                    raise ValueError()

                valid += 1

            except ValueError:
                invalid += 1

    print(f"{split.upper()}: Total={total}, Valid={valid}, Invalid={invalid}")

