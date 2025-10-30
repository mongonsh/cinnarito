import { useState, useEffect, useRef } from 'react';

// 3D Garden Game with visual models and environment
const Garden3D = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [gameStats, setGameStats] = useState({
    seedsPlanted: 0,
    spiritsFed: 0,
    robotCharged: 0,
    postsShared: 0,
    cinnamonPoints: 100,
    treeLevel: 1
  });
  const [lastAction, setLastAction] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [floatingSpirits, setFloatingSpirits] = useState([]);
  const [particles, setParticles] = useState([]);
  const [robotPosition, setRobotPosition] = useState({ x: 70, y: 60 });
  const gardenRef = useRef(null);

  // Generate floating spirits
  useEffect(() => {
    const spirits = Array.from({ length: gameStats.spiritsFed }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 40,
      rotation: Math.random() * 360,
      speed: 0.5 + Math.random() * 0.5
    }));
    setFloatingSpirits(spirits);
  }, [gameStats.spiritsFed]);

  // Animate spirits
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingSpirits(prev => prev.map(spirit => ({
        ...spirit,
        x: spirit.x + Math.sin(Date.now() * 0.001 + spirit.id) * 0.2,
        y: spirit.y + Math.cos(Date.now() * 0.001 + spirit.id) * 0.1,
        rotation: spirit.rotation + spirit.speed
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Create particle effect
  const createParticles = (x, y, type) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      type
    }));
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 2000);
  };

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.1, // gravity
        life: particle.life - 0.02
      })).filter(p => p.life > 0));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  if (showSplash) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          fontSize: '3rem',
          animation: 'float 3s ease-in-out infinite',
          opacity: 0.3
        }}>🌸</div>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          fontSize: '2rem',
          animation: 'float 4s ease-in-out infinite reverse',
          opacity: 0.4
        }}>✨</div>
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '20%',
          fontSize: '2.5rem',
          animation: 'float 3.5s ease-in-out infinite',
          opacity: 0.3
        }}>🦋</div>

        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <div style={{ 
            fontSize: '6rem', 
            marginBottom: '1rem',
            animation: 'bounce 2s ease-in-out infinite'
          }}>🌳</div>
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem', 
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Cinnarito
          </h1>
          <p style={{ 
            fontSize: '1.3rem', 
            marginBottom: '2rem', 
            opacity: 0.9,
            maxWidth: '500px'
          }}>
            Enter a magical 3D garden where community grows together
          </p>
          <button
            onClick={() => setShowSplash(false)}
            style={{
              padding: '15px 30px',
              fontSize: '1.2rem',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              transform: 'scale(1)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            🚪 Enter Garden
          </button>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 50%, #228B22 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sky and clouds */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '10%',
        fontSize: '3rem',
        animation: 'drift 20s linear infinite',
        opacity: 0.8
      }}>☁️</div>
      <div style={{
        position: 'absolute',
        top: '8%',
        right: '20%',
        fontSize: '2.5rem',
        animation: 'drift 25s linear infinite reverse',
        opacity: 0.7
      }}>☁️</div>
      <div style={{
        position: 'absolute',
        top: '3%',
        left: '60%',
        fontSize: '4rem',
        animation: 'drift 30s linear infinite',
        opacity: 0.6
      }}>☁️</div>

      {/* Sun */}
      <div style={{
        position: 'absolute',
        top: '5%',
        right: '10%',
        fontSize: '4rem',
        animation: 'glow 3s ease-in-out infinite alternate'
      }}>☀️</div>

      {/* Garden Ground */}
      <div ref={gardenRef} style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '70%',
        background: 'linear-gradient(to bottom, #90EE90 0%, #228B22 100%)',
        borderRadius: '50% 50% 0 0 / 20% 20% 0 0'
      }}>
        
        {/* Garden Grid with 3D tiles */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          right: '10%',
          bottom: '20%',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          gap: '4px'
        }}>
          {Array.from({ length: 48 }, (_, i) => (
            <div
              key={i}
              onClick={() => {
                if (gameStats.cinnamonPoints >= 10) {
                  const rect = gardenRef.current.getBoundingClientRect();
                  const x = (i % 8) * 12.5 + 15;
                  const y = Math.floor(i / 8) * 16.67 + 25;
                  createParticles(x, y, 'plant');
                  
                  setGameStats(prev => ({
                    ...prev,
                    seedsPlanted: prev.seedsPlanted + 1,
                    cinnamonPoints: prev.cinnamonPoints - 10,
                    treeLevel: Math.floor((prev.seedsPlanted + 1) / 5) + 1
                  }));
                  setActionFeedback('🌱 Seed planted! Garden grows!');
                  setTimeout(() => setActionFeedback(''), 2000);
                }
              }}
              style={{
                background: i < gameStats.seedsPlanted 
                  ? 'linear-gradient(45deg, #8FBC8F, #90EE90)' 
                  : 'linear-gradient(45deg, #8B4513, #A0522D)',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                transform: 'perspective(100px) rotateX(10deg)'
              }}
            >
              {i < gameStats.seedsPlanted && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.2rem',
                  animation: 'grow 2s ease-in-out infinite alternate'
                }}>
                  {i % 3 === 0 ? '🌱' : i % 3 === 1 ? '🌿' : '🌾'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Central Spirit Tree - 3D Model */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: `${3 + gameStats.treeLevel * 0.5}rem`,
            animation: 'sway 4s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            position: 'relative'
          }}>
            🌳
            {/* Tree glow effect */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(144,238,144,0.3) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'pulse 3s ease-in-out infinite'
            }} />
          </div>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: '#2F4F2F',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
          }}>
            Level {gameStats.treeLevel}
          </div>
        </div>

        {/* Floating Spirits - 3D Models */}
        {floatingSpirits.map(spirit => (
          <div
            key={spirit.id}
            style={{
              position: 'absolute',
              left: `${spirit.x}%`,
              top: `${spirit.y}%`,
              fontSize: '1.5rem',
              transform: `rotate(${spirit.rotation}deg)`,
              animation: 'float 3s ease-in-out infinite',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              zIndex: 10
            }}
          >
            👻
          </div>
        ))}

        {/* Reddit Robot - 3D Model */}
        <div style={{
          position: 'absolute',
          left: `${robotPosition.x}%`,
          top: `${robotPosition.y}%`,
          fontSize: '2rem',
          animation: gameStats.robotCharged > 0 ? 'robotActive 2s ease-in-out infinite' : 'none',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
          zIndex: 15,
          transition: 'all 1s ease'
        }}>
          🤖
          {/* Robot charge indicator */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '4px',
            background: '#333',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(gameStats.robotCharged / 10) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff6b6b, #feca57)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Particle Effects */}
        {particles.map(particle => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              fontSize: '1rem',
              opacity: particle.life,
              pointerEvents: 'none',
              zIndex: 20
            }}
          >
            {particle.type === 'plant' ? '✨' : particle.type === 'feed' ? '💫' : '⚡'}
          </div>
        ))}
      </div>

      {/* 3D UI Panel */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        minWidth: '600px'
      }}>
        {/* Stats Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '15px',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          <div style={{ textAlign: 'center', color: '#f39c12' }}>
            🍯 {gameStats.cinnamonPoints}
          </div>
          <div style={{ textAlign: 'center', color: '#27ae60' }}>
            🌱 {gameStats.seedsPlanted}
          </div>
          <div style={{ textAlign: 'center', color: '#8e44ad' }}>
            👻 {gameStats.spiritsFed}
          </div>
          <div style={{ textAlign: 'center', color: '#3498db' }}>
            🤖 {gameStats.robotCharged}/10
          </div>
        </div>

        {/* Action Buttons - 3D Style */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '10px'
        }}>
          {[
            { emoji: '🌿', label: 'Plant', cost: 10, action: 'plant', color: '#27ae60' },
            { emoji: '🍩', label: 'Feed', cost: 15, action: 'feed', color: '#e74c3c' },
            { emoji: '🤖', label: 'Charge', cost: 20, action: 'charge', color: '#3498db' },
            { emoji: '💬', label: 'Post', cost: 3, action: 'post', color: '#f39c12', costType: '⚡' }
          ].map((btn, i) => {
            const canAfford = btn.costType === '⚡' 
              ? gameStats.robotCharged >= btn.cost 
              : gameStats.cinnamonPoints >= btn.cost;
            
            return (
              <button
                key={i}
                onClick={() => {
                  if (!canAfford) {
                    setActionFeedback(`Need ${btn.cost}${btn.costType || '🍯'} for ${btn.label}!`);
                    setTimeout(() => setActionFeedback(''), 2000);
                    return;
                  }

                  // Handle different actions
                  if (btn.action === 'plant') {
                    setGameStats(prev => ({
                      ...prev,
                      seedsPlanted: prev.seedsPlanted + 1,
                      cinnamonPoints: prev.cinnamonPoints - btn.cost,
                      treeLevel: Math.floor((prev.seedsPlanted + 1) / 5) + 1
                    }));
                    createParticles(50, 50, 'plant');
                    setActionFeedback('🌱 Seed planted in garden!');
                  } else if (btn.action === 'feed') {
                    setGameStats(prev => ({
                      ...prev,
                      spiritsFed: prev.spiritsFed + 1,
                      cinnamonPoints: prev.cinnamonPoints - btn.cost
                    }));
                    createParticles(30, 40, 'feed');
                    setActionFeedback('👻 Spirit fed with love!');
                  } else if (btn.action === 'charge') {
                    if (gameStats.robotCharged < 10) {
                      setGameStats(prev => ({
                        ...prev,
                        robotCharged: prev.robotCharged + 1,
                        cinnamonPoints: prev.cinnamonPoints - btn.cost
                      }));
                      createParticles(70, 60, 'charge');
                      setActionFeedback('🤖 Robot powered up!');
                    }
                  } else if (btn.action === 'post') {
                    setGameStats(prev => ({
                      ...prev,
                      postsShared: prev.postsShared + 1,
                      robotCharged: prev.robotCharged - btn.cost,
                      cinnamonPoints: prev.cinnamonPoints + 25
                    }));
                    setActionFeedback('💬 Garden update shared! +25🍯');
                  }
                  
                  setTimeout(() => setActionFeedback(''), 3000);
                }}
                style={{
                  padding: '12px 8px',
                  background: canAfford 
                    ? `linear-gradient(145deg, ${btn.color}, ${btn.color}dd)` 
                    : 'linear-gradient(145deg, #bdc3c7, #95a5a6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  boxShadow: canAfford 
                    ? '0 4px 8px rgba(0,0,0,0.2)' 
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  transform: 'perspective(100px) rotateX(5deg)'
                }}
                onMouseOver={(e) => {
                  if (canAfford) {
                    e.target.style.transform = 'perspective(100px) rotateX(5deg) scale(1.05)';
                    e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'perspective(100px) rotateX(5deg) scale(1)';
                  e.target.style.boxShadow = canAfford 
                    ? '0 4px 8px rgba(0,0,0,0.2)' 
                    : '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{btn.emoji}</div>
                <div>{btn.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                  {btn.cost}{btn.costType || '🍯'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Utility buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setGameStats(prev => ({ ...prev, cinnamonPoints: prev.cinnamonPoints + 50 }));
              setActionFeedback('🍯 Bonus cinnamon collected!');
              setTimeout(() => setActionFeedback(''), 2000);
            }}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(45deg, #f39c12, #e67e22)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🍯 Collect Cinnamon
          </button>
          <button
            onClick={() => setShowSplash(true)}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(45deg, #95a5a6, #7f8c8d)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🚪 Exit Garden
          </button>
        </div>
      </div>

      {/* Action Feedback */}
      {actionFeedback && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(45deg, rgba(46, 204, 113, 0.9), rgba(39, 174, 96, 0.9))',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '25px',
          fontSize: '1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          animation: 'slideDown 0.5s ease-out',
          zIndex: 100
        }}>
          {actionFeedback}
        </div>
      )}

      <style>{`
        @keyframes drift {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        @keyframes glow {
          0% { filter: brightness(1) drop-shadow(0 0 5px #ffeb3b); }
          100% { filter: brightness(1.2) drop-shadow(0 0 20px #ffeb3b); }
        }
        @keyframes sway {
          0%, 100% { transform: translateX(-50%) rotate(-2deg); }
          50% { transform: translateX(-50%) rotate(2deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        @keyframes grow {
          0% { transform: translate(-50%, -50%) scale(0.8); }
          100% { transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.6; transform: translateX(-50%) scale(1.1); }
        }
        @keyframes robotActive {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slideDown {
          0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export { Garden3D as App };