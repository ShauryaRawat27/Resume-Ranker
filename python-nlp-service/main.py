from fastapi import FastAPI
from resume_analyzer import analyze_resume

app = FastAPI()

@app.post("/rank")

def rank_resume(data: dict):

    resume_text = data["resume_text"]
    job_description = data["job_description"]
    skills = data["skills"]

    result = analyze_resume(
        resume_text,
        job_description,
        skills
    )

    return result