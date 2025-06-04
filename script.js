// Obtener el contenedor de la grilla desde el HTML
const gameGrid = document.getElementById('gameGrid');

// Variables que almacenan el estado actual del juego
let selectedCell = null;  // Celda actualmente seleccionada

let currentPath = [];  // El camino actual que el jugador está dibujando
let drawing = false;  // Indica si estamos dibujando un camino
let startValue = null;  // El valor inicial con el que comenzamos a dibujar el camino

let finalMatrix = [];  // Matriz que representa el estado final de caminos trazados


// Función que se activa al hacer clic en una celda
function handleCellClick(e) {
  const cell = e.currentTarget;
  const value = cell.dataset.value.trim();  // APLICA .trim()
  const original = (cell.dataset.original || "").trim();  // APLICA .trim()
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  console.log(`Celda seleccionada: Fila ${row + 1}, Columna ${col + 1}, Valor: ${value}`);
  console.log("Estado de la matriz final: ", finalMatrix);
  console.log("Estado del camino actual: ", currentPath);

  if (value !== "") {
    if (!drawing) {
      // Validar que la celda para iniciar sea principal
      if (original === "") { // original ya está trim()eado
        alert("Solo puedes iniciar un camino en una casilla principal.");
        return;
      }

      startValue = value;
      currentPath = [cell];
      drawing = true;
      highlightCell(cell, value);

    } else if (value === startValue && cell !== currentPath[0]) {
      // Validar que la celda para terminar sea principal
      if (original === "") { // original ya está trim()eado
        alert("Solo puedes terminar un camino en una casilla principal.");
        return;
      }

      const lastCell = currentPath[currentPath.length - 1];
      if (isAdjacent(lastCell, cell)) {
        currentPath.push(cell);
        highlightCell(cell, value);

        savePathInFinalMatrix(currentPath, startValue);

        currentPath.forEach(c => c.classList.add('completed'));

        drawing = false;

        if (checkVictory()) {
          setTimeout(() => {
            document.getElementById('victoryModal').style.display = 'block';
          }, 100);
        }

        currentPath = [];
        startValue = null;
      } else {
        alert("La casilla final debe ser adyacente a la última.");
      }
    } else {
      alert("No puedes conectar con un número distinto o no adyacente.");
    }
  } else if (drawing && value === "") { // value ya es trim()eado
    const lastCell = currentPath[currentPath.length - 1];

    if (!isAdjacent(lastCell, cell)) {
      alert("Solo puedes avanzar a celdas adyacentes.");
      return;
    }

    // Verificar que la celda no esté ocupada en finalMatrix
    if (finalMatrix[row][col].trim() !== "") { // APLICA .trim()
      alert("Esa celda ya fue ocupada por otro camino.");
      return;
    }

    // Verificar que la celda no esté ya en el camino actual (evita loops)
    if (isCellInCurrentPath(cell)) {
      alert("No puedes volver a una celda ya seleccionada en el camino actual.");
      return;
    }

    currentPath.push(cell);
    highlightCell(cell, startValue);
  }
}


// Función para verificar si dos celdas son adyacentes
function isAdjacent(cell1, cell2) {
  const r1 = parseInt(cell1.dataset.row);  // Fila de la primera celda
  const c1 = parseInt(cell1.dataset.col);  // Columna de la primera celda
  const r2 = parseInt(cell2.dataset.row);  // Fila de la segunda celda
  const c2 = parseInt(cell2.dataset.col);  // Columna de la segunda celda

  // Las celdas son adyacentes si la diferencia de fila o columna es igual a 1
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}


function isCellInCurrentPath(cellToCheck) {
  const rowCheck = parseInt(cellToCheck.dataset.row);
  const colCheck = parseInt(cellToCheck.dataset.col);

  for (const cell of currentPath) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (row === rowCheck && col === colCheck) {
      return true;  // Celda ya está en el camino actual
    }
  }

  return false;  // Celda no está en el camino
}


