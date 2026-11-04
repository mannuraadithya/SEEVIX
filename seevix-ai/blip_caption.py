
from transformers import BlipProcessor, BlipForQuestionAnswering
from PIL import Image
import torch
import os

# ==========================================
# SEEVIX - BLIP VISUAL QUESTION ANSWERING
# ==========================================

print("\nLoading SEEVIX BLIP VQA model...")

MODEL_NAME = "Salesforce/blip-vqa-base"

processor = BlipProcessor.from_pretrained(MODEL_NAME)

model = BlipForQuestionAnswering.from_pretrained(MODEL_NAME)

# Select available device
device = "cuda" if torch.cuda.is_available() else "cpu"

model.to(device)
model.eval()

print(f"BLIP VQA loaded successfully on {device}")


# ==========================================
# ASK QUESTIONS ABOUT THE IMAGE
# ==========================================

def ask_image_question(image, question):

    inputs = processor(
        images=image,
        text=question,
        return_tensors="pt"
    ).to(device)

    with torch.inference_mode():

        output = model.generate(
            **inputs,
            max_new_tokens=40,
            num_beams=5
        )

    answer = processor.decode(
        output[0],
        skip_special_tokens=True
    )

    return answer.strip()


# ==========================================
# GENERATE INFORMATIVE DESCRIPTION
# ==========================================

def generate_caption(image_path):

    # Remove quotation marks and extra spaces
    image_path = image_path.strip().strip('"').strip("'")

    # Check whether image exists
    if not os.path.isfile(image_path):
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    print("\nProcessing image with BLIP VQA...")

    # Open image
    image = Image.open(image_path).convert("RGB")

    # Ask multiple questions
    questions = {
        "Image Overview": "What is visible in this photograph?",
        "Visible Issue": "What damage or problem, if any, is visible?",
        "Surface Condition": "What does the road or ground surface look like?",
        "Surroundings": "What objects or surroundings are visible?"
    }

    answers = {}

    for heading, question in questions.items():

        print(f"\nAnalysing: {heading}...")

        try:
            answer = ask_image_question(image, question)

            answers[heading] = answer

            print(f"{heading}: {answer}")

        except Exception as error:

            print(f"Could not answer {heading}: {error}")

            answers[heading] = ""

    # ======================================
    # BUILD FINAL DESCRIPTION
    # ======================================

    description_parts = []

    for heading, answer in answers.items():

        if answer and answer.lower() not in [
            "unknown",
            "none",
            "nothing"
        ]:

            description_parts.append(
                f"{heading}: {answer}."
            )

    if not description_parts:

        return "AI could not generate a reliable description. Please describe the issue manually."

    final_description = " ".join(description_parts)

    print("\nBLIP analysis completed.")

    return final_description


# ==========================================
# TEST BLIP VQA MODEL
# ==========================================

if __name__ == "__main__":

    print("\n========== SEEVIX BLIP VQA TEST ==========")

    image_path = input(
        "\nEnter image path: "
    ).strip()

    try:

        caption = generate_caption(image_path)

        print("\n========== AI RESULT ==========")

        print("\nGenerated Image Description:\n")

        print(caption)

        print("\nBLIP VQA analysis completed successfully!")

    except Exception as error:

        print("\nError:", error)

    print("\n======================================")
