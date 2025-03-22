import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import * as tf from '@tensorflow/tfjs';
// Import BlazeFace model for simpler, more reliable face detection
import * as blazeface from '@tensorflow-models/blazeface';

// Wrap component with React.memo to prevent unnecessary re-renders
const UserVideoFeed = memo(({ onHeadPoseUpdate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  // Store previous head pose to avoid sending redundant updates
  const lastPoseRef = useRef(null);
  // Used for throttling detection frequency
  const lastDetectionTimeRef = useRef(0);
  // Store animation frame ID
  const animationFrameRef = useRef(null);
  // Store status text to avoid re-renders when status doesn't change
  const lastStatusRef = useRef('Initializing...');
  // Reference to store detected faces to avoid unnecessary state updates
  const detectedFacesRef = useRef([]);

  // Setup face detector - using BlazeFace for simplicity and reliability
  useEffect(() => {
    async function setupFaceDetector() {
      try {
        console.log("Setting up TensorFlow.js...");
        
        // Try to use WebGL backend for better performance
        await tf.setBackend('webgl');
        await tf.ready();
        console.log("TensorFlow.js is ready, backend:", tf.getBackend());
        
        setModelLoading(true);
        setStatus('Loading face detection model...');
        
        // Use BlazeFace - a simpler and more reliable face detection model
        console.log("Loading BlazeFace model...");
        // Set a lower scoreThreshold for better detection
        const model = await blazeface.load({ scoreThreshold: 0.5 });
        
        setDetector(model);
        setModelLoading(false);
        setStatus('Model loaded successfully');
        console.log("Face detector loaded successfully");
      } catch (error) {
        console.error("Error loading face detector:", error);
        setModelError(`Failed to load model: ${error.message}`);
        setModelLoading(false);
        setStatus(`Error: ${error.message}`);
      }
    }

    setupFaceDetector();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsDetecting(false);
    };
  }, []);

  // Setup webcam - with optimized video settings
  useEffect(() => {
    async function setupCamera() {
      try {
        // Optimize video constraints for performance
        // Lower resolution for faster processing
        const constraints = {
          video: { 
            facingMode: 'user',
            width: { ideal: 320 },
            height: { ideal: 240 },
            frameRate: { ideal: 15 } // Lower frame rate
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraPermission('granted');
          setStatus('Camera ready');
          console.log("Camera setup successful");
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setCameraPermission('denied');
        setStatus(`Camera error: ${error.message}`);
      }
    }
    
    setupCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Update status without re-rendering
  const updateStatus = useCallback((newStatus) => {
    // Only update if status changed, to avoid re-renders
    if (lastStatusRef.current !== newStatus) {
      lastStatusRef.current = newStatus;
      setStatus(newStatus);
    }
  }, []);

  // Memoized head pose updater that avoids frequent updates
  const updateHeadPose = useCallback((headPose) => {
    // Only update if we have a valid head pose
    if (!headPose) return;
    
    // Check if the pose has changed significantly
    const lastPose = lastPoseRef.current;
    if (lastPose) {
      const yawDiff = Math.abs(lastPose.yaw - headPose.yaw);
      const rollDiff = Math.abs(lastPose.roll - headPose.roll);
      const confidenceDiff = Math.abs(lastPose.confidence - headPose.confidence);
      
      // Only update if pose has changed beyond threshold or confidence changed significantly
      if (yawDiff < 5 && rollDiff < 5 && confidenceDiff < 0.15) {
        return; // Skip update if change is minimal
      }
    }
    
    // Store the new pose and send update
    lastPoseRef.current = headPose;
    if (onHeadPoseUpdate) {
      onHeadPoseUpdate(headPose);
    }
  }, [onHeadPoseUpdate]);

  // Optimized face detection loop with throttling
  useEffect(() => {
    if (!detector || !videoRef.current || cameraPermission !== 'granted') {
      return;
    }
    
    const detectFace = async () => {
      // Always request the next animation frame first to ensure the loop continues
      // even if there's an error in processing
      animationFrameRef.current = requestAnimationFrame(detectFace);
      
      // Throttle detection to improve performance (aim for ~10 fps)
      const now = performance.now();
      const minDetectionInterval = 100; // milliseconds between detections
      
      if (now - lastDetectionTimeRef.current < minDetectionInterval) {
        // Skip detection this time
        return;
      }
      
      // Update time of last detection
      lastDetectionTimeRef.current = now;
      
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }
      
      try {
        // Make sure video is ready
        if (videoRef.current.readyState < 2) {
          return;
        }
        
        // Set detecting state to true if not already set
        if (!isDetecting) {
          setIsDetecting(true);
        }
        
        // Detect faces using BlazeFace
        const faces = await detector.estimateFaces(videoRef.current, false);
        detectedFacesRef.current = faces;
        
        // Update status without re-rendering too often
        if (faces.length === 0) {
          updateStatus('No faces detected');
        } else if (lastStatusRef.current !== 'Face detected') {
          updateStatus('Face detected');
        }
        
        // Draw results on canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          
          // Set canvas dimensions to match video
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          
          // Clear canvas
          ctx.clearRect(0, 0, videoWidth, videoHeight);
          
          // Always draw debugging information
          ctx.font = '14px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText(`Face detection: ${faces.length} faces`, 10, 20);
          
          if (faces.length > 0) {
            // Draw wireframe for the first face
            drawFaceWireframe(ctx, faces[0]);
            
            // Calculate head and neck pose
            const headAndNeckPose = calculateHeadAndNeckPose(faces[0]);
            if (headAndNeckPose) {
              // Draw head pose info
              ctx.fillText(`Yaw: ${headAndNeckPose.yaw.toFixed(1)}°`, 10, 40);
              ctx.fillText(`Roll: ${headAndNeckPose.roll.toFixed(1)}°`, 10, 60);
              
              // Send head pose update (throttled)
              updateHeadPose(headAndNeckPose);
            }
          } else {
            ctx.fillText('No face detected - please face the camera', 10, 40);
          }
        }
      } catch (error) {
        console.error("Error during face detection:", error);
        updateStatus(`Detection error: ${error.message}`);
      }
    };
    
    // Start detection when video is ready
    const handleVideoReady = () => {
      console.log("Video ready, starting face detection");
      detectFace();
    };
    
    videoRef.current.addEventListener('loadeddata', handleVideoReady);
    
    // Backup method to start detection after a delay
    const timeoutId = setTimeout(() => {
      if (!isDetecting && videoRef.current.readyState >= 2) {
        console.log("Starting face detection (backup method)");
        detectFace();
      }
    }, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', handleVideoReady);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsDetecting(false);
    };
  }, [detector, cameraPermission, isDetecting, updateStatus, updateHeadPose]);

  // Simple function to draw face wireframe with neck
  const drawFaceWireframe = (ctx, face) => {
    // BlazeFace provides these key points:
    // topLeft: {x, y} - top left of bounding box
    // bottomRight: {x, y} - bottom right of bounding box
    // landmarks - array of points for: right eye, left eye, nose, mouth, right ear, left ear
    const { topLeft, bottomRight, landmarks, probability } = face;
    
    // Draw bounding box
    const width = bottomRight[0] - topLeft[0];
    const height = bottomRight[1] - topLeft[1];
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.strokeRect(topLeft[0], topLeft[1], width, height);
    
    // Draw landmarks - BlazeFace returns 6 points
    ctx.fillStyle = '#FF0000';
    
    landmarks.forEach((landmark, i) => {
      const x = landmark[0];
      const y = landmark[1];
      
      // Draw the point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Label only important points to reduce clutter
      const labels = ['R Eye', 'L Eye', 'Nose', 'Mouth'];
      if (i < labels.length) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(labels[i], x + 8, y);
        ctx.fillStyle = '#FF0000';
      }
    });
    
    // Draw face orientation lines
    if (landmarks.length >= 3) {
      const rightEye = landmarks[0];
      const leftEye = landmarks[1];
      const nose = landmarks[2];
      const mouth = landmarks.length > 3 ? landmarks[3] : null;
      
      // Eye line
      ctx.strokeStyle = 'yellow';
      ctx.beginPath();
      ctx.moveTo(rightEye[0], rightEye[1]);
      ctx.lineTo(leftEye[0], leftEye[1]);
      ctx.stroke();
      
      // Nose to eye midpoint line
      ctx.strokeStyle = 'cyan';
      ctx.beginPath();
      ctx.moveTo(nose[0], nose[1]);
      ctx.lineTo((rightEye[0] + leftEye[0]) / 2, (rightEye[1] + leftEye[1]) / 2);
      ctx.stroke();
      
      // Draw neck (estimated from face position)
      if (mouth) {
        // Estimate neck position based on face landmarks
        const neckTop = [mouth[0], mouth[1] + height * 0.5]; // Below mouth
        const neckBottom = [mouth[0], mouth[1] + height * 1.2]; // Further down
        
        // Draw neck line
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(neckTop[0], neckTop[1]);
        ctx.lineTo(neckBottom[0], neckBottom[1]);
        ctx.stroke();
        
        // Draw neck points
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(neckTop[0], neckTop[1], 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(neckBottom[0], neckBottom[1], 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Label the neck
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('Neck', neckTop[0] + 8, neckTop[1]);
      }
    }
  };

  // Calculate head pose with neck position estimation
  const calculateHeadAndNeckPose = (face) => {
    const { landmarks, probability, topLeft, bottomRight } = face;
    
    // Need at least eye and nose points
    if (landmarks.length < 3) return null;
    
    const rightEye = landmarks[0];
    const leftEye = landmarks[1];
    const nose = landmarks[2];
    const mouth = landmarks.length > 3 ? landmarks[3] : null;
    
    // Face dimensions
    const width = bottomRight[0] - topLeft[0];
    const height = bottomRight[1] - topLeft[1];
    
    // Calculate yaw (left/right rotation) based on nose position relative to eye midpoint
    const eyeMidpointX = (leftEye[0] + rightEye[0]) / 2;
    const eyeDistance = Math.abs(leftEye[0] - rightEye[0]);
    const noseOffsetX = nose[0] - eyeMidpointX;
    const yaw = (noseOffsetX / eyeDistance) * 45; // Scale to approximate degrees
    
    // Roll (tilt) calculation from eye angle
    const deltaY = rightEye[1] - leftEye[1];
    const deltaX = rightEye[0] - leftEye[0];
    const rollRadians = Math.atan2(deltaY, deltaX);
    const roll = rollRadians * (180 / Math.PI);
    
    // Estimate pitch based on face height and position
    let pitch = 0;
    if (mouth && nose) {
      const noseToMouthY = mouth[1] - nose[1];
      const expectedRatio = height * 0.25; // Expected ratio of nose-to-mouth distance
      pitch = ((noseToMouthY / expectedRatio) - 1) * 30; // Approximate pitch in degrees
    }
    
    // Neck position estimation (relative to face)
    const neckPosition = {
      top: mouth ? [mouth[0], mouth[1] + height * 0.5] : [nose[0], nose[1] + height * 0.7],
      bottom: mouth ? [mouth[0], mouth[1] + height * 1.2] : [nose[0], nose[1] + height * 1.4]
    };
    
    // Calculate neck tilt (correlates with head roll)
    const neckTilt = roll * 0.7; // Neck usually follows head roll but with less extreme angle
    
    return {
      yaw: yaw,                 // Left/right rotation
      pitch: pitch,             // Up/down tilt (approximated)
      roll: roll,               // Head tilt
      neckTilt: neckTilt,       // Neck tilt angle
      neckPosition: neckPosition, // Neck position estimation
      confidence: probability   // Detection confidence
    };
  };

  // Use React.memo for UI components that don't need to re-render often
  const StatusIndicator = React.memo(({ status }) => (
    <div style={{
      fontSize: '12px',
      marginTop: '5px',
      padding: '5px',
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: '3px',
      textAlign: 'center'
    }}>
      Status: {status}
    </div>
  ));

  return (
    <div className="user-video-feed" style={{ position: 'relative' }}>
      {cameraPermission === 'pending' && (
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5
        }}>
          Requesting camera permission...
        </div>
      )}
      
      {cameraPermission === 'denied' && (
        <div style={{ 
          backgroundColor: 'rgba(255,0,0,0.7)', 
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5
        }}>
          Camera access denied. Please enable camera permissions.
        </div>
      )}
      
      {modelLoading && (
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}>
          Loading face detection model...
        </div>
      )}
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            transform: 'scaleX(-1)' // Mirror view
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: 'scaleX(-1)' // Mirror view
          }}
        />
      </div>
      
      <StatusIndicator status={status} />
    </div>
  );
});

export default UserVideoFeed;