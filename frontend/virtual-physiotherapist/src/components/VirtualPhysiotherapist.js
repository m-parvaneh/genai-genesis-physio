import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import apiClient from '../services/apiClient';
import UserVideoFeed from './UserVideoFeed';
import ChatHistorySidebar from './ChatHistorySidebar';
import ThinkingBox from "./ThinkingBox";

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
  thinkingAnimation[1].name = "thinking";
  
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
    talkingStandingAnimation[1]
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

                // 6) After 4 more seconds, ask question #3
                setTimeout(() => {
                    const sorryText = "Oh my goodness, I'm sorry you're feeling that way. Let me think of a few exercises that might help you."
                    apiClient.speakWithBrowserTTS(sorryText);
                    handleCaptionUpdate(sorryText);
                    setShowThinking(true);
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
  
  // Helper function to speak text with appropriate animation
  const speakWithAnimation = (text) => {
    try {
      // Update captions first
      handleCaptionUpdate(text);
      
      // Try to use ElevenLabs
      apiClient.generateSpeech(text)
        .then((arrayBuffer) => {
          const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const tempUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(tempUrl);
          
          // Auto-play
          const audio = new Audio(tempUrl);
          audio.play();
        })
        .catch((error) => {
          console.error('Error generating speech:', error);
          // If ElevenLabs fails, fallback to built-in voice
          apiClient.speakWithBrowserTTS(text);
        });
    } catch (error) {
      console.error('Error generating speech:', error);
      // Direct fallback
      apiClient.speakWithBrowserTTS(text);
    }
  };

  // Animation control functions - encapsulated for clarity
  const handleSpeakIntro = async () => {
    setCurrentExercise(null);
    try {
      // Play greeting animation
      if (modelRef.current) {
        console.log("Triggering greeting animation");
        modelRef.current.greet();
      } else {
        console.warn("Model reference not available");
      }
      
      const introText = 'Hello, I am Genesis, your virtual physiotherapist. How can I help you today?';
      handleCaptionUpdate(introText);
      
      const arrayBuffer = await apiClient.generateSpeech(introText);
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const tempUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(tempUrl);

      // Auto-play
      const audio = new Audio(tempUrl);
      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      // If ElevenLabs fails, fallback to built-in voice
      const introText = 'Hello, I am Genesis, your virtual physiotherapist. How can I help you today?';
      apiClient.speakWithBrowserTTS(introText);
      handleCaptionUpdate(introText);
    }
  };

  const handleNeckStretch = () => {
    setCurrentExercise('neck');
    if (modelRef.current) {
      console.log("Starting neck stretching exercise");
      modelRef.current.neckStretch();
      
      // Return to idle after the neck stretching animation completes
      const neckStretchDuration = 10; // Approximate duration in seconds
      setTimeout(() => {
        console.log("Neck stretching exercise completed, returning to idle");
        if (modelRef.current) {
          modelRef.current.idle();
          setCurrentExercise(null);
        }
      }, neckStretchDuration * 1000);
      
      // Speak instructions for the exercise
      const neckText = 'Let\'s do some neck stretching exercises. Follow along with me.';
      apiClient.speakWithBrowserTTS(neckText);
      handleCaptionUpdate(neckText);
    } else {
      console.warn("Model reference not available");
    }
  };

  // Handlers for specific neck stretching movements
  const handleNeckStretchRight = () => {
    setCurrentExercise('neck-right');
    if (modelRef.current) {
      console.log("Tilting head to the right");
      modelRef.current.neckStretchRight();
      
      // Speak instructions
      const rightText = 'Slowly tilt your head to the right side until you feel a gentle stretch.';
      apiClient.speakWithBrowserTTS(rightText);
      handleCaptionUpdate(rightText);
    }
  };

  const handleNeckStretchHold = () => {
    setCurrentExercise('neck-hold');
    if (modelRef.current) {
      console.log("Holding stretch position");
      modelRef.current.neckStretchHold();
      
      // Speak instructions
      const holdText = 'Hold this position for 15 to 30 seconds. Breathe deeply and feel the stretch.';
      apiClient.speakWithBrowserTTS(holdText);
      handleCaptionUpdate(holdText);
    }
  };

  const handleNeckStretchLeft = () => {
    setCurrentExercise('neck-left');
    if (modelRef.current) {
      console.log("Tilting head to the left");
      modelRef.current.neckStretchLeft();
      
      // Speak instructions
      const leftText = 'Now slowly tilt your head to the left side until you feel a gentle stretch on the other side.';
      apiClient.speakWithBrowserTTS(leftText);
      handleCaptionUpdate(leftText);
    }
  };

  const handleReturnToIdle = () => {
    setCurrentExercise(null);
    if (modelRef.current) {
      console.log("Returning to idle position");
      modelRef.current.idle();
      
      // Speak instructions
      const idleText = 'Well done! Let\'s return to the starting position.';
      apiClient.speakWithBrowserTTS(idleText);
      handleCaptionUpdate(idleText);
    }
  };
  
  // Handlers for new animations
  const handleShakingHands = () => {
    setCurrentExercise('shaking-hands');
    if (modelRef.current) {
      console.log("Playing shaking hands animation");
      modelRef.current.shakingHands();
      
      // Speak appropriate message
      const shakinigText = 'It\'s a pleasure to meet you. I\'m here to assist with your physiotherapy needs.';
      apiClient.speakWithBrowserTTS(shakinigText);
      handleCaptionUpdate(shakinigText);
    }
  };
  
  const handleTalkingQuestion = () => {
    setCurrentExercise('talking-question');
    if (modelRef.current) {
      console.log("Playing talking question animation");
      modelRef.current.talkingQuestion();
      
      // Speak appropriate message
      const questionText = 'Do you have any questions about your exercise routine?';
      apiClient.speakWithBrowserTTS(questionText);
      handleCaptionUpdate(questionText);
    }
  };
  
  const handleTalkingStanding = () => {
    setCurrentExercise('talking-standing');
    if (modelRef.current) {
      console.log("Playing talking standing animation");
      modelRef.current.talkingStanding();
      
      // Speak appropriate message
      const standingText = 'Let me explain the next set of exercises we\'ll be working on together.';
      apiClient.speakWithBrowserTTS(standingText);
      handleCaptionUpdate(standingText);
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
    
    // Only provide feedback when doing specific exercises
    // AND ONLY when the current exercise requires feedback
    // Add time-based throttling for feedback
    const now = Date.now();
    if (currentExercise && pose && 
        ['neck-right', 'neck-left', 'neck-hold'].includes(currentExercise) &&
        now - lastFeedbackTime.current > 500) { // Only update feedback every 500ms
      evaluateHeadPose(pose, currentExercise);
      lastFeedbackTime.current = now;
    }
    
    // Don't trigger any animation changes here
    // This prevents animation restarts when new head pose updates come in
  }, [currentExercise]); // Only depends on currentExercise

  // Evaluate user's head pose and provide feedback
  const evaluateHeadPose = (pose, exercise) => {
    // Skip if not enough confidence
    if (pose.confidence < 0.65) {
      setFeedback({
        message: "Please face the camera more directly for better tracking",
        status: "warning"
      });
      return;
    }
    
    // Depending on the current exercise step, evaluate proper form
    switch (exercise) {
      case 'neck-left':
        // Check if properly tilting to the right
        if (pose.roll < -10) {  // Roll is negative when tilting head right
          setFeedback({
            message: "Great! Continue tilting your head to the left gently",
            status: "good"
          });
        } else if (pose.roll > 5) {  // Tilting in wrong direction
          setFeedback({
            message: "You're tilting your head to the right instead of left",
            status: "bad"
          });
        } else {  // Not tilting enough
          setFeedback({
            message: "Try to tilt your head more to the left until you feel a stretch",
            status: "warning"
          });
        }
        break;
        
      case 'neck-hold':
        // Check if holding the position steadily
        if (Math.abs(pose.roll) < 5 && Math.abs(pose.yaw) < 10) {
          setFeedback({
            message: "Keep your head centered, that's good",
            status: "good"
          });
        } else {
          setFeedback({
            message: "Try to keep your head steady in the neutral position",
            status: "warning"
          });
        }
        break;
        
      case 'neck-right':
        // Check if properly tilting to the left
        if (pose.roll > 10) {  // Roll is positive when tilting head left
          setFeedback({
            message: "Great! Continue tilting your head to the right gently",
            status: "good"
          });
        } else if (pose.roll < -5) {  // Tilting in wrong direction
          setFeedback({
            message: "You're tilting your head to the left instead of right",
            status: "bad"
          });
        } else {  // Not tilting enough
          setFeedback({
            message: "Try to tilt your head more to the right until you feel a stretch",
            status: "warning"
          });
        }
        break;
        
      default:
        // General posture feedback
        if (Math.abs(pose.pitch) > 20) {
          setFeedback({
            message: "Try to keep your chin level, not too high or low",
            status: "warning"
          });
        } else if (Math.abs(pose.yaw) > 20) {
          setFeedback({
            message: "Try to face forward more directly",
            status: "warning"
          });
        } else {
          setFeedback({
            message: "Your head position looks good!",
            status: "good"
          });
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

      <ThinkingBox isVisible={showThinking} />
      
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
      
      {/* Feedback area - only showing when there is feedback */}
      {feedback && animationComplete && (
        <div style={{ 
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '10px', 
          padding: '15px', 
          backgroundColor: 
            feedback.status === 'good' ? 'rgba(76, 175, 80, 0.9)' : 
            feedback.status === 'warning' ? 'rgba(255, 152, 0, 0.9)' : 
            'rgba(244, 67, 54, 0.9)', 
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          zIndex: 10,
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>Feedback</h4>
          <p style={{ margin: 0 }}>{feedback.message}</p>
        </div>
      )}
      
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