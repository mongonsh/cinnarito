import { useState } from 'react';

// Ultra-safe App component - no external dependencies except React
const SafeApp = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [gameStats, setGameStats] = useState({
    seedsPlanted: 0,
    spiritsFed: 0,
    robotCharged: 0,
    postsShared: 0,
    cinnamonPoints: 100
  });
  const [lastAction, setLastAction] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');

  if (showSplash) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #581c87, #7c3aed)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌳</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Cinnarito
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
            Grow your spirit tree together, one cinnamon roll at a time
          </p>
          <button
            onClick={() => setShowSplash(false)}
            style={{
              padding: '12px 24px',
              fontSize: '1.1rem',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
          >
            Press Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #581c87, #7c3aed)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌳✨</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          Welcome to Your Community Garden!
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9, lineHeight: 1.6 }}>
          This is a safe version of Cinnarito running successfully! 
          The full game features are being loaded gradually to ensure stability.
        </p>
        
        {/* Game Stats Display */}
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <div>🍯 Cinnamon: {gameStats.cinnamonPoints}</div>
            <div>🌱 Seeds: {gameStats.seedsPlanted}</div>
            <div>👻 Spirits: {gameStats.spiritsFed}</div>
            <div>🤖 Robot: {gameStats.robotCharged}/10</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <button 
            onClick={() => {
              if (gameStats.cinnamonPoints >= 10) {
                setGameStats(prev => ({
                  ...prev,
                  seedsPlanted: prev.seedsPlanted + 1,
                  cinnamonPoints: prev.cinnamonPoints - 10
                }));
                setLastAction('🌿 Planted a seed!');
                setActionFeedback('Your garden grows stronger! 🌱');
                setTimeout(() => setActionFeedback(''), 3000);
              } else {
                setActionFeedback('Need 10 cinnamon points to plant! 🍯');
                setTimeout(() => setActionFeedback(''), 3000);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: gameStats.cinnamonPoints >= 10 ? '#059669' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: gameStats.cinnamonPoints >= 10 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            🌿 Plant (10🍯)
          </button>
          
          <button 
            onClick={() => {
              if (gameStats.cinnamonPoints >= 15) {
                setGameStats(prev => ({
                  ...prev,
                  spiritsFed: prev.spiritsFed + 1,
                  cinnamonPoints: prev.cinnamonPoints - 15
                }));
                setLastAction('🍩 Fed a spirit!');
                setActionFeedback('The spirits dance with joy! ✨');
                setTimeout(() => setActionFeedback(''), 3000);
              } else {
                setActionFeedback('Need 15 cinnamon points to feed spirits! 🍯');
                setTimeout(() => setActionFeedback(''), 3000);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: gameStats.cinnamonPoints >= 15 ? '#dc2626' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: gameStats.cinnamonPoints >= 15 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            🍩 Feed Spirit (15🍯)
          </button>
          
          <button 
            onClick={() => {
              if (gameStats.cinnamonPoints >= 20 && gameStats.robotCharged < 10) {
                setGameStats(prev => ({
                  ...prev,
                  robotCharged: prev.robotCharged + 1,
                  cinnamonPoints: prev.cinnamonPoints - 20
                }));
                setLastAction('🤖 Charged the robot!');
                setActionFeedback('Robot power increasing! ⚡');
                setTimeout(() => setActionFeedback(''), 3000);
              } else if (gameStats.robotCharged >= 10) {
                setActionFeedback('Robot is fully charged! 🔋');
                setTimeout(() => setActionFeedback(''), 3000);
              } else {
                setActionFeedback('Need 20 cinnamon points to charge robot! 🍯');
                setTimeout(() => setActionFeedback(''), 3000);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: gameStats.cinnamonPoints >= 20 && gameStats.robotCharged < 10 ? '#2563eb' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: gameStats.cinnamonPoints >= 20 && gameStats.robotCharged < 10 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            🤖 Charge Robot (20🍯)
          </button>
          
          <button 
            onClick={() => {
              if (gameStats.robotCharged >= 3) {
                setGameStats(prev => ({
                  ...prev,
                  postsShared: prev.postsShared + 1,
                  robotCharged: prev.robotCharged - 3,
                  cinnamonPoints: prev.cinnamonPoints + 25
                }));
                setLastAction('💬 Shared garden update!');
                setActionFeedback('Community engagement +25 cinnamon! 🎉');
                setTimeout(() => setActionFeedback(''), 3000);
              } else {
                setActionFeedback('Need robot charge ≥3 to post updates! ⚡');
                setTimeout(() => setActionFeedback(''), 3000);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: gameStats.robotCharged >= 3 ? '#7c2d12' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: gameStats.robotCharged >= 3 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            💬 Post Update (3⚡)
          </button>
        </div>

        {/* Action Feedback */}
        {actionFeedback && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {actionFeedback}
          </div>
        )}

        {/* Last Action */}
        {lastAction && (
          <div style={{
            padding: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            Last action: {lastAction}
          </div>
        )}

        {/* Utility Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          <button
            onClick={() => {
              setGameStats(prev => ({
                ...prev,
                cinnamonPoints: prev.cinnamonPoints + 50
              }));
              setActionFeedback('Bonus cinnamon earned! 🍯✨');
              setTimeout(() => setActionFeedback(''), 2000);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🍯 Get Cinnamon (+50)
          </button>
          
          <button
            onClick={() => setShowSplash(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Back to Splash
          </button>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(0,0,0,0.2)', 
          borderRadius: '8px',
          fontSize: '0.85rem'
        }}>
          <p><strong>Status:</strong> ✅ App is running safely</p>
          <p><strong>Garden Level:</strong> {Math.floor((gameStats.seedsPlanted + gameStats.spiritsFed) / 5) + 1}</p>
          <p><strong>Total Actions:</strong> {gameStats.seedsPlanted + gameStats.spiritsFed + gameStats.postsShared}</p>
          <p><strong>Next:</strong> Gradually enable advanced features</p>
        </div>
      </div>
    </div>
  );
};

export { SafeApp as App };