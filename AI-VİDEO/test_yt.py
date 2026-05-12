import os, json, googleapiclient.discovery
from google.oauth2.credentials import Credentials

with open('youtube_token.json', 'r') as f:
    token_data = json.load(f)

credentials = Credentials(
    token=token_data['token'],
    refresh_token=token_data['refresh_token'],
    token_uri=token_data['token_uri'],
    client_id=token_data['client_id'],
    client_secret=token_data['client_secret'],
    scopes=token_data['scopes']
)

try:
    youtube = googleapiclient.discovery.build('youtube', 'v3', credentials=credentials)
    request = youtube.channels().list(part='snippet,contentDetails,statistics', mine=True)
    response = request.execute()
    print('Channels:', response)
except Exception as e:
    print('ERROR:', e)
