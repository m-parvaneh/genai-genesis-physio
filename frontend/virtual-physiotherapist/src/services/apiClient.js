// src/services/apiClient.js

/**
 * API client for handling both Flask backend and ElevenLabs services
 */
class ApiClient {
    constructor() {
      // Configure base URLs
      this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      this.elevenLabsUrl = 'https://api.elevenlabs.io/v1';
      
      // ElevenLabs configuration
      this.elevenLabsApiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
      this.voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default female voice
    }
  
    /**
     * Set the ElevenLabs API key
     * @param {string} apiKey - ElevenLabs API key
     */
    setElevenLabsApiKey(apiKey) {
      this.elevenLabsApiKey = apiKey;
    }
  
    /**
     * Set a specific ElevenLabs voice ID
     * @param {string} voiceId - ElevenLabs voice ID
     */
    setVoice(voiceId) {
      this.voiceId = voiceId;
    }
  
    /**
     * Send assessment data to Flask backend and get recommended exercises
     * @param {string} symptomArea - Main symptom area (e.g., 'neck', 'back')
     * @param {Object} responses - User's questionnaire responses
     * @returns {Promise<Object>} - Recommended exercises and steps
     */
    async getExerciseRecommendation(symptomArea, responses) {
      try {
        const response = await fetch(`${this.backendUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symptom: symptomArea,
            responses
          }),
        });
  
        if (!response.ok) {
          throw new Error(`Backend API error: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error getting exercise recommendation:', error);
        throw error;
      }
    }
  
    /**
     * Track user's exercise step completion
     * @param {string} exerciseId - ID of the exercise
     * @param {number} stepNumber - Step number completed
     * @returns {Promise<Object>} - Updated progress info
     */
    async trackStepCompletion(exerciseId, stepNumber) {
      try {
        const response = await fetch(`${this.backendUrl}/api/track-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercise_id: exerciseId,
            step: stepNumber
          }),
        });
  
        if (!response.ok) {
          throw new Error(`Backend API error: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error tracking step completion:', error);
        throw error;
      }
    }
  
    /**
     * Generate speech using ElevenLabs API
     * @param {string} text - Text to convert to speech
     * @returns {Promise<ArrayBuffer>} - Audio data as ArrayBuffer
     */
    async generateSpeech(text) {
      if (!this.elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is required');
      }
  
      try {
        const response = await fetch(
          `${this.elevenLabsUrl}/text-to-speech/${this.voiceId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': this.elevenLabsApiKey,
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
        }
  
        return await response.arrayBuffer();
      } catch (error) {
        console.error('Error generating speech:', error);
        throw error;
      }
    }
  
    /**
     * Get available voices from ElevenLabs
     * @returns {Promise<Array>} - List of available voices
     */
    async getVoices() {
      if (!this.elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is required');
      }
  
      try {
        const response = await fetch(`${this.elevenLabsUrl}/voices`, {
          method: 'GET',
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
          },
        });
  
        if (!response.ok) {
          throw new Error(`Failed to get voices: ${response.statusText}`);
        }
  
        const data = await response.json();
        return data.voices || [];
      } catch (error) {
        console.error('Error getting voices:', error);
        throw error;
      }
    }
  
    /**
     * Fallback to browser's speech synthesis if ElevenLabs isn't available
     * @param {string} text - Text to speak
     */
    speakWithBrowserTTS(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to use a female voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.includes('girl') ||
          voice.name.includes('woman')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    }
  }
  
  export default new ApiClient();