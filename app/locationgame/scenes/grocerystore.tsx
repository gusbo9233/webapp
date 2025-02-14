// pages/three-scene.js
"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Raycaster, Intersection } from 'three';
import { useMovementControls } from '../hooks/useMovementControls';
import type { PickupableObject } from '../hooks/useMovementControls';
import { GameUI } from '../components/GameUI';

// First, let's define store sections
const STORE_SECTIONS = {
  PRODUCE: { color: 0x00ff00, productHeight: 0.2 },
  CANNED: { color: 0x808080, productHeight: 0.3 },
  DRINKS: { color: 0x0000ff, productHeight: 0.4 },
  SNACKS: { color: 0xffff00, productHeight: 0.25 },
  FROZEN: { color: 0x00ffff, productHeight: 0.3 },
};

// Add these constants at the top, after STORE_SECTIONS
const MOVEMENT_SETTINGS = {
  WALK_SPEED: 0.05,      // Even slower movement speed
  MOUSE_SENSITIVITY: 0.0005,  // Lower mouse sensitivity
  VERTICAL_LIMIT: Math.PI/3   // Keep the existing vertical look limit
};

const createCheckout = () => {
  const checkoutGroup = new THREE.Group();

  // Counter base
  const counterGeometry = new THREE.BoxGeometry(3, 1, 1);
  const counterMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.7,
    metalness: 0.3
  });
  const counter = new THREE.Mesh(counterGeometry, counterMaterial);
  counter.position.y = 0.5;
  counter.castShadow = true;
  checkoutGroup.add(counter);

  // Register/Screen
  const registerGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.4);
  const registerMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.5,
    metalness: 0.8
  });
  const register = new THREE.Mesh(registerGeometry, registerMaterial);
  register.position.set(0, 1.2, 0);
  register.castShadow = true;
  checkoutGroup.add(register);

  return checkoutGroup;
};

const createOutdoorEnvironment = () => {
  const outdoorGroup = new THREE.Group();

  // Parking lot with lines
  const parkingLotGeometry = new THREE.PlaneGeometry(50, 30);
  const parkingLotMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,  // Darker asphalt color
    roughness: 0.9,
    metalness: 0.1
  });
  const parkingLot = new THREE.Mesh(parkingLotGeometry, parkingLotMaterial);
  parkingLot.rotation.x = -Math.PI / 2;
  parkingLot.position.set(0, -0.1, 35);
  parkingLot.receiveShadow = true;
  outdoorGroup.add(parkingLot);

  // Add parking lines
  const lineGeometry = new THREE.PlaneGeometry(0.2, 5);
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5
  });

  // Create multiple parking spaces
  for (let x = -20; x <= 20; x += 3) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0, 35);
    outdoorGroup.add(line);
  }

  // Add some simple trees
  const createTree = (x: number, z: number) => {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2f1b,
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;

    const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f5f0f,
      roughness: 0.8
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 3.5, z);
    leaves.castShadow = true;

    outdoorGroup.add(trunk);
    outdoorGroup.add(leaves);
  };

  // Add trees along the parking lot
  for (let x = -18; x <= 18; x += 6) {
    createTree(x, 45);
  }

  // Add sidewalk
  const sidewalkGeometry = new THREE.BoxGeometry(40, 0.2, 5);
  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8
  });
  const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
  sidewalk.position.set(0, -0.05, 17.5);
  sidewalk.receiveShadow = true;
  outdoorGroup.add(sidewalk);

  // Add simple exit trim
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.2
  });

  const topTrimGeometry = new THREE.BoxGeometry(4, 0.2, 0.2);
  const topTrim = new THREE.Mesh(topTrimGeometry, trimMaterial);
  topTrim.position.set(0, 3, 15);
  outdoorGroup.add(topTrim);

  const sideTrimGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
  const leftTrim = new THREE.Mesh(sideTrimGeometry, trimMaterial);
  const rightTrim = new THREE.Mesh(sideTrimGeometry, trimMaterial);
  leftTrim.position.set(-2, 1.5, 15);
  rightTrim.position.set(2, 1.5, 15);
  outdoorGroup.add(leftTrim);
  outdoorGroup.add(rightTrim);

  return outdoorGroup;
};

