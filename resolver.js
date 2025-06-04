function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const numberLinkSolver = {
  grid: [],
  rows: 0,
  cols: 0,
  pairs: [],
  solutionFound: false,
  maxSteps: 50000, // máximo de pasos por par
  startTime: 0,
  timedOut: false,
  animationDelay: 15, // Tiempo de animación para cada paso

  init: function(initialGrid) {
    this.grid = initialGrid.map(row => row.map(cell => cell.trim()));
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.pairs = this.findPairs(this.grid);
    this.solutionFound = false;
    this.timedOut = false;
    this.startTime = Date.now();
  },

  // Encontrar los pares de números y ordenarlos por distancia Manhattan
  findPairs: function(grid) {
    const pairMap = {};
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        const val = grid[r][c];
        if (val !== '') {
          if (!pairMap[val]) pairMap[val] = [];
          pairMap[val].push([r, c]);
        }
      }
    }
    const pairsArr = Object.keys(pairMap).map(val => {
      const [start, end] = pairMap[val];
      const dist = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
      return { val, start, end, dist };
    }).sort((a, b) => a.dist - b.dist); // Ordenamos por la distancia Manhattan

    return pairsArr;
  },

  // Función para obtener los vecinos adyacentes
  getNeighbors: function(r, c) {
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([nr, nc]) => nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols);
  },

  // Verificar la conectividad de los próximos 2 pares
  async checkNextPairsConnectivity(pairsIndex) {
    if (pairsIndex + 2 >= this.pairs.length) return true;

    const firstPair = this.pairs[pairsIndex];
    const secondPair = this.pairs[pairsIndex + 1];

    // Verificamos si hay caminos viables entre el último punto del primer par y el primero del segundo
    const [endRow, endCol] = firstPair.end;
    const [startRow, startCol] = secondPair.start;

    // Usamos un BFS para verificar si hay conexión
    const queue = [[endRow, endCol]];
    const visited = new Set();
    visited.add(`${endRow},${endCol}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r === startRow && c === startCol) return true;

      const neighbors = this.getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        if (!visited.has(`${nr},${nc}`)) {
          visited.add(`${nr},${nc}`);
          queue.push([nr, nc]);
        }
      }
    }

    return false;
  },

  // Resolución con Backtracking
  async solve() {
    this.solutionFound = await this.backtrackSolve(0, 0); // Comienza desde el primer par y el primer intento
    return this.solutionFound;
  },

  // Backtracking con verificación de caminos
  async backtrackSolve(pairIndex, attemptIndex) {
    if (this.timedOut || pairIndex >= this.pairs.length) {
      return this.isGridFull();
    }

    const pair = this.pairs[pairIndex];
    const path = [pair.start];
    let foundSolution = false;

    // Intentamos hasta 50 caminos por par
    for (let i = 0; i < 50; i++) {
      if (this.timedOut) return false;
      foundSolution = await this.findPathForPair(path, pair, pairIndex, i);
      if (foundSolution) break;

      // Si no encontramos solución, volvemos atrás
      path.pop();
    }

    if (foundSolution) {
      if (await this.checkNextPairsConnectivity(pairIndex)) {
        if (await this.backtrackSolve(pairIndex + 1, 0)) return true;
      }
    }

    return false;
  },

  // Encontrar el camino para un par específico
  async findPathForPair(path, pair, pairIndex, attemptIndex) {
    const [r, c] = path[path.length - 1];
    const [endR, endC] = pair.end;
    const neighbors = this.getNeighborsSorted(r, c, endR, endC);

    for (const [nr, nc] of neighbors) {
      if (this.grid[nr][nc] === '' || (nr === endR && nc === endC)) {
        path.push([nr, nc]);
        this.grid[nr][nc] = pair.val;
        await this.updateCellVisual(nr, nc, pair.val, true);

        if (this.isPathComplete(pair.val)) {
          return true;
        }

        if (await this.findPathForPair(path, pair, pairIndex, attemptIndex)) {
          return true;
        }

        path.pop();
        this.grid[nr][nc] = '';
        await this.updateCellVisual(nr, nc, pair.val, false);
      }
    }

    return false;
  },

  // Verificar si un camino para un par está completo
  isPathComplete(val) {
    const pair = this.pairs.find(p => p.val === val);
    if (!pair) return false;
    const [startR, startC] = pair.start;
    const [endR, endC] = pair.end;

    return this.grid[endR][endC] === val;
  },

  // Verificar si la grilla está llena
  isGridFull() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === '') return false;
      }
    }
    return true;
  },

  // Actualizar la visualización de las celdas
  async updateCellVisual(row, col, val, isAdding) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    if (isAdding) {
      cell.classList.add(`color-${val}`, 'pathing');
      cell.textContent = "";
    } else {
      const originalVal = (cell.dataset.original || "").trim();
      cell.classList.remove('pathing');
      if (originalVal !== "") {
        cell.className = `cell color-${originalVal}`;
        cell.textContent = originalVal;
      } else {
        cell.className = "cell";
        cell.textContent = "";
      }
    }
  }
};

// Llamar al solver y pasar el tablero inicial
async function solveNumberLink(initialGrid) {
  numberLinkSolver.init(initialGrid);
  const success = await numberLinkSolver.solve();
  if (!success) alert("No se encontró solución válida");
}
