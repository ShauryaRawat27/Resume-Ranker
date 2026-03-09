import re
import spacy
from sentence_transformers import SentenceTransformer, util

nlp = spacy.load("en_core_web_sm")
model = SentenceTransformer("all-MiniLM-L6-v2")

SECTION_HEADERS = {
    "summary": ["summary", "objective", "profile"],
    "skills": ["skills", "technical skills", "core skills"],
    "experience": ["experience", "work experience", "internship"],
    "projects": ["projects", "academic projects"],
    "education": ["education"],
}

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\+\.\-\s]", " ", text)

    doc = nlp(text)

    cleaned_tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop
    ]

    return " ".join(cleaned_tokens)


def extract_skills(clean_text, skill_set):
    extracted = set()

    for skill in skill_set:
        if skill in clean_text:
            extracted.add(skill)

    return extracted


def skill_match_percentage(resume_skills, jd_skills):

    if not jd_skills:
        return 0.0, []

    common = resume_skills.intersection(jd_skills)

    score = (len(common) / len(jd_skills)) * 100

    return score, list(common)


def semantic_similarity(resume_text, jd_text):

    embeddings = model.encode(
        [resume_text, jd_text],
        convert_to_tensor=True
    )

    similarity = util.cos_sim(
        embeddings[0],
        embeddings[1]
    ).item()

    return round(similarity * 100, 2)


def analyze_resume(resume_text, job_description, skill_set):

    cleaned_resume = preprocess_text(resume_text)
    cleaned_jd = preprocess_text(job_description)

    resume_skills = extract_skills(cleaned_resume, skill_set)
    jd_skills = extract_skills(cleaned_jd, skill_set)

    skill_match, matched_skills = skill_match_percentage(
        resume_skills,
        jd_skills
    )

    semantic_score = semantic_similarity(
        cleaned_resume,
        cleaned_jd
    )

    final_score = 0.6 * skill_match + 0.4 * semantic_score

    missing_skills = list(jd_skills - resume_skills)

    return {
        "skill_match": skill_match,
        "semantic_score": semantic_score,
        "final_score": round(final_score,2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }