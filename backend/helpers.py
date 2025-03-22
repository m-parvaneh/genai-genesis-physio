import base64
import json 
import os
import re 
import requests
import tempfile 
import uuid

from elevenlabs import ElevenLabs
from playsound import playsound

ELEVEN_LABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/cgSgspJ2msm6clMCkdW9?output_format=mp3_44100_128"

def extract_json_from_markdown(text):
    # Pattern to match JSON content between markdown code blocks
    # This will work for both ```json and ``` formatting
    pattern = r"```(?:json)?\s*([\s\S]*?)```"
    
    # Find the match
    match = re.search(pattern, text)
    
    if match:
        # Extract just the JSON content
        json_str = match.group(1).strip()
        
        # Parse to ensure it's valid JSON
        try:
            json_obj = json.loads(json_str)
            return json_obj
        except json.JSONDecodeError as e:
            return f"Error parsing JSON: {e}"
    else:
        return "No JSON found in the provided text"
    

def apply_to_all_string_values(dictionary, function, client):
    """
    Recursively applies a function to all string values in a dictionary.
    
    Args:
        dictionary (dict): The dictionary to process
        function (callable): The function to apply to string values
        
    Returns:
        dict: A new dictionary with the function applied to all string values
    """
    result = {}
    
    for key, value in dictionary.items():
        if isinstance(value, dict):
            # Recursively process nested dictionaries
            result[key] = apply_to_all_string_values(value, function, client)
        elif isinstance(value, str):
            result[key] = value 
            if key == "action" or key == "exercise":
                continue     
            # Apply the function to string values
            result[f"{key}_audio"] = function(client, value)
        else:
            # Keep other types unchanged
            result[key] = value
            
    return result

    
def generate_audio_payload(client, text):
    """
    Encode an audio binary file to base64 so it can be sent over
    HTTP without issues.
    """
    audio_binary = client.text_to_speech.convert(
        voice_id="cgSgspJ2msm6clMCkdW9",
        output_format="mp3_44100_128",
        text=text,
        # model_id="eleven_multilingual_v2"
        model_id="eleven_flash_v2_5"
    )
    # Writing the audio to a file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    temp_file_path = temp_file.name
    with open(temp_file_path, 'wb') as f:
        for chunk in audio_binary:
            if chunk:
                f.write(chunk)
    
    # Read in the mp3 and convert to base64
    with open(temp_file_path, 'rb') as f:
        mp3_binary = f.read()

    os.unlink(temp_file_path)
    
    return base64.b64encode(mp3_binary).decode('utf-8')