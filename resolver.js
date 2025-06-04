function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const numberLinkSolver = {
  grid: [],
  rows: 0,
  cols: 0,
  pairs: [],
  finalSolutionGrid: [],
  solutionFound: false,

  init: function(initialGrid) {
    this.grid = initialGrid.map(row => row.map(cell => cell.trim()));
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.pairs = this.findPairs(this.grid);
    this.finalSolutionGrid = this.grid.map(row => row.map(cell => cell));
    this.solutionFound = false;
  },

  findPairs: function(grid) {
    const pairMap = {};
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        const val = grid[r][c];
        if (val !== '') {
          if (!pairMap[val]) pairMap[val] = [];
          pairMap[val].push([r,c]);
        }
      }
    }
    // Convertir a array ordenado por distancia manhattan ascendente
    const pairsArr = Object.keys(pairMap).map(val => {
      const [start, end] = pairMap[val];
      const dist = Math.abs(start[0]-end[0]) + Math.abs(start[1]-end[1]);
      return { val, start, end, dist };
    }).sort((a,b) => a.dist - b.dist);

    // Validar que todos tengan dos puntos
    for (const p of pairsArr) {
      if (!p.start || !p.end) throw new Error(`Número ${p.val} no tiene dos puntos.`);
    }
    return pairsArr;
  },

  async solve() {
    this.clearNonFixed();

    // Estado inicial: un path por par, empezando en start
    const paths = this.pairs.map(p => [p.start]);
    const doneFlags = Array(this.pairs.length).fill(false);

    this.solutionFound = await this.backtrackParallel(paths, doneFlags);

    return this.solutionFound;
  },

  async backtrackParallel(paths, doneFlags) {
    if (this.solutionFound) return true;

    // Si todos están terminados y matriz llena => solución encontrada
    if (doneFlags.every(flag => flag) && this.isGridFull()) {
      this.solutionFound = true;
      this.drawSolution();
      return true;
    }

    // Para cada par aún no terminado, intentar extender su camino
    for (let i=0; i < this.pairs.length; i++) {
      if (doneFlags[i]) continue;

      const {val, end} = this.pairs[i];
      const path = paths[i];
      const [r,c] = path[path.length - 1];

      const neighbors = this.getNeighborsSorted(r,c, end[0], end[1]);

      for (const [nr, nc] of neighbors) {
        if (this.solutionFound) return true;

        // Validaciones de paso:
        if (this.finalSolutionGrid[nr][nc] !== '' && this.finalSolutionGrid[nr][nc] !== val) continue;

        // No retroceder en el mismo camino
        if (path.some(([pr, pc]) => pr === nr && pc === nc)) continue;

        // No pisar puntos de otros pares
        let isOtherPairPoint = false;
        for (const [j, p] of this.pairs.entries()) {
          if (j !== i) {
            const [pStart, pEnd] = [p.start, p.end];
            if ((pStart[0] === nr && pStart[1] === nc) || (pEnd[0] === nr && pEnd[1] === nc)) {
              isOtherPairPoint = true;
              break;
            }
          }
        }
        if (isOtherPairPoint) continue;

        // Extender camino
        path.push([nr,nc]);
        this.finalSolutionGrid[nr][nc] = val;
        this.updateCellVisual(nr, nc, val, true);
        await delay(30);

        // Si llegamos al destino, marcar done
        let ended = false;
        if (nr === end[0] && nc === end[1]) {
          doneFlags[i] = true;
          ended = true;
        }

        // Recurse
        if (await this.backtrackParallel(paths, doneFlags)) {
          return true;
        }

        // Backtrack
        if (ended) doneFlags[i] = false;
        path.pop();
        this.finalSolutionGrid[nr][nc] = '';
        this.updateCellVisual(nr, nc, val, false);
        await delay(30);
      }
    }

    return false;
  },

  getNeighborsSorted: function(r, c, targetR, targetC) {
    const neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      .filter(([nr,nc]) => nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols);

    neighbors.sort((a,b) => {
      const distA = Math.abs(a[0] - targetR) + Math.abs(a[1] - targetC);
      const distB = Math.abs(b[0] - targetR) + Math.abs(b[1] - targetC);
      return distA - distB;
    });

    return neighbors;
  },

  clearNonFixed: function() {
    for (let r=0; r<this.rows; r++) {
      for (let c=0; c<this.cols; c++) {
        if (this.grid[r][c] === '') this.finalSolutionGrid[r][c] = '';
      }
    }
  },

  drawSolution: function() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      const val = this.finalSolutionGrid[r][c];
      const orig = (cell.dataset.original || '').trim();

      cell.className = "cell";
      if(val !== '') {
        cell.classList.add(`color-${val}`, 'completed');
        cell.textContent = val === orig ? val : '';
      } else {
        cell.textContent = '';
      }
    });

    if (checkVictory()) {
      setTimeout(() => {
        document.getElementById('victoryModal').style.display = 'block';
      }, 400);
    }
  },

  isGridFull: function() {
    for (let r=0; r<this.rows; r++) {
      for (let c=0; c<this.cols; c++) {
        if (this.finalSolutionGrid[r][c] === '') return false;
      }
    }
    return true;
  },

  updateCellVisual: function(row, col, val, isAdding) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    if (isAdding) {
      cell.classList.add(`color-${val}`, 'pathing');
      cell.textContent = "";
    } else {
      const originalVal = (cell.dataset.original || "").trim();
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

async function solveNumberLink(initialGrid) {
  numberLinkSolver.init(initialGrid);
  const success = await numberLinkSolver.solve();
  if (!success) alert("No se encontró solución válida");
}
