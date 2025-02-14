import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const MOVEMENT_SETTINGS = {
  WALK_SPEED: 0.05,
  MOUSE_SENSITIVITY: 0.0005,
  VERTICAL_LIMIT: Math.PI / 4
};

export interface PickupableObject extends THREE.Mesh {
  isPickupable?: boolean;
  onPickup?: () => void;
}

export interface DialogueObject extends THREE.Object3D {
  isDialogueEnabled?: boolean;
  onDialogueStart?: () => void;
  dialogueDistance?: number;
}

interface UseMovementControlsProps {
  isDialogueOpen?: boolean;
  checkCollision?: (newPosition: THREE.Vector3) => boolean;
  onItemPickup?: (object: PickupableObject) => void;
  onDialogueStart?: (object: DialogueObject) => void;
}

export const useMovementControls = ({ 
  isDialogueOpen = false, 
  checkCollision,
  onItemPickup,
  onDialogueStart 
}: UseMovementControlsProps) => {
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const sceneRef = useRef<THREE.Scene | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked || !cameraRef.current || isDialogueOpen || isMenuOpen) return;
      
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      
      if (Math.abs(movementX) > Math.abs(movementY)) {
        cameraRef.current.rotation.y -= movementX * MOVEMENT_SETTINGS.MOUSE_SENSITIVITY;
      } else if (Math.abs(movementY) > Math.abs(movementX)) {
        const verticalSensitivity = MOVEMENT_SETTINGS.MOUSE_SENSITIVITY * 0.5;
        const verticalLimit = Math.PI / 4;
        
        const newRotationX = cameraRef.current.rotation.x - movementY * verticalSensitivity;
        cameraRef.current.rotation.x = Math.max(-verticalLimit, Math.min(verticalLimit, newRotationX));
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDialogueOpen || isMenuOpen) return;
      keysPressed.current[event.key.toLowerCase()] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isDialogueOpen || isMenuOpen) return;
      keysPressed.current[event.key.toLowerCase()] = false;
    };

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === mountRef.current);
      clearKeys();
    };

    const handlePickup = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'e' || !cameraRef.current || !sceneRef.current || isDialogueOpen) return;

      // Cast ray from center of screen
      raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);

      // Get all pickupable meshes
      const pickupableMeshes: PickupableObject[] = [];
      sceneRef.current.traverse((object) => {
        const mesh = object as PickupableObject;
        if (mesh.isPickupable) {
          pickupableMeshes.push(mesh);
        }
      });

      // Check for intersections
      const intersects = raycasterRef.current.intersectObjects(pickupableMeshes);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object as PickupableObject;
        if (hitObject.isPickupable) {
          // Call object's own pickup handler if it exists
          hitObject.onPickup?.();
          // Call the provided pickup handler
          onItemPickup?.(hitObject);
        }
      }
    };

    const handleDialogue = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'q' || !cameraRef.current || !sceneRef.current || isDialogueOpen) return;

      // Cast ray from center of screen
      raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);

      // Get all dialogue-enabled objects
      const dialogueObjects: DialogueObject[] = [];
      sceneRef.current.traverse((object) => {
        const dialogueObj = object as DialogueObject;
        if (dialogueObj.isDialogueEnabled) {
          dialogueObjects.push(dialogueObj);
        }
      });

      // Check for intersections and distance
      const intersects = raycasterRef.current.intersectObjects(dialogueObjects);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object as DialogueObject;
        const distance = intersects[0].distance;
        
        if (hitObject.isDialogueEnabled && 
            (!hitObject.dialogueDistance || distance <= hitObject.dialogueDistance)) {
          // Call object's own dialogue handler if it exists
          hitObject.onDialogueStart?.();
          // Call the provided dialogue handler
          onDialogueStart?.(hitObject);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDialogueOpen) {
        if (!isMenuOpen) {
          setIsMenuOpen(true);
          document.exitPointerLock();
          clearKeys();
        } else {
          setIsMenuOpen(false);
          clearKeys();
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('keydown', handlePickup);
    document.addEventListener('keydown', handleDialogue);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('keydown', handlePickup);
      document.removeEventListener('keydown', handleDialogue);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPointerLocked, isDialogueOpen, isMenuOpen, onItemPickup, onDialogueStart]);

  const movePlayer = () => {
    if (!cameraRef.current || isDialogueOpen || isMenuOpen) return;

    const camera = cameraRef.current;
    const currentPosition = camera.position.clone();

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));

    const movement = new THREE.Vector3(0, 0, 0);

    if (keysPressed.current['w']) {
      movement.add(direction.clone().multiplyScalar(MOVEMENT_SETTINGS.WALK_SPEED));
    }
    if (keysPressed.current['s']) {
      movement.add(direction.clone().multiplyScalar(-MOVEMENT_SETTINGS.WALK_SPEED));
    }
    if (keysPressed.current['a']) {
      movement.add(right.clone().multiplyScalar(-MOVEMENT_SETTINGS.WALK_SPEED));
    }
    if (keysPressed.current['d']) {
      movement.add(right.clone().multiplyScalar(MOVEMENT_SETTINGS.WALK_SPEED));
    }

    if (movement.length() > 0) {
      const newPosition = currentPosition.clone().add(movement);
      if (!checkCollision || !checkCollision(newPosition)) {
        camera.position.copy(newPosition);
      }
    }
  };

  const mountRef = useRef<HTMLDivElement>(null);
  
  const handleClick = () => {
    mountRef.current?.requestPointerLock();
  };

  const clearKeys = () => {
    keysPressed.current = {};
  };

  return {
    mountRef,
    cameraRef,
    sceneRef,
    isPointerLocked,
    isMenuOpen,
    setIsMenuOpen,
    movePlayer,
    handleClick,
    raycasterRef
  };
}; 