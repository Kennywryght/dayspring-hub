# app/routers/quiz.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from app.database import supabase
from app.utils.auth import get_current_user
from typing import Optional, List
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

# ---------- Pydantic Schemas ----------
class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str
    order: int
    options: Optional[List[OptionCreate]] = None

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    class_id: str
    questions: List[QuestionCreate]

class QuizOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_published: bool
    class_id: str
    teacher_id: str
    created_at: str

    class Config:
        orm_mode = False

class Answer(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    text_answer: Optional[str] = None

class SubmissionPayload(BaseModel):
    answers: List[Answer]


# ─────────────────────────────────────────────────────────────────
# TEACHER — fixed paths (no path param), safe at any position
# ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=QuizOut)
async def create_quiz(quiz_data: QuizCreate, user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")

    quiz_insert = {
        "teacher_id": user["user_id"],
        "class_id": quiz_data.class_id,
        "title": quiz_data.title,
        "description": quiz_data.description,
    }
    res_quiz = supabase.table("quizzes").insert(quiz_insert).execute()
    quiz_row = res_quiz.data[0]
    quiz_id = quiz_row["id"]

    for q in quiz_data.questions:
        question_insert = {
            "quiz_id": quiz_id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "order": q.order,
        }
        res_q = supabase.table("questions").insert(question_insert).execute()
        question_id = res_q.data[0]["id"]

        if q.question_type == "multiple_choice" and q.options:
            options_insert = [
                {
                    "question_id": question_id,
                    "option_text": opt.option_text,
                    "is_correct": opt.is_correct,
                }
                for opt in q.options
            ]
            supabase.table("options").insert(options_insert).execute()

    return {
        "id": quiz_id,
        "title": quiz_row["title"],
        "description": quiz_row.get("description"),
        "is_published": quiz_row.get("is_published", False),
        "class_id": quiz_row["class_id"],
        "teacher_id": quiz_row["teacher_id"],
        "created_at": str(quiz_row["created_at"]),
    }


@router.get("/", response_model=List[QuizOut])
async def list_my_quizzes(user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view this")
    quizzes = supabase.table("quizzes") \
        .select("*") \
        .eq("teacher_id", user["user_id"]) \
        .execute()
    return quizzes.data


# ─────────────────────────────────────────────────────────────────
# STUDENT — /available MUST live above all /{quiz_id} routes
# so FastAPI does not swallow "available" as a path parameter
# ─────────────────────────────────────────────────────────────────

@router.get("/available")
async def available_quizzes(user=Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view available quizzes")
    class_id = user.get("class_id")
    if not class_id:
        raise HTTPException(status_code=400, detail="No class assigned to this student")

    quizzes = supabase.table("quizzes") \
        .select("id, title, description, created_at") \
        .eq("class_id", class_id) \
        .eq("is_published", True) \
        .execute()
    return quizzes.data


# ─────────────────────────────────────────────────────────────────
# Parameterised routes — always declared last at this path level
# ─────────────────────────────────────────────────────────────────

@router.get("/{quiz_id}/questions")
async def get_quiz_questions(quiz_id: int, user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view full question details")

    quiz = supabase.table("quizzes").select("*").eq("id", quiz_id).single().execute()
    if not quiz.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = supabase.table("questions") \
        .select("*") \
        .eq("quiz_id", quiz_id) \
        .order("order") \
        .execute()

    for q in questions.data:
        q["options"] = supabase.table("options") \
            .select("*") \
            .eq("question_id", q["id"]) \
            .execute().data

    return {
        "quiz": quiz.data,
        "questions": questions.data,
    }


@router.get("/{quiz_id}/take")
async def take_quiz(quiz_id: int, user=Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can take quizzes")

    class_id = user.get("class_id")
    quiz = supabase.table("quizzes").select("*").eq("id", quiz_id).single().execute()

    if (
        not quiz.data
        or quiz.data["class_id"] != class_id
        or not quiz.data["is_published"]
    ):
        raise HTTPException(status_code=404, detail="Quiz not available")

    questions = supabase.table("questions") \
        .select("*") \
        .eq("quiz_id", quiz_id) \
        .order("order") \
        .execute()

    for q in questions.data:
        if q["question_type"] == "multiple_choice":
            q["options"] = supabase.table("options") \
                .select("id, option_text") \
                .eq("question_id", q["id"]) \
                .execute().data
        else:
            q["options"] = []

    return {
        "quiz": {
            "id": quiz_id,
            "title": quiz.data["title"],
            "description": quiz.data.get("description"),
        },
        "questions": questions.data,
    }


@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, payload: SubmissionPayload, user=Depends(get_current_user)):
    try:
        logger.info(f"Quiz submission attempt - User: {user.get('user_id')}, Quiz: {quiz_id}")
        
        if user["role"] != "student":
            return JSONResponse(
                status_code=403,
                content={"detail": "Only students can submit quizzes"}
            )

        if not payload.answers:
            return JSONResponse(
                status_code=400,
                content={"detail": "No answers provided"}
            )

        # Duplicate submission check: look at all question IDs in this quiz
        # rather than just the first answer, to avoid edge-case bypasses
        question_ids = [a.question_id for a in payload.answers]
        existing = supabase.table("student_responses") \
            .select("id") \
            .in_("question_id", question_ids) \
            .eq("student_id", user["user_id"]) \
            .limit(1) \
            .execute()

        if existing.data:
            return JSONResponse(
                status_code=400,
                content={"detail": "You have already submitted this quiz"}
            )

        for ans in payload.answers:
            response = {
                "question_id": ans.question_id,
                "student_id": user["user_id"],
                "selected_option_id": ans.selected_option_id,
                "text_answer": ans.text_answer,
            }
            supabase.table("student_responses").insert(response).execute()

        logger.info(f"Quiz {quiz_id} submitted successfully by user {user.get('user_id')}")
        return JSONResponse(
            content={"detail": "Answers submitted successfully"}
        )
    
    except Exception as e:
        logger.error(f"Error in submit_quiz: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )


@router.put("/{quiz_id}/publish")
async def publish_quiz(quiz_id: int, user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can publish quizzes")

    res = supabase.table("quizzes") \
        .update({"is_published": True}) \
        .eq("id", quiz_id) \
        .eq("teacher_id", user["user_id"]) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Quiz not found or does not belong to you")

    return {"detail": "Quiz published successfully"}


@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: int, user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete quizzes")

    supabase.table("quizzes") \
        .delete() \
        .eq("id", quiz_id) \
        .eq("teacher_id", user["user_id"]) \
        .execute()

    return {"detail": "Quiz deleted successfully"}