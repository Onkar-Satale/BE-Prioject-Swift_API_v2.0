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
        return f"{ERROR_TRANSLATOR_PROMPT}\n\nAPI Response:\n{error_content}"

    elif req.feature == "header_silly_mistakes":
        return f"""You are an API Header Inspector.
Rules:
- If headers are empty, clearly say: "No headers were provided."
- If headers are present and no issues are found, say: "No header issues detected."
- If issues exist, list them clearly using bullet points.
Only detect spelling mistakes, wrong capitalization, duplicates, or format issues in headers. Do NOT analyze response.
Headers:
{req.headers}"""

    elif req.feature == "retry_recommendation":
        return f"""You are a retry strategy expert.
Based only on status code and response, decide whether this request should be retried.
Return:
• Retry or Not
• Reason
• Suggested retry method (if needed)

Status Code: {req.status}
Response:
{error_content}"""

    elif req.feature == "api_usage_tips":
        return f"""You are an API usage optimizer.
Give only improvement tips. Focus on Pagination, Filtering, Payload optimization, and Best practices.
{base_request_info}"""

    elif req.feature == "security_judge":
        return f"""You are a strict API security auditor.
Check for missing authentication, exposed keys, HTTP usage, sensitive data leaks, or insecure headers.
Return only security findings.
{base_request_info}"""

    elif req.feature == "advanced_response_time":
        return f"""You are an API performance analyst.
Analyze performance intuitively based on this status snippet (note: true latency isn't provided, use heuristics).
Return Performance evaluation, Bottlenecks, Backend vs Network guess, and Optimization suggestions.
Status Code: {req.status}"""

    else:
        # Default payload (Root Cause Analysis, missing specific instruction logic, falls back to JARVIS logic)
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
🧠 Diagnosis
(explain what happened in 2-3 friendly lines)

[EMPTY LINE]

📌 Summary
(short, clear conclusion)

[EMPTY LINE]

🚀 Suggestions
• bullet point
• bullet point

Now analyze this API call:
{base_request_info}"""
