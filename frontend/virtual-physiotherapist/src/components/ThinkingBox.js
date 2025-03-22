import React, { useState, useEffect } from 'react';

const ThinkingBox = ({ isVisible }) => {
  const [dots, setDots] = useState('');

  // Animate the loading dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(50% - 170px)',
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
          Genesis is thinking
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px' 
        }}>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      <p style={{ 
        fontSize: '14px',
        color: '#555',
        marginBottom: '16px',
        lineHeight: 1.4
      }}>
        Analyzing your symptoms and preparing recommendations...
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px' 
      }}>
        {[
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
        ))}
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