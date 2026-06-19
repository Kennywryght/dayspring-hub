from fastapi import APIRouter, Depends
from app.database import supabase
from app.utils.auth import get_current_user

router = APIRouter(prefix="/parent", tags=["Parent"])

@router.get("/students/")
async def get_my_students(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        return []
    student_ids = current_user.get("student_ids", [])
    if not student_ids:
        return []
    # Fetch students details
    result = supabase.table("students").select("id, student_number, display_name, class_id").in_("id", student_ids).execute()
    return result.data

# Get available quizzes for a student
@router.get("/quizzes/{student_id}/")
async def get_student_quizzes(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    if student_id not in current_user.get("student_ids", []):
        raise HTTPException(status_code=403, detail="Not your child")
    
    # Get student's class
    student = supabase.table("students").select("class_id").eq("id", student_id).single().execute()
    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get published quizzes for that class
    quizzes = supabase.table("quizzes").select("id, title, description").eq("class_id", student.data["class_id"]).eq("is_published", True).execute()
    return quizzes.data


# Get quiz result for a student
@router.get("/quiz-result/{student_id}/{quiz_id}/")
async def get_student_quiz_result(student_id: str, quiz_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    if student_id not in current_user.get("student_ids", []):
        raise HTTPException(status_code=403, detail="Not your child")
    
    # Get quiz info
    quiz = supabase.table("quizzes").select("id, title").eq("id", quiz_id).single().execute()
    if not quiz.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get questions count
    questions = supabase.table("questions").select("id").eq("quiz_id", quiz_id).execute()
    total_questions = len(questions.data) if questions.data else 0
    
    # Get student responses
    responses = supabase.table("student_responses").select("*, questions(question_text, question_type)").eq("student_id", student_id).eq("questions.quiz_id", quiz_id).execute()
    
    if not responses.data:
        return {"quiz_title": quiz.data["title"], "submitted": False, "total_points": 0, "total_possible": total_questions * 5, "graded_count": 0, "total_questions": total_questions, "answers": []}
    
    total_points = 0
    graded_count = 0
    answers = []
    for r in responses.data:
        answers.append({"question_id": r["question_id"], "question_text": r.get("questions", {}).get("question_text", ""), "question_type": r.get("questions", {}).get("question_type", ""), "points": r.get("points"), "feedback": r.get("feedback"), "text_answer": r.get("text_answer"), "selected_option_id": r.get("selected_option_id")})
        if r.get("points") is not None:
            total_points += float(r["points"])
            graded_count += 1
    
    return {"quiz_title": quiz.data["title"], "submitted": True, "total_points": total_points, "total_possible": total_questions * 5, "graded_count": graded_count, "total_questions": total_questions, "answers": answers}