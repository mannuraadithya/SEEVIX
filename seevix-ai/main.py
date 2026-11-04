
import torch
from transformers import BlipProcessor, BlipForQuestionAnswering
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import joblib
import numpy as np
import base64

from ultralytics import YOLO


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="SEEVIX AI Engine",
    description="AI-powered civic complaint analysis service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# TEXT CLASSIFICATION MODEL
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "complaint_model.pkl"
text_model = joblib.load(MODEL_PATH)


# ==========================================
# POTHOLE YOLO MODEL
# ==========================================

yolo_model = None


def get_yolo_model():
    global yolo_model

    if yolo_model is None:
        print("Loading SEEVIX custom pothole model...")

        model_path = (
            BASE_DIR
            / "runs/detect/runs/detect/seevix_runs/"
            / "pothole_improved/weights/best.pt"
        )

        if not model_path.exists():
            raise FileNotFoundError(
                f"Pothole model not found: {model_path}"
            )

        yolo_model = YOLO(str(model_path))

        print("Custom pothole model loaded successfully!")

    return yolo_model


# ==========================================
# STREETLIGHT YOLO MODEL
# ==========================================

streetlight_model = None


def get_streetlight_model():
    global streetlight_model

    if streetlight_model is None:
        print("Loading SEEVIX Streetlight YOLO11n model...")

        model_path = (
            BASE_DIR
            / "runs/detect/runs/detect/seevix_runs/"
            / "streetlight_yolo11n/weights/best.pt"
        )

        if not model_path.exists():
            raise FileNotFoundError(
                f"Streetlight model not found: {model_path}"
            )

        streetlight_model = YOLO(str(model_path))

        print("Streetlight YOLO11n model loaded successfully!")

    return streetlight_model


# ==========================================
# REQUEST MODEL
# ==========================================

class ComplaintRequest(BaseModel):
    description: str


# ==========================================
# CATEGORY INFORMATION
# ==========================================

CATEGORY_DETAILS = {
    "Roads": {
        "issue_type": "Road Damage",
        "department": "Road Maintenance"
    },
    "Garbage": {
        "issue_type": "Waste Management",
        "department": "Sanitation Department"
    },
    "Water": {
        "issue_type": "Water or Drainage Problem",
        "department": "Water Supply Department"
    },
    "Streetlight": {
        "issue_type": "Streetlight Problem",
        "department": "Electrical Department"
    },
    "Other": {
        "issue_type": "General Civic Issue",
        "department": "Municipal Corporation"
    }
}


# ==========================================
# TEXT CLASSIFICATION
# ==========================================

def analyse_complaint(description):

    prediction = text_model.predict([description])[0]

    probabilities = text_model.predict_proba([description])[0]
    confidence = float(max(probabilities))

    details = CATEGORY_DETAILS[prediction]

    text = description.lower()

    urgent_words = [
        "accident", "dangerous", "emergency",
        "injury", "collapsed", "exposed wire"
    ]

    high_words = [
        "large", "huge", "severe",
        "overflow", "blocked", "major"
    ]

    if any(word in text for word in urgent_words):
        priority = "Urgent"
    elif any(word in text for word in high_words):
        priority = "High"
    else:
        priority = "Medium"

    return {
        "category": prediction,
        "issue_type": details["issue_type"],
        "suggested_priority": priority,
        "department": details["department"],
        "confidence": round(confidence * 100, 2),
        "analysis_type": "TF-IDF + Logistic Regression"
    }


# ==========================================
# HOME API
# ==========================================

@app.get("/")
def home():
    return {
        "application": "SEEVIX AI Engine",
        "status": "Running",
        "message": "Welcome to SEEVIX AI Service"
    }


# ==========================================
# HEALTH API
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "SEEVIX AI Engine",
        "timestamp": datetime.now().isoformat()
    }


# ==========================================
# AI STATUS API
# ==========================================

@app.get("/ai/status")
def ai_status():
    return {
        "ai_engine": "SEEVIX",
        "status": "Running",
        "models": {
            "pothole_detection": "YOLO11n available",
            "streetlight_detection": "YOLO11n available",
            "text_classification": "ML model loaded",
            "image_analysis": "BLIP VQA available",
            "duplicate_detection": "Not loaded",
            "llm_analysis": "Not connected"
        }
    }


# ==========================================
# TEXT CLASSIFICATION API
# ==========================================

@app.post("/ai/classify")
def classify(request: ComplaintRequest):

    if not request.description.strip():
        raise HTTPException(
            status_code=400,
            detail="Complaint description cannot be empty"
        )

    result = analyse_complaint(request.description)

    return {
        "success": True,
        "input": request.description,
        "analysis": result
    }


# ==========================================
# POTHOLE IMAGE DETECTION API
# ==========================================

