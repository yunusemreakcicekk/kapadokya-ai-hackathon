import os
import json
import google_auth_oauthlib.flow
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import googleapiclient.discovery
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaFileUpload

router = APIRouter()

SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/userinfo.profile'
]

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

oauth_state = {}

@router.get("/auth/youtube/login")
def login_youtube():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        return {"error": "Lutfen .env dosyasina GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET ekleyin."}

    client_config = {
        "web": {
            "client_id": client_id,
            "project_id": "ai-video-pipeline",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret,
            "redirect_uris": ["http://localhost:8001/api/auth/youtube/callback"]
        }
    }
        
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config, scopes=SCOPES)
    flow.redirect_uri = 'http://localhost:8001/api/auth/youtube/callback'
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    # Store the code verifier in memory for the callback
    oauth_state[state] = getattr(flow, 'code_verifier', None)
    
    return RedirectResponse(url=authorization_url)

@router.get("/auth/youtube/callback")
def callback_youtube(state: str, code: str):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    client_config = {
        "web": {
            "client_id": client_id,
            "project_id": "ai-video-pipeline",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret,
            "redirect_uris": ["http://localhost:8001/api/auth/youtube/callback"]
        }
    }
    
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config, scopes=SCOPES, state=state)
    flow.redirect_uri = 'http://localhost:8001/api/auth/youtube/callback'
    
    if state in oauth_state:
        verifier = oauth_state.pop(state)
        if verifier:
            flow.code_verifier = verifier
            
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    token_data = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    with open("youtube_token.json", "w") as f:
        json.dump(token_data, f)
        
    # Redirect back to frontend
    return RedirectResponse(url="http://localhost:5173/?youtube_connected=true")

class YouTubeUploadRequest(BaseModel):
    video_path: str
    title: str
    description: str
    tags: list[str] = []

@router.post("/upload/youtube")
def upload_to_youtube(request: YouTubeUploadRequest):
    if not os.path.exists("youtube_token.json"):
        raise HTTPException(status_code=401, detail="YouTube hesabi bagli degil.")
    
    if not os.path.exists(request.video_path):
        raise HTTPException(status_code=404, detail="Video dosyasi bulunamadi.")

    with open("youtube_token.json", "r") as f:
        token_data = json.load(f)
        
    credentials = Credentials(
        token=token_data['token'],
        refresh_token=token_data['refresh_token'],
        token_uri=token_data['token_uri'],
        client_id=token_data['client_id'],
        client_secret=token_data['client_secret'],
        scopes=token_data['scopes']
    )
    
    youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)
    
    body = {
        "snippet": {
            "title": request.title,
            "description": request.description,
            "tags": request.tags,
            "categoryId": "22" 
        },
        "status": {
            "privacyStatus": "private" 
        }
    }
    
    media = MediaFileUpload(request.video_path, chunksize=-1, resumable=True)
    
    try:
        request_obj = youtube.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media
        )
        response = request_obj.execute()
        return {"status": "success", "video_id": response.get("id"), "message": "Video basariyla YouTube'a yuklendi!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