// Función para resaltar una celda (cambiar su color)
function highlightCell(cell, value) {
  const colorClass = `color-${String(value).trim()}`; // Asegura que la clase de color esté limpia
  cell.classList.add(colorClass);
  cell.dataset.value = value;

  // Remover clase 'selected' de todas las celdas
  document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));

  // Añadir clase 'selected' a la nueva celda
  cell.classList.add('selected');
}



// Función para leer el archivo de texto y procesarlo
function readTextFile(file) {
  const reader = new FileReader();  // Crear un nuevo lector de archivos

  // Cuando el archivo se haya cargado correctamente
  reader.onload = function(event) {
    const fileContent = event.target.result;  // Obtener el contenido del archivo
    console.log("Contenido del archivo: ", fileContent);  // Imprimir el contenido en la consola
    processTextFile(fileContent);  // Procesar el contenido del archivo
  };

  // Si hay un error al leer el archivo
  reader.onerror = function(error) {
    console.error("Error al leer el archivo: ", error);
  };

  reader.readAsText(file);  // Leer el archivo como texto
}

// Función para procesar el contenido del archivo de texto
function processTextFile(content) {
  const lines = content.split('\n');  // Dividir el contenido del archivo en líneas
  const size = lines[0].split(',');  // Obtener tamaño de la grilla (de la primera línea)
  const rows = parseInt(size[0]);
  const cols = parseInt(size[1]);

  // Crear una matriz vacía con las dimensiones correctas
  const gridData = Array.from({ length: rows }, () => Array(cols).fill(""));

  // Procesar las celdas del archivo de texto
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');  // Dividir cada línea en celdas

    if (cells.length === 3) {  // Verificar que haya 3 valores: fila, columna, valor
      const row = parseInt(cells[0]) - 1;  // Convertir de 1-index a 0-index
      const col = parseInt(cells[1]) - 1;  // Convertir de 1-index a 0-index
      const value = cells[2].trim();  // El valor que debe ir en la celda - APLICA .trim() AQUÍ

      // Asignar el valor a la celda correspondiente
      gridData[row][col] = value;
    }
  }

  // Verificar el contenido de gridData
  console.log("Datos procesados del tablero: ", gridData);

  // Llamar a la función para generar la grilla con los datos procesados
  generateGrid(rows, cols, gridData);

  // Mostrar el botón de limpiar después de cargar el archivo
  document.getElementById('cleanButtonContainer').style.display = 'block';  // Mostrar el contenedor de limpiar
  document.getElementById('cancelButtonContainer').style.display = 'block';  // Mostrar el contenedor de cancelar
}


// Función para generar el tablero dinámicamente en la pantalla
function generateGrid(rows, cols, gridData) {
  gameGrid.innerHTML = "";  // Limpiar el tablero antes de generar uno nuevo

  // Establecer el tamaño de las celdas según las dimensiones del tablero
  gameGrid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
  gameGrid.style.gridTemplateRows = `repeat(${rows}, 60px)`;

  // Inicializar finalMatrix correctamente con valores limpiados
  finalMatrix = gridData.map(row => row.map(cellVal => cellVal.trim())); // APLICA .trim() AQUÍ

  // Crear las celdas con los valores de la grilla
  gridData.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const trimmedValue = value.trim(); // APLICA .trim() AQUÍ

      const cell = document.createElement('div');  // Crear una nueva celda
      cell.classList.add('cell');  // Añadir clase "cell" a la celda
      cell.dataset.row = rowIndex;  // Asignar la fila de la celda
      cell.dataset.col = colIndex;  // Asignar la columna de la celda
      cell.dataset.value = trimmedValue;  // Asignar el valor de la celda (trim()eado)
      cell.dataset.original = trimmedValue;  // Guardar el valor original para restaurar (trim()eado)

      // Si la celda tiene un valor (no está vacía)
      if (trimmedValue !== "") {
        cell.textContent = trimmedValue;  // Mostrar el valor en la celda

        // Si el valor es un número, asignar un color basado en el valor
        if (!isNaN(trimmedValue)) { // Compara con el valor trim()eado
          const colorClass = `color-${trimmedValue}`;
          cell.classList.add(colorClass);  // Añadir la clase de color
        }
      }

      // Añadir el evento de clic a la celda
      cell.addEventListener('click', handleCellClick);
      gameGrid.appendChild(cell);  // Añadir la celda al contenedor del tablero
    });
  });
}

