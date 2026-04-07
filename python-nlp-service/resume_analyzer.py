import re
import fitz  # PyMuPDF
import spacy
from sentence_transformers import SentenceTransformer, util
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# Known Trusted Providers
# -----------------------------
TRUSTED_PROVIDERS = [
    "aws", "amazon", "google", "microsoft",
    "cisco", "ibm", "oracle", "meta",
    "coursera", "edx", "udacity"
]

VERIFICATION_LINK_HINTS = [
    "credly",
    "badgr",
    "verify",
    "verification",
    "credential",
    "certmetrics",
    "youracclaim",
    "coursera.org/account/accomplishments",
    "edx.org/verified-certificate",
]

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


# -----------------------------
# Step 1: Extract Certifications
# -----------------------------
def extract_certifications(text):
    certs = []
    stop_headers = [
        "summary", "skills", "technical skills", "experience", "projects",
        "education", "extracurricular", "work experience"
    ]
    section_match = re.search(
        r"(?is)\b(certifications|certificates|प्रमाणपत्र)\b[:\s]*(.*?)(?=\n\s*(?:"
        + "|".join(re.escape(header) for header in stop_headers)
        + r")\b|$)",
        text,
    )
    source_text = section_match.group(2) if section_match else text
    lines = [line.strip(" -•\t") for line in source_text.split("\n") if line.strip()]

    for index, line in enumerate(lines):
        line_lower = line.lower()
        if line_lower in ["certifications", "certificates", "प्रमाणपत्र"]:
            continue

        looks_like_cert = any(
            word in line_lower
            for word in ["certified", "certificate", "certification", "credential id", "license id"]
        )

        if not looks_like_cert:
            continue

        parts = [line]
        for next_line in lines[index + 1:index + 3]:
            next_line_lower = next_line.lower()
            if "verification link" in next_line_lower or "credential id" in next_line_lower or "license id" in next_line_lower:
                parts.append(next_line)

        cert_text = " ".join(parts).strip()
        if len(cert_text) <= 280:
            certs.append(cert_text)

    return certs


# -----------------------------
# Step 2: Extract Credential Info
# -----------------------------
def extract_credential_info(text):
    ids = re.findall(r'(?:credential id|license id)[:\s]*([a-zA-Z0-9\-]+)', text.lower())
    links = re.findall(r'https?://\S+', text)
    return ids, links


# -----------------------------
# Step 3: Check Trusted Provider
# -----------------------------
def check_provider(cert_text):
    return any(provider in cert_text.lower() for provider in TRUSTED_PROVIDERS)


# -----------------------------
# Step 4: Validate Links
# -----------------------------
def check_link_validity(url):
    try:
        response = requests.get(url, timeout=5)
        return response.status_code == 200
    except:
        return False


def check_verification_link(url):
    url_lower = url.lower()
    return any(hint in url_lower for hint in VERIFICATION_LINK_HINTS)


# -----------------------------
# Step 5: LLM Validation (Optional but Powerful)
# -----------------------------
def llm_validate(cert_text):

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return "Unknown (No API key)"

    prompt = f"""
Evaluate this certification:

"{cert_text}"

Is it:
- Valid (candidate-specific verification evidence is present)
- Recognized but not verified
- Suspicious
- Unknown

Give 1-line reason.
"""

    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "user", "content": prompt}
        ],
    }

    try:
        response = requests.post(
        OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Resume Ranker",
            },
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return "LLM validation failed"


