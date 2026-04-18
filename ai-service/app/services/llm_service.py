import logging
from groq import AsyncGroq
from app.config.settings import settings
from app.schemas.request import AnalyzeRequest

logger = logging.getLogger(__name__)

# Single global instance for AsyncGroq connection pooling
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# ---------------- SYSTEM MESSAGES & PROMPTS ----------------
GLOBAL_SYSTEM_PROMPT = """You are J.A.R.V.I.S. 🤖✨ — a smart, friendly API assistant.
STYLE REQUIREMENTS (MANDATORY):
- Return ONLY plain text. Do NOT return JSON, markdown code blocks, or raw objects.
- Keep response between 180-250 words total (not too long, not too brief).
- Use clear section headers separated by ONE empty line.
- Use emojis in section titles and key insights naturally.
- Use bullet points with "•" where appropriate.
- Keep the format clean and visually well-structured.
- Maintain a professional, confident, but friendly tone without dramatic or emotional filler.
"""

ERROR_TRANSLATOR_PROMPT = """Explain the following API error in simple English for a junior developer.
Focus on:
- What happened
- Why it likely happened
- 4-5 practical fix steps
Provide a calm and reassuring explanation. Do not simply repeat the raw error message fully.
"""

# ---------------- CORE SERVICE LOGIC ----------------

async def generate_analysis(req: AnalyzeRequest) -> dict:
    """
    Main orchestrator for generating LLM analysis based on the feature type.
    """
    # 1. Select the content format based on the feature
    user_content = build_user_prompt(req)

    try:
        res = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": GLOBAL_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.5,
            max_tokens=400
        )
        explanation = res.choices[0].message.content
        return {
            "type": req.feature,
            "text": explanation
        }

    except Exception as e:
        logger.error(f"Groq API Error: {str(e)}", exc_info=True)
        # Never expose raw backend internal errors to frontend
        return {
            "type": req.feature,
            "text": "❌ An internal error occurred while connecting to the AI backend. Please try again later."
        }


def build_user_prompt(req: AnalyzeRequest) -> str:
    """
    Constructs the optimized user prompt based on the requested feature.
    """
    error_content = req.response or "No response body provided."
    base_request_info = f"""
Request:
Method: {req.method}
URL: {req.url}
Headers: {req.headers}
Body: {req.body}
Response:
Status Code: {req.status}
Response Body: {error_content}
"""

    if req.feature == "smart_error_translator":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🕵️ What Happened
(explain what happened in simple English for a junior developer)

[EMPTY LINE]

### 🤔 Why It Happened
(explain why it likely happened)

[EMPTY LINE]

### 🛠️ Practical Fixes
• step 1
• step 2

Now explain this error based on these details:
{base_request_info}"""

    elif req.feature == "header_silly_mistakes":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🔍 Header Inspection
(detect missing or empty headers)

[EMPTY LINE]

### 📌 Summary
(no header issues or overview of duplicate/format metadata)

[EMPTY LINE]

### 📝 Corrections
• step 1 (if issues exist)
• step 2

Analyze only for spelling mistakes, wrong capitalization, duplicates, or format issues.
Headers:
{req.headers}"""

    elif req.feature == "retry_recommendation":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🔄 Retry Decision
(Retry or Not and short explanation)

[EMPTY LINE]

### 📌 Reason
(clear explanation of why based on status code and response)

[EMPTY LINE]

### 🚀 Suggestions
• suggested retry method step 1
• step 2

Decide whether this request should be retried based on:
Status Code: {req.status}
Response:
{error_content}"""

    elif req.feature == "api_usage_tips":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 💡 Overview
(overall api usage)

[EMPTY LINE]

### 📌 Summary
(summary of what can be optimized)

[EMPTY LINE]

### 🚀 Tips & Best Practices
• Pagination
• Filtering
• Payload optimization

Analyze this API call and recommend best practices:
{base_request_info}"""

    elif req.feature == "security_judge":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🛡️ Security Audit
(check for missing authentication, exposed keys, HTTP usage, sensitive data leaks, etc)

[EMPTY LINE]

### 📌 Findings
(key security notes)

[EMPTY LINE]

### 🛠️ Recommendations
• fix step 1
• fix step 2

Analyze this API call strictly for security issues:
{base_request_info}"""

    elif req.feature == "advanced_response_time":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### ⚡ Performance Eval
(analyze performance intuitively based on this status snippet)

[EMPTY LINE]

### 🐢 Bottlenecks
(backend vs network guess)

[EMPTY LINE]

### 🚀 Optimization Suggestions
• step 1
• step 2

Analyze for performance:
Status Code: {req.status}"""

    else:
        # Default payload (Root Cause Analysis, missing specific instruction logic, falls back to JARVIS logic)
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🧠 Diagnosis
(explain what happened in 2-3 friendly lines)

[EMPTY LINE]

### 📌 Summary
(short, clear conclusion)

[EMPTY LINE]

### 🚀 Suggestions
• bullet point
• bullet point

Now analyze this API call:
{base_request_info}"""
