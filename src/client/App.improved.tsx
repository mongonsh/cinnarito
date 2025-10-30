import { useState, useEffect, useRef, useCallback } from 'react';

// Import images directly (Vite will handle them)
import robotWalk from '/assets/robot_walk.png';
import robotLeft from '/assets/robot_left.png';
import robotBack from '/assets/robot_back.png';
import spiritLeft from '/assets/spirit_left.png';
import spiritRight from '/assets/spirit_right.png';

// Improved 3D Garden with better layout
const ImprovedGarden3D = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [gameStats, setGameStats] = useState({
    seedsPlanted: 0,
    spiritsFed: 0,
    robotCharged: 0,
    postsShared: 0,
    cinnamonPoints: 100,
    treeLevel: 1,
  });
  const [actionFeedback, setActionFeedback] = useState('');
  const [floatingSpirits, setFloatingSpirits] = useState([]);
  const [particles, setParticles] = useState([]);

  // Character positions and states
  const [robotState, setRobotState] = useState({
    x: 70,
    y: 60,
    direction: 'walk',
    isMoving: false,
  });

  const [selectedCharacter, setSelectedCharacter] = useState('robot');
  const [controlledSpirit, setControlledSpirit] = useState({
    x: 30,
    y: 40,
    direction: 'right',
    isMoving: false,
  });

  const gardenRef = useRef(null);
  const [keys, setKeys] = useState({});

  // Image mapping
  const robotImages = {
    walk: robotWalk,
    left: robotLeft,
    back: robotBack,
  };

  const spiritImages = {
    left: spiritLeft,
    right: spiritRight,
  };

  // Keyboard event handlers
  const handleKeyDown = useCallback((e) => {
    setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
  }, []);

  const handleKeyUp = useCallback((e) => {
    setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
  }, []);

  // Setup keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Handle character movement
  useEffect(() => {
    const moveSpeed = 0.8;
    const interval = setInterval(() => {
      if (selectedCharacter === 'robot') {
        setRobotState((prev) => {
          let newX = prev.x;
          let newY = prev.y;
          let newDirection = prev.direction;
          let isMoving = false;

          if (keys['arrowleft'] || keys['a']) {
            newX = Math.max(15, prev.x - moveSpeed);
            newDirection = 'left';
            isMoving = true;
          }
          if (keys['arrowright'] || keys['d']) {
            newX = Math.min(85, prev.x + moveSpeed);
            newDirection = 'walk';
            isMoving = true;
          }
          if (keys['arrowup'] || keys['w']) {
            newY = Math.max(25, prev.y - moveSpeed);
            newDirection = 'back';
            isMoving = true;
          }
          if (keys['arrowdown'] || keys['s']) {
            newY = Math.min(75, prev.y + moveSpeed);
            newDirection = 'walk';
            isMoving = true;
          }

          return { x: newX, y: newY, direction: newDirection, isMoving };
        });
      } else if (selectedCharacter === 'spirit') {
        setControlledSpirit((prev) => {
          let newX = prev.x;
          let newY = prev.y;
          let newDirection = prev.direction;
          let isMoving = false;

          if (keys['arrowleft'] || keys['a']) {
            newX = Math.max(15, prev.x - moveSpeed);
            newDirection = 'left';
            isMoving = true;
          }
          if (keys['arrowright'] || keys['d']) {
            newX = Math.min(85, prev.x + moveSpeed);
            newDirection = 'right';
            isMoving = true;
          }
          if (keys['arrowup'] || keys['w']) {
            newY = Math.max(25, prev.y - moveSpeed);
            isMoving = true;
          }
          if (keys['arrowdown'] || keys['s']) {
            newY = Math.min(75, prev.y + moveSpeed);
            isMoving = true;
          }

          return { x: newX, y: newY, direction: newDirection, isMoving };
        });
      }
    }, 16);

    return () => clearInterval(interval);
  }, [keys, selectedCharacter]);

  // Generate floating spirits
  useEffect(() => {
    const spirits = Array.from({ length: Math.max(0, gameStats.spiritsFed - 1) }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 40,
      rotation: Math.random() * 360,
      speed: 0.3 + Math.random() * 0.3,
      direction: Math.random() > 0.5 ? 'left' : 'right',
    }));
    setFloatingSpirits(spirits);
  }, [gameStats.spiritsFed]);

  // Animate spirits
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingSpirits((prev) =>
        prev.map((spirit) => ({
          ...spirit,
          x: spirit.x + Math.sin(Date.now() * 0.001 + spirit.id) * 0.15,
          y: spirit.y + Math.cos(Date.now() * 0.001 + spirit.id) * 0.08,
          rotation: spirit.rotation + spirit.speed,
        }))
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Create particle effect
  const createParticles = (x, y, type) => {
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 1,
      type,
    }));
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1500);
  };

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.08,
            life: particle.life - 0.025,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, []);

  if (showSplash) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🌳</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Cinnarito Garden
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            Control your characters with WASD or Arrow Keys
          </p>
          <button
            onClick={() => setShowSplash(false)}
            style={{
              padding: '12px 24px',
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}
          >
            🎮 Enter Garden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 40%, #228B22 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Sky elements */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '15%',
          fontSize: '2.5rem',
          animation: 'drift 25s linear infinite',
          opacity: 0.7,
        }}
      >
        ☁️
      </div>
      <div
        style={{
          position: 'absolute',
          top: '6%',
          right: '12%',
          fontSize: '3rem',
          animation: 'glow 4s ease-in-out infinite alternate',
        }}
      >
        ☀️
      </div>

      {/* Top Stats Bar */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))',
          borderRadius: '20px',
          padding: '8px 20px',
          boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(255,255,255,0.4)',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 'bold',
          }}
        >
          <div style={{ color: '#f39c12', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🍯 {gameStats.cinnamonPoints}
          </div>
          <div style={{ color: '#27ae60', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🌱 {gameStats.seedsPlanted}
          </div>
          <div style={{ color: '#8e44ad', display: 'flex', alignItems: 'center', gap: '4px' }}>
            👻 {gameStats.spiritsFed}
          </div>
          <div style={{ color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🤖 {gameStats.robotCharged}/10
          </div>
          <div style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🌳 Lv.{gameStats.treeLevel}
          </div>
        </div>
      </div>

      {/* Character Control Panel - Left Side */}
      <div
        style={{
          position: 'fixed',
          top: '70px',
          left: '10px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.4)',
          minWidth: '160px',
          maxWidth: '180px',
          zIndex: 900,
        }}
      >
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            color: '#2c3e50',
          }}
        >
          🎮 Character Control
        </h3>

        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#34495e',
            }}
          >
            Select Character:
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedCharacter('robot')}
              style={{
                padding: '6px 10px',
                background:
                  selectedCharacter === 'robot'
                    ? 'linear-gradient(45deg, #2ecc71, #27ae60)'
                    : '#ecf0f1',
                color: selectedCharacter === 'robot' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
            >
              🤖 Robot
            </button>
            <button
              onClick={() => setSelectedCharacter('spirit')}
              disabled={gameStats.spiritsFed === 0}
              style={{
                padding: '6px 10px',
                background:
                  selectedCharacter === 'spirit'
                    ? 'linear-gradient(45deg, #f39c12, #e67e22)'
                    : gameStats.spiritsFed === 0
                      ? '#bdc3c7'
                      : '#ecf0f1',
                color:
                  selectedCharacter === 'spirit'
                    ? 'white'
                    : gameStats.spiritsFed === 0
                      ? '#7f8c8d'
                      : '#2c3e50',
                border: 'none',
                borderRadius: '8px',
                cursor: gameStats.spiritsFed === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
            >
              👻 Spirit
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#7f8c8d', lineHeight: 1.4 }}>
          <div>
            <strong>Controls:</strong>
          </div>
          <div>WASD or Arrow Keys</div>
          <div>Move selected character</div>
        </div>
      </div>

      {/* Main Garden Area */}
      <div
        ref={gardenRef}
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '78%',
          background: 'linear-gradient(to bottom, #90EE90 0%, #228B22 100%)',
          borderRadius: '30px 30px 0 0',
          zIndex: 1,
        }}
      >
        {/* Garden Grid */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '200px',
            right: '20px',
            bottom: '140px',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '6px',
            zIndex: 2,
          }}
        >
          {Array.from({ length: 32 }, (_, i) => (
            <div
              key={i}
              onClick={() => {
                if (gameStats.cinnamonPoints >= 10) {
                  const x = (i % 8) * 12.5 + 20;
                  const y = Math.floor(i / 8) * 16 + 30;
                  createParticles(x, y, 'plant');

                  setGameStats((prev) => ({
                    ...prev,
                    seedsPlanted: prev.seedsPlanted + 1,
                    cinnamonPoints: prev.cinnamonPoints - 10,
                    treeLevel: Math.floor((prev.seedsPlanted + 1) / 8) + 1,
                  }));
                  setActionFeedback('🌱 Seed planted!');
                  setTimeout(() => setActionFeedback(''), 2000);
                }
              }}
              style={{
                background:
                  i < gameStats.seedsPlanted
                    ? 'linear-gradient(45deg, #8FBC8F, #90EE90)'
                    : 'linear-gradient(45deg, #8B4513, #A0522D)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                minHeight: '25px',
              }}
            >
              {i < gameStats.seedsPlanted && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1rem',
                    animation: 'grow 2s ease-in-out infinite alternate',
                  }}
                >
                  {i % 3 === 0 ? '🌱' : i % 3 === 1 ? '🌿' : '🌾'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Central Spirit Tree */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: `${2.5 + gameStats.treeLevel * 0.3}rem`,
              animation: 'sway 5s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          >
            🌳
          </div>
          <div
            style={{
              marginTop: '0.3rem',
              fontSize: '0.8rem',
              color: '#2F4F2F',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            Level {gameStats.treeLevel}
          </div>
        </div>

        {/* Controlled Spirit Character */}
        {gameStats.spiritsFed > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${controlledSpirit.x}%`,
              top: `${controlledSpirit.y}%`,
              width: '50px',
              height: '50px',
              transition: 'none',
              zIndex: 15,
              border: selectedCharacter === 'spirit' ? '2px solid #f39c12' : 'none',
              borderRadius: '50%',
              boxShadow: selectedCharacter === 'spirit' ? '0 0 12px #f39c12' : 'none',
            }}
          >
            <img
              src={spiritImages[controlledSpirit.direction]}
              alt="Controllable Spirit"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                animation: controlledSpirit.isMoving
                  ? 'characterMove 0.4s ease-in-out infinite alternate'
                  : 'float 3s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Non-controlled Floating Spirits */}
        {floatingSpirits.map((spirit) => (
          <div
            key={spirit.id}
            style={{
              position: 'absolute',
              left: `${spirit.x}%`,
              top: `${spirit.y}%`,
              width: '35px',
              height: '35px',
              zIndex: 10,
            }}
          >
            <img
              src={spiritImages[spirit.direction]}
              alt="Floating Spirit"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `rotate(${spirit.rotation}deg)`,
                animation: 'float 3s ease-in-out infinite',
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
                opacity: 0.7,
              }}
            />
          </div>
        ))}

        {/* Reddit Robot Character */}
        <div
          style={{
            position: 'absolute',
            left: `${robotState.x}%`,
            top: `${robotState.y}%`,
            width: '65px',
            height: '65px',
            transition: 'none',
            zIndex: 20,
            border: selectedCharacter === 'robot' ? '2px solid #2ecc71' : 'none',
            borderRadius: '50%',
            boxShadow: selectedCharacter === 'robot' ? '0 0 12px #2ecc71' : 'none',
          }}
        >
          <img
            src={robotImages[robotState.direction]}
            alt="Controllable Robot"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
              animation: robotState.isMoving
                ? 'characterMove 0.25s ease-in-out infinite alternate'
                : gameStats.robotCharged > 0
                  ? 'robotActive 2s ease-in-out infinite'
                  : 'none',
            }}
          />
          {/* Robot charge indicator */}
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '35px',
              height: '4px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(gameStats.robotCharged / 10) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #e74c3c, #f39c12)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Particle Effects */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              fontSize: '0.9rem',
              opacity: particle.life,
              pointerEvents: 'none',
              zIndex: 25,
            }}
          >
            {particle.type === 'plant' ? '✨' : particle.type === 'feed' ? '💫' : '⚡'}
          </div>
        ))}
      </div>

      {/* Bottom Action Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))',
          borderRadius: '18px',
          padding: '14px',
          boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(255,255,255,0.4)',
          minWidth: '480px',
          maxWidth: '90vw',
          zIndex: 800,
        }}
      >
        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {[
            { emoji: '🌿', label: 'Plant', cost: 10, action: 'plant', color: '#27ae60' },
            { emoji: '🍩', label: 'Feed', cost: 15, action: 'feed', color: '#e74c3c' },
            { emoji: '🤖', label: 'Charge', cost: 20, action: 'charge', color: '#3498db' },
            {
              emoji: '💬',
              label: 'Post',
              cost: 3,
              action: 'post',
              color: '#f39c12',
              costType: '⚡',
            },
          ].map((btn, i) => {
            const canAfford =
              btn.costType === '⚡'
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

                  if (btn.action === 'plant') {
                    setGameStats((prev) => ({
                      ...prev,
                      seedsPlanted: prev.seedsPlanted + 1,
                      cinnamonPoints: prev.cinnamonPoints - btn.cost,
                      treeLevel: Math.floor((prev.seedsPlanted + 1) / 8) + 1,
                    }));
                    createParticles(50, 50, 'plant');
                    setActionFeedback('🌱 Seed planted!');
                  } else if (btn.action === 'feed') {
                    setGameStats((prev) => ({
                      ...prev,
                      spiritsFed: prev.spiritsFed + 1,
                      cinnamonPoints: prev.cinnamonPoints - btn.cost,
                    }));
                    createParticles(30, 40, 'feed');
                    setActionFeedback('👻 Spirit fed!');
                  } else if (btn.action === 'charge') {
                    if (gameStats.robotCharged < 10) {
                      setGameStats((prev) => ({
                        ...prev,
                        robotCharged: prev.robotCharged + 1,
                        cinnamonPoints: prev.cinnamonPoints - btn.cost,
                      }));
                      createParticles(robotState.x, robotState.y, 'charge');
                      setActionFeedback('🤖 Robot charged!');
                    }
                  } else if (btn.action === 'post') {
                    setGameStats((prev) => ({
                      ...prev,
                      postsShared: prev.postsShared + 1,
                      robotCharged: prev.robotCharged - btn.cost,
                      cinnamonPoints: prev.cinnamonPoints + 25,
                    }));
                    setActionFeedback('💬 Update shared! +25🍯');
                  }

                  setTimeout(() => setActionFeedback(''), 2500);
                }}
                style={{
                  padding: '10px 6px',
                  background: canAfford
                    ? `linear-gradient(145deg, ${btn.color}, ${btn.color}dd)`
                    : 'linear-gradient(145deg, #bdc3c7, #95a5a6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  boxShadow: canAfford ? '0 3px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{btn.emoji}</div>
                <div style={{ fontSize: '0.75rem' }}>{btn.label}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>
                  {btn.cost}
                  {btn.costType || '🍯'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Utility buttons */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setGameStats((prev) => ({ ...prev, cinnamonPoints: prev.cinnamonPoints + 50 }));
              setActionFeedback('🍯 Bonus cinnamon!');
              setTimeout(() => setActionFeedback(''), 1500);
            }}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(45deg, #f39c12, #e67e22)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            🍯 +50 Cinnamon
          </button>
          <button
            onClick={() => setShowSplash(true)}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(45deg, #95a5a6, #7f8c8d)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            🚪 Exit
          </button>
        </div>
      </div>

      {/* Action Feedback */}
      {actionFeedback && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '15px',
            background: 'linear-gradient(45deg, rgba(46, 204, 113, 0.98), rgba(39, 174, 96, 0.98))',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '15px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 1100,
            maxWidth: '220px',
          }}
        >
          {actionFeedback}
        </div>
      )}

      <style>{`
        @keyframes drift {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(calc(100vw + 50px)); }
        }
        @keyframes glow {
          0% { filter: brightness(1) drop-shadow(0 0 5px #ffeb3b); }
          100% { filter: brightness(1.2) drop-shadow(0 0 15px #ffeb3b); }
        }
        @keyframes sway {
          0%, 100% { transform: translateX(-50%) rotate(-1deg); }
          50% { transform: translateX(-50%) rotate(1deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes grow {
          0% { transform: translate(-50%, -50%) scale(0.9); }
          100% { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes robotActive {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes characterMove {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-2px) scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export { ImprovedGarden3D as App };