function savePathInFinalMatrix(path, value) {
  for (const cell of path) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    finalMatrix[row][col] = value.trim(); // APLICA .trim()
  }
}

// Función para verificar si el juego fue completado

function checkVictory() {
  const numberPositions = {};

  // Paso 1: Agrupar las posiciones por número
  for (let r = 0; r < finalMatrix.length; r++) {
    for (let c = 0; c < finalMatrix[0].length; c++) {
      const val = finalMatrix[r][c].trim(); // APLICA .trim()
      if (val !== "") {
        if (!numberPositions[val]) numberPositions[val] = [];
        numberPositions[val].push([r, c]);
      }
    }
  }

  // Paso 2: Verificar que cada número esté conectado en un único grupo
  for (const num in numberPositions) {
    const visited = new Set();
    const queue = [numberPositions[num][0]];
    visited.add(`${numberPositions[num][0][0]},${numberPositions[num][0][1]}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      // Revisar vecinos adyacentes
      for (const [dr, dc] of [[0,1], [1,0], [0,-1], [-1,0]]) {
        const nr = r + dr, nc = c + dc;
        if (
          nr >= 0 && nr < finalMatrix.length &&
          nc >= 0 && nc < finalMatrix[0].length &&
          finalMatrix[nr][nc].trim() === num.trim() // APLICA .trim()
        ) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }

    // Si el grupo conectado no cubre todas las celdas de ese número, error
    if (visited.size !== numberPositions[num].length) {
      return false;
    }
  }

  // Paso 3: Verificar que ninguna celda tenga más de un valor
  for (let r = 0; r < finalMatrix.length; r++) {
    for (let c = 0; c < finalMatrix[0].length; c++) {
      const cell = gameGrid.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      const val = finalMatrix[r][c].trim(); // APLICA .trim()
      const expected = (cell.dataset.value || "").trim(); // APLICA .trim()
      if (val !== expected) {
        return false;  // Conflicto detectado
      }
    }
  }

  // Todo está conectado y sin conflictos
  return true;
}

//Funcion para reiniciar el juego
document.getElementById('restartButton').addEventListener('click', function() {
  gameGrid.innerHTML = "";
  document.getElementById('fileInput').value = "";
  gameGrid.style.display = 'none';

  // Ocultar controles
  document.getElementById('cleanButtonContainer').style.display = 'none';
  document.getElementById('cancelButtonContainer').style.display = 'none';

  // Limpiar matriz y variables
  finalMatrix = [];
  currentPath = [];
  drawing = false;
  startValue = null;

  setTimeout(function() {
    gameGrid.style.display = 'grid';
    alert("Juego reiniciado. Carga un nuevo archivo para comenzar.");
  }, 200);
});


// Agregar el evento al botón "Limpiar"
document.getElementById('clearButton').addEventListener('click', clearGrid);

// Vincular el botón de "Seleccionar archivo" para activar el input de archivo
document.getElementById('fileButton').addEventListener('click', function() {
  document.getElementById('fileInput').click();  // Activar el input de archivo
});

// Agregar evento al input para cargar el archivo
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file && file.name.endsWith('.txt')) {
    readTextFile(file);  // Leer el archivo si es .txt
  } else {
    alert("Por favor, carga un archivo .txt");  // Validar que el archivo sea .txt
  }
});

// Evento para cancelar el camino en curso
document.getElementById('cancelButton').addEventListener('click', () => {
  if (!drawing || currentPath.length === 0) {
    alert("No estás dibujando ningún camino.");
    return;
  }

  // Eliminar todas las celdas del camino actual (excluyendo la celda de inicio si es un número)
  for (let i = 1; i < currentPath.length; i++) {
    clearCell(currentPath[i]);
  }

  // Restaurar solo el borde de la celda de inicio
  const startCell = currentPath[0];
  const originalStartValue = (startCell.dataset.original || "").trim();
  if (originalStartValue !== "") {
    // Si la celda de inicio era un número, no la limpiamos completamente, solo su estilo temporal
    startCell.classList.remove('selected');
    // Asegurarse de que el color original del número se mantiene, si fue removido accidentalmente
    const colorClass = `color-${originalStartValue}`;
    if (!startCell.classList.contains(colorClass)) {
      cell.classList.add(colorClass);
    }
  } else {
    // Si la celda de inicio era vacía, la limpiamos por completo
    clearCell(startCell);
  }
  // Asegurarse de que la celda de inicio no tenga el borde de selección
  startCell.style.border = "2px solid #cccccc";
   
  // Reiniciar estado de dibujo
  drawing = false;
  startValue = null;
  currentPath = [];
});


// Modal de victoria
window.addEventListener('DOMContentLoaded', () => {
  const closeModalBtn = document.getElementById('closeModal');
  const victoryModal = document.getElementById('victoryModal');

  closeModalBtn.addEventListener('click', () => {
    victoryModal.style.display = 'none';  // Cerrar el modal de victoria
  });
});


// Función para limpiar toda la grilla (restaurar celdas a su estado inicial)

function clearGrid() {
  const cells = gameGrid.querySelectorAll('.cell');

  cells.forEach(cell => {
    const originalVal = (cell.dataset.original || "").trim(); // APLICA .trim()
    if (originalVal === "") {
      clearCell(cell);
    } else {
      // Restaurar el aspecto de una celda con número original
      cell.style.border = "2px solid #cccccc";
      cell.classList.forEach(cls => {
        if (cls.startsWith('color-') && cls !== `color-${originalVal}`) {
          cell.classList.remove(cls);
        }
      });
      if (!cell.classList.contains(`color-${originalVal}`)) {
        cell.classList.add(`color-${originalVal}`);
      }
      cell.classList.remove('completed');
      cell.classList.remove('selected');
      cell.dataset.value = originalVal; // Asegurar que el dataset.value vuelve a ser el original
      cell.textContent = originalVal; // Asegurar que el texto vuelve a ser el original
    }
  });

  // Limpiar matriz y variables de estado
  // Asegurarse de que finalMatrix se restablece a los números originales, no a un vacío total
  finalMatrix = Array.from({ length: finalMatrix.length }, (_, r) => 
    Array.from({ length: finalMatrix[0].length }, (_, c) => 
      (document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`).dataset.original || "").trim()
    )
  );
  currentPath = [];
  startValue = null;
  drawing = false;
}


// Función para limpiar una celda (restaurar su estado original)
function clearCell(cell) {
  const originalValue = (cell.dataset.original || "").trim(); // APLICA .trim()

  // Si la celda estaba vacía o sin valor original
  if (originalValue === "") {
    cell.dataset.value = "";  // Eliminar el valor de la celda
    cell.className = "cell";  // Eliminar cualquier clase de color (restablecer a solo 'cell')
    cell.style.backgroundColor = "";  // Eliminar color de fondo
    cell.style.border = "2px solid #cccccc";  // Restaurar borde
    cell.textContent = "";  // Limpiar el texto de la celda
  }
}

document.getElementById('solveButton').addEventListener('click', () => {
  if (finalMatrix.length === 0 || finalMatrix[0].length === 0) {
    alert("Primero carga un tablero.");
    return;
  }

  // Extraer los valores originales del tablero para el solver
  const rows = finalMatrix.length;
  const cols = finalMatrix[0].length;
  const initialGridForSolver = Array.from({ length: rows }, () => Array(cols).fill(""));

  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    initialGridForSolver[r][c] = (cell.dataset.original || "").trim(); // APLICA .trim()
  });

  solveNumberLink(initialGridForSolver);
});