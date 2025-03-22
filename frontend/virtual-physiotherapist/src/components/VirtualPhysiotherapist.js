import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import { Check } from 'lucide-react';

// Main component
const VirtualPhysiotherapist = () => {
  const [step, setStep] = useState('initial'); // initial, questionnaire, exercise
  const [responses, setResponses] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [exerciseSteps, setExerciseSteps] = useState([]);
  const [currentExerciseStep, setCurrentExerciseStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialSymptom, setInitialSymptom] = useState('');

  // Hardcoded questionnaire based on initial symptom
  const questionnaires = {
    neck: [
      "Do you feel pain when turning your head to the left or right?",
      "Is the pain sharp or dull?",
      "Rate your pain from 1-10"
    ],
    back: [
      "Where in your back is the pain located?",
      "Does the pain radiate to other parts of your body?",
      "What activities make the pain worse?"
    ],
    shoulder: [
      "Can you raise your arm above your head?",
      "Do you feel a clicking sensation when moving your shoulder?",
      "Is the pain worse at night?"
    ]
  };

  // Hardcoded exercises (normally would come from backend)
  const exercises = {
    neck: [
      "Stand up straight with your shoulders relaxed",
      "Slowly tilt your head to the left, hold for 10 seconds",
      "Slowly tilt your head to the right, hold for 10 seconds"
    ],
    back: [
      "Lie on your back with knees bent",
      "Tighten your abdominal muscles and press your lower back into the floor",
      "Hold for 10 seconds, then relax"
    ],
    shoulder: [
      "Stand with your arm at your side",
      "Slowly raise your arm forward and up until you feel a gentle stretch",
      "Slowly lower your arm back down"
    ]
  };

  // Initial greeting and symptom gathering
  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!initialSymptom) return;
    
    setStep('questionnaire');
  };

  // Handle questionnaire responses
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    const answer = e.target.elements.answer.value;
    if (!answer) return;

    // Store the response
    setResponses({
      ...responses,
      [questionnaires[initialSymptom][currentQuestion]]: answer
    });
    
    // Move to next question or finish questionnaire
    if (currentQuestion < questionnaires[initialSymptom].length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      e.target.elements.answer.value = "";
    } else {
      setLoading(true);
      
      // Simulate API call to backend
      setTimeout(() => {
        // In a real app, you would send the responses to your backend:
        // const result = await fetch('/api/analyze', {
        //   method: 'POST',
        //   body: JSON.stringify({symptom: initialSymptom, responses})
        // });
        // const data = await result.json();
        // setExerciseSteps(data.exerciseSteps);
        
        // For demo, we'll use our hardcoded exercises
        setExerciseSteps(exercises[initialSymptom]);
        setStep('exercise');
        setLoading(false);
      }, 1500);
    }
  };

  // Move to next exercise step
  const handleNextStep = () => {
    if (currentExerciseStep < exerciseSteps.length - 1) {
      setCurrentExerciseStep(currentExerciseStep + 1);
    } else {
      // Exercise complete
      setStep('complete');
    }
  };

  // Reset the app
  const handleReset = () => {
    setStep('initial');
    setResponses({});
    setCurrentQuestion(0);
    setExerciseSteps([]);
    setCurrentExerciseStep(0);
    setInitialSymptom('');
  };

  // Audio context and analyzer for lip sync
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(null);
  
  // Set up audio context for lip sync
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext && step === 'exercise') {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      
      audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      analyserRef.current = analyser;
      
      return () => {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      };
    }
  }, [step]);
  
  // Text-to-speech function to speak instructions with lip sync
  const speakInstruction = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
      if (femaleVoice) utterance.voice = femaleVoice;
      
      // Connect to audio analyzer if available
      if (analyserRef.current && audioRef.current) {
        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(new Blob([text], { type: 'audio/wav' }));
        audioRef.current = audioElement;
        
        const source = analyserRef.current.context.createMediaElementSource(audioElement);
        source.connect(analyserRef.current);
        analyserRef.current.connect(analyserRef.current.context.destination);
        
        // Start audio playback
        audioElement.play();
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak exercise step when it changes
  useEffect(() => {
    if (step === 'exercise' && exerciseSteps.length > 0) {
      speakInstruction(exerciseSteps[currentExerciseStep]);
    }
  }, [currentExerciseStep, exerciseSteps, step]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Virtual Physiotherapist</h1>
      
      {/* Initial symptom gathering */}
      {step === 'initial' && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
          <p className="mb-4">Please tell me what feels wrong so I can help you.</p>
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label htmlFor="symptom" className="block text-sm font-medium text-gray-700 mb-1">
                Main symptom area:
              </label>
              <select 
                id="symptom"
                value={initialSymptom}
                onChange={(e) => setInitialSymptom(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a symptom area</option>
                <option value="neck">Neck pain</option>
                <option value="back">Back pain</option>
                <option value="shoulder">Shoulder pain</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue
            </button>
          </form>
        </div>
      )}
      
      {/* Questionnaire */}
      {step === 'questionnaire' && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Assessment Questions</h2>
          <p className="font-medium mb-4">Question {currentQuestion + 1} of {questionnaires[initialSymptom].length}</p>
          <form onSubmit={handleQuestionSubmit} className="space-y-4">
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                {questionnaires[initialSymptom][currentQuestion]}
              </label>
              <input 
                type="text"
                id="answer"
                name="answer"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {currentQuestion < questionnaires[initialSymptom].length - 1 ? 'Next Question' : 'Complete Assessment'}
            </button>
          </form>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Analyzing your responses...</h2>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Exercise */}
      {step === 'exercise' && (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Recommended Exercise</h2>
          <div className="mb-4">
            <div className="font-medium">Step {currentExerciseStep + 1} of 3:</div>
            <p className="text-lg p-2 bg-blue-50 rounded">{exerciseSteps[currentExerciseStep]}</p>
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-center space-x-6 mb-4">
            {[0, 1, 2].map((index) => (
              <div 
                key={index} 
                className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                  index < currentExerciseStep 
                    ? 'bg-green-500 text-white' // Completed
                    : index === currentExerciseStep
                      ? 'bg-blue-500 text-white' // Current step
                      : 'bg-gray-200 text-gray-400 border-2 border-gray-300' // Upcoming
                }`}
              >
                {index < currentExerciseStep ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-semibold">{index + 1}</span>
                )}
              </div>
            ))}
          </div>
          
          {/* 3D model container */}
          <div className="h-96 bg-gray-100 rounded-lg mb-4">
            <Canvas camera={{ position: [0, 1.5, 3] }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <Model 
                exerciseType={initialSymptom} 
                stepIndex={currentExerciseStep}
                audioDataRef={audioDataRef}
              />
              <OrbitControls />
            </Canvas>
          </div>
          
          <button 
            onClick={handleNextStep}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {currentExerciseStep < exerciseSteps.length - 1 ? 'Next Step' : 'Complete Exercise'}
          </button>
        </div>
      )}
      
      {/* Exercise complete */}
      {step === 'complete' && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Exercise Complete!</h2>
          <p className="mb-6">Great job! Remember to perform this exercise 3 times daily for best results.</p>
          <button 
            onClick={handleReset}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

// 3D Model component with lip sync
const Model = ({ exerciseType, stepIndex, audioDataRef }) => {
  const headRef = useRef();
  const mouthRef = useRef();
  
  // Update animation frame
  useEffect(() => {
    let animationFrameId;
    
    const animate = () => {
      // Handle lip sync if audio data is available
      if (audioDataRef?.current) {
        // Get audio analyzer data for lip sync
        const analyser = audioDataRef.current?.analyser;
        if (analyser) {
          analyser.getByteFrequencyData(audioDataRef.current);
          
          // Calculate mouth opening based on audio volume
          const average = audioDataRef.current.reduce((a, b) => a + b) / audioDataRef.current.length;
          const normalizedValue = Math.min(1, average / 128);
          
          // Apply to mouth morph target or scale
          if (mouthRef.current) {
            mouthRef.current.scale.y = 1 + normalizedValue * 1.5;
          }
        }
      }
      
      // Apply exercise-specific animations
      if (headRef.current) {
        if (exerciseType === 'neck') {
          if (stepIndex === 1) {
            // Tilt head left animation
            headRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.1 + 0.2;
          } else if (stepIndex === 2) {
            // Tilt head right animation
            headRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.1 - 0.2;
          } else {
            // Stand straight
            headRef.current.rotation.z = Math.sin(Date.now() * 0.0005) * 0.05;
          }
        } else if (exerciseType === 'shoulder') {
          if (stepIndex === 1) {
            // Raise arm animation
            headRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1 + 0.1;
          } else if (stepIndex === 2) {
            // Lower arm animation
            headRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1 - 0.1;
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [exerciseType, stepIndex, audioDataRef]);
  
  // In a real implementation, you would:
  // 1. Load your character model with useGLTF
  // 2. Load animations with useAnimations
  // 3. Play the appropriate animation based on exerciseType and stepIndex
  
  // Simplified character model with head and mouth
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1, 16, 16]} />
        <meshStandardMaterial color="#8899aa" />
      </mesh>
      
      {/* Head with tilt animation */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        {/* Head */}
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial color="#ffcd94" />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.15, 0.05, 0.3]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="white" />
          <mesh position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>
        </mesh>
        <mesh position={[0.15, 0.05, 0.3]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="white" />
          <mesh position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>
        </mesh>
        
        {/* Mouth with lip sync */}
        <mesh ref={mouthRef} position={[0, -0.15, 0.3]}>
          <boxGeometry args={[0.2, 0.05, 0.05]} />
          <meshStandardMaterial color="#cc6666" />
        </mesh>
      </group>
      
      {/* Arms */}
      <mesh position={[-0.6, 0.3, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.15, 0.7, 16, 16]} />
        <meshStandardMaterial color="#8899aa" />
      </mesh>
      <mesh position={[0.6, 0.3, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.15, 0.7, 16, 16]} />
        <meshStandardMaterial color="#8899aa" />
      </mesh>
    </group>
  );
};

export default VirtualPhysiotherapist;