import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import apiClient from '../services/apiClient';
import UserVideoFeed from './UserVideoFeed';
import ChatHistorySidebar from './ChatHistorySidebar';
import ThinkingBox from "./ThinkingBox";
import { model } from '@tensorflow/tfjs';
import { io } from "socket.io-client";

// Model component remains unchanged
const Model = React.forwardRef((props, ref) => {
  // Load the GLB model from the public folder
  const { scene } = useGLTF('/test.glb');
  
  // Load FBX animations
  const { animations: idleAnimation } = useFBX('/animations/Breathing Idle.fbx');
  const { animations: greetingAnimation } = useFBX('/animations/Standing Greeting.fbx');
  const { animations: neckStretching } = useFBX('/animations/Neck Stretching.fbx');
  const { animations: shakingHandsAnimation } = useFBX('/animations/Shaking Hands 1.fbx');
  const { animations: talkingQuestionAnimation } = useFBX('/animations/Talking Question.fbx');
  const { animations: talkingStandingAnimation } = useFBX('/animations/Talking Standing.fbx');
  const { animations: thinkingAnimation } = useFBX('/animations/Thinking.fbx');
  
  // Name animations (ensuring they match when we reference them)
  idleAnimation[0].name = "idle";
  greetingAnimation[1].name = "greeting";
  neckStretching[1].name = "neckStretching";
  shakingHandsAnimation[1].name = "shakingHands";
  talkingQuestionAnimation[1].name = "talkingQuestion";
  talkingStandingAnimation[1].name = "talkingStanding";
  thinkingAnimation[0].name = "thinking";
  
  // Add debug logs to see animation data
  console.log("Idle animation loaded:", idleAnimation);
  console.log("Greeting animation loaded:", greetingAnimation);
  console.log("Neck stretching animation loaded:", neckStretching);
  console.log("Shaking hands animation loaded:", shakingHandsAnimation);
  console.log("Talking question animation loaded:", talkingQuestionAnimation);
  console.log("Talking standing animation loaded:", talkingStandingAnimation);
  console.log("Thinking animation loaded: ", thinkingAnimation);

  // Animation state
  const [animation, setAnimation] = useState("idle");
  
  // Group ref for animations
  const group = useRef();

  // Combine animations for the useAnimations hook
  const animations = [
    idleAnimation[0], 
    greetingAnimation[1], 
    neckStretching[1],
    shakingHandsAnimation[1],
    talkingQuestionAnimation[1],
    talkingStandingAnimation[1],
    thinkingAnimation[0]
  ];
  
  // Setup animations using useAnimations hook
  const { actions, mixer } = useAnimations(animations, group);
  
  // Enable shadows on the model
  useEffect(() => {
    if (scene) {
      scene.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }
  }, [scene]);
  
  // Initialize animations when they become available
  useEffect(() => {
    // Wait until actions are loaded
    if (actions.idle && actions.greeting) {
      console.log("Animations loaded successfully");
      
      // Start with greeting animation
      actions.greeting.reset().fadeIn(0.5).play();
      
      // Switch to idle after greeting animation completes
      const greetingDuration = actions.greeting._clip.duration;
      console.log("Greeting animation duration:", greetingDuration, "seconds");
      
      // Set a timeout to switch to idle after the greeting animation finishes
      const timeoutId = setTimeout(() => {
        console.log("Greeting animation finished, switching to idle");
        setAnimation("idle");
      }, greetingDuration * 1000); // Convert seconds to milliseconds
      
      return () => {
        clearTimeout(timeoutId);
        if (mixer) {
          mixer.stopAllAction();
        }
      };
    } else {
      console.warn("Actions not available yet", actions);
    }
    
    // Cleanup function
    return () => {
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, [actions, mixer]);
  
  // Handle animation changes
  useEffect(() => {
    const currentAction = actions[animation];
    const prevAction = Object.values(actions).find(
      action => action.isRunning() && action !== currentAction
    );
    
    if (currentAction && prevAction) {
      // Fade from previous to current animation
      prevAction.fadeOut(0.5);
      currentAction.reset().fadeIn(0.5).play();
      
      console.log(`Changing animation to: ${animation}`);
    } else if (currentAction) {
      // Just play current if no previous
      currentAction.reset().fadeIn(0.5).play();
      console.log(`Playing animation: ${animation}`);
    }
  }, [animation, actions]);
  
  // Encapsulated animation functions
  const playGreeting = () => {
    setAnimation("greeting");
  };
  
  const playIdle = () => {
    setAnimation("idle");
  };
  
  const playNeckStretch = () => {
    setAnimation("neckStretching");
  };
  
  const playShakingHands = () => {
    setAnimation("shakingHands");
  };
  
  const playTalkingQuestion = () => {
    setAnimation("talkingQuestion");
  };
  
  const playTalkingStanding = () => {
    setAnimation("talkingStanding");
  };

  const playThinking = () => {
    setAnimation("thinking");
  }
  
  // Neck stretch specific animations
  const neckStretchRight = () => {
    // First switch to the neck stretching animation
    setAnimation("neckStretching");
    
    // After a small delay to ensure the animation is loaded
    setTimeout(() => {
      if (actions.neckStretching) {
        console.log("Starting right tilt animation");
        
        // Reset the animation to beginning
        actions.neckStretching.reset();
        
        // We'll use the animation mixer to manually control position
        const neckStretchClip = actions.neckStretching._clip;
        const fullDuration = neckStretchClip.duration;
        
        // Define right tilt as first 30% of the animation
        const rightTiltEnd = fullDuration * 0.3;
        
        // Start playing from the beginning
        actions.neckStretching.play();
        
        // Set up a watcher to stop at the right point
        const checkInterval = setInterval(() => {
          if (actions.neckStretching.time >= rightTiltEnd) {
            console.log("Right tilt completed at time:", actions.neckStretching.time);
            actions.neckStretching.paused = true;
            clearInterval(checkInterval);
          }
        }, 100); // Check every 100ms
      }
    }, 100);
  };
  
  const neckStretchHold = () => {
    // This simply ensures the animation is paused
    if (actions.neckStretching) {
      actions.neckStretching.paused = true;
      console.log("Animation paused at time:", actions.neckStretching.time);
    }
  };
  
  const neckStretchLeft = () => {
    // Make sure we're using the neck stretching animation
    setAnimation("neckStretching");
    
    // After a small delay to ensure the animation is loaded
    setTimeout(() => {
      if (actions.neckStretching) {
        console.log("Starting left tilt animation");
        
        // Get the full duration of the animation
        const neckStretchClip = actions.neckStretching._clip;
        const fullDuration = neckStretchClip.duration;
        
        // Define left tilt as 40% to 70% of animation
        const leftTiltStart = fullDuration * 0.4;
        const leftTiltEnd = fullDuration * 0.7;
        
        // Start from the left tilt position
        actions.neckStretching.reset();
        actions.neckStretching.time = leftTiltStart;
        actions.neckStretching.paused = false;
        actions.neckStretching.play();
        
        // Set up a watcher to stop at the right point
        const checkInterval = setInterval(() => {
          if (actions.neckStretching.time >= leftTiltEnd) {
            console.log("Left tilt completed at time:", actions.neckStretching.time);
            actions.neckStretching.paused = true;
            clearInterval(checkInterval);
          }
        }, 100); // Check every 100ms
      }
    }, 100);
  };
  
  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    // Basic animations
    greet: playGreeting,
    idle: playIdle,
    neckStretch: playNeckStretch,
    shakingHands: playShakingHands,
    talkingQuestion: playTalkingQuestion,
    talkingStanding: playTalkingStanding,
    think: playThinking,
    
    // Neck stretching specific movements
    neckStretchRight,
    neckStretchHold,
    neckStretchLeft
  }));
  
  return (
    <Center>
      <group ref={group} {...props}>
        <primitive 
          object={scene} 
          position={[0, -5, 0]} 
          scale={1.2}
          rotation={[(Math.PI + 0.2)/ 2 * 3, 0, 0]} // Rotate the model 180 degrees around Y axis to face forward
          castShadow
          receiveShadow
        />
      </group>
    </Center>
  );
});

