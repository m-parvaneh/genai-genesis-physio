import React, { useState, useEffect } from 'react';

const ThinkingBox = ({ isVisible, isThinking = true, exercises = [], currentExerciseIndex = -1, exerciseStatuses = [] }) => {
  const [dots, setDots] = useState('');

  // Animate the loading dots during thinking phase
  useEffect(() => {
    if (!isVisible || !isThinking) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, isThinking]);

  if (!isVisible) return null;

  // Determine the appropriate color for each exercise based on its status
  const getStatusColor = (index) => {
    if (!exerciseStatuses || !exerciseStatuses[index]) return '#f5f5f5'; // Default gray
    
    switch (exerciseStatuses[index]) {
      case 'inactive': return '#f5f5f5'; // Gray
      case 'active': return '#FFD700'; // Yellow
      case 'completed': return '#4CAF50'; // Green
      default: return '#f5f5f5';
    }
  };

  const getTextColor = (index) => {
    if (!exerciseStatuses || !exerciseStatuses[index]) return '#444';
    
    switch (exerciseStatuses[index]) {
      case 'inactive': return '#444'; // Dark gray
      case 'active': 
      case 'completed': return 'white'; // White text on colored backgrounds
      default: return '#444';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(50% - 250px)',
        left: '25%',
        transform: 'translateX(-50%)',
        width: '360px',
        backgroundColor: 'white',
        color: '#333',
        padding: '20px',
        borderRadius: '12px',
        fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
        fontSize: '15px',
        fontWeight: '500',
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
        zIndex: 30,
        border: '1px solid #eee'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          color: '#222', 
          margin: 0,
          letterSpacing: '-0.3px'
        }}>
          {isThinking ? 'Genesis is thinking' : 'Neck Stretching Exercises'}
        </h3>
        {isThinking && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <p style={{ 
        fontSize: '14px',
        color: '#555',
        marginBottom: '16px',
        lineHeight: 1.4
      }}>
        {isThinking 
          ? "Analyzing your symptoms and preparing recommendations..." 
          : "Follow these exercises to help relieve your neck pain:"}
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px' 
      }}>
        {isThinking ? (
          // Thinking suggestions
          [
            "Identifying appropriate exercises",
            "Evaluating intensity level",
            "Creating personalized treatment plan"
          ].map((suggestion, index) => (
            <div 
              key={index}
              style={{
                backgroundColor: '#f5f5f5',
                padding: '12px 15px',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#444',
                lineHeight: 1.4,
                border: '1px solid #eee',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              {suggestion}
            </div>
          ))
        ) : (
          // Exercise steps
          exercises.map((exercise, index) => (
            <div 
              key={index}
              style={{
                backgroundColor: getStatusColor(index),
                padding: '12px 15px',
                borderRadius: '8px',
                fontSize: '14px',
                color: getTextColor(index),
                lineHeight: 1.4,
                border: '1px solid #eee',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </div>
              <div>
                {exercise}
                {exerciseStatuses && exerciseStatuses[index] === 'active' && (
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Do this now...</div>
                )}
                {exerciseStatuses && exerciseStatuses[index] === 'completed' && (
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Completed ✓</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #555;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.6s;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ThinkingBox;