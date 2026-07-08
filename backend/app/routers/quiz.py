# app/routers/quiz.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, Response, HTMLResponse
from app.database import supabase
from app.utils.auth import get_current_user
from typing import Optional, List
from pydantic import BaseModel
import logging
from datetime import datetime
import io

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
    time_limit: int = 0
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

class GradeAnswer(BaseModel):
    answer_id: int
    points: Optional[float] = None
    feedback: Optional[str] = None

class GradePayload(BaseModel):
    grades: List[GradeAnswer]


# ---------- Helper Functions ----------
async def get_student_db_id(user):
    """Get the student's actual database ID from their student_number"""
    student_number = user.get("student_id") or user.get("user_id")
    
    try:
        student = supabase.table("students") \
            .select("id") \
            .eq("student_number", student_number) \
            .execute()
        
        if student.data and len(student.data) > 0:
            return student.data[0]["id"]
    except Exception as e:
        logger.warning(f"Could not find student by number {student_number}: {e}")
    
    return user["user_id"]


# ═══════════════════════════════════════════════════════════════
# FIXED-PATH ROUTES (no path parameters) - MUST BE FIRST
# ═══════════════════════════════════════════════════════════════

@router.post("/", response_model=QuizOut)
async def create_quiz(quiz_data: QuizCreate, user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")

    quiz_insert = {
        "teacher_id": user["user_id"],
        "class_id": quiz_data.class_id,
        "title": quiz_data.title,
        "description": quiz_data.description,
        "time_limit": quiz_data.time_limit,
        "is_published": False,
        "auto_graded": False,
        "created_at": datetime.utcnow().isoformat(),
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
            "points": 5,
        }
        res_q = supabase.table("questions").insert(question_insert).execute()
        question_id = res_q.data[0]["id"]

        if q.question_type == "multiple_choice" and q.options:
            options_insert = []
            for opt in q.options:
                options_insert.append({
                    "question_id": question_id,
                    "option_text": opt.option_text,
                    "is_correct": opt.is_correct,
                })
            
            logger.info(f"Saving options for question {question_id}: {options_insert}")
            result = supabase.table("options").insert(options_insert).execute()
            logger.info(f"Options saved: {result.data}")
            
            # Verify the correct answer was saved
            verify = supabase.table("options").select("id, option_text, is_correct").eq("question_id", question_id).execute()
            logger.info(f"Verified options: {verify.data}")

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


@router.get("/available")
async def available_quizzes(user=Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view available quizzes")
    class_id = user.get("class_id")
    if not class_id:
        raise HTTPException(status_code=400, detail="No class assigned to this student")

    quizzes = supabase.table("quizzes") \
        .select("id, title, description, created_at, time_limit") \
        .eq("class_id", class_id) \
        .eq("is_published", True) \
        .execute()
    return quizzes.data


@router.get("/submissions")
async def get_my_submissions(user=Depends(get_current_user)):
    """Get student's quiz submissions"""
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their submissions")
    
    student_db_id = await get_student_db_id(user)
    logger.info(f"Fetching submissions for student DB ID: {student_db_id}")
    
    responses = supabase.table("student_responses") \
        .select("*, questions(quiz_id)") \
        .eq("student_id", student_db_id) \
        .execute()
    
    submissions = {}
    for r in responses.data:
        if r.get("questions") and r["questions"].get("quiz_id"):
            quiz_id = r["questions"]["quiz_id"]
            if quiz_id not in submissions:
                submissions[quiz_id] = {
                    "quiz_id": quiz_id,
                    "submitted": True,
                    "submitted_at": None,
                }
    
    logger.info(f"Found submissions for quizzes: {list(submissions.keys())}")
    return list(submissions.values())


@router.get("/submissions/{submission_id}/answers")
async def get_submission_answers(submission_id: str, user=Depends(get_current_user)):
    """Teacher: Get a student's answers for grading"""
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view answers")
    
    try:
        responses = supabase.table("student_responses") \
            .select("*, questions(question_text, question_type, id)") \
            .eq("student_id", submission_id) \
            .execute()
        
        for r in responses.data:
            if r.get("selected_option_id") and r.get("questions"):
                question_id = r["questions"]["id"]
                options = supabase.table("options") \
                    .select("id, option_text") \
                    .eq("question_id", question_id) \
                    .order("id") \
                    .execute()
                
                if options.data:
                    for idx, opt in enumerate(options.data):
                        if opt["id"] == r["selected_option_id"]:
                            r["selected_option_number"] = idx + 1
                            r["selected_option_text"] = opt["option_text"]
                            break
        
        return {
            "submission_id": submission_id,
            "answers": responses.data
        }
    except Exception as e:
        logger.error(f"Error fetching answers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/submissions/{submission_id}/grade")
async def grade_submission(submission_id: str, payload: GradePayload, user=Depends(get_current_user)):
    """Teacher: Grade a student's quiz answers"""
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can grade submissions")
    
    try:
        for grade in payload.grades:
            update_data = {}
            
            if grade.points is not None:
                update_data["points"] = float(grade.points)
                if float(grade.points) > 0:
                    update_data["is_correct"] = True
                else:
                    update_data["is_correct"] = False
            
            if grade.feedback is not None:
                update_data["feedback"] = grade.feedback
            
            if update_data:
                logger.info(f"Updating response {grade.answer_id} with: {update_data}")
                supabase.table("student_responses") \
                    .update(update_data) \
                    .eq("id", grade.answer_id) \
                    .execute()
        
        return {"detail": "Grades saved successfully"}
    except Exception as e:
        logger.error(f"Error saving grades: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error saving grades: {str(e)}"}
        )


# ═══════════════════════════════════════════════════════════════
# PARAMETERISED ROUTES – with {quiz_id} – ALL LAST
# ═══════════════════════════════════════════════════════════════

@router.get("/{quiz_id}/submissions")
async def get_quiz_submissions(quiz_id: int, user=Depends(get_current_user)):
    """Teacher: Get all submissions for a quiz"""
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view submissions")
    
    try:
        quiz = supabase.table("quizzes") \
            .select("*") \
            .eq("id", quiz_id) \
            .eq("teacher_id", user["user_id"]) \
            .single() \
            .execute()
        
        if not quiz.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        responses = supabase.table("student_responses") \
            .select("student_id, questions!inner(quiz_id)") \
            .eq("questions.quiz_id", quiz_id) \
            .execute()
        
        students = {}
        for r in responses.data:
            sid = r["student_id"]
            if sid not in students:
                try:
                    student = supabase.table("students") \
                        .select("display_name") \
                        .eq("id", sid) \
                        .single() \
                        .execute()
                    student_name = student.data["display_name"] if student.data else "Unknown"
                except Exception:
                    student_name = "Unknown"
                
                students[sid] = {
                    "id": sid,
                    "student_name": student_name,
                    "submitted_at": None,
                }
        
        return list(students.values())
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz submissions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{quiz_id}/results")
async def get_quiz_results(quiz_id: int, user=Depends(get_current_user)):
    """Teacher: Get all student results for a quiz"""
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view results")
    
    try:
        quiz = supabase.table("quizzes") \
            .select("*") \
            .eq("id", quiz_id) \
            .eq("teacher_id", user["user_id"]) \
            .single() \
            .execute()
        
        if not quiz.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        questions = supabase.table("questions") \
            .select("id, question_text, order") \
            .eq("quiz_id", quiz_id) \
            .order("order") \
            .execute()
        
        total_possible = len(questions.data) * 5
        
        responses = supabase.table("student_responses") \
            .select("*, questions!inner(quiz_id)") \
            .eq("questions.quiz_id", quiz_id) \
            .execute()
        
        students = {}
        for r in responses.data:
            sid = r["student_id"]
            if sid not in students:
                try:
                    student = supabase.table("students") \
                        .select("display_name, student_number") \
                        .eq("id", sid) \
                        .single() \
                        .execute()
                    student_name = student.data["display_name"] if student.data else "Unknown"
                    student_number = student.data.get("student_number", "N/A") if student.data else "N/A"
                except Exception:
                    student_name = "Unknown"
                    student_number = "N/A"
                
                students[sid] = {
                    "student_id": sid,
                    "student_name": student_name,
                    "student_number": student_number,
                    "total_points": 0,
                    "graded_count": 0,
                    "total_questions": len(questions.data),
                }
            
            if r.get("points") is not None:
                students[sid]["total_points"] += float(r["points"])
                students[sid]["graded_count"] += 1
        
        return {
            "quiz_title": quiz.data["title"],
            "total_possible": total_possible,
            "students": list(students.values()),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
            options = supabase.table("options") \
                .select("id, option_text, is_correct") \
                .eq("question_id", q["id"]) \
                .execute()
            
            # Only send id and option_text to student (hide is_correct)
            q["options"] = [
                {"id": opt["id"], "option_text": opt["option_text"]}
                for opt in options.data
            ]
        else:
            q["options"] = []

    return {
        "quiz": {
            "id": quiz_id,
            "title": quiz.data["title"],
            "description": quiz.data.get("description"),
            "time_limit": quiz.data.get("time_limit", 0),
        },
        "questions": questions.data,
    }


@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, payload: SubmissionPayload, user=Depends(get_current_user)):
    try:
        logger.info(f"Quiz submission attempt - User: {user}, Quiz: {quiz_id}")
        
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

        student_db_id = await get_student_db_id(user)
        logger.info(f"Resolved student DB ID: {student_db_id}")

        question_ids = [a.question_id for a in payload.answers]
        existing = supabase.table("student_responses") \
            .select("id") \
            .in_("question_id", question_ids) \
            .eq("student_id", student_db_id) \
            .limit(1) \
            .execute()

        if existing.data:
            return JSONResponse(
                status_code=400,
                content={"detail": "You have already submitted this quiz"}
            )

        # Store responses and auto-grade them immediately
        for ans in payload.answers:
            # 1. Insert the response
            response = {
                "question_id": ans.question_id,
                "student_id": student_db_id,
                "selected_option_id": ans.selected_option_id,
                "text_answer": ans.text_answer,
            }
            result = supabase.table("student_responses").insert(response).execute()
            
            if result.data and ans.selected_option_id is not None:
                # 2. Auto-grade this specific answer immediately
                response_id = result.data[0]["id"]
                
                # Find the correct option
                correct = supabase.table("options") \
                    .select("id") \
                    .eq("question_id", ans.question_id) \
                    .eq("is_correct", True) \
                    .execute()
                
                if correct.data:
                    is_correct = ans.selected_option_id == correct.data[0]["id"]
                    # Update the response with grade
                    supabase.table("student_responses").update({
                        "points": 5 if is_correct else 0,
                        "is_correct": is_correct,
                        "feedback": "Correct!" if is_correct else "Incorrect"
                    }).eq("id", response_id).execute()

        logger.info(f"Quiz {quiz_id} submitted and auto-graded successfully for student {student_db_id}")
        return JSONResponse(
            content={"detail": "Answers submitted and graded successfully"}
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


# ==================== FIXED AUTO-GRADE - FORCES UPDATE ====================
@router.post("/{quiz_id}/auto-grade")
async def auto_grade_quiz(quiz_id: int, user=Depends(get_current_user)):
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can auto-grade")
    
    try:
        # Get all questions for this quiz
        questions = supabase.table("questions") \
            .select("id, question_type, points") \
            .eq("quiz_id", quiz_id) \
            .execute()
        
        if not questions.data:
            raise HTTPException(status_code=404, detail="No questions found")
        
        graded_count = 0
        results = []
        
        for q in questions.data:
            if q["question_type"] == "multiple_choice":
                # Get the correct option
                correct_options = supabase.table("options") \
                    .select("id") \
                    .eq("question_id", q["id"]) \
                    .eq("is_correct", True) \
                    .execute()
                
                logger.info(f"Question {q['id']} - Correct options: {correct_options.data}")
                
                if correct_options.data and len(correct_options.data) > 0:
                    correct_option_id = correct_options.data[0]["id"]
                    pts = float(q.get("points") or 5)
                    
                    # Get all student responses for this question
                    responses = supabase.table("student_responses") \
                        .select("id, selected_option_id") \
                        .eq("question_id", q["id"]) \
                        .execute()
                    
                    for r in responses.data:
                        is_correct = r["selected_option_id"] == correct_option_id
                        
                        logger.info(f"Response {r['id']}: selected={r['selected_option_id']}, correct={correct_option_id}, result={is_correct}")
                        
                        # FORCE UPDATE - explicitly set all fields
                        update_result = supabase.table("student_responses").update({
                            "points": pts if is_correct else 0,
                            "is_correct": is_correct,
                            "feedback": "Auto-graded" if is_correct else "Incorrect"
                        }).eq("id", r["id"]).execute()
                        
                        if update_result.data:
                            graded_count += 1
                            results.append({
                                "response_id": r["id"],
                                "is_correct": is_correct,
                                "points": pts if is_correct else 0
                            })
                            
                            # Verify the update worked
                            verify = supabase.table("student_responses") \
                                .select("id, points, is_correct") \
                                .eq("id", r["id"]) \
                                .execute()
                            logger.info(f"Verification after update: {verify.data}")
                else:
                    logger.warning(f"No correct option found for question {q['id']}")
        
        # Mark quiz as auto-graded
        supabase.table("quizzes").update({"auto_graded": True}).eq("id", quiz_id).execute()
        
        return {
            "message": f"Quiz auto-graded successfully. {graded_count} responses graded.",
            "details": results
        }
    
    except Exception as e:
        logger.error(f"Error in auto-grade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FIXED MY-RESULT - Uses is_correct flag directly ====================
@router.get("/{quiz_id}/my-result")
async def get_my_quiz_result(quiz_id: int, user=Depends(get_current_user)):
    """Student: Get my result for a specific quiz with correct answers"""
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view results")
    
    try:
        student_db_id = await get_student_db_id(user)
        logger.info(f"Fetching result for student {student_db_id}, quiz {quiz_id}")
        
        quiz = supabase.table("quizzes") \
            .select("id, title, auto_graded") \
            .eq("id", quiz_id) \
            .single() \
            .execute()
        
        if not quiz.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        questions = supabase.table("questions") \
            .select("id, question_text, question_type, points, order") \
            .eq("quiz_id", quiz_id) \
            .order("order") \
            .execute()
        
        total_questions = len(questions.data)
        total_possible = total_questions * 5
        
        responses = supabase.table("student_responses") \
            .select("*, questions!inner(quiz_id, question_text, question_type, order, points)") \
            .eq("student_id", student_db_id) \
            .eq("questions.quiz_id", quiz_id) \
            .execute()
        
        logger.info(f"Found {len(responses.data)} responses for student {student_db_id}, quiz {quiz_id}")
        
        # Log the raw response data for debugging
        for r in responses.data:
            logger.info(f"Raw response: id={r['id']}, is_correct={r.get('is_correct')}, points={r.get('points')}, selected={r.get('selected_option_id')}")
        
        if not responses.data:
            return {
                "quiz_title": quiz.data["title"],
                "submitted": False,
                "total_points": 0,
                "total_possible": total_possible,
                "graded_count": 0,
                "total_questions": total_questions,
                "auto_graded": quiz.data.get("auto_graded", False),
                "answers": [],
            }
        
        sorted_responses = sorted(
            responses.data, 
            key=lambda r: r.get("questions", {}).get("order", 0)
        )
        
        total_points = 0
        graded_count = 0
        answers = []
        
        for r in sorted_responses:
            q_data = r.get("questions", {})
            
            # CRITICAL: Get the is_correct value directly from the database
            is_correct = r.get("is_correct", False)
            
            # If is_correct is None, check points
            if is_correct is False and r.get("points") is not None:
                if float(r.get("points", 0)) > 0:
                    is_correct = True
            
            logger.info(f"Response {r['id']}: is_correct from DB = {is_correct}")
            
            answer_data = {
                "question_id": r["question_id"],
                "question_text": q_data.get("question_text", ""),
                "question_type": q_data.get("question_type", ""),
                "points": r.get("points"),
                "feedback": r.get("feedback"),
                "text_answer": r.get("text_answer"),
                "selected_option_id": r.get("selected_option_id"),
                "is_correct": is_correct if is_correct is not None else False,
            }
            
            if r.get("selected_option_id"):
                # Get the selected option text
                option = supabase.table("options") \
                    .select("option_text") \
                    .eq("id", r["selected_option_id"]) \
                    .single() \
                    .execute()
                if option.data:
                    answer_data["selected_option_text"] = option.data["option_text"]
                
                # Get the correct answer for display
                if q_data.get("question_type") == "multiple_choice":
                    correct_opts = supabase.table("options") \
                        .select("option_text") \
                        .eq("question_id", r["question_id"]) \
                        .eq("is_correct", True) \
                        .execute()
                    
                    if correct_opts.data and len(correct_opts.data) > 0:
                        answer_data["correct_answer"] = correct_opts.data[0]["option_text"]
            
            answers.append(answer_data)
            if r.get("points") is not None:
                total_points += float(r["points"])
                graded_count += 1
        
        result = {
            "quiz_title": quiz.data["title"],
            "submitted": True,
            "total_points": total_points,
            "total_possible": total_possible,
            "graded_count": graded_count,
            "total_questions": total_questions,
            "auto_graded": quiz.data.get("auto_graded", False),
            "answers": answers,
        }
        
        logger.info(f"Returning result: {result}")
        return result
    
    except Exception as e:
        logger.error(f"Error fetching student result: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{quiz_id}/export-result")
async def export_quiz_result(quiz_id: int, user=Depends(get_current_user)):
    """Export student's quiz result as HTML report"""
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can export results")
    
    try:
        result = await get_my_quiz_result(quiz_id, user)
        
        if not result.get("submitted"):
            raise HTTPException(status_code=400, detail="You haven't submitted this quiz yet")
        
        total_possible = result.get("total_possible", 1)
        percentage = round((result.get("total_points", 0) / total_possible) * 100) if total_possible > 0 else 0
        
        student = supabase.table("students").select("display_name, student_number").eq("id", user["user_id"]).single().execute()
        student_name = student.data.get("display_name", "Student") if student.data else "Student"
        student_number = student.data.get("student_number", "N/A") if student.data else "N/A"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Quiz Results - {result['quiz_title']}</title>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #f8fafc; }}
                .container {{ background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                h1 {{ color: #1e293b; border-bottom: 3px solid #e2e8f0; padding-bottom: 15px; }}
                .header {{ background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 25px; }}
                .score {{ font-size: 32px; font-weight: 700; color: #0f172a; }}
                .meta {{ color: #64748b; font-size: 14px; margin-top: 10px; }}
                .meta span {{ margin-right: 20px; }}
                .question {{ background: #f8fafc; padding: 18px; margin: 12px 0; border-radius: 10px; border-left: 4px solid #3b82f6; }}
                .question.correct {{ border-left-color: #22c55e; background: #f0fdf4; }}
                .question.incorrect {{ border-left-color: #ef4444; background: #fef2f2; }}
                .question.pending {{ border-left-color: #eab308; background: #fefce8; }}
                .badge {{ display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }}
                .badge-correct {{ background: #dcfce7; color: #166534; }}
                .badge-incorrect {{ background: #fee2e2; color: #991b1b; }}
                .badge-pending {{ background: #fef9c3; color: #854d0e; }}
                .answer-box {{ background: white; padding: 8px 14px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 5px 0; display: inline-block; }}
                .points {{ font-weight: 600; }}
                .points-correct {{ color: #16a34a; }}
                .points-incorrect {{ color: #dc2626; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }}
                .student-info {{ background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; }}
                .student-info div {{ font-size: 14px; color: #334155; }}
                .student-info strong {{ color: #0f172a; }}
                @media print {{
                    body {{ background: white; padding: 20px; }}
                    .container {{ box-shadow: none; padding: 20px; }}
                    .header {{ background: #f1f5f9; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📝 Quiz Results: {result['quiz_title']}</h1>
                
                <div class="student-info">
                    <div><strong>Student:</strong> {student_name}</div>
                    <div><strong>Student Number:</strong> {student_number}</div>
                </div>
                
                <div class="header">
                    <div class="score">Score: {result['total_points']} / {result['total_possible']} ({percentage}%)</div>
                    <div class="meta">
                        <span>📊 Questions graded: {result['graded_count']} / {result['total_questions']}</span>
                        <span>🤖 Auto-graded: {'Yes' if result.get('auto_graded') else 'No'}</span>
                        <span>📅 Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}</span>
                    </div>
                </div>
                
                <h2>Question Breakdown</h2>
        """
        
        for i, ans in enumerate(result.get("answers", [])):
            is_correct = ans.get("is_correct")
            
            if is_correct is True:
                status_class = "correct"
                status_text = "✅ Correct"
                badge_class = "badge-correct"
            elif is_correct is False:
                status_class = "incorrect"
                status_text = "❌ Incorrect"
                badge_class = "badge-incorrect"
            else:
                status_class = "pending"
                status_text = "⏳ Not graded"
                badge_class = "badge-pending"
            
            points_display = ans.get('points') if ans.get('points') is not None else 'N/A'
            points_class = "points-correct" if is_correct is True else "points-incorrect" if is_correct is False else ""
            
            answer_text = ans.get('selected_option_text') or ans.get('text_answer') or 'No answer provided'
            
            html += f"""
                <div class="question {status_class}">
                    <p><strong>Q{i+1}: {ans['question_text']}</strong></p>
                    <p><strong>Your answer:</strong> <span class="answer-box">{answer_text}</span></p>
            """
            
            if ans.get('correct_answer'):
                html += f"""
                    <p><strong>Correct answer:</strong> <span class="answer-box" style="background:#f0fdf4;border-color:#86efac;">{ans['correct_answer']}</span></p>
                """
            
            html += f"""
                    <p>
                        <span class="badge {badge_class}">{status_text}</span>
                        <span class="points {points_class}"> | Points: {points_display}</span>
                    </p>
            """
            
            if ans.get('feedback'):
                html += f"""
                    <p><strong>Feedback:</strong> {ans['feedback']}</p>
                """
            
            html += "</div>"
        
        html += """
                <div class="footer">
                    <p>Generated by Dayspring Hub Learning Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return HTMLResponse(
            content=html,
            headers={
                "Content-Disposition": f"attachment; filename=quiz_results_{quiz_id}.html",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DEBUG ENDPOINT ====================
@router.get("/{quiz_id}/debug-options")
async def debug_options(quiz_id: int, user=Depends(get_current_user)):
    """Debug endpoint to check if options are stored correctly"""
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can debug")
    
    questions = supabase.table("questions") \
        .select("id, question_text") \
        .eq("quiz_id", quiz_id) \
        .execute()
    
    result = []
    for q in questions.data:
        options = supabase.table("options") \
            .select("id, option_text, is_correct") \
            .eq("question_id", q["id"]) \
            .execute()
        
        correct_count = sum(1 for opt in options.data if opt.get("is_correct", False))
        
        result.append({
            "question_id": q["id"],
            "question_text": q["question_text"],
            "options": options.data,
            "correct_count": correct_count,
            "has_correct": correct_count > 0,
            "has_multiple_correct": correct_count > 1
        })
    
    return {
        "quiz_id": quiz_id,
        "questions": result,
        "total_questions": len(result),
        "issues": [
            q for q in result if q["correct_count"] == 0 or q["correct_count"] > 1
        ]
    }