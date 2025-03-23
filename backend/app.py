# app.py
import json
import os

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
from datetime import datetime

from elevenlabs import ElevenLabs
from google import genai


from helpers import *

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/', methods=['GET', 'OPTIONS'])
def index():
    return jsonify({
                'status': 'success',
                'message': "Hello there!"
            }), 200


@app.route('/treatment', methods=["POST", "OPTIONS"])
def treatment():
    """
    Use an LLM to generate the correct treatment plan based on the 
    issue the user is experiencing. 
    """
    print("Got into the function")
    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        # Allows requests from specified domains
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Sample JSON payload response:
    sample_exercise_json = """
    {
        "exercise": "Neck stretch",
        "intro": "We're going to start out with an exercise that's going to help improve the range of motion in your neck!"
        "steps": {
            "1": {
                "action": "Tilt neck to left",
                "description": "We are going to start by tilting our neck to the left toward our shoulder for a few seconds." 
            },
            "2": {
                "action": "Tilt neck to right",
                "description": "Next, we are going to tilt our neck to the right toward our other shoulder for a few seconds."
            }
        },
        "outro": "And we're done! This exercise will help you get a good stretch throughout the sides of your neck and your traps, improving your range of motion and helping ease your pain little by little."
    }
    """

    data = request.get_json()
    questionnaire = data.get('questionnaire', 'I have pain in my neck')    # empty default value for now
    # Simple intro message to the user

    # Create the system prompt to send to Gemini
    system_prompt = f"""
    You are a licensed physiotherapist consulting on a patient who needs your
    help finding an exercise to ease help ease their pain, rehab an injury,
    and/or improve their range of motion. 

    Below is the list of questions about the patient's pain/injury and their 
    responses to each one, which will give you some insight into the type 
    of issue they are dealing with:

    {questionnaire}

    Based on their answers to this question, put together ONE physiotherapy
    exercise that best suits the problem or pain they are experiencing. 

    You have this list of actions at your disposal to put together an exercise:
    - Tilt neck to left
    - Tilt neck to right
    - Rotate neck to left 
    - Rotate neck to right
    - Lift right arm up
    - Lift left arm up 
    - Reach left arm over head
    - Reach right arm over head 
    - Stretch left arm across body
    - Stretch right arm across body 
    - Lift left knee up
    - Life right knee up
    - Lunge with left leg
    - Lunge with right leg

    Name the exercise and then put the entire exercise together using 2 to 4
    of the actions above as steps for the patient to complete one by one.
    Your response should follow the format of this example, providing all the 
    data in the format of a JSON payload:

    {sample_exercise_json}

    Now, it's your turn, please generate a response in the same format as the JSON 
    payload above for the patient's issue. Please output only the JSON payload and no
    other text around it (do not include markdown formatting like ```json).
    """

    # These might not be necessary anymore given that ElevenLabs is on the frontend
    intro = data.get('intro', "Okay, I'm gonna show you an exercise to help you with this pain")
    outro = data.get('outro', "Generate a message suggesting they should be ")

    # Up to date code
    gemini_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=gemini_key)
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=system_prompt
    )
    payload = extract_json_from_markdown(response.text)
    
    # For debugging
    print(payload)

    # Convert all text to audio files
    client = ElevenLabs(
        api_key=os.environ.get("ELEVEN_LABS_API_KEY"),
    )
    audio_payload = apply_to_all_string_values(payload, generate_audio_payload, client)

    return jsonify(audio_payload), 200

@app.route('/pose', methods=['POST', 'OPTIONS'])
def pose_estimation(request):
    pass

# Route to accept request from button and emit notification to frontend client listening to socket
# @app.route('/trigger-recording', methods=['POST'])
# def trigger_recording():
#     """Endpoint to trigger recording from an admin interface or external system."""
#     # You could add authentication here - no way 
#     action = request.json.get('action', 'start')
    
#     if action == 'start':
#         # Broadcast to all connected clients to start recording
#         socketio.emit('audio_command', {'command': 'start_recording'})
#         return {'status': 'success', 'message': 'Start recording command sent to all clients'}
#     elif action == 'stop':
#         socketio.emit('audio_command', {'command': 'stop_recording'})
#         return {'status': 'success', 'message': 'Stop recording command sent to all clients'}
#     else:
#         return {'status': 'error', 'message': 'Invalid action'}, 400

@socketio.on('trigger_recording')
def handle_trigger(data):
    """Handle recording trigger requests via WebSocket."""
    # You could add authentication check here
    print("Hello we are triggered")
    action = data.get('action', 'start')
    print(action)
    
    if action == 'start':
        # Broadcast to all connected clients to start recording
        socketio.emit('audio_command', {'command': 'start_recording'})
        # Send acknowledgment back to the requesting client
        return {'status': 'success', 'message': 'Start recording command broadcast to all clients'}
    elif action == 'stop':
        socketio.emit('audio_command', {'command': 'stop_recording'})
        return {'status': 'success', 'message': 'Stop recording command broadcast to all clients'}
    else:
        return {'status': 'error', 'message': 'Invalid action'}    

# Probably not going to get used but whatever
@socketio.on('audio_data')
def handle_audio_data(data):
    """Receive audio data from the client."""
    # Here you would process or store the received audio data
    # data might contain audio chunks in base64 format
    print(f"Received audio data chunk of size: {len(data.get('audio', ''))}")
    
    # You might save this to a file, database, or process it
    # For demonstration, we'll just acknowledge receipt
    emit('audio_received', {'status': 'success'})

@socketio.on('connect')
def test_connect():
    print('Client connected')
    emit('server_response', {'data': 'Connected'})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

@socketio.on('ping_event')
def handle_ping_event(json):
    print('Received ping from device: ' + str(json))
    # Broadcast the ping to all connected clients except the sender
    emit('ping_received', {
        'device_id': json.get('device_id', 'unknown'),
        'message': json.get('message', ''),
        'timestamp': json.get('timestamp', '')
    }, broadcast=True, include_self=True)

if __name__ == '__main__':
    # app.run(debug=True)
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)