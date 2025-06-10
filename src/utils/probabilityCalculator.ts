import { GameObject, GridPosition, Orientation } from '../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../consts/gameData';

interface PlacementInfo {
  cells: GridPosition[];
  weight: number;
}

export function calculateProbabilities(objects: GameObject[], blockedCells: GridPosition[]): number[][] {
  // Initialize probability grid
  const probabilities = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0.0));

  // Convert blocked cells to Set for fast lookup
  const blockedCellsSet = new Set(blockedCells.map(({ x, y }) => `${x},${y}`));

  // Helper function to check if a cell is blocked
  const isBlocked = (x: number, y: number): boolean => {
    return blockedCellsSet.has(`${x},${y}`);
  };

  // Helper function to get all valid orientations
  const getOrientations = (w: number, h: number): Orientation[] => {
    if (w === h) {
      return [{ w, h }];
    }
    return [{ w, h }, { w: h, h: w }];
  };

  // Helper function to check if placement is valid
  const isValidPlacement = (x: number, y: number, w: number, h: number): boolean => {
    // Check bounds
    if (x + w > GRID_WIDTH || y + h > GRID_HEIGHT || x < 0 || y < 0) {
      return false;
    }
    
    // Check if any cell is blocked
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (isBlocked(x + dx, y + dy)) {
          return false;
        }
      }
    }
    return true;
  };

  // Calculate probabilities for each object type
  for (const obj of objects) {
    const { w: originalW, h: originalH, count } = obj;

    // Skip if no objects remaining
    if (count <= 0) continue;

    const orientations = getOrientations(originalW, originalH);
    const validPlacements: PlacementInfo[] = [];

    // Find all valid placements for this object type
    for (const { w, h } of orientations) {
      for (let y = 0; y <= GRID_HEIGHT - h; y++) {
        for (let x = 0; x <= GRID_WIDTH - w; x++) {
          if (isValidPlacement(x, y, w, h)) {
            const cells: GridPosition[] = [];
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) {
                cells.push({ x: x + dx, y: y + dy });
              }
            }
            
            // Each placement has equal weight for now
            // In more advanced versions, we could weight by strategic value
            validPlacements.push({ cells, weight: 1.0 });
          }
        }
      }
    }

    const totalPlacements = validPlacements.length;
    if (totalPlacements === 0) continue;

    // Calculate how many times each cell is covered by valid placements
    const cellCoverage = new Map<string, number>();
    
    for (const placement of validPlacements) {
      for (const cell of placement.cells) {
        const key = `${cell.x},${cell.y}`;
        cellCoverage.set(key, (cellCoverage.get(key) || 0) + placement.weight);
      }
    }

    // Calculate probability for each cell
    const totalWeight = validPlacements.reduce((sum, p) => sum + p.weight, 0);
    
    for (const [cellKey, coverage] of cellCoverage.entries()) {
      const [x, y] = cellKey.split(',').map(Number);
      
      // Probability that a single object covers this cell
      const singleObjectProb = coverage / totalWeight;
      
      // Probability that at least one of 'count' objects covers this cell
      // Using complement: P(at least one) = 1 - P(none)
      // P(none) = (1 - singleObjectProb)^count
      const atLeastOneProb = 1 - Math.pow(1 - singleObjectProb, count);
      
      // Combine with existing probability (for multiple object types)
      // P(A or B) = P(A) + P(B) - P(A and B)
      // For independent events: P(A and B) = P(A) * P(B)
      // So: P(A or B) = P(A) + P(B) - P(A) * P(B) = 1 - (1-P(A)) * (1-P(B))
      probabilities[y][x] = 1 - (1 - probabilities[y][x]) * (1 - atLeastOneProb);
    }
  }

  // Ensure blocked cells have 0 probability
  for (const cell of blockedCells) {
    if (cell.x >= 0 && cell.x < GRID_WIDTH && cell.y >= 0 && cell.y < GRID_HEIGHT) {
      probabilities[cell.y][cell.x] = 0.0;
    }
  }

  return probabilities;
}
