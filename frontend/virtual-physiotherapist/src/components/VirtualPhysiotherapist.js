import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import apiClient from '../services/apiClient';
import UserVideoFeed from './UserVideoFeed';
import ChatHistorySidebar from './ChatHistorySidebar';
import ThinkingBox from "./ThinkingBox";
import { model } from '@tensorflow/tfjs';

// Simple 3D model component with animations
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
    { text: "Where is the pain?", animation: "talkingQuestion" },
    { text: "How bad is it?", animation: "talkingQuestion" },
    { text: "What makes it worse?", animation: "talkingQuestion" }
  ];

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
        if (index >= questions.length) return;
        
        const question = questions[index];
        
        if (modelRef.current) {
          // Play the appropriate animation for the question
          if (question.animation && modelRef.current[question.animation]) {
            modelRef.current[question.animation]();
          }
          
          // Speak the question
          apiClient.speakWithBrowserTTS(question.text);
          handleCaptionUpdate(question.text);
          
          // Move to the next question automatically
          // In a real app, you'd wait for user input before moving on
          if (index < questions.length - 1) {
            setQuestionStep(index + 1);
          } else {
            // This is the last question, move to the next step
            setQuestionStep(questions.length);
          }
        }
      };

    const startExerciseSequence = () => {
    // Switch from thinking to exercise mode
    setIsThinking(false);
    
    // Update the first exercise to active
    const updatedStatuses = [...exerciseStatuses];
    updatedStatuses[0] = 'active';
    setExerciseStatuses(updatedStatuses);
    setCurrentExerciseIndex(0);
    
    // Have the avatar demonstrate standing up straight
    if (modelRef.current) {
        // First, explain what we're going to do
        modelRef.current.talkingStanding();
        const instructionText = "I've found some exercises that should help. Let's start with these simple neck stretches.";
        apiClient.speakWithBrowserTTS(instructionText);
        handleCaptionUpdate(instructionText);
        
        // After brief explanation, demonstrate first exercise
        setTimeout(() => {
        const exerciseText = "First, stand up straight with your shoulders relaxed.";
        apiClient.speakWithBrowserTTS(exerciseText);
        handleCaptionUpdate(exerciseText);
        modelRef.current.idle(); // Stand straight for the first exercise
        }, 3000);
    }
    };

