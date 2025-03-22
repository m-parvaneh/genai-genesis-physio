// src/services/apiClient.js

class ApiClient {
    constructor() {
      this.elevenLabsUrl = 'https://api.elevenlabs.io/v1';
  
      // Load from environment if available:
      this.elevenLabsApiKey =
        process.env.REACT_APP_ELEVENLABS_API_KEY ||
        process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  
      // Hardcode or load from env
      this.voiceId =
        process.env.REACT_APP_ELEVENLABS_VOICE_ID ||
        process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ||
        '21m00Tcm4TlvDq8ikWAM'; // Rachel’s voice ID (female voice)
  
      if (!this.elevenLabsApiKey) {
        console.warn(
          'Warning: ElevenLabs API key not found in environment variables.'
        );
      }
    }
  
    setElevenLabsApiKey(apiKey) {
      this.elevenLabsApiKey = apiKey;
    }
  
    setVoice(voiceId) {
      this.voiceId = voiceId;
    }
  
    async generateSpeech(text) {
      if (!this.elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is missing.');
      }
      // Use the default female voice if none was set
      if (!this.voiceId) {
        this.voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel
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
                style_exaggeration: 1,
              },
            }),
          }
        );
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `ElevenLabs API error: ${errorData.detail || response.statusText}`
          );
        }
  
        return await response.arrayBuffer();
      } catch (error) {
        console.error('Error generating speech:', error);
        throw error;
      }
    }
  
    async getVoices() {
      if (!this.elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is required.');
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
  
    // Browser fallback if ElevenLabs fails or is missing an API key
    speakWithBrowserTTS(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
  
        // Attempt to pick a female-sounding local voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('girl') ||
            v.name.toLowerCase().includes('woman')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
  
        window.speechSynthesis.speak(utterance);
      }
    }
  }
  
  export default new ApiClient();
  