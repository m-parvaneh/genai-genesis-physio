import React, { useState, useEffect, useRef } from 'react';

// Mock chat history data
const mockChatHistory = [
  {
    id: 1,
    title: "Neck Pain Relief",
    date: "2025-03-20",
    preview: "I've been experiencing neck pain after long hours at my desk...",
    messages: [
      { role: "user", content: "I've been experiencing neck pain after long hours at my desk. What exercises can help?" },
      { role: "assistant", content: "Neck pain from desk work is common. I recommend trying gentle neck stretches every hour. Would you like me to demonstrate some?" }
    ]
  },
  {
    id: 2,
    title: "Lower Back Exercise",
    date: "2025-03-18",
    preview: "What exercises are safe for someone with a history of lower back issues?",
    messages: [
      { role: "user", content: "What exercises are safe for someone with a history of lower back issues?" },
      { role: "assistant", content: "For lower back issues, focus on core strengthening exercises that maintain neutral spine position. Let's start with gentle stretches." }
    ]
  },
  {
    id: 3,
    title: "Shoulder Mobility",
    date: "2025-03-15",
    preview: "My shoulders feel tight after swimming yesterday...",
    messages: [
      { role: "user", content: "My shoulders feel tight after swimming yesterday. Any recovery tips?" },
      { role: "assistant", content: "Post-swimming shoulder tightness is common. Let's work on some rotator cuff mobility exercises and gentle stretches." }
    ]
  },
  {
    id: 4,
    title: "Knee Rehabilitation",
    date: "2025-03-12",
    preview: "I'm recovering from minor knee surgery. What gentle exercises can I start with?",
    messages: [
      { role: "user", content: "I'm recovering from minor knee surgery. What gentle exercises can I start with?" },
      { role: "assistant", content: "Post-surgery rehabilitation should be gradual. Let's start with isometric exercises to rebuild strength without strain." }
    ]
  },
  {
    id: 5,
    title: "Posture Improvement",
    date: "2025-03-10",
    preview: "How can I improve my posture? I feel hunched over most of the day.",
    messages: [
      { role: "user", content: "How can I improve my posture? I feel hunched over most of the day." },
      { role: "assistant", content: "Poor posture can lead to various issues. Let's work on strengthening your upper back and stretching your chest muscles." }
    ]
  },
  {
    id: 6,
    title: "Morning Stretches",
    date: "2025-03-08",
    preview: "What's a good 5-minute morning stretch routine?",
    messages: [
      { role: "user", content: "What's a good 5-minute morning stretch routine?" },
      { role: "assistant", content: "A quick morning routine should energize your body. I recommend starting with gentle spinal movements and progressing to larger muscle groups." }
    ]
  },
  {
    id: 7,
    title: "Wrist Pain Solutions",
    date: "2025-03-05",
    preview: "I'm getting wrist pain from typing all day. Any exercises that can help?",
    messages: [
      { role: "user", content: "I'm getting wrist pain from typing all day. Any exercises that can help?" },
      { role: "assistant", content: "Wrist pain from typing is often related to repetitive strain. Let's try some wrist mobility exercises and stretches for the forearm muscles." }
    ]
  },
  {
    id: 8,
    title: "Hip Mobility",
    date: "2025-03-03",
    preview: "My hips feel stiff after sitting all day in meetings...",
    messages: [
      { role: "user", content: "My hips feel stiff after sitting all day in meetings. What can help?" },
      { role: "assistant", content: "Hip stiffness from prolonged sitting is common. Let's work on some hip flexor stretches and mobility exercises to relieve that tension." }
    ]
  },
  {
    id: 9,
    title: "Tennis Elbow Exercises",
    date: "2025-02-28",
    preview: "I think I'm developing tennis elbow. Are there exercises I should do?",
    messages: [
      { role: "user", content: "I think I'm developing tennis elbow. Are there exercises I should do?" },
      { role: "assistant", content: "Tennis elbow often responds well to specific exercises. Let's focus on eccentric strengthening of the forearm extensors and gentle stretches." }
    ]
  },
  {
    id: 10,
    title: "Ankle Strengthening",
    date: "2025-02-25",
    preview: "I sprained my ankle a month ago. How can I strengthen it now that it's mostly healed?",
    messages: [
      { role: "user", content: "I sprained my ankle a month ago. How can I strengthen it now that it's mostly healed?" },
      { role: "assistant", content: "Post-sprain ankle strengthening is important to prevent future injuries. Let's work on balance exercises and progressive resistance training." }
    ]
  },
  {
    id: 11,
    title: "Sciatica Relief",
    date: "2025-02-20",
    preview: "My sciatica is flaring up again. What gentle exercises might help?",
    messages: [
      { role: "user", content: "My sciatica is flaring up again. What gentle exercises might help?" },
      { role: "assistant", content: "For sciatica flare-ups, gentle nerve gliding exercises and specific stretches can provide relief. Let's try a few that won't aggravate your symptoms." }
    ]
  },
  {
    id: 12,
    title: "Desk Stretches",
    date: "2025-02-15",
    preview: "Can you suggest some stretches I can do at my desk throughout the workday?",
    messages: [
      { role: "user", content: "Can you suggest some stretches I can do at my desk throughout the workday?" },
      { role: "assistant", content: "Desk-friendly stretches are great for preventing stiffness. I'll show you some discreet movements for your neck, shoulders, wrists, and lower back." }
    ]
  }
];

