import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Center, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Model component as a separate file
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

// Preload the model
useGLTF.preload('/test.glb');

export default Model; 