const VirtualPhysiotherapist = () => {
    // Original state variables
    const [audioUrl, setAudioUrl] = useState(null);
    const [currentExercise, setCurrentExercise] = useState(null);
    const [headPose, setHeadPose] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [showVideoFeed, setShowVideoFeed] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [slidedIn, setSlidedIn] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const [showCaptions, setShowCaptions] = useState(true);
    const [currentCaption, setCurrentCaption] = useState("");
    const [isCaptionVisible, setIsCaptionVisible] = useState(false);
    const [questionStep, setQuestionStep] = useState(0);
    const [showThinking, setShowThinking] = useState(false);
    const [treatmentPlan, setTreatmentPlan] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const modelRef = useRef();
    const lastFeedbackTime = useRef(Date.now());

    const [isThinking, setIsThinking] = useState(true);
    const [exercises] = useState([
      "Stand up straight.",
      "Tilt your head to the left, hold for 5 seconds.",
      "Tilt your head to the right, hold for 5 seconds."
    ]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1);
    const [exerciseStatuses, setExerciseStatuses] = useState(['inactive', 'inactive', 'inactive']);
    const [holdStartTime, setHoldStartTime] = useState(null);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);

    // Define the questions array
    const questions = [
      { text: "Let me see if i can help you out! Can you please tell me what kind of problem you're experiencing. Please make sure to tell me what part of your body is affected specifically, like your neck, lower back, knee, et cetera", animation: "talkingQuestion" },
      { text: "Gotcha, now how would you describe the severity of your pain? For example, is it more of a dull ache or sharp consistent pain?", animation: "talkingQuestion" },
      { text: "Thank you for letting me know. Finally, are there any activities or movements that trigger the pain or make it worse?", animation: "talkingQuestion" }
    ];

    // Socket and recording state variables
    const [socketResponse, setSocketResponse] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [audioStream, setAudioStream] = useState(null);
    const [recordedResponses, setRecordedResponses] = useState({
      q1: "",
      q2: "",
      q3: ""
    });
    const [socket, setSocket] = useState(null);

    // Setup socket connection when component mounts
    useEffect(() => {
      console.log("Setting up socket connection...");
      
      const newSocket = io("http://localhost:8000", {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Connection event handlers for debugging
      newSocket.on("connect", () => {
        console.log("Socket connected successfully!", newSocket.id);
      });
      
      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
      
      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });
      
      // Set up ping_received listener
      newSocket.on("ping_received", (data) => {
        console.log("Received ping:", data);
        // Increment counter to trigger recording toggle
        setSocketResponse(prev => prev + 1);
      });
      
      // Add a testing function to the window
      window.sendPing = () => {
        console.log("Sending ping_event");
        newSocket.emit("ping_event", {
          device_id: "virtual_physiotherapist",
          message: "Test ping",
          timestamp: new Date().toISOString()
        });
      };
      
      // Store the socket in state
      setSocket(newSocket);
      
      return () => {
        // Cleanup
        console.log("Cleaning up socket connection");
        delete window.sendPing;
        newSocket.disconnect();
      };
    }, []);

    // Toggle recording whenever socketResponse changes
    useEffect(() => {
      if (socketResponse > 0) { // Skip initial render
        toggleRecording();
      }
    }, [socketResponse]);

    // Process responses when all questions are answered
    useEffect(() => {
      if (questionStep === 4) {
        // All questions answered, send to treatment
        // Modified processResponses function inside the useEffect for questionStep === 4
        const processResponses = async () => {
            // Show thinking animation
            setShowThinking(true);
            if (modelRef.current) {
            modelRef.current.think();
            }
            
            // Format responses for the API
            const formattedMessage = formatTranscriptions();
            console.log("Sending to treatment API:", formattedMessage);
            
            try {
            const res = await fetch("http://localhost:8000/treatment", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({ questionnaire: formattedMessage }),
            });
        
            if (!res.ok) {
                throw new Error("Failed to fetch treatment plan.");
            }
            
            console.log("Fetching data from LLM");
            const data = await res.json();
            console.log("Treatment response:", data);
            
            // Store the treatment plan data
            console.log("DEBUG " + data)
            setTreatmentPlan(data);
            
            
            
            } catch (err) {
            console.error("Error in treatment API call:", err);
            
            // Still continue with exercise sequence even if API fails
            setTimeout(() => {
                startExerciseSequence();
            }, 4000);
            }
        };
  
        processResponses();
      }
    }, [questionStep]);


     // Use effect to trigger slide-in and introduction on component mount
     useEffect(() => {
        // After "thinking" for 4 seconds, start the exercise sequence
        if (treatmentPlan){
            setTimeout(() => {
                startExerciseSequence();
            }, 2000);
        }
        
      }, [treatmentPlan]);

    // Format transcriptions for treatment API
    const formatTranscriptions = () => {
      return `Q1: ${questions[0].text}, A: ${recordedResponses.q1 || ""} Q2: ${questions[1].text}, A: ${recordedResponses.q2 || ""} Q3: ${questions[2].text}, A: ${recordedResponses.q3 || ""}.`;
    };

    // Toggle recording function - similar to Whisper component
    const toggleRecording = async () => {
      if (!isRecording) {
        // Start recording
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const mediaRecorder = new MediaRecorder(stream);
          const audioChunks = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            console.log("Recording stopped, processing audio...");
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

            console.log("Audio blob created:", audioBlob);

            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            formData.append("model", "whisper-1");

            const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
            console.log("key: " + OPENAI_API_KEY)

            try {
              console.log("Sending request to Whisper API...");
              const response = await fetch(
                "https://api.openai.com/v1/audio/transcriptions",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                  },
                  body: formData,
                }
              );

              if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              if (data.text) {
                // Update the recorded responses
                setRecordedResponses(prev => ({
                  ...prev,
                  [`q${questionStep}`]: data.text
                }));
              }

              console.log("Transcription result:", data);

              // Move to next question
              setQuestionStep(prev => prev + 1);
              
              // Prepare for next question if needed
              if (questionStep < 3) {
                setTimeout(() => {
                  askQuestion(questionStep);
                }, 2000);
              }
              
            } catch (error) {
              console.error("Error transcribing audio:", error);
              // Still move to next question even if transcription fails
              setQuestionStep(prev => prev + 1);
              
              if (questionStep < 3) {
                setTimeout(() => {
                  askQuestion(questionStep);
                }, 2000);
              }
            }
          };

          setAudioStream({ stream, mediaRecorder });
          mediaRecorder.start();
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      } else if (audioStream) {
        audioStream.mediaRecorder.stop();
        audioStream.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(!isRecording);
    };

    // Use effect to trigger slide-in and introduction on component mount
    useEffect(() => {
      // Delay to ensure everything is loaded
      const timer = setTimeout(() => {
        handleSlideInIntroduction();
      }, 5000);
      
      return () => clearTimeout(timer);
    }, []);

    // Function to ask a specific question
    const askQuestion = (index) => {

        console.log("index: " + index);

      if (index >= questions.length) return;
      
      const question = questions[index];
      
      if (modelRef.current) {
        // Play the appropriate animation for the question
        if (question.animation && modelRef.current[question.animation]) {
          modelRef.current[question.animation]();
        }
        
        // Speak the question
        apiClient.playQuestionAudio(index + 1);
        handleCaptionUpdate(question.text);
      }
    };

    // Modified startExerciseSequence function
    const startExerciseSequence = () => {
        // Switch from thinking to exercise mode
        
        // Update the first exercise to active
        const updatedStatuses = [...exerciseStatuses];
        updatedStatuses[0] = 'active';
        setExerciseStatuses(updatedStatuses);
        setCurrentExerciseIndex(0);
        setCurrentStepIndex(0);
        
        // Have the avatar demonstrate standing up straight
        if (modelRef.current) {
        // First, play the intro audio from the treatment plan
        modelRef.current.talkingStanding();

        console.log("DEBUG2: " + treatmentPlan);
        
        if (treatmentPlan && treatmentPlan.intro) {
            // Play the intro audio (the base64 string should be stored in treatmentPlan.intro)
            playBase64Audio(treatmentPlan.intro_audio);
            
            // Update captions with the text content
            if (treatmentPlan.intro.text) {
            handleCaptionUpdate(treatmentPlan.intro.text);
            console.log(treatmentPlan.intro.text);
            } else {
            handleCaptionUpdate("I've found some exercises that should help with your condition.");
            }
        } else {
            // Fallback if no treatment plan is available
            const instructionText = "I've found some exercises that should help. Let's start with these simple neck stretches.";
            apiClient.speakWithBrowserTTS(instructionText);
            handleCaptionUpdate(instructionText);
        }
        
        // After intro, demonstrate first exercise
        setTimeout(() => {
            console.log("DEBUG: after intro play next exercise for question number " + currentStepIndex)
            playNextExerciseStep();
            setIsThinking(false);

        }, 10000);
        }
    };

    // Function to play the next exercise step
    const playNextExerciseStep = () => {
        if (!treatmentPlan || !treatmentPlan.steps) {
        // If no treatment plan, use default behavior
        modelRef.current.idle();
        return;
        }
        
        const stepKeys = Object.keys(treatmentPlan.steps).sort();
        console.log("playnextexericse: " + currentStepIndex + "and length is "+stepKeys.length)
        if (currentStepIndex >= (stepKeys.length)) {
        // If we've completed all steps, play the outro
        playOutro();
        return;
        }
        
        const currentStep = treatmentPlan.steps[stepKeys[currentStepIndex]];
        
        // Update avatar animation based on action
        if (currentStep.action) {
        const action = currentStep.action.toLowerCase();
        
        if (action.includes('tilt') && action.includes('right')) {
            modelRef.current.neckStretchRight();
        } else if (action.includes('tilt') && action.includes('left')) {
            modelRef.current.neckStretchLeft();
        } else {
            // Default to idle for other actions
            modelRef.current.idle();
        }
        }
        
        // Play the audio for this step
        if (currentStep) {
        playBase64Audio(currentStep.description_audio);
        
        // Update captions with the text content
        if (currentStep.description) {
            handleCaptionUpdate(currentStep.description);
        }
        }
        
        // Move to the next exercise index and step
        setCurrentStepIndex(prev => prev + 1);
    };
  
    // Function to play the outro
    const playOutro = () => {
        if (!treatmentPlan || !treatmentPlan.outro) {
        // Default outro behavior
        const congratsText = "Excellent work! You've completed all the exercises. This should help relieve your pain.";
        console.log("DEBUG: played tts outro because there is no treatment plan, this is what we have: " + treatmentPlan)
        apiClient.speakWithBrowserTTS(congratsText);
        handleCaptionUpdate(congratsText);
        modelRef.current.talkingStanding();
        return;
        }
        
        // Play the outro audio
        modelRef.current.talkingStanding();
        playBase64Audio(treatmentPlan.outro_audio);
        
        // Update captions with the text content
        if (treatmentPlan.outro.text) {
        handleCaptionUpdate(treatmentPlan.outro.text);
        }
    };
    
    // Helper function to play base64 audio
    const playBase64Audio = (audioData) => {
        if (!audioData) return;
        
        // If it's a string, assume it's base64 audio
        if (typeof audioData === 'string') {
        const audio = new Audio(`data:audio/mpeg;base64,${audioData}`);
        audio.play();
        return;
        }
        
        // If it's an object with an audio property, play that
        if (audioData.audio) {
        const audio = new Audio(`data:audio/mpeg;base64,${audioData.audio}`);
        audio.play();
        return;
        }
    };

    // Updated introduction function
    const handleSlideInIntroduction = () => {
      // Slide in the model
      setSlidedIn(true);
      // Mark animation available
      setAnimationComplete(true);
    
      // If the model is ready, play greeting + speak AT THE SAME TIME
      if (modelRef.current) {
        // 1) Greeting animation + introduction speech
        modelRef.current.greet(); 
        const introText = "Welcome to Rekovery, I'm your physiotherapy assistant!";
        apiClient.playIntro();
        handleCaptionUpdate(introText);
    
        // 2) After 4 seconds, ask "How can I help you?"
        setTimeout(() => {
          if (modelRef.current) {
            modelRef.current.talkingQuestion();
            const helpText = "How can I help you today?";
    
            // Optional tiny delay so the model is in talkingQuestion pose first
            setTimeout(() => {
              apiClient.playHelp();
              handleCaptionUpdate(helpText);
              
            //   // 3) After another 4 seconds, ask first question
            //   setTimeout(() => {
            //     askQuestion(0);
            //   }, 4000);
            }, 500);
          }
        }, 4000);
      }
    };

    // Function to update captions
    const handleCaptionUpdate = (text) => {
      if (showCaptions) {
        setCurrentCaption(text);
        setIsCaptionVisible(true);
        
        // Hide caption after speech would likely be completed (rough calculation)
        const wordsPerMinute = 150; // Average speaking rate
        const words = text.split(' ').length;
        const durationInMs = (words / wordsPerMinute) * 60 * 1000;
        
        // Minimum duration of 2 seconds, maximum of 8 seconds
        const displayTime = Math.max(2000, Math.min(durationInMs, 8000));
        
        setTimeout(() => {
          setIsCaptionVisible(false);
        }, displayTime);
      }
    };

    // Function to manually trigger a ping (for testing)
    const triggerPing = () => {
      if (socket) {
        console.log("Manually triggering ping");
        socket.emit("ping_event", {
          device_id: "manual_test",
          message: "Manual ping test",
          timestamp: new Date().toISOString()
        });
      } else {
        console.error("Socket not initialized yet");
      }
    };

    // Toggle sidebar visibility
    const toggleSidebar = () => {
      setShowSidebar(prev => !prev);
    };
    
    // Toggle captions
    const toggleCaptions = () => {
      setShowCaptions(prev => !prev);
      
      // If turning captions off, hide any currently visible caption
      if (showCaptions) {
        setIsCaptionVisible(false);
      }
    };

    // Handler for head pose updates from video feed - memoize to prevent recreation
    const handleHeadPoseUpdate = useCallback((pose) => {
      // Use functional update to avoid unnecessary re-renders
      console.log("DEBUG:checking to update")

      setHeadPose(prev => {
        // If the pose is very similar to the previous one, don't update state
        if (prev && pose) {
          const yawDiff = Math.abs(prev.yaw - pose.yaw);
          const rollDiff = Math.abs(prev.roll - pose.roll);
          const pitchDiff = Math.abs(prev.pitch - pose.pitch);
          
          // Only update if there's a significant change
          if (yawDiff < 2 && rollDiff < 2 && pitchDiff < 2) {
            console.log("DEBUG: no update to yaw and pitch")

            return prev; // Return previous state to avoid re-render
          }
        }
        console.log("DEBUG: UPDATED yaw and pitch")
        return pose; // Return new pose if it's significantly different
      });
      
      // Evaluate head pose for different scenarios
      const now = Date.now();
      
      // Case 1: For guided exercise sequence
      if (pose && !isThinking && currentExerciseIndex >= 0 && now - lastFeedbackTime.current > 300) {
        evaluateHeadPose(pose);
        lastFeedbackTime.current = now;
      }
      // Case 2: For original exercise modes
      else if (currentExercise && pose && 
          ['neck-right', 'neck-left', 'neck-hold'].includes(currentExercise) &&
          now - lastFeedbackTime.current > 500) { 
        evaluateHeadPose(pose, currentExercise);
        lastFeedbackTime.current = now;
      }
    }, [currentExercise, isThinking, currentExerciseIndex, exerciseStatuses, holdStartTime]);

    const evaluateHeadPose = (pose, exercise) => {
        
        // If we're in exercise mode and not in a specific exercise
        if (!isThinking && currentExerciseIndex >= 0 && !exerciseCompleted) {
          console.log("DEBUG: current index is "+currentExerciseIndex)
          console.log("DEBUG: pitch: "+pose.pitch + " and yaw: " + pose.yaw)
          switch (currentExerciseIndex) {
            case 0: // Stand up straight
            //   console.log("DEBUG: case 0 is here:  "+currentStepIndex+"pitch: "+headPose.pitch + " and yaw: " + headPose.yaw)

              if (pose.yaw < 10 && pose.pitch < 10 && pose.yaw > -10 && pose.pitch > -10) {
                // console.log("DEBUG: passed the check for index:  "+currentExerciseIndex)

                // Start timing the hold if not already started
                if (!holdStartTime) {
                  setHoldStartTime(Date.now());
                  setFeedback({
                    message: "Good posture! Keep holding for 5 seconds...",
                    status: "good"
                  });
                } else {
                  // Check if we've held for 5 seconds
                  const holdDuration = (Date.now() - holdStartTime) / 1000;
                  
                  if (holdDuration >= 5) {
                    // Mark first exercise as completed and activate second
                    const updatedStatuses = [...exerciseStatuses];
                    updatedStatuses[0] = 'completed';
                    updatedStatuses[1] = 'active';
                    setExerciseStatuses(updatedStatuses);
                    setCurrentExerciseIndex(1);
                    setHoldStartTime(null);
                    
                    // Play the next exercise step
                    console.log("DEBUG: case 0 play next exercise for question number " + currentStepIndex);
                    playNextExerciseStep();
                  }
                }
              } else {
                // Reset hold timer if user moves out of position
                if (holdStartTime) {
                  setHoldStartTime(null);
                  setFeedback({
                    message: "Try to face the camera directly with your head straight",
                    status: "warning"
                  });
                }
              }
              break;
              
            case 1: // Tilt head to the left
              if (pose.roll < -15) { // Negative roll indicates left tilt
                // Start timing the hold if not already started
                if (!holdStartTime) {
                  setHoldStartTime(Date.now());
                  setFeedback({
                    message: "Good! Keep holding for 5 seconds...",
                    status: "good"
                  });
                } else {
                  // Check if we've held for 5 seconds
                  const holdDuration = (Date.now() - holdStartTime) / 1000;
                  
                  if (holdDuration >= 5) {
                    // Mark second exercise as completed and activate third
                    const updatedStatuses = [...exerciseStatuses];
                    updatedStatuses[1] = 'completed';
                    updatedStatuses[2] = 'active';
                    setExerciseStatuses(updatedStatuses);
                    setCurrentExerciseIndex(2);
                    setHoldStartTime(null);
                    
                    // Avatar demonstrates tilting head to the right
                    if (modelRef.current) {
                      const rightTiltText = "Perfect! Now tilt your head to the right and hold for 5 seconds.";
                      // apiClient.generateSpeech(rightTiltText);
                      console.log("DEBUG: case 1 play next exercise for question number " + currentStepIndex)
                      playNextExerciseStep();
                      handleCaptionUpdate(rightTiltText);
                      setTimeout(() => modelRef.current.neckStretchRight(), 500);
                    }
                  }
                }
              } else {
                // Reset hold timer if user moves out of position
                if (holdStartTime) {
                  setHoldStartTime(null);
                  setFeedback({
                    message: "Try to tilt your head to the left",
                    status: "warning"
                  });
                }
              }
              break;
              
            case 2: // Tilt head to the right
              if (pose.roll > 15) { // Positive roll indicates right tilt
                // Start timing the hold if not already started
                if (!holdStartTime) {
                  setHoldStartTime(Date.now());
                  setFeedback({
                    message: "Good! Keep holding for 5 seconds...",
                    status: "good"
                  });
                } else {
                  // Check if we've held for 5 seconds
                  const holdDuration = (Date.now() - holdStartTime) / 1000;
                  
                  if (holdDuration >= 5) {
                    // Mark third exercise as completed
                    const updatedStatuses = [...exerciseStatuses];
                    updatedStatuses[2] = 'completed';
                    setExerciseStatuses(updatedStatuses);
                    setExerciseCompleted(true);
                    setHoldStartTime(null);
                    
                    // Avatar congratulates the user
                    if (modelRef.current) {
                      modelRef.current.idle();
                      setTimeout(() => {
                        const congratsText = "Excellent work! You've completed all the exercises. This should help relieve your neck pain.";
                        // apiClient.generateSpeech(congratsText);
                        console.log("DEBUG: case 2 play next exercise for question number " + currentStepIndex)
                        playNextExerciseStep();
                        handleCaptionUpdate(congratsText);
                        modelRef.current.talkingStanding();
                      }, 1000);
                    }
                  }
                }
              } else {
                // Reset hold timer if user moves out of position
                if (holdStartTime) {
                  setHoldStartTime(null);
                  setFeedback({
                    message: "Try to tilt your head to the right",
                    status: "warning"
                  });
                }
              }
              break;
          }
        }
      // Original pose evaluation for other exercises...
      else if (exercise) {
        // Keep the original exercise evaluation logic here
        switch (exercise) {
          case 'neck-left':
            // Original neck-left evaluation
            break;
          case 'neck-hold':
            // Original neck-hold evaluation
            break;
          case 'neck-right':
            // Original neck-right evaluation
            break;
          default:
            // Original default evaluation
        }
      }
    };

    // Toggle video feed visibility
    const toggleVideoFeed = () => {
      setShowVideoFeed(prev => !prev);
    };

    // Memoize the model to prevent re-renders
    const MemoizedModel = useMemo(() => {
      return (
        <Model ref={modelRef} />
      );
    }, []); // Empty dependency array means this only renders once

    // Memoize the video feed to prevent re-renders
    const MemoizedVideoFeed = useMemo(() => {
      if (!showVideoFeed) return null;
      
      return (
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          width: '320px', // Fixed width
          height: 'auto', // Height adjusts based on content
          overflow: 'hidden' // Prevent content overflow
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
            color: '#222'
          }}>Your Camera Feed</h3>
          
          <div style={{ 
            width: '290px', // Fixed width for the feed container
            height: '217.5px', // Fixed height (4:3 aspect ratio)
            overflow: 'hidden', // Hide overflow
            borderRadius: '5px',
            backgroundColor: '#f0f0f0',
            marginBottom: '10px',
            position: 'relative' // For positioning StatusIndicator
          }}>
            <UserVideoFeed onHeadPoseUpdate={handleHeadPoseUpdate} />
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            fontSize: '14px',
            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
            color: '#333',
            padding: '8px',
            backgroundColor: '#f3f3f3',
            borderRadius: '5px'
          }}>
          <div 
          style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: '500', 
              marginBottom: '5px'
          }}
          >
          <span>Head Rotation:</span>
          <span>
              {headPose
              ? headPose.yaw < -10
                  ? 'Left'
                  : headPose.yaw > 10
                  ? 'Right'
                  : 'Neutral'
              : 'Neutral'}
          </span>
          </div>
          <div 
          style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '5px'
          }}
          >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Yaw (left/right):</span>
              <span>{headPose ? headPose.yaw.toFixed(1) : '0.0'}°</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pitch (up/down):</span>
              <span>{headPose ? headPose.pitch.toFixed(1) : '0.0'}°</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Roll (tilt):</span>
              <span>{headPose ? headPose.roll.toFixed(1) : '0.0'}°</span>
          </div>
          </div>
            <div style={{ 
              marginTop: '5px', 
              display: 'flex', 
              justifyContent: 'space-between',
              borderTop: '1px solid #e0e0e0',
              paddingTop: '5px'
            }}>
              <span>Confidence:</span>
              <span>{headPose ? (headPose.confidence * 100).toFixed(1) : '0.0'}%</span>
            </div>
          </div>
        </div>
      );
    }, [showVideoFeed, handleHeadPoseUpdate, headPose]); // Only re-render when these change

    // CSS styles for buttons
    const buttonStyle = {
      backgroundColor: '#ffffff',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      cursor: 'pointer',
      fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    };
    
    const topButtonStyle = {
      ...buttonStyle,
      padding: '8px',
      width: '40px',
      height: '40px'
    };
    
    const captionButtonStyle = {
      ...topButtonStyle,
      backgroundColor: showCaptions ? '#4CAF50' : '#ffffff',
      color: showCaptions ? 'white' : 'black',
    };
    
    const activeButtonStyle = (animationName) => ({
      backgroundColor: currentExercise === animationName ? '#4CAF50' : '#ffffff',
      color: currentExercise === animationName ? 'white' : 'black',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      cursor: 'pointer'
    });

    // Return the enhanced UI with captions
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        margin: 0, 
        padding: 0, 
        paddingTop: '150px',
        background: 'linear-gradient(to bottom, #e6f5ff, #b3e0ff)',
        overflow: 'hidden'
      }}>
        {/* Top navigation with Sidebar Toggle and Captions Toggle */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          display: 'flex',
          gap: '10px',
          zIndex: 20,
        }}>
          {/* Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            style={topButtonStyle}
            aria-label="Toggle Sidebar"
          >
            <div style={{ fontSize: '20px' }}>☰</div>
          </button>
          
          {/* Captions Toggle Button */}
          <button
            onClick={toggleCaptions}
            style={captionButtonStyle}
            aria-label="Toggle Captions"
            title={showCaptions ? "Hide Captions" : "Show Captions"}
          >
            <div style={{ fontSize: '20px' }}>CC</div>
          </button>
          
          {/* Debug button for testing - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={triggerPing}
              style={{...topButtonStyle, backgroundColor: '#ff9800', color: 'white'}}
              title="Test Ping"
            >
              <div style={{ fontSize: '16px' }}>🔔</div>
            </button>
          )}
        </div>

        {/* Chat Sidebar */}
        <ChatHistorySidebar 
          isVisible={showSidebar} 
          onClose={toggleSidebar} 
        />
        
        {/* Captions Display */}
        <div 
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: `translateX(-50%) scale(${isCaptionVisible ? 1 : 0})`,
            opacity: isCaptionVisible ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            maxWidth: '80%',
            textAlign: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            zIndex: 10,
            marginBottom: '20px'
          }}
        >
          {currentCaption}
        </div>

        <ThinkingBox 
          isVisible={showThinking}
          isThinking={isThinking}
          exercises={exercises}
          currentExerciseIndex={currentExerciseIndex}
          exerciseStatuses={exerciseStatuses}
          onClose={() => setShowThinking(false)}
        />      
        
        <Canvas 
          camera={{ position: [0, 0, 4], fov: 60 }}
          shadows
        >
          {/* Soft ambient light */}
          <ambientLight intensity={0.5} />
          
          {/* Main directional light with shadow */}
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={2} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* Secondary fill light */}
          <directionalLight position={[-5, 5, 5]} intensity={2} />

          <directionalLight position={[10, 0, 10]} intensity={2} />

          {/* Model container with slide-in animation */}
          <group
            position={[
              slidedIn ? 0 : 8, // Start off-screen to the right, slide to center
              0,
              0
            ]}
            style={{
              transition: 'transform 1s ease-out'
            }}
          >
            {/* Model */}
            {MemoizedModel}
          </group>
          
          {/* Gradient floor that fades out from the center */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -.35, 0]} 
            receiveShadow
          >
            <planeGeometry args={[80, 80, 1, 1]} />
            <shaderMaterial
              attach="material"
              uniforms={{
                color1: { value: new THREE.Color("#96d5ff") }, // Darker blue
                color2: { value: new THREE.Color("#e6f5ff") }, // Light blue (same as background)
                center: { value: new THREE.Vector2(0, 0) },
                radius: { value: 10.0 }, // Size of the visible floor
                fadeDistance: { value: 10.0 }, // Distance over which the floor fades out
                opacity: { value: 1.0 }
              }}
              vertexShader={`
                varying vec2 vUv;
                varying vec4 worldPosition;
                
                void main() {
                  vUv = uv;
                  worldPosition = modelMatrix * vec4(position, 1.0);
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec2 center;
                uniform float radius;
                uniform float fadeDistance;
                uniform float opacity;
                
                varying vec2 vUv;
                varying vec4 worldPosition;
                
                void main() {
                  // Calculate distance from center
                  float dist = distance(vec2(worldPosition.x, worldPosition.z), center);
                  
                  // Calculate opacity based on distance
                  float fadeStart = radius - fadeDistance;
                  float alpha = 1.0 - smoothstep(fadeStart, radius, dist);
                  
                  // Mix colors based on distance
                  vec3 color = mix(color1, color2, smoothstep(0.0, radius, dist));
                  
                  gl_FragColor = vec4(color, alpha * opacity);
                }
              `}
              transparent={true}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Shadow-catching plane */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.351, 0]} 
            receiveShadow
          >
            <planeGeometry args={[80, 80]} />
            <shadowMaterial opacity={0.8} transparent={true} />
          </mesh>
          
          <OrbitControls 
            enablePan={false}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
        
        {/* Video feed with head pose estimation - fade in after animation */}
        <div style={{
          opacity: animationComplete ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
        }}>
          {MemoizedVideoFeed}
        </div>
        
        {/* Audio controls - hidden by default but kept for debugging */}
        {audioUrl && (
          <audio
            src={audioUrl}
            controls
            style={{ 
              position: 'absolute', 
              bottom: 20, 
              left: 20,
              opacity: 0, // Hidden by default
              height: 0,
              width: 0
            }}
          />
        )}
        
        {/* Status indicator for recording */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 20
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#f44336',
              animation: 'pulse 1.5s infinite'
            }} />
            <span>Recording...</span>
          </div>
        )}
        
        {/* Add global styles for animations */}
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
          `}
        </style>
      </div>
    );
};

// Preload the model
useGLTF.preload('/test.glb');

export default VirtualPhysiotherapist;