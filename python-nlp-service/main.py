import json
import os
import tempfile
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from resume_analyzer import analyze_resume, analyze_resume_pdf

load_dotenv()

app = FastAPI()


def parse_skills(skills: Any) -> list[str]:
    if isinstance(skills, list):
        return [str(skill).strip() for skill in skills if str(skill).strip()]

    if isinstance(skills, str):
        try:
            parsed = json.loads(skills)
            if isinstance(parsed, list):
                return [str(skill).strip() for skill in parsed if str(skill).strip()]
        except json.JSONDecodeError:
            pass

        return [skill.strip() for skill in skills.split(",") if skill.strip()]

    return []


@app.post("/rank")
def rank_resume(data: dict):
    try:
        resume_text = data["resume_text"]
        job_description = data["job_description"]
        skills = parse_skills(data["skills"])

        return analyze_resume(resume_text, job_description, skills)
    except KeyError as error:
        raise HTTPException(status_code=400, detail=f"Missing field: {error.args[0]}") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/rank-pdf")
async def rank_resume_pdf(
    resume_pdf: UploadFile = File(...),
    job_description: str = Form(...),
    skills: str = Form(...),
):
    if resume_pdf.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    temp_path = ""

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await resume_pdf.read())
            temp_path = temp_file.name

        return analyze_resume_pdf(temp_path, job_description, parse_skills(skills))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
