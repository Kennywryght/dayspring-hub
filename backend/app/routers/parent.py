# app/routers/parent.py
from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parent", tags=["Parent"])


# ---------- Helper Functions ----------
async def get_parent_record(profile_id: str):
    """Get the parent's database record from their profile ID"""
    try:
        parent = supabase.table("parents") \
            .select("id") \
            .eq("profile_id", profile_id) \
            .single() \
            .execute()
        
        if parent.data:
            return parent.data
        return None
    except Exception as e:
        logger.warning(f"Could not find parent record for profile {profile_id}: {e}")
        return None


async def verify_parent_access(student_id: str, parent_id: str) -> bool:
    """Verify that a parent has access to a specific student"""
    try:
        link = supabase.table("student_parents") \
            .select("student_id") \
            .eq("parent_id", parent_id) \
            .eq("student_id", student_id) \
            .execute()
        
        return len(link.data) > 0
    except Exception as e:
        logger.error(f"Error verifying parent access: {e}")
        return False


# ═══════════════════════════════════════════════════════════════
# PARENT ROUTES
# ═══════════════════════════════════════════════════════════════

@router.get("/students/")
async def get_my_students(current_user: dict = Depends(get_current_user)):
    """Get all students linked to the current parent"""
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")

    try:
        # Get parent record
        parent = await get_parent_record(current_user["user_id"])
        if not parent:
            return []
        
        parent_id = parent["id"]
        
        # Get linked students
        links = supabase.table("student_parents") \
            .select("student_id") \
            .eq("parent_id", parent_id) \
            .execute()
        
        if not links.data:
            return []
        
        student_ids = [link["student_id"] for link in links.data]
        
        # Fetch student details
        students = supabase.table("students") \
            .select("id, student_number, display_name, class_id") \
            .in_("id", student_ids) \
            .execute()
        
        # Get class names for each student
        result = []
        for student in students.data:
            class_info = supabase.table("classes") \
                .select("name") \
                .eq("id", student["class_id"]) \
                .single() \
                .execute()
            
            result.append({
                "id": student["id"],
                "student_number": student["student_number"],
                "display_name": student["display_name"],
                "class_id": student["class_id"],
                "class_name": class_info.data["name"] if class_info.data else "Unknown"
            })
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# In parent.py - update get_student_quizzes
@router.get("/quizzes/{student_id}/")
async def get_student_quizzes(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get available quizzes for a specific student"""
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    
    try:
        # Get parent record
        parent = await get_parent_record(current_user["user_id"])
        if not parent:
            logger.warning(f"Parent record not found for user: {current_user['user_id']}")
            return []  # Return empty list instead of 404
        
        # Verify access
        has_access = await verify_parent_access(student_id, parent["id"])
        if not has_access:
            raise HTTPException(status_code=403, detail="Not your child")
        
        # Get student's class
        student = supabase.table("students") \
            .select("class_id") \
            .eq("id", student_id) \
            .single() \
            .execute()
        
        if not student.data:
            logger.warning(f"Student not found: {student_id}")
            return []  # Return empty list instead of 404
        
        # Get published quizzes for that class
        quizzes = supabase.table("quizzes") \
            .select("id, title, description, created_at") \
            .eq("class_id", student.data["class_id"]) \
            .eq("is_published", True) \
            .execute()
        
        quiz_list = quizzes.data or []
        
        # Check which quizzes the student has submitted
        for quiz in quiz_list:
            try:
                submissions = supabase.table("student_responses") \
                    .select("id") \
                    .eq("student_id", student_id) \
                    .eq("questions.quiz_id", quiz["id"]) \
                    .limit(1) \
                    .execute()
                quiz["submitted"] = len(submissions.data) > 0
            except Exception as e:
                logger.warning(f"Error checking submission for quiz {quiz['id']}: {e}")
                quiz["submitted"] = False
        
        return quiz_list
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student quizzes: {e}")
        return []  # Return empty list on error
    
@router.get("/quiz-result/{student_id}/{quiz_id}/")
async def get_student_quiz_result(student_id: str, quiz_id: int, current_user: dict = Depends(get_current_user)):
    """Get quiz result for a specific student"""
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    
    try:
        # Get parent record
        parent = await get_parent_record(current_user["user_id"])
        if not parent:
            raise HTTPException(status_code=404, detail="Parent record not found")
        
        # Verify access
        has_access = await verify_parent_access(student_id, parent["id"])
        if not has_access:
            raise HTTPException(status_code=403, detail="Not your child")
        
        # Get quiz info
        quiz = supabase.table("quizzes") \
            .select("id, title, auto_graded") \
            .eq("id", quiz_id) \
            .single() \
            .execute()
        
        if not quiz.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Get questions count
        questions = supabase.table("questions") \
            .select("id") \
            .eq("quiz_id", quiz_id) \
            .execute()
        
        total_questions = len(questions.data) if questions.data else 0
        total_possible = total_questions * 5
        
        # Get student responses
        responses = supabase.table("student_responses") \
            .select("*, questions!inner(question_text, question_type, order)") \
            .eq("student_id", student_id) \
            .eq("questions.quiz_id", quiz_id) \
            .execute()
        
        if not responses.data:
            return {
                "quiz_title": quiz.data["title"],
                "quiz_id": quiz_id,
                "submitted": False,
                "total_points": 0,
                "total_possible": total_possible,
                "graded_count": 0,
                "total_questions": total_questions,
                "auto_graded": quiz.data.get("auto_graded", False),
                "answers": []
            }
        
        # Sort responses by question order
        sorted_responses = sorted(
            responses.data,
            key=lambda r: r.get("questions", {}).get("order", 0)
        )
        
        total_points = 0
        graded_count = 0
        answers = []
        
        for r in sorted_responses:
            q_data = r.get("questions", {})
            answer_data = {
                "question_id": r["question_id"],
                "question_text": q_data.get("question_text", ""),
                "question_type": q_data.get("question_type", ""),
                "points": r.get("points"),
                "feedback": r.get("feedback"),
                "text_answer": r.get("text_answer"),
                "selected_option_id": r.get("selected_option_id"),
                "is_correct": r.get("is_correct"),
            }
            
            # Get option text if multiple choice
            if r.get("selected_option_id"):
                option = supabase.table("options") \
                    .select("option_text") \
                    .eq("id", r["selected_option_id"]) \
                    .single() \
                    .execute()
                if option.data:
                    answer_data["selected_option_text"] = option.data["option_text"]
                
                # Get correct answer
                if q_data.get("question_type") == "multiple_choice":
                    correct_opt = supabase.table("options") \
                        .select("option_text") \
                        .eq("question_id", r["question_id"]) \
                        .eq("is_correct", True) \
                        .single() \
                        .execute()
                    if correct_opt.data:
                        answer_data["correct_answer"] = correct_opt.data["option_text"]
            
            answers.append(answer_data)
            if r.get("points") is not None:
                total_points += float(r["points"])
                graded_count += 1
        
        return {
            "quiz_title": quiz.data["title"],
            "quiz_id": quiz_id,
            "submitted": True,
            "total_points": total_points,
            "total_possible": total_possible,
            "graded_count": graded_count,
            "total_questions": total_questions,
            "auto_graded": quiz.data.get("auto_graded", False),
            "answers": answers,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz result: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assignments/{student_id}/")
async def get_student_assignments(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get assignments and submissions for a specific student"""
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    
    try:
        # Get parent record
        parent = await get_parent_record(current_user["user_id"])
        if not parent:
            raise HTTPException(status_code=404, detail="Parent record not found")
        
        # Verify access
        has_access = await verify_parent_access(student_id, parent["id"])
        if not has_access:
            raise HTTPException(status_code=403, detail="Not your child")
        
        # Get student's submissions with assignment details
        submissions = supabase.table("submissions") \
            .select("*, assignments(id, title, description, deadline, file_url, audio_url)") \
            .eq("student_id", student_id) \
            .execute()
        
        if not submissions.data:
            return []
        
        # Format response
        result = []
        for sub in submissions.data:
            assignment = sub.get("assignments", {})
            result.append({
                "submission_id": sub["id"],
                "assignment_id": assignment.get("id"),
                "title": assignment.get("title", "Unknown Assignment"),
                "description": assignment.get("description"),
                "deadline": assignment.get("deadline"),
                "submitted_at": sub.get("submitted_at"),
                "grade": sub.get("grade"),
                "feedback": sub.get("feedback"),
                "file_url": assignment.get("file_url"),
                "audio_url": assignment.get("audio_url"),
            })
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/results/")
async def get_student_results(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get comprehensive results for a student including assignments and quizzes"""
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    
    try:
        # Get parent record
        parent = await get_parent_record(current_user["user_id"])
        if not parent:
            raise HTTPException(status_code=404, detail="Parent record not found")
        
        # Verify access
        has_access = await verify_parent_access(student_id, parent["id"])
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have access to this student")
        
        # Get student info
        student = supabase.table("students") \
            .select("display_name, student_number, class_id") \
            .eq("id", student_id) \
            .single() \
            .execute()
        
        if not student.data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get class name
        class_info = supabase.table("classes") \
            .select("name") \
            .eq("id", student.data["class_id"]) \
            .single() \
            .execute()
        
        # Get assignments with grades
        assignments = supabase.table("submissions") \
            .select("*, assignments(id, title, description, deadline)") \
            .eq("student_id", student_id) \
            .execute()
        
        assignment_results = []
        for sub in assignments.data:
            assignment = sub.get("assignments", {})
            assignment_results.append({
                "assignment_id": assignment.get("id"),
                "title": assignment.get("title", "Unknown Assignment"),
                "description": assignment.get("description"),
                "deadline": assignment.get("deadline"),
                "submitted_at": sub.get("submitted_at"),
                "grade": sub.get("grade"),
                "feedback": sub.get("feedback"),
            })
        
        # Get quiz results
        quiz_results = []
        quiz_submissions = supabase.table("student_responses") \
            .select("question_id, points, feedback, questions!inner(quiz_id), quizzes!inner(title)") \
            .eq("student_id", student_id) \
            .execute()
        
        # Group by quiz
        quiz_map = {}
        for r in quiz_submissions.data:
            quiz_id = r.get("questions", {}).get("quiz_id")
            if quiz_id:
                if quiz_id not in quiz_map:
                    quiz_map[quiz_id] = {
                        "quiz_id": quiz_id,
                        "title": r.get("quizzes", {}).get("title", "Unknown Quiz"),
                        "total_points": 0,
                        "graded_count": 0,
                        "submitted": True,
                    }
                if r.get("points") is not None:
                    quiz_map[quiz_id]["total_points"] += float(r["points"])
                    quiz_map[quiz_id]["graded_count"] += 1
        
        quiz_results = list(quiz_map.values())
        
        return {
            "student": {
                "id": student_id,
                "display_name": student.data["display_name"],
                "student_number": student.data["student_number"],
                "class_name": class_info.data["name"] if class_info.data else "Unknown"
            },
            "assignments": assignment_results,
            "quizzes": quiz_results
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/progress/")
async def get_student_progress(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get overall progress summary for a student"""
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view this")
    
    try:
        # Get parent record
        parent = await get_parent_record(current_user["user_id"])
        if not parent:
            raise HTTPException(status_code=404, detail="Parent record not found")
        
        # Verify access
        has_access = await verify_parent_access(student_id, parent["id"])
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have access to this student")
        
        # Get assignments summary
        submissions = supabase.table("submissions") \
            .select("grade") \
            .eq("student_id", student_id) \
            .execute()
        
        total_assignments = len(submissions.data)
        graded_assignments = sum(1 for s in submissions.data if s.get("grade") is not None)
        
        # Calculate average grade
        grades = [float(s["grade"]) for s in submissions.data if s.get("grade") is not None]
        avg_grade = sum(grades) / len(grades) if grades else None
        
        # Get quiz summary
        quiz_responses = supabase.table("student_responses") \
            .select("points, questions!inner(quiz_id)") \
            .eq("student_id", student_id) \
            .execute()
        
        quiz_map = {}
        for r in quiz_responses.data:
            quiz_id = r.get("questions", {}).get("quiz_id")
            if quiz_id:
                if quiz_id not in quiz_map:
                    quiz_map[quiz_id] = {"points": [], "total": 0}
                if r.get("points") is not None:
                    quiz_map[quiz_id]["points"].append(float(r["points"]))
                    quiz_map[quiz_id]["total"] += 1
        
        total_quizzes = len(quiz_map)
        completed_quizzes = sum(1 for q in quiz_map.values() if q["total"] > 0)
        
        return {
            "student_id": student_id,
            "assignments": {
                "total": total_assignments,
                "graded": graded_assignments,
                "average_grade": avg_grade,
            },
            "quizzes": {
                "total": total_quizzes,
                "completed": completed_quizzes,
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))