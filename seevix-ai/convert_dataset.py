from pathlib import Path
import shutil

source = Path("dataset/pothole/Pothole detection.v1-seevix-pothole-v1.yolov11")
target = Path("dataset/pothole_detection_ready")

for split in ["train", "valid", "test"]:
    image_dir = source / split / "images"
    label_dir = source / split / "labels"

    new_image_dir = target / split / "images"
    new_label_dir = target / split / "labels"

    new_image_dir.mkdir(parents=True, exist_ok=True)
    new_label_dir.mkdir(parents=True, exist_ok=True)

    for image in image_dir.iterdir():
        if image.is_file():
            shutil.copy2(image, new_image_dir / image.name)

    converted = 0

    for file in label_dir.glob("*.txt"):
        new_lines = []

        for line in file.read_text().splitlines():
            if not line.strip():
                continue

            values = list(map(float, line.split()))
            cls = int(values[0])
            coords = values[1:]

            if len(coords) == 4:
                x, y, w, h = coords

            elif len(coords) >= 6 and len(coords) % 2 == 0:
                xs = coords[0::2]
                ys = coords[1::2]

                x_min, x_max = min(xs), max(xs)
                y_min, y_max = min(ys), max(ys)

                x = (x_min + x_max) / 2
                y = (y_min + y_max) / 2
                w = x_max - x_min
                h = y_max - y_min

            else:
                raise ValueError(f"Unexpected annotation: {file.name}")

            if not (0 <= x <= 1 and 0 <= y <= 1 and 0 < w <= 1 and 0 < h <= 1):
                raise ValueError(f"Invalid bounding box: {file.name}")

            new_lines.append(
                f"{cls} {x:.8f} {y:.8f} {w:.8f} {h:.8f}"
            )
            converted += 1

        (new_label_dir / file.name).write_text(
            "\n".join(new_lines) + ("\n" if new_lines else "")
        )

    print(f"{split.upper()}: Converted annotations successfully")

print("\nCONVERSION COMPLETED!")
print("Original dataset has not been modified.")
