"""
Groq LLM Integration Service
Manages system prompts, dynamic user prompt generation per feature,
async calls to Groq with model fallback (qwen/qwen3.8-27b, groq/compound, openai/gpt-oss-120b),
History-Grounded RAG retrieval, Root Cause Prediction, History Comparison, and API Health Scoring.
"""

import json
import re
from typing import Dict, Any, List
from groq import AsyncGroq
from app.config.settings import settings, logger
from app.schemas.request import (
    AnalyzeRequest,
    BotRequest,
    FailureAssistRequest,
    CompareRequest,
    HealthScoreRequest,
    IndexEpisodeRequest,
    RetrieveEpisodesRequest
)
from app.services.rag_service import rag_memory_store

# Shared Groq async client instance
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# Supported active Groq models in prioritized order for minimum latency
ACTIVE_MODELS = [
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
    "qwen/qwen3.8-27b",
    "groq/compound",
    "openai/gpt-oss-120b"
]

async def call_groq_with_fallback(
    messages: List[Dict[str, str]],
    temperature: float = 0.2,
    max_tokens: int = 500,
    is_json: bool = False
) -> str:
    """
    Executes high-speed chat completion with Groq using automatic fallback across active models.
    """
    last_err = None
    for model_name in ACTIVE_MODELS:
        try:
            kwargs = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if is_json:
                kwargs["response_format"] = {"type": "json_object"}

            res = await groq_client.chat.completions.create(**kwargs)
            content = res.choices[0].message.content
            if content and content.strip():
                return content
        except Exception as e:
            logger.warning(f"Groq call with model '{model_name}' failed: {e}. Trying next fallback...")
            last_err = e
            continue

    raise last_err or RuntimeError("All Groq model fallbacks failed.")

# ---------------- SYSTEM MESSAGES & PROMPTS (V1) ----------------
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

BOT_SYSTEM_PROMPT = """
You are J.A.R.V.I.S. 🤖 — an expert API Testing and Backend Development assistant.

Your purpose is to help developers understand, test, debug, and build APIs. Your explanations should be beginner-friendly while remaining technically accurate.

==================================================
PRIMARY ROLE
==================================================

You ONLY assist with topics related to:

• API Testing
• REST APIs
• HTTP Protocol
• HTTP Methods (GET, POST, PUT, PATCH, DELETE, etc.)
• Headers
• Query Parameters
• Path Parameters
• Request Body
• Response Body
• JSON
• XML
• Authentication (JWT, OAuth, API Keys, Bearer Tokens)
• Cookies
• Sessions
• CORS
• Status Codes
• Backend Development
• Express.js
• Node.js
• Python APIs
• FastAPI
• Flask
• Django REST
• Spring Boot APIs
• ASP.NET APIs
• API Security
• Validation
• Error Handling
• API Design
• Swift API
• cURL
• fetch()
• Axios
• Python requests
• API Documentation
• API Debugging
• Request/Response Structures

If a question is outside these topics, politely refuse.

Never answer unrelated questions.

==================================================
TONE
==================================================

Be:
• Friendly
• Supportive
• Encouraging
• Professional
• Patient

Teach like you're helping a junior developer.
Use emojis naturally but sparingly.

==================================================
RESPONSE STYLE
==================================================

Keep responses concise.
Default length: 2–6 short paragraphs. Use simple English.
"""

# ---------------- CORE SERVICE LOGIC (V1) ----------------

