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
        'cgSgspJ2msm6clMCkdW9'; // Jessica's voice ID (female voice)
      
      if (!this.elevenLabsApiKey) {
        console.warn(
          'Warning: ElevenLabs API key not found in environment variables.'
        );
      }
  
      // Cache for preloaded question audio files
      this.questionAudio = {
        q1: null,
        q2: null,
        q3: null
      };

      this.intro = {
        intro: null,
        help: null,
      }
  
      // Audio recording state
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.recordingPromise = null;
      this.recordingResolver = null;
  
      // Init function to preload audio
      this.initAudio();
    }
  
    // Preload the question audio files
    async initAudio() {
      try {
        // Load all three question audio files
        const [q1Audio, q2Audio, q3Audio, introAudio, helpAudio] = await Promise.all([
          this.loadAudioFile('/audio/q1.mp3'),
          this.loadAudioFile('/audio/q2.mp3'),
          this.loadAudioFile('/audio/q3.mp3'),
          this.loadAudioFile('/audio/rekovery.mp3'),
          this.loadAudioFile('/audio/help_msg.mp3')
        ]);
  
        this.questionAudio.q1 = q1Audio;
        this.questionAudio.q2 = q2Audio;
        this.questionAudio.q3 = q3Audio;
        this.intro.intro = introAudio;
        this.intro.help = helpAudio;
        
        console.log('All question audio files loaded successfully');
      } catch (error) {
        console.error('Error loading question audio files:', error);
      }
    }
  
    // Load an audio file and return it as an HTMLAudioElement
    async loadAudioFile(path) {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = path;
        
        audio.oncanplaythrough = () => {
          resolve(audio);
        };
        
        audio.onerror = (err) => {
          console.error(`Error loading audio file ${path}:`, err);
          reject(err);
        };
  
        // Start loading the audio
        audio.load();
      });
    }

    playIntro() {
        return new Promise((resolve) => {
            this.intro.intro.onended = resolve;
            this.intro.intro.play().catch(err => {
              console.error(`Error playing intro audio:`, err);
              resolve(); // Resolve anyway to prevent blocking
            });
          });
    }

    playHelp() {
        return new Promise((resolve) => {
            this.intro.help.onended = resolve;
            this.intro.help.play().catch(err => {
              console.error(`Error playing intro audio:`, err);
              resolve(); // Resolve anyway to prevent blocking
            });
          });
    }
  
    // Play a specific question audio
    playQuestionAudio(questionNumber) {
      const audioKey = `q${questionNumber}`;
      
      if (this.questionAudio[audioKey]) {
        // Stop any currently playing audio
        Object.values(this.questionAudio).forEach(audio => {
          if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
        });
  
        console.log(`Playing question ${questionNumber} audio`);
        
        // Return a promise that resolves when audio finishes playing
        return new Promise((resolve) => {
          this.questionAudio[audioKey].onended = resolve;
          this.questionAudio[audioKey].play().catch(err => {
            console.error(`Error playing question ${questionNumber} audio:`, err);
            resolve(); // Resolve anyway to prevent blocking
          });
        });
      } else {
        console.warn(`Question ${questionNumber} audio not loaded`);
        return Promise.resolve(); // Return resolved promise if audio not loaded
      }
    }
  
    // Start recording audio
    startRecording() {
      if (this.mediaRecorder) {
        this.stopRecording();
      }
  
      this.audioChunks = [];
      this.recordingPromise = new Promise((resolve) => {
        this.recordingResolver = resolve;
      });
  
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.mediaRecorder = new MediaRecorder(stream);
          
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };
          
          this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.recordingResolver(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
          };
          
          this.mediaRecorder.start();
          console.log('Recording started');
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          this.recordingResolver(null);
        });
  
      return this.recordingPromise;
    }
  
    // Stop recording and return the audio blob
    stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        console.log('Recording stopped');
      }
      
      return this.recordingPromise || Promise.resolve(null);
    }
  
    // Transcribe audio using Whisper API
    async transcribeAudio(audioBlob) {
      if (!audioBlob) {
        return null;
      }
  
      console.log('Transcribing audio with Whisper API');
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
  
      try {
        // Get OpenAI API Key from environment
        const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
        
        if (!OPENAI_API_KEY) {
          throw new Error('OpenAI API key not found in environment variables');
        }
  
        const response = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: formData
          }
        );
  
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Whisper API Error:', errorData);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('Transcription result:', data);
        
        return data.text || '';
      } catch (error) {
        console.error('Error transcribing audio:', error);
        return '';
      }
    }
  
    // Send transcriptions to treatment endpoint and get audio response
    async sendToTreatment(transcriptions) {
      console.log('Sending transcriptions to treatment endpoint:', transcriptions);
      
      try {
        const response = await fetch('http://localhost:8000/treatment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ questionnaire: transcriptions })
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch treatment plan: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('Treatment response:', data);
        
        return data;
      } catch (error) {
        console.error('Error sending transcriptions to treatment endpoint:', error);
        return null;
      }
    }
  
    // Play treatment audio response
    async playTreatmentAudio(audioUrl) {
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audio.onended = resolve;
        audio.onerror = () => {
          console.error('Error playing treatment audio');
          resolve();
        };
        audio.play().catch(err => {
          console.error('Error playing treatment audio:', err);
          resolve();
        });
      });
    }
  
    // Handle the complete question-response flow
    async handleQuestionResponseFlow(questionNumber, onTranscriptionComplete) {
      // 1. Play the question audio
      await this.playQuestionAudio(questionNumber);
      
      // 2. Start recording the answer
      console.log(`Starting recording for question ${questionNumber}`);
      const recordingPromise = this.startRecording();
      
      // 3. Wait for socket event to stop recording (will be called externally)
      // This will be triggered by the socket ping event in the component
      
      // 4. When stopRecording is called, transcribe the audio
      const handleTranscription = async () => {
        const audioBlob = await recordingPromise;
        if (!audioBlob) {
          console.error('No audio recorded');
          return null;
        }
        
        // Transcribe the audio
        const transcription = await this.transcribeAudio(audioBlob);
        
        // Call the callback with the transcription
        if (onTranscriptionComplete) {
          onTranscriptionComplete(questionNumber, transcription);
        }
        
        return transcription;
      };
      
      // Return the handler function that will be called when recording should stop
      return {
        stopRecording: () => {
          console.log(`Stopping recording for question ${questionNumber}`);
          this.stopRecording();
          return handleTranscription();
        }
      };
    }
  
    // Format transcriptions for the treatment endpoint
    formatTranscriptionsForTreatment(transcriptions) {
      const questions = [
        "Let me see if i can help you out! Can you please tell me what kind of problem you're experiencing. Please make sure to tell me what part of your body is affected specifically, like your neck, lower back, knee, et cetera",
        "Gotcha, now jow would you describe the severity of your pain? For example, is it more of a dull ache or sharp consistent pain?",
        "Thank you for letting me know. Finally, are there any activities or movements that trigger the pain or make it worse?"
      ];
      
      return `Q1: ${questions[0]}, A: ${transcriptions.q1 || ""} Q2: ${questions[1]}, A: ${transcriptions.q2 || ""} Q3: ${questions[2]}, A: ${transcriptions.q3 || ""}.`;
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