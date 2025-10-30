import { useState } from 'react';

// Simple image test component
const ImageTest = () => {
  const [imageStatus, setImageStatus] = useState({});

  const images = [
    'robot_walk.png',
    'robot_left.png', 
    'robot_back.png',
    'spirit_left.png',
    'spirit_right.png'
  ];

  const handleImageLoad = (imageName) => {
    setImageStatus(prev => ({ ...prev, [imageName]: 'loaded' }));
    console.log(`✅ ${imageName} loaded successfully`);
  };

  const handleImageError = (imageName) => {
    setImageStatus(prev => ({ ...prev, [imageName]: 'error' }));
    console.log(`❌ ${imageName} failed to load`);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ marginBottom: '30px', fontSize: '2rem' }}>🖼️ Image Loading Test</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '20px',
        maxWidth: '800px',
        width: '100%'
      }}>
        {images.map(imageName => (
          <div key={imageName} style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>{imageName}</h3>
            
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 10px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <img
                src={`/assets/${imageName}`}
                alt={imageName}
                onLoad={() => handleImageLoad(imageName)}
                onError={() => handleImageError(imageName)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            <div style={{
              fontSize: '0.8rem',
              padding: '5px 10px',
              borderRadius: '15px',
              background: imageStatus[imageName] === 'loaded' 
                ? 'rgba(34, 197, 94, 0.3)' 
                : imageStatus[imageName] === 'error' 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(156, 163, 175, 0.3)'
            }}>
              {imageStatus[imageName] === 'loaded' && '✅ Loaded'}
              {imageStatus[imageName] === 'error' && '❌ Error'}
              {!imageStatus[imageName] && '⏳ Loading...'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ marginBottom: '15px', opacity: 0.9 }}>
          Check browser console for detailed loading info
        </p>
        <button
          onClick={() => {
            // Switch back to enhanced version
            window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔄 Reload Page
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        fontSize: '0.85rem',
        maxWidth: '600px'
      }}>
        <strong>Debug Info:</strong>
        <div>Current URL: {window.location.href}</div>
        <div>Asset Path: /assets/[filename]</div>
        <div>Expected Location: src/client/public/assets/</div>
      </div>
    </div>
  );
};

export { ImageTest as App };