async def generate_analysis(req: AnalyzeRequest) -> dict:
    """
    Constructs feature-specific user prompt and sends async request to Groq LLM API (V1).
    """
    user_content = build_user_prompt(req)

    try:
        explanation = await call_groq_with_fallback(
            messages=[
                {"role": "system", "content": GLOBAL_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.5,
            max_tokens=400
        )

        return {
            "type": req.feature,
            "text": explanation
        }
    except Exception as e:
        logger.error(f"Groq API Error: {str(e)}", exc_info=True)
        return {
            "type": req.feature,
            "text": "❌ An internal error occurred while connecting to the AI backend. Please try again later."
        }

def build_user_prompt(req: AnalyzeRequest) -> str:
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

async def generate_bot_response(req: BotRequest) -> dict:
    context_str = ""

    if req.currentApiContext:
        ctx = req.currentApiContext
        context_str = (
            f"\n\nCurrent API Context Details:\n"
            f"- Method: {ctx.get('method', 'N/A')}\n"
            f"- URL: {ctx.get('url', 'N/A')}\n"
            f"- Status Code: {ctx.get('status', 'N/A')}\n"
            f"- Headers: {ctx.get('headers', 'N/A')}\n"
            f"- Request Body: {ctx.get('body', 'N/A')}\n"
            f"- Response Body: {ctx.get('response', 'N/A')}\n"
        )

    user_content = f"User Message: {req.message}{context_str}"
    messages = [{"role": "system", "content": BOT_SYSTEM_PROMPT}]

    if req.requestHistory:
        for msg in req.requestHistory:
            from_user = msg.get("from")
            text = msg.get("text") or ""
            if text and ("Hi 👋" not in text and "API assistant" not in text):
                role = "user" if from_user == "user" else "assistant"
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_content})

    try:
        explanation = await call_groq_with_fallback(
            messages=messages,
            temperature=0.5,
            max_tokens=500
        )

        return {
            "type": "bot_response",
            "text": explanation
        }
    except Exception as e:
        logger.error(f"Groq API Chat Bot Error: {str(e)}", exc_info=True)
        return {
            "type": "bot_response",
            "text": "❌ An error occurred while generating a response. Please try again."
        }


# ============================================================================
# 🔹 V2: HISTORY-GROUNDED RAG FAILURE ASSISTANT & AUTO-FIX
# ============================================================================

RAG_FAILURE_SYSTEM_PROMPT = """You are SwiftAPI's History-Grounded Diagnostics & Failure Engine 🤖🛠️.
Your role is to diagnose failed HTTP requests (4xx, 5xx, or network errors), predict the backend failure layer, and produce an actionable auto-fix grounded in real historical evidence retrieved via RAG.

GROUNDING & EVIDENCE RULES:
1. Review the "RETRIEVED HISTORICAL EPISODES (RAG)" section. If matching episodes exist, cite the precedent and adopt the proven fix.
2. NEVER fabricate dates or timestamps. Only reference real retrieved episodes.

AUTO-FIX MANDATORY RULE:
You MUST ALWAYS generate an actionable autoFix object with `"fixable": true` for EVERY failure:
- If URL has a typo or invalid format (e.g. decimal ID /posts/20.5 -> /posts/20, or /commentss -> /comments): set "fixType": "url", "actionPayload": {"type": "set_url", "key": "url", "value": "<corrected_url>"}.
- If 401 Unauthorized: set "fixType": "auth", "actionPayload": {"type": "set_auth", "authType": "bearer", "requiresUserInput": true, "userInputPrompt": "Enter Bearer Token"}.
- If 405 Method Not Allowed: set "fixType": "method", "actionPayload": {"type": "change_method", "value": "GET"}.
- If 400 Bad Request / Invalid Body: set "fixType": "body", "actionPayload": {"type": "fix_body", "value": "{}"}.
- If Missing Header: set "fixType": "header", "actionPayload": {"type": "add_header", "key": "Content-Type", "value": "application/json"}.

You MUST output ONLY valid JSON matching this exact structure (NO markdown codeblocks, NO extra text):
{
  "whatHappened": "Clear, concise 1-2 sentence description of the failure.",
  "why": "Explanation of the root cause mechanism.",
  "evidence": ["Evidence point 1 from status/headers/body", "Evidence point 2"],
  "whatToDo": ["Action step 1", "Action step 2"],
  "rootCause": {
    "predictedLayer": "Database | JWT / Authentication | Authorization | Validation | Server / Business Logic | External Service | Network | Configuration",
    "confidence": 85,
    "probableCause": "Concise summary of the probable cause within this backend layer",
    "evidenceSummary": "Specific signals supporting this layer prediction",
    "nextAction": "Recommended backend or client action to resolve",
    "isPrediction": true
  },
  "autoFix": {
    "fixable": true,
    "fixType": "url | header | auth | body | param | method",
    "title": "Short title of fix (e.g. Correct URL Route or Add Authorization Header)",
    "description": "What this fix will change in the request",
    "confirmationPrompt": "Should I update the URL to the correct endpoint?",
    "diff": "- https://example.com/typo\n+ https://example.com/correct",
    "actionPayload": {
      "type": "set_url | add_header | update_header | set_auth | fix_body | set_param | change_method",
      "key": "url",
      "value": "https://example.com/correct",
      "requiresUserInput": false,
      "userInputPrompt": "",
      "userInputDefault": ""
    }
  },
  "historyEvolutionInsight": "Explanation of how this attempt compares with past history or retrieved RAG episodes."
}
"""

