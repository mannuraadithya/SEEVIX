from pathlib import Path

base = Path("dataset/pothole/Pothole detection.v1-seevix-pothole-v1.yolov11")
splits = ["train", "valid", "test"]

errors = []
total_boxes = 0

for split in splits:
    label_dir = base / split / "labels"
    count = 0

    for file in label_dir.glob("*.txt"):
        for line_no, line in enumerate(file.read_text().splitlines(), 1):
            if not line.strip():
                continue

            try:
                values = list(map(float, line.split()))
                if len(values) != 5:
                    raise ValueError("Expected 5 values")

                cls, x, y, w, h = values

                if cls != 0 or not all(0 <= v <= 1 for v in [x, y, w, h]) or w <= 0 or h <= 0:
                    raise ValueError("Invalid class or bounding box")

                count += 1

            except ValueError as e:
                errors.append(f"{file} line {line_no}: {e}")

    total_boxes += count
    print(f"{split.upper()}: {count} valid pothole annotations")

print("\nTOTAL ANNOTATIONS:", total_boxes)
print("ERRORS:", len(errors))

for error in errors[:20]:
    print(error)