# -----------------------------
# Step 6: Final Pipeline
# -----------------------------
def validate_certifications(resume_text):

    certs = extract_certifications(resume_text)
    results = []

    for cert in certs:

        ids, links = extract_credential_info(cert)
        provider_ok = check_provider(cert)

        link_ok = any(check_link_validity(link) for link in links) if links else False
        verification_link_ok = any(check_verification_link(link) for link in links) if links else False

        # simple scoring
        score = 0
        if provider_ok:
            score += 30
        if ids:
            score += 20
        if link_ok:
            score += 10
        if verification_link_ok:
            score += 40

        # optional LLM
        llm_result = llm_validate(cert)

        if provider_ok and ids and verification_link_ok:
            verdict = "Likely Valid"
        elif provider_ok or ids or link_ok:
            verdict = "Uncertain"
        else:
            verdict = "Low Credibility"

        results.append({
            "certification": cert,
            "provider_trusted": provider_ok,
            "has_credential_id": bool(ids),
            "link_valid": link_ok,
            "verification_link": verification_link_ok,
            "score": score,
            "verdict": verdict,
            "llm_opinion": llm_result
        })

    return results
# -----------------------------
# Load Models
# -----------------------------
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = spacy.blank("xx")
embedding_model = None


def get_embedding_model():
    global embedding_model

    if embedding_model is None:
        embedding_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    return embedding_model

# -----------------------------
# Section Headers
# -----------------------------
SECTION_HEADERS = {
    "summary": ["summary", "objective", "profile", "सारांश", "उद्देश्य", "प्रोफाइल"],
    "skills": ["skills", "technical skills", "core skills", "कौशल", "तकनीकी कौशल"],
    "experience": ["experience", "work experience", "internship", "employment", "अनुभव"],
    "projects": ["projects", "academic projects", "परियोजनाएं"],
    "education": ["education", "शिक्षा"],
    "certifications": ["certifications", "certificates", "प्रमाणपत्र"],
    "extracurricular": ["extracurricular", "activities", "गतिविधियां"]
}

def generate_resume_coaching_report(context: dict) -> str:
    """
    Generate an ATS-style resume coaching report using an LLM.

    context should include:
    - resume_text
    - job_description
    - matched_skills
    - missing_skills
    - skill_match_score
    - semantic_similarity_score
    - sections_detected
    """

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return "OpenRouter feedback unavailable because OPENROUTER_API_KEY is not set."

    system_prompt = """
You are an expert ATS (Applicant Tracking System) and resume coach.

You receive structured JSON containing:
• resume_text
• job_description
• matched_skills
• missing_skills
• skill_match_score
• semantic_similarity_score
• sections_detected

Rules:
1. Use ONLY the information provided in the JSON.
2. Do NOT invent skills, scores, or experience.
3. Focus on improving ATS compatibility and recruiter impact.
4. Be specific, actionable, and concise.

Write the output in the following sections:

- Overall Summary
- Key Gaps
- Skills Analysis
- Resume Improvements
- ATS Optimization Tips

Guidelines:

• If skill_match_score is low → emphasize missing skills strongly  
• If semantic_similarity_score is low → highlight mismatch in job alignment  
• If sections are missing → suggest adding them (e.g., projects, certifications)  
• Use missing_skills directly to generate improvement suggestions  
• Use matched_skills to highlight strengths  

Tone:
Professional, direct, and constructive (like a senior recruiter).
"""

    user_prompt = f"""Resume Analysis Context:

{json.dumps(context, indent=2)}

Generate the resume coaching report.
"""

    payload = {
        "model": "openai/gpt-4o-mini",  # or any OpenRouter model
        "messages": [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_prompt.strip()},
        ],
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Resume Ranker",
            },
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
    except Exception as e:
        return f"OpenRouter feedback unavailable: {type(e).__name__}"

    data = response.json()
    return data["choices"][0]["message"]["content"]

# -----------------------------
# PDF Extraction
# -----------------------------
def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text("text")
    return text

# -----------------------------
# Fix spaced characters
# -----------------------------
def fix_spaced_characters(text):
    text = re.sub(
        r'(?:\b[a-zA-Z]\b\s*){2,}',
        lambda m: m.group(0).replace(" ", ""),
        text
    )
    return re.sub(r'\s+', ' ', text).strip()

# -----------------------------
# Preprocess text
# -----------------------------
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\u0900-\u097F\+\.\-\s]", " ", text)
    tokens = text.split()
    return " ".join([t for t in tokens if len(t) > 1])

