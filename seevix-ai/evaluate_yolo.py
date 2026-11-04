from ultralytics import YOLO

print("Loading ACTUAL 60-EPOCH SEEVIX MODEL...")

model = YOLO(
    "runs/detect/runs/detect/seevix_runs/pothole_improved/weights/best.pt"
)

print("\nEvaluating on unseen test dataset...")

metrics = model.val(
    data="dataset/pothole_detection_ready/data.yaml",
    split="test",
    imgsz=640,
    batch=4,
    device="cpu",
    plots=True,
    project="runs/detect/seevix_runs",
    name="seevix_final_test"
)

print("\n========== SEEVIX FINAL MODEL RESULTS ==========")
print("Precision:", round(metrics.box.mp, 4))
print("Recall:", round(metrics.box.mr, 4))
print("mAP50:", round(metrics.box.map50, 4))
print("mAP50-95:", round(metrics.box.map, 4))

print("\nEvaluation completed!")