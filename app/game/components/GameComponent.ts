import { Point } from '../types/Point';

export enum GameCompType {
  GOLD = 'GOLD',
  OIL = 'OIL',
  BUILDER = 'BUILDER',
  BASE = 'BASE',
  // Add other component types as needed
}

export interface ResourceCosts {
  [GameCompType.GOLD]: number;
  [GameCompType.OIL]: number;
}

export interface Cell {
  id: string;
  image?: string;
  type: GameCompType;
  cost?: ResourceCosts;
}

export interface Hex {
  x: number;
  y: number;
  row: number;
  col: number;
  resource?: string;
  unit?: GameComponent;
  building?: GameComponent;
}

export abstract class GameComponent {
  protected height: number;
  protected width: number;
  protected friendly: boolean;
  protected gameCompType: GameCompType;
  protected resourceCosts: ResourceCosts;
  protected cells: Cell[];
  protected coolDown: number;
  protected static readonly COOLDOWN = 17;
  protected imagePath: string | null = null;
  protected onCooldown: boolean = false;
  protected hostHex: Hex | null = null;

  constructor(
    friendly: boolean, 
    width: number, 
    height: number, 
    gameCompType: GameCompType
  ) {
    this.friendly = friendly;
    this.cells = [];
    this.width = width;
    this.height = height;
    this.gameCompType = gameCompType;
    this.coolDown = 0;

    this.resourceCosts = {
      [GameCompType.GOLD]: 0,
      [GameCompType.OIL]: 0
    };

    this.createImage();
  }

  protected createImage(): void {
    const imageFileName = this.gameCompType.toString().toLowerCase();
    this.imagePath = `/images/${imageFileName}.png`;
  }

  setHostHex(hex: Hex | null): void {
    this.removeHostHex();
    this.hostHex = hex;
  }

  removeHostHex(): void {
    if (this.hostHex) {
      if (this instanceof Unit) {
        this.hostHex.unit = undefined;
      } else {
        this.hostHex.building = undefined;
      }
      this.hostHex = null;
    }
  }

  getPos(): Point {
    if (!this.hostHex) return { x: 0, y: 0 };
    return {
      x: this.hostHex.x,
      y: this.hostHex.y
    };
  }

  getCollider(): { x: number, y: number, width: number, height: number } {
    const pos = this.getPos();
    return {
      x: pos.x - this.width / 2,
      y: pos.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  // Getters
  getCells(): Cell[] {
    return this.cells;
  }

  getGameCompType(): GameCompType {
    return this.gameCompType;
  }

  getCoolDown(): number {
    return this.onCooldown ? Math.floor(this.coolDown) : 0;
  }

  getHostHex(): Hex | null {
    return this.hostHex;
  }

  getResourceCosts(): ResourceCosts {
    return this.resourceCosts;
  }

  isOnCooldown(): boolean {
    return this.onCooldown;
  }

  isFriendly(): boolean {
    return this.friendly;
  }

  getImagePath(): string | null {
    return this.imagePath;
  }

  setFriendly(friendly: boolean): void {
    this.friendly = friendly;
  }
}

// Add these classes for type checking
export class Unit extends GameComponent {}
export class Building extends GameComponent {} 