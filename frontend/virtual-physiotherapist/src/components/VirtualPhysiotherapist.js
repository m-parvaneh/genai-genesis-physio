import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import apiClient from '../services/apiClient';
import UserVideoFeed from './UserVideoFeed';

// Simple 3D model component with animations
const Model = React.forwardRef((props, ref) => {
  // Load the GLB model from the public folder
  const { scene } = useGLTF('/test.glb');
  
  // Load FBX animations
  const { animations: idleAnimation } = useFBX('/animations/Breathing Idle.fbx');
  const { animations: greetingAnimation } = useFBX('/animations/Standing Greeting.fbx');
  const { animations: neckStretching } = useFBX('/animations/Neck Stretching.fbx');
  
  // Name animations (ensuring they match when we reference them)
  idleAnimation[0].name = "idle";
  greetingAnimation[1].name = "greeting";
  neckStretching[1].name = "neckStretching";
  
  // Add debug logs to see animation data
  console.log("Idle animation loaded:", idleAnimation);
  console.log("Greeting animation loaded:", greetingAnimation);
  console.log("Neck stretching animation loaded:", neckStretching);
  
  // Animation state
  const [animation, setAnimation] = useState("greeting");
  
  // Group ref for animations
  const group = useRef();

  // Combine animations for the useAnimations hook
  const animations = [idleAnimation[0], greetingAnimation[1], neckStretching[1]];
  
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
    if (actions.idle && actions.greeting && actions.neckStretching) {
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
  
  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    greet: () => {
      setAnimation("greeting");
    },
    idle: () => {
      setAnimation("idle");
    },
    neckStretch: () => {
      setAnimation("neckStretching");
    },
    // Methods for specific neck stretching movements
    neckStretchRight: () => {
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
    },
    neckStretchHold: () => {
      // This simply ensures the animation is paused
      if (actions.neckStretching) {
        actions.neckStretching.paused = true;
        console.log("Animation paused at time:", actions.neckStretching.time);
      }
    },
    neckStretchLeft: () => {
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
    }
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

// Main component
const VirtualPhysiotherapist = () => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [headPose, setHeadPose] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showVideoFeed, setShowVideoFeed] = useState(true);
  const modelRef = useRef();
  // Create a ref to store last feedback time
  const lastFeedbackTime = useRef(Date.now());

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
      
      const arrayBuffer = await apiClient.generateSpeech(
        'Hello, I am your virtual physiotherapist. How can I help you today?'
      );
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const tempUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(tempUrl);

      // Auto-play
      const audio = new Audio(tempUrl);
      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      // If ElevenLabs fails, fallback to built-in voice
      apiClient.speakWithBrowserTTS(
        'Sorry, something went wrong with ElevenLabs. Using browser speech instead.'
      );
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
      apiClient.speakWithBrowserTTS(
        'Let\'s do some neck stretching exercises. Follow along with me.'
      );
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
      apiClient.speakWithBrowserTTS(
        'Slowly tilt your head to the right side until you feel a gentle stretch.'
      );
    }
  };

  const handleNeckStretchHold = () => {
    setCurrentExercise('neck-hold');
    if (modelRef.current) {
      console.log("Holding stretch position");
      modelRef.current.neckStretchHold();
      
      // Speak instructions
      apiClient.speakWithBrowserTTS(
        'Hold this position for 15 to 30 seconds. Breathe deeply and feel the stretch.'
      );
    }
  };

  const handleNeckStretchLeft = () => {
    setCurrentExercise('neck-left');
    if (modelRef.current) {
      console.log("Tilting head to the left");
      modelRef.current.neckStretchLeft();
      
      // Speak instructions
      apiClient.speakWithBrowserTTS(
        'Now slowly tilt your head to the left side until you feel a gentle stretch on the other side.'
      );
    }
  };

  const handleReturnToIdle = () => {
    setCurrentExercise(null);
    if (modelRef.current) {
      console.log("Returning to idle position");
      modelRef.current.idle();
      
      // Speak instructions
      apiClient.speakWithBrowserTTS(
        'Well done! Let\'s return to the starting position.'
      );
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
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Your Camera Feed</h3>
        <UserVideoFeed onHeadPoseUpdate={handleHeadPoseUpdate} />
        
        {headPose && (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <div>Head Rotation:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>Yaw (left/right): {headPose.yaw.toFixed(1)}°</span>
              <span>Pitch (up/down): {headPose.pitch.toFixed(1)}°</span>
              <span>Roll (tilt): {headPose.roll.toFixed(1)}°</span>
            </div>
            <div>Confidence: {(headPose.confidence * 100).toFixed(1)}%</div>
          </div>
        )}
      </div>
    );
  }, [showVideoFeed, handleHeadPoseUpdate, headPose]); // Only re-render when these change

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

        
        {/* Model */}
        {MemoizedModel}
        
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
      
      {/* Controls and UI section - memoized to prevent re-renders */}
      {useMemo(() => (
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleSpeakIntro}
              style={{
                backgroundColor: '#ffffff',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            >
              Speak Intro
            </button>
            <button 
              onClick={handleNeckStretch}
              style={{
                backgroundColor: '#ffffff',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            >
              Full Neck Exercise
            </button>
            <button 
              onClick={toggleVideoFeed}
              style={{
                backgroundColor: '#ffffff',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            >
              {showVideoFeed ? 'Hide' : 'Show'} Video Feed
            </button>
          </div>
          
          {/* Step-by-step neck exercise controls */}
          <div style={{ 
            marginTop: '10px', 
            padding: '15px', 
            backgroundColor: 'rgba(255,255,255,0.8)', 
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Step-by-Step Neck Exercise</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleNeckStretchRight}
                style={{ 
                  backgroundColor: currentExercise === 'neck-right' ? '#4CAF50' : '#ffffff',
                  color: currentExercise === 'neck-right' ? 'white' : 'black',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
              >
                1. Tilt Right
              </button>
              <button 
                onClick={handleNeckStretchHold}
                style={{ 
                  backgroundColor: currentExercise === 'neck-hold' ? '#4CAF50' : '#ffffff',
                  color: currentExercise === 'neck-hold' ? 'white' : 'black',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
              >
                2. Hold Position
              </button>
              <button 
                onClick={handleNeckStretchLeft}
                style={{ 
                  backgroundColor: currentExercise === 'neck-left' ? '#4CAF50' : '#ffffff',
                  color: currentExercise === 'neck-left' ? 'white' : 'black',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
              >
                3. Tilt Left
              </button>
              <button 
                onClick={handleReturnToIdle}
                style={{
                  backgroundColor: '#ffffff',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
              >
                4. Return to Start
              </button>
            </div>
          </div>
          
          {/* Feedback area */}
          {feedback && (
            <div style={{ 
              marginTop: '10px', 
              padding: '15px', 
              backgroundColor: 
                feedback.status === 'good' ? 'rgba(76, 175, 80, 0.9)' : 
                feedback.status === 'warning' ? 'rgba(255, 152, 0, 0.9)' : 
                'rgba(244, 67, 54, 0.9)', 
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              maxWidth: '500px'
            }}>
              <h4 style={{ margin: '0 0 5px 0' }}>Feedback</h4>
              <p style={{ margin: 0 }}>{feedback.message}</p>
            </div>
          )}
        </div>
      ), [currentExercise, showVideoFeed, feedback])}
      
      {/* Video feed with head pose estimation */}
      {MemoizedVideoFeed}
      
      {audioUrl && (
        <audio
          src={audioUrl}
          controls
          style={{ position: 'absolute', bottom: 20, left: 20 }}
        />
      )}
    </div>
  );
};

// Preload the model
useGLTF.preload('/test.glb');

export default VirtualPhysiotherapist;