const ChatHistorySidebar = ({ isVisible = false, onClose }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [renderSidebar, setRenderSidebar] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState(isVisible ? "sidebar-slide-in" : "");
  const animationTimeout = useRef(null);

  // Clean up any lingering timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  // Handle animation on visibility change with more reliable timing
  useEffect(() => {
    // Clear any existing timeouts to prevent race conditions
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }

    if (isVisible) {
      // First render the sidebar
      setRenderSidebar(true);
      
      // Then trigger animation in next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationClass("sidebar-slide-in");
        });
      });
    } else {
      // Start closing animation
      setAnimationClass("sidebar-slide-out");
      
      // Remove from DOM after animation completes
      animationTimeout.current = setTimeout(() => {
        setRenderSidebar(false);
      }, 350); // Slightly longer than animation duration for safety
    }
  }, [isVisible]);

  const selectChat = (chatId) => {
    setSelectedChat(chatId === selectedChat ? null : chatId);
  };

  if (!renderSidebar) return null;

  return (
    <div 
      className={animationClass}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '320px',
        backgroundColor: '#f8f8f8',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        zIndex: 30,
        overflowY: 'auto',
        fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <style>
        {`
          .sidebar-slide-in {
            transform: translateX(0) !important;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform;
          }
          
          .sidebar-slide-out {
            transform: translateX(-100%) !important;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform;
          }
          
          .chat-item {
            transition: all 0.2s ease;
          }
          
          .chat-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          
          .chat-messages {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-in-out;
          }
          
          .chat-messages.expanded {
            max-height: 300px;
          }
        `}
      </style>
      
      <div style={{ padding: '24px 16px', overflowY: 'auto', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#222', 
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Chat History
          </h2>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eee'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mockChatHistory.map((chat) => (
            <div key={chat.id} className="chat-item" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div 
                onClick={() => selectChat(chat.id)} 
                style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  border: '1px solid #eee'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 500, 
                    color: '#111',
                    margin: 0,
                    letterSpacing: '-0.3px'
                  }}>
                    {chat.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#777' }}>{chat.date}</span>
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#555', 
                  margin: '8px 0 0', 
                  lineHeight: 1.4,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {chat.preview}
                </p>
              </div>
              
              <div 
                className={`chat-messages ${selectedChat === chat.id ? 'expanded' : ''}`}
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: selectedChat === chat.id ? '12px' : '0 12px',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                }}
              >
                {chat.messages.map((message, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      backgroundColor: message.role === "user" ? '#e7e7e7' : '#f9f9f9',
                      color: '#333',
                      marginLeft: message.role === "user" ? '20px' : '0',
                      marginRight: message.role === "assistant" ? '20px' : '0',
                      fontSize: '14px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      lineHeight: 1.4
                    }}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ 
          paddingTop: '24px', 
          marginTop: '24px', 
          borderTop: '1px solid #e0e0e0'
        }}>
          <button style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#222',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
            letterSpacing: '0.2px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#000'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#222'}
          >
            + New Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHistorySidebar;