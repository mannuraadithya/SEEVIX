
from ultralytics import YOLO

model_path = (
    "runs/detect/runs/detect/seevix_runs/"
    "streetlight_yolo11n/weights/best.pt"
)

data_yaml = (
    "dataset/streetlight_detection/"
    "Street Lights.v1-seevix-streetlight-v1.yolov8/data.yaml"
)

model = YOLO(model_path)

results = model.val(
    data=data_yaml,
    split="test",
    imgsz=640,
    batch=4,
    device="cpu"
)

print("\nSTREETLIGHT MODEL TEST RESULTS")
print("Precision:", results.box.mp)
print("Recall:", results.box.mr)
print("mAP50:", results.box.map50)
print("mAP50-95:", results.box.map)
