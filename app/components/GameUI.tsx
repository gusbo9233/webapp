import React from 'react';

interface GameUIProps {
  isPointerLocked: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  requestPointerLock: () => void;
  position?: { x: number; y: number; z: number; rotation: number };
  shoppingList?: string[];
  children?: React.ReactNode;
  isInitialStart?: boolean;
}

export const GameUI = ({
  isPointerLocked,
  isMenuOpen,
  setIsMenuOpen,
  requestPointerLock,
  position,
  shoppingList,
  children,
  isInitialStart
}: GameUIProps) => {
  return (
    <>
      {/* Menu */}
      {isMenuOpen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 p-6 rounded-lg w-96">
          <h2 className="text-white text-xl font-bold mb-4">Menu</h2>
          <div className="space-y-2">
            <button 
              className="w-full p-2 bg-white/10 text-white hover:bg-white/20 rounded"
              onClick={() => {
                setIsMenuOpen(false);
                requestPointerLock();
              }}
            >
              Resume
            </button>
            <button 
              className="w-full p-2 bg-white/10 text-white hover:bg-white/20 rounded"
              onClick={() => window.location.href = '/'}
            >
              Exit to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Crosshair */}
      {isPointerLocked && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute w-4 h-px bg-white"></div>
            <div className="absolute w-px h-4 bg-white"></div>
          </div>
        </div>
      )}

      {/* Shopping List Display */}
      {shoppingList && (
        <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded">
          <h3 className="font-bold mb-2">Shopping List:</h3>
          <ul className="space-y-1">
            {shoppingList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Position Display */}
      {position && (
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded">
          <p>
            X: {position.x.toFixed(2)}
            <br />
            Y: {position.y.toFixed(2)}
            <br />
            Z: {position.z.toFixed(2)}
            <br />
            Rotation: {(position.rotation * (180/Math.PI)).toFixed(0)}°
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isPointerLocked && !isMenuOpen && isInitialStart && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
          <p>Click to start</p>
          <p className="text-sm">Use WASD to move, mouse to look around</p>
          <p className="text-sm">Press E to pick up items</p>
          <p className="text-sm">Press ESC for menu</p>
        </div>
      )}

      {children}
    </>
  );
}; 