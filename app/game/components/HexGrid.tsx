"use client";
import { useMemo, useState, useEffect } from 'react';

interface HexGridProps {
  rows: number;
  cols: number;
}

interface Hex {
  x: number;
  y: number;
  row: number;
  col: number;
  resource?: string;
  unit?: string;
  building?: string;
  isSelected?: boolean;
}

// Hex directions for neighbors (odd-r offset coordinates)
const oddNeighbors = [
  [1, 0], [0, -1], [-1, -1],
  [-1, 0], [-1, 1], [0, 1]
];

const evenNeighbors = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [0, 1], [1, 1]
];

export default function HexGrid({ rows, cols }: HexGridProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  
  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate hex dimensions based on screen size
  const size = Math.min(dimensions.width, dimensions.height) / (rows * 2.5);
  const width = Math.sqrt(3) * size;
  const height = 2 * size;
  const horizontalSpacing = width;
  const verticalSpacing = height * 0.75;

  // Generate points for a hexagon
  const hexPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (60 * i - 30) * Math.PI / 180;
      points.push([
        size * Math.cos(angle),
        size * Math.sin(angle)
      ]);
    }
    return points.map(point => point.join(',')).join(' ');
  }, [size]);

  // Generate grid of hexagons with resources
  const hexagons = useMemo(() => {
    const hexes: Hex[] = [];
    const half = Math.floor(rows / 2);
    
    for (let q = -half; q <= half; q++) {
      const r1 = Math.max(-half, -q - half);
      const r2 = Math.min(half, -q + half);
      
      for (let r = r1; r <= r2; r++) {
        const x = horizontalSpacing * (q + r/2);
        const y = verticalSpacing * r;
        
        // Random resource assignment (10% chance)
        const hasResource = Math.random() < 0.1;
        const resource = hasResource ? (Math.random() < 0.5 ? 'gold' : 'oil') : undefined;
        
        hexes.push({
          x,
          y,
          row: r,
          col: q,
          resource
        });
      }
    }
    return hexes;
  }, [rows, horizontalSpacing, verticalSpacing]);

  const handleHexClick = (hex: Hex) => {
    if (selectedHex?.row === hex.row && selectedHex?.col === hex.col) {
      setSelectedHex(null);
    } else {
      setSelectedHex(hex);
    }
  };

  // Calculate SVG viewport size
  const viewportWidth = dimensions.width;
  const viewportHeight = dimensions.height - 100; // Leave some space for header

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox={`${-viewportWidth/2} ${-viewportHeight/2} ${viewportWidth} ${viewportHeight}`}
        className="bg-gray-100"
        preserveAspectRatio="xMidYMid meet"
      >
        {hexagons.map((hex, index) => (
          <g
            key={index}
            transform={`translate(${hex.x}, ${hex.y})`}
            className="cursor-pointer"
            onClick={() => handleHexClick(hex)}
          >
            <polygon
              points={hexPoints}
              className={`
                ${selectedHex?.row === hex.row && selectedHex?.col === hex.col 
                  ? 'fill-yellow-200' 
                  : 'fill-white'} 
                ${hex.resource === 'gold' ? 'stroke-yellow-500' : 
                  hex.resource === 'oil' ? 'stroke-black' : 'stroke-gray-300'}
                hover:fill-blue-50 transition-colors
              `}
              strokeWidth="2"
            />
            {/* Coordinates for debugging */}
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-400"
            >
              {`${hex.row},${hex.col}`}
              {hex.resource && <tspan x="0" y="15" className="text-xs">{hex.resource}</tspan>}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
} 