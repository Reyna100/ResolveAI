from pathlib import Path
from io import BytesIO
import asyncio
import os
import tempfile
import traceback

import joblib
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from faster_whisper import WhisperModel
from pydantic import BaseModel, Field

# Load environment variables from ai-service/.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# ResolveAI AI service
app = FastAPI(
    title="ResolveAI ML and Speech Service",
    description="Complaint classification and local multilingual voice transcription with faster-whisper",
    version="2.0.0"
)

# Model location
MODEL_PATH = BASE_DIR / "model" / "resolveai_model.pkl"

# Load the trained classifier model
try:
    model = joblib.load(MODEL_PATH)
    print("ResolveAI trained classifier model loaded successfully.")
except Exception as error:
    raise RuntimeError(
        f"Unable to load ResolveAI model: {error}"
    )

# faster-whisper settings
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

whisper_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    global whisper_model
    if whisper_model is None:
        print(
            f"Loading faster-whisper model '{WHISPER_MODEL_SIZE}' "
            f"on {WHISPER_DEVICE} (compute_type={WHISPER_COMPUTE_TYPE})..."
        )
        whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE
        )
        print("faster-whisper model loaded successfully.")
    return whisper_model


# Accepted language names and Whisper language codes
LANGUAGE_CODES = {
    "English": "en",
    "Tamil": "ta",
    "Hindi": "hi"
}

MAX_AUDIO_SIZE = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".m4a",
    ".mp3",
    ".wav",
    ".webm",
    ".mp4",
    ".mpeg",
    ".mpga"
}


class ComplaintRequest(BaseModel):
    complaint_text: str = Field(
        min_length=3,
        max_length=5000
    )


@app.get("/")
def home():
    return {
        "success": True,
        "message": "ResolveAI ML and speech service is running with faster-whisper"
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "model_loaded": model is not None,
        "speech_service": "faster-whisper",
        "speech_model_size": WHISPER_MODEL_SIZE,
        "whisper_device": WHISPER_DEVICE,
        "whisper_loaded": whisper_model is not None
    }


@app.post("/predict")
def predict_complaint(request: ComplaintRequest):
    try:
        complaint = request.complaint_text.strip()

        if not complaint:
            raise HTTPException(
                status_code=400,
                detail="Complaint text cannot be empty"
            )

        prediction = model.predict([complaint])[0]

        category = str(prediction)
        confidence = None

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba([complaint])[0]
            confidence = float(np.max(probabilities))

        return {
            "success": True,
            "category": category,
            "confidence": confidence,
            "model": "ResolveAI trained classifier"
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Prediction error:", str(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to classify the complaint"
        )


def transcribe_with_whisper(
    filename: str,
    audio_bytes: bytes,
    language_code: str
) -> str:
    extension = Path(filename).suffix.lower() or ".m4a"

    # Write audio bytes to temporary file for reliable PyAV/FFmpeg container demuxing (.m4a/.mp3)
    temp_fd, temp_path = tempfile.mkstemp(suffix=extension)
    try:
        with os.fdopen(temp_fd, "wb") as f:
            f.write(audio_bytes)

        model_instance = get_whisper_model()
        segments, info = model_instance.transcribe(
            temp_path,
            language=language_code,
            beam_size=5
        )

        text_parts = [segment.text.strip() for segment in segments if segment.text]
        return " ".join(text_parts).strip()
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.post("/transcribe")
async def transcribe_complaint(
    file: UploadFile = File(...),
    language: str = Form(...)
):
    if language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail="Language must be English, Tamil or Hindi."
        )

    filename = file.filename or "voice-complaint.m4a"
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Upload an M4A, MP3, WAV or WEBM recording."
        )

    try:
        audio_bytes = await file.read(MAX_AUDIO_SIZE + 1)

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded audio file is empty."
            )

        if len(audio_bytes) > MAX_AUDIO_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Audio file is too large. Please record a shorter complaint."
            )

        language_code = LANGUAGE_CODES[language]

        transcript = await asyncio.to_thread(
            transcribe_with_whisper,
            filename,
            audio_bytes,
            language_code
        )

        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="No speech was detected. Please record your complaint again."
            )

        return {
            "success": True,
            "transcript": transcript,
            "language": language,
            "speech_model": f"faster-whisper-{WHISPER_MODEL_SIZE}"
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Speech transcription error:", str(error))
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Speech recognition failed: {str(error)}"
        )

    finally:
        await file.close()
