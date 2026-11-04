from pathlib import Path

base = Path("dataset/pothole_detection_ready")

total_images = 0
total_labels = 0
total_boxes = 0
errors = []

for split in ["train", "valid", "test"]:
    images = list((base / split / "images").glob("*"))
    labels = list((base / split / "labels").glob("*.txt"))

    image_stems = {p.stem for p in images}
    label_stems = {p.stem for p in labels}

    missing = image_stems - label_stems
    extra = label_stems - image_stems

    boxes = 0

    for file in labels:
        for line_no, line in enumerate(file.read_text().splitlines(), 1):
            if not line.strip():
                continue

            values = line.split()

            try:
                v = list(map(float, values))
                if len(v) != 5:
                    raise ValueError("Not 5 values")

                cls, x, y, w, h = v

                if cls != 0 or not all(0 <= n <= 1 for n in [x, y, w, h]) or w <= 0 or h <= 0:
                    raise ValueError("Invalid bounding box")

                boxes += 1

            except ValueError as e:
                errors.append(f"{file.name}, line {line_no}: {e}")

    total_images += len(images)
    total_labels += len(labels)
    total_boxes += boxes

    print(f"\n{split.upper()}")
    print("Images:", len(images))
    print("Label files:", len(labels))
    print("Bounding boxes:", boxes)
    print("Missing labels:", len(missing))
    print("Extra labels:", len(extra))

    if missing or extra:
        errors.append(f"{split}: image-label mismatch")

print("\n========== FINAL RESULT ==========")
print("Total images:", total_images)
print("Total label files:", total_labels)
print("Total bounding boxes:", total_boxes)
print("Errors:", len(errors))

for error in errors[:20]:
    print(error)