const GroceryStore = () => {
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
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
    isDialogueOpen,
    checkCollision: (newPosition: THREE.Vector3) => {
      const PLAYER_RADIUS = 0.4;
      for (const boundary of shelfBoundaries) {
        if (
          newPosition.x + PLAYER_RADIUS >= boundary.minX &&
          newPosition.x - PLAYER_RADIUS <= boundary.maxX &&
          newPosition.z + PLAYER_RADIUS >= boundary.minZ &&
          newPosition.z - PLAYER_RADIUS <= boundary.maxZ
        ) {
          return true;
        }
      }
      if (
        newPosition.x < -14 || 
        newPosition.x > 14 || 
        newPosition.z < -14
      ) {
        return true;
      }
      return false;
    },
    onItemPickup: (object) => {
      if (object.material instanceof THREE.MeshStandardMaterial) {
        const color = object.material.color;
        const colorName = getColorName(color);
        if (colorName) {
          setShoppingList(prev => [...prev, colorName]);
          object.visible = false;
        }
      }
    }
  });

  // Add shared materials at component level
  const sharedMaterials = {
    shelf: new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.1
    }),
    floor: new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    }),
    wall: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.1
    })
  };

  // Add state for position display
  const [position, setPosition] = useState({ x: 0, y: 1.7, z: 0, rotation: 0 });

  // Add state for the shopping list
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Update sections to include both sides of each aisle
  const sections: Array<{ position: [number, number], type: keyof typeof STORE_SECTIONS }> = [
    // First aisle
    { position: [-8, -7], type: 'PRODUCE' },
    { position: [8, -7], type: 'PRODUCE' },  // Opposite side
    { position: [-8, -3], type: 'PRODUCE' },
    { position: [8, -3], type: 'PRODUCE' },  // Opposite side
    
    // Second aisle
    { position: [-8, 1], type: 'CANNED' },
    { position: [8, 1], type: 'CANNED' },    // Opposite side
    { position: [-8, 5], type: 'DRINKS' },
    { position: [8, 5], type: 'DRINKS' },    // Opposite side
    
    // Third aisle
    { position: [-8, 9], type: 'SNACKS' },
    { position: [8, 9], type: 'SNACKS' },    // Opposite side
    { position: [-8, 13], type: 'FROZEN' },
    { position: [8, 13], type: 'FROZEN' },   // Opposite side
  ];

  // Update collision boundaries to be more precise
  let shelfBoundaries = [
    // Left side shelves
    { minX: -9, maxX: -7, minZ: -8, maxZ: -6 },    // First aisle left front
    { minX: -9, maxX: -7, minZ: -4, maxZ: -2 },    // First aisle left back
    { minX: -9, maxX: -7, minZ: 0, maxZ: 2 },      // Second aisle left front
    { minX: -9, maxX: -7, minZ: 4, maxZ: 6 },      // Second aisle left back
    { minX: -9, maxX: -7, minZ: 8, maxZ: 10 },     // Third aisle left front
    { minX: -9, maxX: -7, minZ: 12, maxZ: 14 },    // Third aisle left back

    // Right side shelves
    { minX: 7, maxX: 9, minZ: -8, maxZ: -6 },      // First aisle right front
    { minX: 7, maxX: 9, minZ: -4, maxZ: -2 },      // First aisle right back
    { minX: 7, maxX: 9, minZ: 0, maxZ: 2 },        // Second aisle right front
    { minX: 7, maxX: 9, minZ: 4, maxZ: 6 },        // Second aisle right back
    { minX: 7, maxX: 9, minZ: 8, maxZ: 10 },       // Third aisle right front
    { minX: 7, maxX: 9, minZ: 12, maxZ: 14 },      // Third aisle right back

    // Store outer walls (with gap for door)
    { minX: -15, maxX: 15, minZ: -15.5, maxZ: -14.5 },  // Back wall
    { minX: -15, maxX: -2, minZ: 14.5, maxZ: 15.5 },    // Front wall left
    { minX: 2, maxX: 15, minZ: 14.5, maxZ: 15.5 },      // Front wall right
    { minX: -15.5, maxX: -14.5, minZ: -15, maxZ: 15 },  // Left wall
    { minX: 14.5, maxX: 15.5, minZ: -15, maxZ: 15 },    // Right wall
  ];

  const createProduct = (section: keyof typeof STORE_SECTIONS) => {
    const { color, productHeight } = STORE_SECTIONS[section];
    const productGeometry = new THREE.BoxGeometry(0.3, productHeight, 0.3);
    const productMaterial = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.5,
      metalness: 0.1
    });
    const product = new THREE.Mesh(productGeometry, productMaterial) as PickupableObject;
    product.isPickupable = true;
    return product;
  };

  const createShelf = (section: keyof typeof STORE_SECTIONS) => {
    const shelfGroup = new THREE.Group();
    
    // Shelf base with more detail
    const shelfGeometry = new THREE.BoxGeometry(2, 0.05, 1);
    const shelfMaterial = sharedMaterials.shelf;
    
    // Create 4 levels of shelves
    for (let i = 0; i < 4; i++) {
      const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
      shelf.position.y = 0.5 + (i * 0.8);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      shelfGroup.add(shelf);
      
      // Add products to each shelf
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
      for (let j = -0.8; j <= 0.8; j += 0.4) {
        const product = createProduct(section);
        product.position.set(j, 0.2, 0); // Position relative to shelf
        product.castShadow = true;
        shelf.add(product);
      }
      
      // Add vertical supports
      if (i === 0) {
        const supportGeometry = new THREE.BoxGeometry(0.1, 3.2, 1);
        const supportLeft = new THREE.Mesh(supportGeometry, shelfMaterial);
        const supportRight = new THREE.Mesh(supportGeometry, shelfMaterial);
        
        supportLeft.position.set(-0.95, 1.6, 0);
        supportRight.position.set(0.95, 1.6, 0);
        
        supportLeft.castShadow = true;
        supportRight.castShadow = true;
        
        shelfGroup.add(supportLeft);
        shelfGroup.add(supportRight);
      }
    }
    
    return shelfGroup;
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    if (mountRef.current) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);
    }

    // Simplified lighting - just a few key lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Just two main directional lights
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 8, -5);
    scene.add(fillLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floor = new THREE.Mesh(floorGeometry, sharedMaterials.floor);
    floor.rotation.x = Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create ceiling
    const ceiling = new THREE.Mesh(floorGeometry, sharedMaterials.floor);
    ceiling.position.y = 5;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Create all shelves
    sections.forEach(({ position, type }) => {
      const [x, z] = position;
      const shelf = createShelf(type);
      shelf.position.set(x, 0, z);
      scene.add(shelf);
    });

    // Create checkout counter
    const checkout = createCheckout();
    checkout.position.set(0, 0, 12); // Position near front of store
    checkout.rotation.y = Math.PI; // Face towards back of store
    scene.add(checkout);

    // Add to collision boundaries
    const checkoutBoundary = { minX: -1.5, maxX: 1.5, minZ: 11.5, maxZ: 12.5 };
    shelfBoundaries.push(checkoutBoundary);

    // Add outdoor environment
    const outdoor = createOutdoorEnvironment();
    scene.add(outdoor);

    // Update store boundaries to include exit path
    const exitPath = { minX: -1.5, maxX: 1.5, minZ: 14, maxZ: 16 };
    shelfBoundaries = shelfBoundaries.filter(boundary => 
      !(boundary.minZ === 15 && boundary.maxZ === 15.5 && boundary.minX === -15 && boundary.maxX === 15)
    );

    // Add walls
    const walls = [
      // Back wall
      { size: [40, 5, 0.5] as [number, number, number], position: [0, 2.5, -15] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      // Front wall with gap for door
      { size: [18, 5, 0.5] as [number, number, number], position: [-11, 2.5, 15] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      { size: [18, 5, 0.5] as [number, number, number], position: [11, 2.5, 15] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      // Side walls
      { size: [0.5, 5, 30] as [number, number, number], position: [-15, 2.5, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      { size: [0.5, 5, 30] as [number, number, number], position: [15, 2.5, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    ];

    walls.forEach(({ size, position, rotation }) => {
      const wallGeometry = new THREE.BoxGeometry(...size);
      const wall = new THREE.Mesh(wallGeometry, sharedMaterials.wall);
      wall.position.set(...position);
      wall.rotation.set(...rotation);
      scene.add(wall);
    });

    camera.position.set(0, 1.7, 0);
    camera.lookAt(0, 1.7, -1);

    // Update animation loop
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

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isPointerLocked]);

  // Helper function to identify colors
  const getColorName = (color: THREE.Color): string | null => {
    const hex = color.getHexString();
    const colorMap: { [key: string]: string } = {
      '00ff00': 'Green',
      '808080': 'Gray',
      '0000ff': 'Blue',
      'ffff00': 'Yellow',
      '00ffff': 'Cyan',
    };
    return colorMap[hex] || null;
  };

  // Add exit trigger check in handleMove
  const checkExit = (position: THREE.Vector3) => {
    if (
      position.z > 15 && 
      position.x > -1.5 && 
      position.x < 1.5
    ) {
      // Exit without message
    }
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
        shoppingList={shoppingList}
      />
    </div>
  );
};

export default GroceryStore;
