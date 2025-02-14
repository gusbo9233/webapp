import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

export interface DialogueObject extends THREE.Group {
  isDialogueEnabled?: boolean;
  dialogueDistance?: number;
}

export interface PickupableObject extends THREE.Mesh {
  isPickupable?: boolean;
  pickupDistance?: number;
}

interface UseMovementControlsProps {
  isDialogueOpen?: boolean;
  checkCollision?: (newPosition: THREE.Vector3) => boolean;
  onItemPickup?: (object: PickupableObject) => void;
}

export function useMovementControls({
  isDialogueOpen = false,
  checkCollision,
  onItemPickup
}: UseMovementControlsProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const moveForwardRef = useRef(false);
  const moveBackwardRef = useRef(false);
  const moveLeftRef = useRef(false);
  const moveRightRef = useRef(false);
  const prevTimeRef = useRef(performance.now());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isDialogueOpen || isMenuOpen) return;
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        moveForwardRef.current = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        moveBackwardRef.current = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        moveLeftRef.current = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        moveRightRef.current = true;
        break;
      case 'Escape':
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        break;
    }
  }, [isDialogueOpen, isMenuOpen]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        moveForwardRef.current = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        moveBackwardRef.current = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        moveLeftRef.current = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        moveRightRef.current = false;
        break;
    }
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isPointerLocked || !cameraRef.current || isDialogueOpen || isMenuOpen) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    // Horizontal rotation
    cameraRef.current.rotation.y -= movementX * 0.002;

    // Vertical rotation (with limits)
    const newRotationX = cameraRef.current.rotation.x - movementY * 0.002;
    const PI_2 = Math.PI / 2;
    cameraRef.current.rotation.x = Math.max(-PI_2, Math.min(PI_2, newRotationX));
  }, [isPointerLocked, isDialogueOpen, isMenuOpen]);

  const handleClick = useCallback(() => {
    if (!mountRef.current || isDialogueOpen || isMenuOpen) return;
    mountRef.current.requestPointerLock();
  }, [isDialogueOpen, isMenuOpen]);

  const handlePointerLockChange = useCallback(() => {
    setIsPointerLocked(document.pointerLockElement !== null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handlePointerLockChange]);

  const movePlayer = useCallback(() => {
    if (!cameraRef.current || isDialogueOpen || isMenuOpen) return;

    const time = performance.now();
    const delta = (time - prevTimeRef.current) / 1000;

    const moveSpeed = 5.0;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();

    direction.z = Number(moveForwardRef.current) - Number(moveBackwardRef.current);
    direction.x = Number(moveRightRef.current) - Number(moveLeftRef.current);
    direction.normalize();

    if (moveForwardRef.current || moveBackwardRef.current) {
      velocity.z = direction.z * moveSpeed * delta;
    }
    if (moveLeftRef.current || moveRightRef.current) {
      velocity.x = direction.x * moveSpeed * delta;
    }

    // Apply camera rotation to movement
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(cameraRef.current.rotation.y);
    velocity.applyMatrix4(rotationMatrix);

    // Calculate new position
    const newPosition = cameraRef.current.position.clone();
    newPosition.add(velocity);

    // Check for collisions if a collision checker is provided
    if (checkCollision && !checkCollision(newPosition)) {
      cameraRef.current.position.copy(newPosition);
    }

    // Check for pickupable objects
    if (onItemPickup && sceneRef.current) {
      const raycaster = new THREE.Raycaster();
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(cameraRef.current.quaternion);
      raycaster.set(cameraRef.current.position, direction);

      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      for (const intersect of intersects) {
        const object = intersect.object as PickupableObject;
        if (object.isPickupable && intersect.distance <= (object.pickupDistance || 2)) {
          onItemPickup(object);
          break;
        }
      }
    }

    prevTimeRef.current = time;
  }, [isDialogueOpen, isMenuOpen, checkCollision, onItemPickup]);

  return {
    mountRef,
    cameraRef,
    sceneRef,
    isPointerLocked,
    isMenuOpen,
    setIsMenuOpen,
    movePlayer,
    handleClick
  };
} 