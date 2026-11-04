
from ultralytics import YOLO

model = YOLO(
    "runs/detect/runs/detect/seevix_runs/"
    "streetlight_yolo11n/weights/best.pt"
)

model.predict(
    source=(
        "dataset/streetlight_detection/"
        "Street Lights.v1-seevix-streetlight-v1.yolov8/"
        "test/images"
    ),
    imgsz=640,
    conf=0.25,
    save=True,
    project="runs/detect/seevix_runs",
    name="streetlight_test_predictions"
)

print("Prediction images saved successfully!")