@app.post("/ai/detect-image")
async def detect_image(file: UploadFile = File(...)):

    if file.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    image_bytes = await file.read()

    try:
        image = Image.open(
            BytesIO(image_bytes)
        ).convert("RGB")

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    try:
        detector = get_yolo_model()

        results = detector.predict(
            source=image,
            conf=0.25,
            verbose=False
        )

        result = results[0]
        detections = []

        if result.boxes is not None:

            for box in result.boxes:

                class_id = int(box.cls.item())
                confidence = float(box.conf.item())

                detections.append({
                    "object": result.names[class_id],
                    "confidence": round(confidence * 100, 2),
                    "bounding_box": [
                        round(float(value), 2)
                        for value in box.xyxy[0].tolist()
                    ]
                })

        annotated = result.plot()
        annotated_rgb = annotated[:, :, ::-1]

        output_image = Image.fromarray(
            np.asarray(annotated_rgb)
        )

        buffer = BytesIO()
        output_image.save(buffer, format="JPEG")

        encoded_image = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")

        return {
            "success": True,
            "model": "Pothole YOLO11n",
            "image_size": {
                "width": image.width,
                "height": image.height
            },
            "total_detections": len(detections),
            "detections": detections,
            "annotated_image": encoded_image
        }

    except Exception as error:
        print("Pothole YOLO detection error:", error)

        raise HTTPException(
            status_code=500,
            detail="Pothole detection failed. Check the AI server terminal."
        )


# ==========================================
# STREETLIGHT DETECTION API
# ==========================================

@app.post("/ai/detect-streetlight")
async def detect_streetlight(file: UploadFile = File(...)):

    if file.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    image_bytes = await file.read()

    try:
        image = Image.open(
            BytesIO(image_bytes)
        ).convert("RGB")

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    try:
        detector = get_streetlight_model()

        results = detector.predict(
            source=image,
            conf=0.25,
            verbose=False
        )

        result = results[0]
        detections = []

        if result.boxes is not None:

            for box in result.boxes:

                class_id = int(box.cls.item())
                confidence = float(box.conf.item())

                detections.append({
                    "object": result.names[class_id],
                    "confidence": round(confidence * 100, 2),
                    "bounding_box": [
                        round(float(value), 2)
                        for value in box.xyxy[0].tolist()
                    ]
                })

        annotated = result.plot()
        annotated_rgb = annotated[:, :, ::-1]

        output_image = Image.fromarray(
            np.asarray(annotated_rgb)
        )

        buffer = BytesIO()
        output_image.save(buffer, format="JPEG")

        encoded_image = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")

        return {
            "success": True,
            "model": "Streetlight YOLO11n",
            "image_size": {
                "width": image.width,
                "height": image.height
            },
            "total_detections": len(detections),
            "detections": detections,
            "annotated_image": encoded_image
        }

    except Exception as error:
        print("Streetlight detection error:", error)

        raise HTTPException(
            status_code=500,
            detail="Streetlight detection failed. Check the AI server terminal."
        )


# ==========================================
# BLIP VQA IMAGE ANALYSIS
# ==========================================

blip_processor = None
blip_model = None


def get_blip_model():
    global blip_processor, blip_model

    if blip_processor is None or blip_model is None:

        print("Loading SEEVIX BLIP VQA model...")

        model_name = "Salesforce/blip-vqa-base"

        blip_processor = BlipProcessor.from_pretrained(
            model_name
        )

        blip_model = BlipForQuestionAnswering.from_pretrained(
            model_name
        )

        blip_model.to("cpu")
        blip_model.eval()

        print("BLIP VQA model loaded successfully!")

    return blip_processor, blip_model


# ==========================================
# BLIP VQA IMAGE ANALYSIS API
# ==========================================

@app.post("/ai/caption-image")
async def caption_image(file: UploadFile = File(...)):

    try:
        if file.content_type not in [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, PNG and WEBP images are allowed"
            )

        image_bytes = await file.read()

        image = Image.open(
            BytesIO(image_bytes)
        ).convert("RGB")

        processor, model = get_blip_model()

        questions = {
            "Image Overview": "What is visible in this photograph?",
            "Visible Issue": "What damage or problem, if any, is visible?",
            "Surface Condition": "What does the road or ground surface look like?",
            "Surroundings": "What objects or surroundings are visible?"
        }

        answers = []

        for heading, question in questions.items():

            inputs = processor(
                images=image,
                text=question,
                return_tensors="pt"
            )

            with torch.inference_mode():

                output = model.generate(
                    **inputs,
                    max_new_tokens=40,
                    num_beams=5
                )

            answer = processor.decode(
                output[0],
                skip_special_tokens=True
            ).strip()

            print(f"{heading}: {answer}")

            if answer and answer.lower() not in [
                "unknown", "none", "nothing"
            ]:
                answers.append(
                    f"{heading}: {answer}."
                )

        if not answers:

            caption = (
                "AI could not generate a reliable description. "
                "Please describe the issue manually."
            )

        else:
            caption = " ".join(answers)

        return {
            "success": True,
            "caption": caption,
            "model": "BLIP VQA Base"
        }

    except HTTPException:
        raise

    except Exception as error:
        print("BLIP VQA error:", error)

        raise HTTPException(
            status_code=500,
            detail="Image analysis failed. Check the AI server terminal."
        )