def extract_json_from_llm(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return {}

async def generate_failure_diagnosis(req: FailureAssistRequest) -> dict:
    """
    Executes automated failure diagnosis grounded with RAG-retrieved historical episodes.
    """
    # 1. RAG Vector Retrieval: Retrieve top-k matching historical episodes
    error_str = str(req.response or "")
    headers_keys = list(req.headers.keys()) if isinstance(req.headers, dict) else []
    
    retrieved_episodes = rag_memory_store.retrieve_relevant_episodes(
        user_id=req.userId or "guest",
        method=req.method,
        url=req.url,
        status=req.status,
        error_text=error_str,
        headers_keys=headers_keys,
        top_k=2
    )

    rag_context_str = ""
    if retrieved_episodes:
        rag_context_str = "\n=== RETRIEVED HISTORICAL EPISODES (RAG MEMORY) ===\n"
        for idx, ep in enumerate(retrieved_episodes):
            rag_context_str += (
                f"Episode #{idx+1} (Match Score: {ep['matchPercentage']}% | Timestamp: {ep['timestamp']}):\n"
                f"- Endpoint: {ep['endpoint']}\n"
                f"- Failed Status: {ep['failedStatus']} | Previous Error: {ep['previousError']}\n"
                f"- Root Cause Layer: {ep['rootCauseLayer']}\n"
                f"- Verified Successful Fix Used: {json.dumps(ep['successfulFixUsed'])}\n"
                f"- Resolved To: Status {ep['resultStatus']} in {ep.get('resultDuration', 0)}ms\n\n"
            )
    else:
        rag_context_str = "\n=== RETRIEVED HISTORICAL EPISODES (RAG MEMORY) ===\nNo prior matching failure episodes found in memory for this endpoint pattern.\n"

    # Add previous attempts from active session
    prev_attempts_str = ""
    if req.previousAttempts and len(req.previousAttempts) > 0:
        prev_attempts_str = f"\nRecent Active Session Attempts:\n"
        for idx, att in enumerate(req.previousAttempts[-3:]):
            prev_attempts_str += f"Attempt {idx+1}: Status {att.get('status')} | Duration {att.get('duration')}ms | Time {att.get('time')}\n"

    user_prompt = f"""
Diagnose this failed API request using the grounded RAG history:

CURRENT FAILED REQUEST:
Method: {req.method}
URL: {req.url}
Headers: {json.dumps(req.headers or {})}
Params: {json.dumps(req.params or {})}
Body: {json.dumps(req.body) if req.body else 'None'}
Status Code: {req.status}
Duration: {req.duration}ms
Response Body: {json.dumps(req.response) if isinstance(req.response, (dict, list)) else str(req.response or '')}
{prev_attempts_str}
{rag_context_str}
"""

    try:
        content = await call_groq_with_fallback(
            messages=[
                {"role": "system", "content": RAG_FAILURE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=550,
            is_json=True
        )
        diagnosis_data = extract_json_from_llm(content)

        if not diagnosis_data or "whatHappened" not in diagnosis_data:
            status_num = int(req.status) if str(req.status).isdigit() else 500
            layer = "JWT / Authentication" if status_num == 401 else ("Authorization" if status_num == 403 else ("Validation" if status_num == 400 else "Server / Business Logic"))
            
            diagnosis_data = {
                "whatHappened": f"The request failed with status {req.status}.",
                "why": f"The target server rejected the request in the {layer} layer.",
                "evidence": [f"Status code: {req.status}", f"Target URL: {req.url}"],
                "whatToDo": ["Review headers and authentication parameters."],
                "rootCause": {
                    "predictedLayer": layer,
                    "confidence": 85,
                    "probableCause": f"Status {req.status} indicates an issue in the {layer} layer.",
                    "evidenceSummary": f"HTTP status code {req.status}",
                    "nextAction": "Review headers and authentication parameters.",
                    "isPrediction": True
                }
            }

        # Ensure autoFix is ALWAYS populated and actionable
        auto_fix = diagnosis_data.get("autoFix")
        if not auto_fix or not auto_fix.get("fixable") or not auto_fix.get("actionPayload"):
            status_num = int(req.status) if str(req.status).isdigit() else 500
            url_str = req.url or ""
            decimal_match = re.search(r"\/(\d+)\.\d+", url_str)

            if decimal_match:
                corrected_url = re.sub(r"\/(\d+)\.\d+", r"/\1", url_str)
                diagnosis_data["autoFix"] = {
                    "fixable": True,
                    "fixType": "url",
                    "title": "Correct Resource ID to Integer",
                    "description": f"Convert decimal ID in URL to valid integer ({decimal_match.group(1)})",
                    "confirmationPrompt": f"Should I update the URL to '{corrected_url}'?",
                    "diff": f"- {url_str}\n+ {corrected_url}",
                    "actionPayload": {
                        "type": "set_url",
                        "key": "url",
                        "value": corrected_url
                    }
                }
            elif retrieved_episodes and retrieved_episodes[0].get("successfulFixUsed"):
                rec_fix = retrieved_episodes[0]["successfulFixUsed"]
                act_payload = rec_fix.get("actionPayload") or {}
                diagnosis_data["autoFix"] = {
                    "fixable": True,
                    "fixType": rec_fix.get("fixType") or act_payload.get("type", "url"),
                    "title": rec_fix.get("title") or "Apply Verified Historical Fix",
                    "description": rec_fix.get("description") or "Apply proven fix retrieved from RAG memory.",
                    "confirmationPrompt": "Should I apply the proven fix from history?",
                    "diff": rec_fix.get("diff") or f"+ Fix applied from past run",
                    "actionPayload": act_payload or {
                        "type": "set_url",
                        "key": "url",
                        "value": act_payload.get("value", url_str)
                    }
                }
            elif status_num == 401:
                diagnosis_data["autoFix"] = {
                    "fixable": True,
                    "fixType": "auth",
                    "title": "Configure Bearer Token",
                    "description": "Add Authorization Bearer token to authorize this request.",
                    "confirmationPrompt": "Should I configure Authorization for you?",
                    "diff": "+ Authorization: Bearer <token>",
                    "actionPayload": {
                        "type": "set_auth",
                        "authType": "bearer",
                        "requiresUserInput": True,
                        "userInputPrompt": "Enter Bearer Token",
                        "userInputDefault": ""
                    }
                }
            elif status_num == 404 and ("commentss" in url_str or "postss" in url_str or "todoss" in url_str):
                corrected_url = url_str.replace("commentss", "comments").replace("postss", "posts").replace("todoss", "todos")
                diagnosis_data["autoFix"] = {
                    "fixable": True,
                    "fixType": "url",
                    "title": "Correct URL Route Typo",
                    "description": "Fixed trailing plural typo in endpoint URL path.",
                    "confirmationPrompt": f"Should I update the URL to '{corrected_url}'?",
                    "diff": f"- {url_str}\n+ {corrected_url}",
                    "actionPayload": {
                        "type": "set_url",
                        "key": "url",
                        "value": corrected_url
                    }
                }
            else:
                next_act = diagnosis_data.get("rootCause", {}).get("nextAction") or "Review request parameters."
                diagnosis_data["autoFix"] = {
                    "fixable": True,
                    "fixType": "url",
                    "title": "Apply Suggested Configuration Fix",
                    "description": next_act,
                    "confirmationPrompt": "Should I apply this fix to the workspace?",
                    "diff": f"Action: {next_act}",
                    "actionPayload": {
                        "type": "set_url",
                        "key": "url",
                        "value": url_str
                    }
                }

        return {
            "success": True,
            "diagnosis": diagnosis_data,
            "retrievedEpisodes": retrieved_episodes
        }

    except Exception as e:
        logger.error(f"Error generating failure diagnosis: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "diagnosis": {
                "whatHappened": f"Request failed with status {req.status}.",
                "why": "Unable to connect with AI diagnostics service.",
                "evidence": [f"Status code {req.status}"],
                "whatToDo": ["Inspect headers and body parameters manually."],
                "rootCause": {
                    "predictedLayer": "Server / Business Logic",
                    "confidence": 70,
                    "probableCause": "Backend error response received.",
                    "evidenceSummary": f"Status: {req.status}",
                    "nextAction": "Check API logs.",
                    "isPrediction": True
                },
                "autoFix": {
                    "fixable": False,
                    "title": "Manual Review Needed",
                    "description": "Please review the request configuration."
                }
            },
            "retrievedEpisodes": retrieved_episodes
        }


# ============================================================================
# 🔹 V2: HISTORY-AWARE COMPARISON & API HEALTH SCORE
# ============================================================================

COMPARE_SYSTEM_PROMPT = """You are SwiftAPI's History-Aware Comparison Engine 🤖⚖️.
Your role is to compare two execution attempts (Attempt A vs Attempt B) of an API request, identify every key difference, and explain WHY the outcome changed.

You MUST return ONLY valid JSON:
{
  "statusComparison": {
    "attemptAStatus": "401",
    "attemptBStatus": "200",
    "statusChanged": true,
    "summary": "Outcome improved from 401 Unauthorized to 200 OK."
  },
  "timingComparison": {
    "attemptADuration": 450,
    "attemptBDuration": 120,
    "differenceMs": -330,
    "insight": "Attempt B was 330ms faster."
  },
  "detectedChanges": [
    {
      "field": "Headers / Authorization",
      "attemptA": "Missing",
      "attemptB": "Bearer token included",
      "impact": "Crucial: Provided required authentication."
    }
  ],
  "aiExplanation": "Clear, developer-friendly 2-3 paragraph explanation of why the two attempts had different results."
}
"""

def truncate_val_for_prompt(val, max_len=400):
    if val is None:
        return "None"
    if isinstance(val, list):
        if len(val) > 2:
            return f"[{len(val)} items, sample: {json.dumps(val[0])[:150]}...]"
        return json.dumps(val)[:max_len]
    if isinstance(val, dict):
        dumped = json.dumps(val)
        return dumped[:max_len] + ("..." if len(dumped) > max_len else "")
    s = str(val)
    return s[:max_len] + ("..." if len(s) > max_len else "")

async def generate_history_comparison(req: CompareRequest) -> dict:
    user_prompt = f"""
Compare these two API execution attempts:

--- ATTEMPT A ---
Method: {req.attemptA.get('method')}
URL: {req.attemptA.get('url')}
Status: {req.attemptA.get('status')}
Duration: {req.attemptA.get('duration')}ms
Headers: {truncate_val_for_prompt(req.attemptA.get('headers', {}))}
Params: {truncate_val_for_prompt(req.attemptA.get('params', {}))}
Body: {truncate_val_for_prompt(req.attemptA.get('body', {}))}
Response: {truncate_val_for_prompt(req.attemptA.get('response'))}

--- ATTEMPT B ---
Method: {req.attemptB.get('method')}
URL: {req.attemptB.get('url')}
Status: {req.attemptB.get('status')}
Duration: {req.attemptB.get('duration')}ms
Headers: {truncate_val_for_prompt(req.attemptB.get('headers', {}))}
Params: {truncate_val_for_prompt(req.attemptB.get('params', {}))}
Body: {truncate_val_for_prompt(req.attemptB.get('body', {}))}
Response: {truncate_val_for_prompt(req.attemptB.get('response'))}
"""

    # Build intelligent fallback diff in case LLM is overloaded
    status_a = str(req.attemptA.get('status', 'ERR'))
    status_b = str(req.attemptB.get('status', 'ERR'))
    url_a = req.attemptA.get('url', '')
    url_b = req.attemptB.get('url', '')
    dur_a = int(req.attemptA.get('duration') or 0)
    dur_b = int(req.attemptB.get('duration') or 0)

    changes = []
    if url_a != url_b:
        changes.append({
            "field": "URL Endpoint",
            "attemptA": url_a,
            "attemptB": url_b,
            "impact": "Crucial: Fixed incorrect route path or endpoint typo."
        })
    if req.attemptA.get('method') != req.attemptB.get('method'):
        changes.append({
            "field": "HTTP Method",
            "attemptA": str(req.attemptA.get('method')),
            "attemptB": str(req.attemptB.get('method')),
            "impact": "Adjusted HTTP method for the endpoint."
        })
    
    diff_ms = dur_b - dur_a
    time_insight = f"Attempt B was {abs(diff_ms)}ms {'faster' if diff_ms < 0 else 'slower'} than Attempt A."
    
    status_summary = f"Outcome transitioned from status {status_a} to {status_b}."
    if status_a != "200" and status_b == "200":
        status_summary = f"Resolution verified: Successfully fixed status {status_a} error to 200 OK."

    explanation = f"In Attempt A, the request returned HTTP {status_a} on '{url_a}'. In Attempt B, the request was executed with '{url_b}' returning HTTP {status_b}. The key difference was resolving the endpoint configuration, resulting in a successful response payload."
    
    fallback_data = {
        "statusComparison": {
            "attemptAStatus": status_a,
            "attemptBStatus": status_b,
            "statusChanged": status_a != status_b,
            "summary": status_summary
        },
        "timingComparison": {
            "attemptADuration": dur_a,
            "attemptBDuration": dur_b,
            "differenceMs": diff_ms,
            "insight": time_insight
        },
        "detectedChanges": changes,
        "aiExplanation": explanation
    }

    try:
        content = await call_groq_with_fallback(
            messages=[
                {"role": "system", "content": COMPARE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=450,
            is_json=True
        )
        data = extract_json_from_llm(content)
        if data and "aiExplanation" in data:
            return {
                "success": True,
                "comparison": data
            }
        return {
            "success": True,
            "comparison": fallback_data
        }
    except Exception as e:
        logger.error(f"Error in history comparison: {str(e)}", exc_info=True)
        return {
            "success": True,
            "comparison": fallback_data
        }

def compute_measurable_health_score(req: HealthScoreRequest) -> dict:
    deductions = []
    recommendations = []
    
    # 1. SECURITY (20 pts max)
    sec_score = 20
    is_https = req.url.lower().startswith("https://")
    if not is_https:
        sec_score -= 8
        deductions.append({"category": "Security", "points": -8, "reason": "Request sent over unencrypted HTTP protocol instead of HTTPS."})
        recommendations.append("Enforce HTTPS on all API endpoints to encrypt transit data.")
    
    url_lower = req.url.lower()
    if any(k in url_lower for k in ["token=", "password=", "secret=", "apikey=", "api_key="]):
        sec_score -= 6
        deductions.append({"category": "Security", "points": -6, "reason": "Sensitive credentials detected in URL query parameters."})
        recommendations.append("Move secrets and tokens from URL query strings into Authorization headers.")

    has_auth = False
    if req.headers and isinstance(req.headers, dict):
        has_auth = any(k.lower() == "authorization" for k in req.headers.keys())
    if not has_auth and req.method.upper() in ["POST", "PUT", "PATCH", "DELETE"]:
        sec_score -= 4
        deductions.append({"category": "Security", "points": -4, "reason": "State-mutating request sent without an Authorization header."})
        recommendations.append("Secure mutating endpoints with JWT or API Key authorization.")
    
    sec_score = max(0, min(20, sec_score))

    # 2. PERFORMANCE (20 pts max)
    perf_score = 20
    duration = req.duration or 0
    if duration <= 250:
        perf_score = 20
    elif duration <= 600:
        perf_score = 16
        deductions.append({"category": "Performance", "points": -4, "reason": f"Response latency is moderate ({duration} ms). Target is < 250 ms."})
    elif duration <= 1200:
        perf_score = 11
        deductions.append({"category": "Performance", "points": -9, "reason": f"Response latency is slow ({duration} ms). Target is < 250 ms."})
        recommendations.append("Optimize backend query execution, database indexes, or introduce caching.")
    elif duration <= 2500:
        perf_score = 6
        deductions.append({"category": "Performance", "points": -14, "reason": f"Response latency is critical ({duration} ms)."})
        recommendations.append("Investigate backend bottleneck, unoptimized database joins, or network hop delays.")
    else:
        perf_score = 2
        deductions.append({"category": "Performance", "points": -18, "reason": f"Response took excessive time ({duration} ms)."})
        recommendations.append("Implement async background jobs or pagination to avoid huge synchronous payloads.")

    # 3. DOCUMENTATION & SPECS (20 pts max)
    doc_score = 20
    headers_dict = req.headers if isinstance(req.headers, dict) else {}
    has_content_type = any(k.lower() == "content-type" for k in headers_dict.keys())
    has_accept = any(k.lower() == "accept" for k in headers_dict.keys())
    
    if req.method.upper() in ["POST", "PUT", "PATCH"] and not has_content_type:
        doc_score -= 8
        deductions.append({"category": "Documentation", "points": -8, "reason": "Missing 'Content-Type' header on payload request."})
        recommendations.append("Explicitly declare 'Content-Type: application/json' in request headers.")
        
    if not has_accept:
        doc_score -= 4
        deductions.append({"category": "Documentation", "points": -4, "reason": "Missing 'Accept' header for explicit content negotiation."})
        recommendations.append("Include 'Accept: application/json' header to ensure consistent response formatting.")

    if "_" in req.url.split("?")[0] or "%20" in req.url:
        doc_score -= 4
        deductions.append({"category": "Documentation", "points": -4, "reason": "URL path contains underscores or encoded spaces; violates REST naming conventions."})
        recommendations.append("Use lowercase kebab-case (hyphens) for RESTful API endpoint paths.")
        
    doc_score = max(0, min(20, doc_score))

    # 4. ERROR HANDLING (20 pts max)
    err_score = 20
    status_num = int(req.status) if str(req.status).isdigit() else 500
    
    if status_num >= 500:
        err_score -= 15
        deductions.append({"category": "Error Handling", "points": -15, "reason": f"Server crashed with 5xx Internal Server Error (HTTP {status_num})."})
        recommendations.append("Catch unhandled exceptions and return structured 4xx or safe operational error responses.")
    elif status_num >= 400:
        err_score -= 8
        deductions.append({"category": "Error Handling", "points": -8, "reason": f"Client request error received (HTTP {status_num})."})
        recommendations.append("Verify required parameters, auth tokens, and payload schema before sending.")

    if isinstance(req.response, str) and ("<!DOCTYPE html>" in req.response or "<html>" in req.response.lower()):
        err_score -= 5
        deductions.append({"category": "Error Handling", "points": -5, "reason": "Received raw HTML error stack dump instead of structured JSON."})
        recommendations.append("Configure backend error handlers to return structured JSON error envelopes.")

    err_score = max(0, min(20, err_score))

    # 5. BEST PRACTICES (20 pts max)
    bp_score = 20
    if req.method.upper() == "GET" and req.body:
        bp_score -= 8
        deductions.append({"category": "Best Practices", "points": -8, "reason": "HTTP GET requests should not carry request payloads according to HTTP spec."})
        recommendations.append("Pass parameters in query string instead of body for GET requests.")
        
    if req.body:
        body_str = json.dumps(req.body) if isinstance(req.body, (dict, list)) else str(req.body)
        if len(body_str) > 100000:
            bp_score -= 6
            deductions.append({"category": "Best Practices", "points": -6, "reason": "Request payload exceeds 100KB without pagination/compression."})
            recommendations.append("Implement pagination (limit/offset) or payload compression (gzip).")
            
    bp_score = max(0, min(20, bp_score))

    total_score = sec_score + perf_score + doc_score + err_score + bp_score
    total_score = max(0, min(100, total_score))

    grade = "Excellent" if total_score >= 85 else ("Good" if total_score >= 70 else ("Fair" if total_score >= 50 else "Critical"))

    return {
        "totalScore": total_score,
        "grade": grade,
        "categories": {
            "security": { "score": sec_score, "max": 20, "percentage": int((sec_score / 20) * 100) },
            "performance": { "score": perf_score, "max": 20, "percentage": int((perf_score / 20) * 100) },
            "documentation": { "score": doc_score, "max": 20, "percentage": int((doc_score / 20) * 100) },
            "errorHandling": { "score": err_score, "max": 20, "percentage": int((err_score / 20) * 100) },
            "bestPractices": { "score": bp_score, "max": 20, "percentage": int((bp_score / 20) * 100) },
        },
        "deductions": deductions,
        "recommendations": recommendations if recommendations else ["Request adheres to REST API standards and best practices! 🚀"]
    }