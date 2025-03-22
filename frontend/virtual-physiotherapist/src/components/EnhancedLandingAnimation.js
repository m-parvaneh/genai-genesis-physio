import React, { useState, useEffect, useRef } from 'react';
import VirtualPhysiotherapist from './VirtualPhysiotherapist';

const EnhancedLandingAnimation = () => {
  const [animationState, setAnimationState] = useState('welcome');
  const [welcomeText, setWelcomeText] = useState('');
  const [physioText, setPhysioText] = useState('');
  const [showMain, setShowMain] = useState(false);
  const [slideAnimation, setSlideAnimation] = useState(false);
  
  const fullWelcomeText = "Welcome to";
  const fullPhysioText = "your Physio Matt";
  
  // Refs to manage animations
  const welcomeRef = useRef(null);
  const physioRef = useRef(null);
  const mainContentRef = useRef(null);
  
  // Welcome text animation
  useEffect(() => {
    if (animationState === 'welcome') {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= fullWelcomeText.length) {
          setWelcomeText(fullWelcomeText.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setAnimationState('physio');
          }, 300);
        }
      }, 80);
      
      return () => clearInterval(interval);
    }
  }, [animationState]);
  
  // Physio text animation
  useEffect(() => {
    if (animationState === 'physio') {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= fullPhysioText.length) {
          setPhysioText(fullPhysioText.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setAnimationState('complete');
          }, 800);
        }
      }, 80);
      
      return () => clearInterval(interval);
    }
  }, [animationState]);
  
  // Final transition - text slides left, main content slides in from right
  useEffect(() => {
    if (animationState === 'complete') {
      setTimeout(() => {
        setSlideAnimation(true);
        
        // After slide animation completes, show the main content
        setTimeout(() => {
          setShowMain(true);
        }, 1000);
      }, 800);
    }
  }, [animationState]);
  
  return (
    <div className="landing-container" style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #e6f5ff, #b3e0ff)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
    }}>
      {/* Text container that slides left */}
      <div 
        className="text-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          zIndex: showMain ? 1 : 10,
          transform: slideAnimation ? 'translateX(-100vw)' : 'translateX(0)',
          transition: 'transform 1s ease-in-out',
          textAlign: 'center'
        }}
      >
        <h1 
          ref={welcomeRef}
          className="welcome-text"
          style={{
            color: 'white',
            fontSize: '5rem',
            fontWeight: '400',
            marginBottom: '0.5rem',
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            letterSpacing: '0.1rem',
            opacity: animationState === 'welcome' ? 1 : 0.9
          }}
        >
          {welcomeText}
          <span className="cursor" style={{
            display: animationState === 'welcome' ? 'inline-block' : 'none',
            width: '3px',
            height: '5rem',
            backgroundColor: 'white',
            marginLeft: '5px',
            animation: 'blink 1s infinite'
          }}></span>
        </h1>
        
        <h1 
          ref={physioRef}
          className="physio-text"
          style={{
            color: 'white',
            fontSize: '5rem',
            fontWeight: '400',
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            letterSpacing: '0.1rem',
            visibility: animationState === 'welcome' ? 'hidden' : 'visible',
            opacity: animationState === 'welcome' ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          {physioText}
          <span className="cursor" style={{
            display: animationState === 'physio' ? 'inline-block' : 'none',
            width: '3px',
            height: '5rem',
            backgroundColor: 'white',
            marginLeft: '5px',
            animation: 'blink 1s infinite'
          }}></span>
        </h1>
      </div>
      
      {/* Main content container that slides in from right */}
      <div 
        ref={mainContentRef}
        className="main-content"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: slideAnimation ? 'translateX(0)' : 'translateX(100vw)',
          transition: 'transform 1s ease-in-out',
          opacity: 1,
          visibility: 'visible',
          zIndex: showMain ? 10 : 1
        }}
      >
        <VirtualPhysiotherapist />
      </div>
      
      {/* Footer that stays at bottom */}
      <div 
        className="footer"
        style={{
          position: 'absolute',
          bottom: '15px',
          width: '100%',
          textAlign: 'center',
          color: 'white',
          fontSize: '0.9rem',
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          opacity: 0.8,
          zIndex: 20 // Always on top
        }}
      >
        made with ❤️ by matt, eric, alan
      </div>
      
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedLandingAnimation;