function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const numberLinkSolver = {
    grid: [],
    rows: 0,
    cols: 0,
    pairs: [],
    solutionFound: false,
    animationDelay: 15, // Más rápido para ver los resultados antes
    timeout: 30000, // Aumentamos un poco el timeout (30 segundos)
    startTime: 0,
    timedOut: false,

    init: function(initialGrid, pairsOrder) {
        this.grid = initialGrid.map(row => [...row]);
        this.rows = this.grid.length;
        this.cols = this.grid[0].length;
        this.pairs = pairsOrder;
        this.solutionFound = false;
        this.timedOut = false;
        this.startTime = Date.now();
    },

    // Función para encontrar los pares de números en el tablero y ordenarlos por distancia de Manhattan
    findPairsAndSort: function(grid) {
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
        return Object.keys(pairMap).map(val => {
            const [start, end] = pairMap[val];
            const dist = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
            return { val, start, end, dist };
        }).sort((a, b) => a.dist - b.dist);
    },

    // Función para obtener los vecinos de una celda
    getNeighbors: function(r, c) {
        return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
            .filter(([nr, nc]) => nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols);
    },

    // Función para la propagación de restricciones (Regla 1 y Regla 2)
    async propagateConstraints() {
        let changed = true;
        while (changed) {
            changed = false;

            // Regla 1: Movimientos forzados
            for (const pair of this.pairs) {
                const endpoints = this.findPathEndpoints(pair.val);
                for (const [r, c] of endpoints) {
                    const emptyNeighbors = this.getNeighbors(r, c).filter(([nr, nc]) => this.grid[nr][nc] === '');
                    if (emptyNeighbors.length === 1) {
                        const [nr, nc] = emptyNeighbors[0];
                        this.grid[nr][nc] = pair.val;
                        await this.updateCellVisual(nr, nc, pair.val, true);
                        changed = true;
                    }
                }
            }

            // Regla 2: Relleno de callejones sin salida
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.grid[r][c] === '') {
                        const neighbors = this.getNeighbors(r, c);
                        const emptyNeighbors = neighbors.filter(([nr, nc]) => this.grid[nr][nc] === '');

                        if (emptyNeighbors.length === 1) {
                            const coloredNeighbors = neighbors.filter(([nr, nc]) => this.grid[nr][nc] !== '');
                            const potentialOwners = [...new Set(coloredNeighbors.map(([nr, nc]) => this.grid[nr][nc]))];

                            if (potentialOwners.length === 1) {
                                const ownerVal = potentialOwners[0];
                                this.grid[r][c] = ownerVal;
                                await this.updateCellVisual(r, c, ownerVal, true);
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
    },

    // Función para encontrar los extremos de los caminos para un par
    findPathEndpoints: function(val) {
        const endpoints = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === val) {
                    const neighbors = this.getNeighbors(r, c);
                    const isEndpoint = neighbors.some(([nr, nc]) => this.grid[nr][nc] === '');
                    if (isEndpoint) {
                        endpoints.push([r, c]);
                    }
                }
            }
        }
        if (endpoints.length === 0) {
            const pair = this.pairs.find(p => p.val === val);
            if (pair) return [pair.start, pair.end];
        }
        return endpoints;
    },

    // Función para resolver el problema con backtracking
    async solve() {
        this.solutionFound = await this.backtrackSolve(0);
        if (this.solutionFound) {
            await this.drawFinalSolution();
        }
        return this.solutionFound;
    },

    // Función de backtracking para resolver el tablero
    async backtrackSolve(pairIndex) {
        if (Date.now() - this.startTime > this.timeout) {
            this.timedOut = true;
            return false;
        }
        if (pairIndex === this.pairs.length) {
            return this.isGridFull();
        }
        const pair = this.pairs[pairIndex];
        return await this.findPathForPair([pair.start], pair, pairIndex);
    },

    // Función para encontrar el camino de un par específico
    async findPathForPair(currentPath, pair, pairIndex) {
        if (this.timedOut) return false;
        const [r, c] = currentPath[currentPath.length - 1];
        const [endR, endC] = pair.end;

        const pathIsAtEnd = this.getNeighbors(r, c).some(([nr, nc]) => nr === endR && nc === endC);
        if (this.isPathComplete(pair.val)) {
            if (await this.backtrackSolve(pairIndex + 1)) {
                return true;
            }
        }

        const neighbors = this.getNeighborsSorted(r, c, endR, endC);
        for (const [nr, nc] of neighbors) {
            const isFinalEndpoint = (nr === endR && nc === endC);
            const isValidCell = this.grid[nr][nc] === '' || (isFinalEndpoint && !this.isPathComplete(pair.val));
            if (isValidCell) {
                this.grid[nr][nc] = pair.val;
                currentPath.push([nr, nc]);
                await this.updateCellVisual(nr, nc, pair.val, true);
                if (await this.findPathForPair(currentPath, pair, pairIndex)) {
                    return true;
                }
                currentPath.pop();
                this.grid[nr][nc] = '';
                await this.updateCellVisual(nr, nc, pair.val, false);
            }
        }
        return false;
    },

    // Función para verificar si el camino de un par está completo
    isPathComplete(val) {
        const pair = this.pairs.find(p => p.val === val);
        if (!pair) return false;
        const [startR, startC] = pair.start;
        const [endR, endC] = pair.end;

        const endNeighbors = this.getNeighbors(endR, endC);
        return endNeighbors.some(([nr, nc]) => this.grid[nr][nc] === val);
    },

    // Función para ordenar los vecinos según la distancia de Manhattan
    getNeighborsSorted: function(r, c, targetR, targetC) {
        const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
            .filter(([nr, nc]) => nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols);

        neighbors.sort((a, b) => {
            const distA = Math.abs(a[0] - targetR) + Math.abs(a[1] - targetC);
            const distB = Math.abs(b[0] - targetR) + Math.abs(b[1] - targetC);
            return distA - distB;
        });

        return neighbors;
    },

    // Función para verificar si el tablero está lleno (es decir, si todos los caminos están completos)
    isGridFull: function() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === '') return false;
            }
        }
        return true;
    },

    // Función para actualizar la visualización de una celda (agregar o quitar el color de un camino)
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
    },

    // Función para dibujar la solución final en la interfaz
    async drawFinalSolution() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const val = this.grid[r][c];
            const orig = (cell.dataset.original || '').trim();

            cell.className = "cell";
            if (val !== '') {
                cell.classList.add(`color-${val}`, 'completed');
                cell.classList.remove('pathing');
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
};

// Función principal que orquesta el proceso de resolución
async function solveNumberLink(initialGrid) {
    clearGrid();
    console.log("Iniciando resolución automática...");

    const originalPairs = numberLinkSolver.findPairsAndSort(initialGrid);

    const gridForLogic = initialGrid.map(row => [...row]);
    numberLinkSolver.init(gridForLogic, originalPairs);
    await numberLinkSolver.propagateConstraints();

    const simplifiedGrid = numberLinkSolver.grid.map(row => [...row]);
    console.log("Tablero simplificado. Pasando al backtracking...");

    let success = false;
    const strategies = [
        { name: 'Defecto', pairs: originalPairs },
        { name: 'Aleatorio', pairs: [...originalPairs].sort(() => Math.random() - 0.5) },
        { name: 'Inverso', pairs: [...originalPairs].reverse() }
    ];

    for (const strategy of strategies) {
        console.log(`Intentando con estrategia de backtracking: ${strategy.name}`);
        numberLinkSolver.init(simplifiedGrid, strategy.pairs);
        success = await numberLinkSolver.solve();

        if (success) {
            console.log(`¡Solución encontrada con backtracking ${strategy.name}!`);
            return;
        }
        if (numberLinkSolver.timedOut) {
            console.log(`La estrategia ${strategy.name} excedió el tiempo.`);
            clearGrid();
            for (let r = 0; r < numberLinkSolver.rows; r++) for (let c = 0; c < numberLinkSolver.cols; c++) {
                if (simplifiedGrid[r][c] !== '') await numberLinkSolver.updateCellVisual(r, c, simplifiedGrid[r][c], true);
            }
        }
    }

    alert("No se encontró una solución válida.");
    clearGrid();
}
