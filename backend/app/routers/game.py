import logging
from fastapi import APIRouter, HTTPException
from ..database import supabase
from ..schemas import GameSessionCreate

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/score")
def submit_score(session_data: GameSessionCreate, user_id: int):
    logger.info(f"Submitting score for user {user_id}: {session_data.score}")
    logger.info(f"Eaten songs count: {len(session_data.eaten_songs)}")
    
    try:
        # Verify user exists
        user_check = supabase.table("users").select("id").eq("id", user_id).execute()
        if not user_check.data:
            logger.warning(f"User {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Convert Pydantic models to dict for JSON storage
        eaten_songs_json = [song.dict() for song in session_data.eaten_songs]
        
        new_session = {
            "user_id": user_id,
            "score": session_data.score,
            "eaten_songs": eaten_songs_json
        }
        
        result = supabase.table("game_sessions").insert(new_session).execute()
        logger.info(f"Score saved successfully with {len(eaten_songs_json)} songs.")
        return result.data[0]
        
    except Exception as e:
        logger.error(f"Error saving score: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/leaderboard")
def get_leaderboard(limit: int = 10):
    logger.info(f"Fetching leaderboard (limit={limit})")
    try:
        # Fetch sessions with user data (fetch more to ensure we get enough unique users)
        response = supabase.table("game_sessions")\
            .select("*, users(id, display_name, profile_image)")\
            .order("score", desc=True)\
            .limit(100)\
            .execute()
            
        # Deduplicate by user_id, keeping the highest score
        unique_users = {}
        for item in response.data:
            user_data = item['users']
            if not user_data: continue # Skip if no user data
            
            user_id = user_data['id']
            if user_id not in unique_users:
                unique_users[user_id] = {
                    "id": item['id'],
                    "score": item['score'],
                    "created_at": item['created_at'],
                    "user": user_data
                }
        
        # Convert to list and take top limit
        results = list(unique_users.values())[:limit]
            
        return results
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/history/{session_id}")
def get_history(session_id: int):
    logger.info(f"Fetching history for session {session_id}")
    try:
        response = supabase.table("game_sessions").select("eaten_songs").eq("id", session_id).execute()
        if not response.data:
            logger.warning(f"Session {session_id} not found")
            raise HTTPException(status_code=404, detail="Session not found")
            
        return response.data[0]['eaten_songs']
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