# -----------------------------
# Section Detection
# -----------------------------
def detect_resume_sections_robust(text):
    text_lower = text.lower()
    matches = []

    for section_name, keywords in SECTION_HEADERS.items():
        for keyword in keywords:
            for match in re.finditer(rf"\b{re.escape(keyword)}\b", text_lower):
                matches.append((match.start(), section_name))

    matches.sort()
    sections = {}

    if not matches:
        return {"other": text}

    for i in range(len(matches)):
        start = matches[i][0]
        section_name = matches[i][1]
        end = matches[i + 1][0] if i + 1 < len(matches) else len(text)

        if section_name not in sections:
            sections[section_name] = text[start:end].strip()

    return sections

# -----------------------------
# Skill Extraction
# -----------------------------
def extract_skills(clean_text, skill_set):
    clean_text = " " + clean_text + " "
    extracted = set()

    for skill in skill_set:
        pattern = rf"\b{re.escape(skill.lower())}\b"
        if re.search(pattern, clean_text):
            extracted.add(skill.lower())

    return extracted

# -----------------------------
# Skill Match
# -----------------------------
def skill_match_percentage(resume_skills, jd_skills):
    if not jd_skills:
        return 0.0, set()

    common = resume_skills.intersection(jd_skills)
    percentage = (len(common) / len(jd_skills)) * 100

    return round(percentage, 2), common

# -----------------------------
# Semantic Similarity
# -----------------------------
def semantic_similarity(resume_text, jd_text):
    try:
        model = get_embedding_model()
        embeddings = model.encode([resume_text, jd_text], convert_to_tensor=True)
        similarity = util.cos_sim(embeddings[0], embeddings[1]).item()
    except Exception:
        resume_tokens = set(resume_text.split())
        jd_tokens = set(jd_text.split())

        if not resume_tokens or not jd_tokens:
            return 0.0

        similarity = len(resume_tokens.intersection(jd_tokens)) / len(resume_tokens.union(jd_tokens))

    return round(similarity * 100, 2)

# -----------------------------
# Main Analyzer
# -----------------------------
def analyze_resume(resume_text, jd_text, skill_set):

    skill_set = [s.lower() for s in skill_set]

    resume_text = fix_spaced_characters(resume_text)
    jd_text = fix_spaced_characters(jd_text)

    resume_clean = preprocess_text(resume_text)
    jd_clean = preprocess_text(jd_text)

    sections = detect_resume_sections_robust(resume_text)

    resume_skills = extract_skills(resume_clean, skill_set)
    jd_skills = extract_skills(jd_clean, skill_set)

    skill_score, matched = skill_match_percentage(resume_skills, jd_skills)
    semantic_score = semantic_similarity(resume_clean, jd_clean)
    final_score = round((skill_score * 0.6) + (semantic_score * 0.4), 2)

    missing_skills = jd_skills - resume_skills
    context = {
        "resume_text": resume_text[:6000],
        "job_description": jd_text[:4000],
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing_skills),
        "skill_match_score": skill_score,
        "semantic_similarity_score": semantic_score,
        "sections_detected": list(sections.keys()),
    }
    feedback = generate_resume_coaching_report(context)

    return {
        "sections_detected": list(sections.keys()),
        "resume_skills": sorted(resume_skills),
        "jd_skills": sorted(jd_skills),
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing_skills),
        "skill_match_score": skill_score,
        "semantic_similarity_score": semantic_score,
        "skill_match": skill_score,
        "semantic_score": semantic_score,
        "final_score": final_score,
        "feedback": feedback,
        "certifications": validate_certifications(resume_text),
    }


def analyze_resume_pdf(pdf_path, jd_text, skill_set):
    resume_text = extract_text_from_pdf(pdf_path)
    if not resume_text.strip():
        raise ValueError("No readable text found in PDF")

    result = analyze_resume(resume_text, jd_text, skill_set)
    result["extracted_resume_text"] = resume_text
    return result
