"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useMovementControls, DialogueObject } from '../hooks/useMovementControls';
import { GameUI } from '../components/GameUI';

const createTaxi = () => {
  const taxi = new THREE.Group();

  // Taxi body
  const bodyGeometry = new THREE.BoxGeometry(2, 1.2, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFD700,  // Yellow
    metalness: 0.3,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  taxi.add(body);

  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    metalness: 0.5,
    roughness: 0.5
  });

  // Add 4 wheels
  const wheelPositions = [
    [-0.8, 0.3, -1.2],  // Front left
    [0.8, 0.3, -1.2],   // Front right
    [-0.8, 0.3, 1.2],   // Back left
    [0.8, 0.3, 1.2]     // Back right
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    taxi.add(wheel);
  });

  // Taxi sign on top
  const signGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.3);
  const signMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFFFFF,
    metalness: 0.3,
    roughness: 0.5
  });
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(0, 1.8, 0);
  taxi.add(sign);

  return taxi;
};

const createTaxiDriver = () => {
  const driver = new THREE.Group() as DialogueObject;
  driver.isDialogueEnabled = true;
  driver.dialogueDistance = 3; // Can talk within 3 units

  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,  // Dark blue suit
    roughness: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.75;
  driver.add(body);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8beac,  // Skin tone
    roughness: 0.6
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.6;
  driver.add(head);

  // Hat
  const hatGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 16);
  const hatMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,  // Match suit color
    roughness: 0.8
  });
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.y = 1.8;
  driver.add(hat);

  // Arms
  const armGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.8
  });

  // Left arm
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.35, 1.1, 0);
  leftArm.rotation.z = 0.3;
  driver.add(leftArm);

  // Right arm
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.35, 1.1, 0);
  rightArm.rotation.z = -0.3;
  driver.add(rightArm);

  // Legs
  const legGeometry = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.8
  });

  // Left leg
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.15, 0.3, 0);
  driver.add(leftLeg);

  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.15, 0.3, 0);
  driver.add(rightLeg);

  return driver;
};

const createAirportBuilding = () => {
  const building = new THREE.Group();

  // Main terminal building
  const terminalGeometry = new THREE.BoxGeometry(50, 15, 20);
  const terminalMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.2,
    roughness: 0.8
  });
  const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
  terminal.position.y = 7.5;
  building.add(terminal);

  // Windows
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.8,
    roughness: 0.2
  });

  // Add rows of windows
  for (let y = 3; y < 12; y += 3) {
    for (let x = -22; x < 22; x += 4) {
      const windowGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x, y, 10.1);
      building.add(window);
    }
  }

  // Entrance
  const entranceGeometry = new THREE.BoxGeometry(10, 5, 2);
  const entrance = new THREE.Mesh(entranceGeometry, terminalMaterial);
  entrance.position.set(0, 2.5, 11);
  building.add(entrance);

  return building;
};

const AirportScene = () => {
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const [dialogueMessage, setDialogueMessage] = useState("Hello! Where would you like to go?");
  const [position, setPosition] = useState({ x: 0, y: 1.7, z: 0, rotation: 0 });
  
  const { 
    mountRef, 
    cameraRef, 
    sceneRef, 
    isPointerLocked, 
    isMenuOpen, 
    setIsMenuOpen,
    movePlayer, 
    handleClick 
  } = useMovementControls({
    isDialogueOpen
  });

  const [userInput, setUserInput] = useState('');
  const dialogueRef = useRef<HTMLInputElement>(null);
  const savedPositionRef = useRef<THREE.Vector3 | null>(null);
  const savedRotationRef = useRef<THREE.Euler | null>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);  // Sky blue

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (mountRef.current) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 50, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add taxi
    const taxi = createTaxi();
    taxi.position.set(5, 0, 15);
    taxi.rotation.y = Math.PI / 4;
    scene.add(taxi);

    // Add taxi driver
    const taxiDriver = createTaxiDriver();
    taxiDriver.position.set(6.2, 0, 14.5);  // Adjust these values based on your taxi position
    taxiDriver.rotation.y = Math.PI / 4;     // Match taxi's rotation
    scene.add(taxiDriver);

    // Add airport building
    const airport = createAirportBuilding();
    airport.position.z = -20;
    scene.add(airport);

    // Set initial camera position only if it hasn't been set
    if (!savedPositionRef.current) {
      camera.position.set(0, 1.7, 20);
      camera.lookAt(0, 1.7, 0);
    } else {
      camera.position.copy(savedPositionRef.current);
      camera.rotation.copy(savedRotationRef.current!);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      movePlayer();
      renderer.render(scene, camera);
      
      if (cameraRef.current) {
        setPosition({
          x: cameraRef.current.position.x,
          y: cameraRef.current.position.y,
          z: cameraRef.current.position.z,
          rotation: cameraRef.current.rotation.y
        });
      }
    };

    animate();

    // Dialogue handler
    const handleDialogue = (event: KeyboardEvent) => {
      if (!cameraRef.current) return;
      
      if (event.key.toLowerCase() === 'q' && !isDialogueOpen) {
        // Check if player is near the driver
        const driverPosition = new THREE.Vector3(6.2, 0, 14.5);
        if (isNearDriver(cameraRef.current.position, driverPosition)) {
          // Save current position and rotation
          savedPositionRef.current = cameraRef.current.position.clone();
          savedRotationRef.current = cameraRef.current.rotation.clone();
          
          setIsDialogueOpen(true);
          document.exitPointerLock();
          setTimeout(() => dialogueRef.current?.focus(), 100);
        }
      } else if (event.key.toLowerCase() === 'x' && isDialogueOpen) {
        setIsDialogueOpen(false);
        setUserInput('');
        
        mountRef.current?.requestPointerLock();
        
        requestAnimationFrame(() => {
          if (cameraRef.current && savedPositionRef.current && savedRotationRef.current) {
            cameraRef.current.position.copy(savedPositionRef.current);
            cameraRef.current.rotation.copy(savedRotationRef.current);
          }
        });
      }
    };

    document.addEventListener('keydown', handleDialogue);

    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      document.removeEventListener('keydown', handleDialogue);
    };
  }, [isPointerLocked]);

  // Add this function to check distance to driver
  const isNearDriver = (playerPosition: THREE.Vector3, driverPosition: THREE.Vector3) => {
    const distance = playerPosition.distanceTo(driverPosition);
    return distance < 3; // Within 3 units of the driver
  };

  return (
    <div className="relative w-full h-screen">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-none"
        onClick={handleClick}
      />
      
      <GameUI
        isPointerLocked={isPointerLocked}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        requestPointerLock={() => mountRef.current?.requestPointerLock()}
        position={position}
        isInitialStart={!savedPositionRef.current}
      >
        {/* Dialogue UI */}
        {isDialogueOpen && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 p-6 rounded-lg w-96">
            {/* Driver's message bubble */}
            <div className="bg-yellow-500 text-black p-4 rounded-lg mb-4">
              <p>{dialogueMessage}</p>
            </div>
            
            {/* User input */}
            <div className="flex flex-col gap-2">
              <input
                ref={dialogueRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full p-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:border-yellow-500"
                placeholder="Type your response..."
              />
              <div className="text-white/60 text-sm text-right">
                Press X to close
              </div>
            </div>
          </div>
        )}
      </GameUI>
    </div>
  );
};

export default AirportScene; 