// New function for sliding in the model from the right and introducing itself
const handleSlideInIntroduction = () => {
    // Slide in the model
    setSlidedIn(true);
    // Mark animation available
    setAnimationComplete(true);
  
    // If the model is ready, play greeting + speak AT THE SAME TIME
    if (modelRef.current) {
      // 1) Greeting animation + introduction speech
      modelRef.current.greet(); 
      const introText = "I am Genesis, your physiotherapy assistant.";
      apiClient.speakWithBrowserTTS(introText);
      handleCaptionUpdate(introText);
  
      // 2) After 4 seconds, ask "How can I help you?"
      setTimeout(() => {
        if (modelRef.current) {
          modelRef.current.talkingQuestion();
          const helpText = "How can I help you today?";
  
          // Optional tiny delay so the model is in talkingQuestion pose first
          setTimeout(() => {
            apiClient.speakWithBrowserTTS(helpText);
            handleCaptionUpdate(helpText);
          }, 500);
  
          // 3) After another 4 seconds, ask question #0
          setTimeout(() => {
            askQuestion(0);
  
            // 4) After 4 more seconds, ask question #1
            setTimeout(() => {
              askQuestion(1);
  
              // 5) After 4 more seconds, ask question #2
              setTimeout(() => {
                askQuestion(2);
                setTimeout(() => {
                    const sorryText = "Oh my goodness, I'm sorry you're feeling that way. Let me think of a few exercises that might help you."
                    apiClient.speakWithBrowserTTS(sorryText);
                    handleCaptionUpdate(sorryText);
                    
                    // Show thinking box
                    setShowThinking(true);
                    if (modelRef.current) {
                        modelRef.current.think();
                    }

                    // After "thinking" for 4 seconds, show the exercises
                    setTimeout(() => {
                      startExerciseSequence();
                    }, 4000);
                  }, 4000);

              }, 4000);
  
            }, 4000);
  
          }, 4000);
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

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
    console.log("Toggling sidebar:", !showSidebar); // Debug log
  };
  
  // Toggle captions
  const toggleCaptions = () => {
    setShowCaptions(prev => !prev);
    console.log("Toggling captions:", !showCaptions);
    
    // If turning captions off, hide any currently visible caption
    if (showCaptions) {
      setIsCaptionVisible(false);
    }
  };

  // Handler for head pose updates from video feed - memoize to prevent recreation
  const handleHeadPoseUpdate = useCallback((pose) => {
    // Use functional update to avoid unnecessary re-renders
    setHeadPose(prev => {
      // If the pose is very similar to the previous one, don't update state
      if (prev && pose) {
        const yawDiff = Math.abs(prev.yaw - pose.yaw);
        const rollDiff = Math.abs(prev.roll - pose.roll);
        const pitchDiff = Math.abs(prev.pitch - pose.pitch);
        
        // Only update if there's a significant change
        if (yawDiff < 2 && rollDiff < 2 && pitchDiff < 2) {
          return prev; // Return previous state to avoid re-render
        }
      }
      
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

  // Enhanced evaluateHeadPose function to handle exercise validation
const evaluateHeadPose = (pose, exercise) => {
    // Skip if not enough confidence
    if (pose.confidence < 0.65) {
      setFeedback({
        message: "Please face the camera more directly for better tracking",
        status: "warning"
      });
      return;
    }
    
    // If we're in exercise mode and not in a specific exercise
    if (!isThinking && currentExerciseIndex >= 0 && !exerciseCompleted) {
      switch (currentExerciseIndex) {
        case 0: // Stand up straight
          if (headPose.yaw < 10 && headPose.yaw < 10 && headPose.yaw > -10 && headPose.yaw > -10) {
            // Mark first exercise as completed and activate second after a short delay
            setTimeout(() => {
              // Only proceed if we're still on the first exercise
              if (currentExerciseIndex === 0) {
                const updatedStatuses = [...exerciseStatuses];
                updatedStatuses[0] = 'completed';
                updatedStatuses[1] = 'active';
                setExerciseStatuses(updatedStatuses);
                setCurrentExerciseIndex(1);
                
                // Avatar demonstrates tilting head to the left
                if (modelRef.current) {
                  const leftTiltText = "Great! Now tilt your head to the left and hold for 5 seconds.";
                  apiClient.speakWithBrowserTTS(leftTiltText);
                  handleCaptionUpdate(leftTiltText);
                  setTimeout(() => modelRef.current.neckStretchLeft(), 500);
                }
              }
            }, 2000); // Wait 2 seconds to confirm pose
            
            setFeedback({
              message: "Good posture! Hold still...",
              status: "good"
            });
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
                  apiClient.speakWithBrowserTTS(rightTiltText);
                  handleCaptionUpdate(rightTiltText);
                  setTimeout(() => modelRef.current.neckStretchRight(), 500);
                }
              }
            }
          } else {
            // Reset hold timer if user moves out of position
            if (holdStartTime) {
              setHoldStartTime(null);
            }
          }
          break;
          
        case 2: // Tilt head to the right
          if (pose.roll > 15) { // Positive roll indicates right tilt
            // Start timing the hold if not already started
            if (!holdStartTime) {
              setHoldStartTime(Date.now());
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
                    apiClient.speakWithBrowserTTS(congratsText);
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
      </div>

      {/* <LoadingPopup isVisible={showLoadingPopup} /> */}


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
    </div>
  );
};

// Preload the model
useGLTF.preload('/test.glb');

export default VirtualPhysiotherapist;