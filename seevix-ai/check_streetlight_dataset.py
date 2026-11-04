
from pathlib import Path

dataset = Path(
    r"dataset/streetlight_detection/Street Lights.v1-seevix-streetlight-v1.yolov8"
)

total_boxes = 0
errors = 0

for split in ["train", "valid", "test"]:
    labels_folder = dataset / split / "labels"
    label_files = list(labels_folder.glob("*.txt"))

    split_boxes = 0
    split_errors = 0

    for file in label_files:
        for line_number, line in enumerate(file.read_text().splitlines(), 1):
            if not line.strip():
                continue

            parts = line.split()

            try:
                values = [float(x) for x in parts]
                class_id = int(values[0])

                valid = (
                    len(values) == 5
                    and values[0] == class_id
                    and class_id == 0
                    and all(0 <= x <= 1 for x in values[1:])
                    and values[3] > 0
                    and values[4] > 0
                )

                if not valid:
                    raise ValueError()

                split_boxes += 1

            except ValueError:
                print(f"ERROR: {file.name}, line {line_number}: {line}")
                split_errors += 1

    print(f"\n{split.upper()}")
    print("Label files:", len(label_files))
    print("Valid boxes:", split_boxes)
    print("Errors:", split_errors)

    total_boxes += split_boxes
    errors += split_errors

print("\nTOTAL VALID BOXES:", total_boxes)
print("TOTAL ERRORS:", errors)
