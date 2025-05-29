// Obtener el contenedor de la grilla desde el HTML
const gameGrid = document.getElementById('gameGrid');

// Variables que almacenan el estado actual del juego
let selectedCell = null;  // Celda actualmente seleccionada

let currentPath = [];  // El camino actual que el jugador está dibujando
let drawing = false;  // Indica si estamos dibujando un camino
let startValue = null;  // El valor inicial con el que comenzamos a dibujar el camino

let finalMatrix = [];  // Matriz que representa el estado final de caminos trazados


// Función que se activa al hacer clic en una celda
function handleCellClick(e) {
  const cell = e.currentTarget;
  const value = cell.dataset.value;
  const original = cell.dataset.original;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  console.log(`Celda seleccionada: Fila ${row + 1}, Columna ${col + 1}, Valor: ${value}`);
  console.log("Estado de la matriz final: ", finalMatrix);
  console.log("Estado del camino actual: ", currentPath);

  if (value !== "") {
    if (!drawing) {
      // Validar que la celda para iniciar sea principal
      if (original === "" || original === undefined) {
        alert("Solo puedes iniciar un camino en una casilla principal.");
        return;
      }

      startValue = value;
      currentPath = [cell];
      drawing = true;
      highlightCell(cell, value);

    } else if (value === startValue && cell !== currentPath[0]) {
      // Validar que la celda para terminar sea principal
      if (original === "" || original === undefined) {
        alert("Solo puedes terminar un camino en una casilla principal.");
        return;
      }

      const lastCell = currentPath[currentPath.length - 1];
      if (isAdjacent(lastCell, cell)) {
        currentPath.push(cell);
        highlightCell(cell, value);

        savePathInFinalMatrix(currentPath, startValue);

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
  } else if (drawing && value === "") {
    const lastCell = currentPath[currentPath.length - 1];

    if (!isAdjacent(lastCell, cell)) {
      alert("Solo puedes avanzar a celdas adyacentes.");
      return;
    }

    // Verificar que la celda no esté ocupada en finalMatrix
    if (finalMatrix[row][col] !== "") {
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
  const r1 = parseInt(cell1.dataset.row);  // Fila de la primera celda
  const c1 = parseInt(cell1.dataset.col);  // Columna de la primera celda
  const r2 = parseInt(cell2.dataset.row);  // Fila de la segunda celda
  const c2 = parseInt(cell2.dataset.col);  // Columna de la segunda celda

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
      return true;  // Celda ya está en el camino actual
    }
  }

  return false;  // Celda no está en el camino
}


// Función para resaltar una celda (cambiar su color)
function highlightCell(cell, value) {
  const colorClass = `color-${String(value).trim()}`;  // Crear una clase de color basada en el valor de la celda
  cell.classList.add(colorClass);  // Añadir la clase de color a la celda
  cell.dataset.value = value;  // Registrar el valor de la celda en el atributo data-value
}


// Función para leer el archivo de texto y procesarlo
function readTextFile(file) {
  const reader = new FileReader();  // Crear un nuevo lector de archivos

  // Cuando el archivo se haya cargado correctamente
  reader.onload = function(event) {
    const fileContent = event.target.result;  // Obtener el contenido del archivo
    console.log("Contenido del archivo: ", fileContent);  // Imprimir el contenido en la consola
    processTextFile(fileContent);  // Procesar el contenido del archivo
  };

  // Si hay un error al leer el archivo
  reader.onerror = function(error) {
    console.error("Error al leer el archivo: ", error);
  };

  reader.readAsText(file);  // Leer el archivo como texto
}

// Función para procesar el contenido del archivo de texto
function processTextFile(content) {
  const lines = content.split('\n');  // Dividir el contenido del archivo en líneas
  const size = lines[0].split(',');  // Obtener tamaño de la grilla (de la primera línea)
  const rows = parseInt(size[0]);
  const cols = parseInt(size[1]);

  // Crear una matriz vacía con las dimensiones correctas
  const gridData = Array.from({ length: rows }, () => Array(cols).fill(""));

  // Procesar las celdas del archivo de texto
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');  // Dividir cada línea en celdas

    if (cells.length === 3) {  // Verificar que haya 3 valores: fila, columna, valor
      const row = parseInt(cells[0]) - 1;  // Convertir de 1-index a 0-index
      const col = parseInt(cells[1]) - 1;  // Convertir de 1-index a 0-index
      const value = cells[2];  // El valor que debe ir en la celda

      // Asignar el valor a la celda correspondiente
      gridData[row][col] = value;
    }
  }

  // Verificar el contenido de gridData
  console.log("Datos procesados del tablero: ", gridData);

  // Llamar a la función para generar la grilla con los datos procesados
  generateGrid(rows, cols, gridData);

  // Mostrar el botón de limpiar después de cargar el archivo
  document.getElementById('cleanButtonContainer').style.display = 'block';  // Mostrar el contenedor de limpiar
  document.getElementById('cancelButtonContainer').style.display = 'block';  // Mostrar el contenedor de cancelar
}


// Función para generar el tablero dinámicamente en la pantalla
function generateGrid(rows, cols, gridData) {
  gameGrid.innerHTML = "";  // Limpiar el tablero antes de generar uno nuevo

  // Establecer el tamaño de las celdas según las dimensiones del tablero
  gameGrid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
  gameGrid.style.gridTemplateRows = `repeat(${rows}, 60px)`;

  finalMatrix = Array.from({ length: rows }, () => Array(cols).fill(""));

  // Crear las celdas con los valores de la grilla
  gridData.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement('div');  // Crear una nueva celda
      cell.classList.add('cell');  // Añadir clase "cell" a la celda
      cell.dataset.row = rowIndex;  // Asignar la fila de la celda
      cell.dataset.col = colIndex;  // Asignar la columna de la celda
      cell.dataset.value = value;  // Asignar el valor de la celda
      cell.dataset.original = value;  // Guardar el valor original para restaurar

      // Si la celda tiene un valor (no está vacía)
      if (value !== "") {
        cell.textContent = value;  // Mostrar el valor en la celda

        // Si el valor es un número, asignar un color basado en el valor
        if (!isNaN(value)) {
          const colorClass = `color-${String(value).trim()}`;
          cell.classList.add(colorClass);  // Añadir la clase de color
        }
      }

      // Añadir el evento de clic a la celda
      cell.addEventListener('click', handleCellClick);
      gameGrid.appendChild(cell);  // Añadir la celda al contenedor del tablero
    });
  });
}

function savePathInFinalMatrix(path, value) {
  for (const cell of path) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    finalMatrix[row][col] = value;
  }
}

// Función para verificar si el juego fue completado

function checkVictory() {
  const numberPositions = {};

  // Paso 1: Agrupar las posiciones por número
  for (let r = 0; r < finalMatrix.length; r++) {
    for (let c = 0; c < finalMatrix[0].length; c++) {
      const val = finalMatrix[r][c];
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
          finalMatrix[nr][nc] === num
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
      const val = finalMatrix[r][c];
      const expected = cell.dataset.value;
      if (val !== expected) {
        return false;  // Conflicto detectado
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
  document.getElementById('fileInput').click();  // Activar el input de archivo
});

// Agregar evento al input para cargar el archivo
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file && file.name.endsWith('.txt')) {
    readTextFile(file);  // Leer el archivo si es .txt
  } else {
    alert("Por favor, carga un archivo .txt");  // Validar que el archivo sea .txt
  }
});

// Evento para cancelar el camino en curso
document.getElementById('cancelButton').addEventListener('click', () => {
  if (!drawing || currentPath.length === 0) {
    alert("No estás dibujando ningún camino.");
    return;
  }

  // Eliminar todas las celdas del camino actual
  for (let i = 1; i < currentPath.length; i++) {
    clearCell(currentPath[i]);
  }

  // Restaurar solo el borde de la celda de inicio
  const startCell = currentPath[0];
  if (startCell.dataset.original !== "" && startCell.dataset.original !== undefined) {
    startCell.style.border = "2px solid #cccccc";
  } else {
    clearCell(startCell);
  }

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
    victoryModal.style.display = 'none';  // Cerrar el modal de victoria
  });
});


// Función para limpiar toda la grilla (restaurar celdas a su estado inicial)

function clearGrid() {
  const cells = gameGrid.querySelectorAll('.cell');

  cells.forEach(cell => {
    if (cell.dataset.original === "" || cell.dataset.original === undefined) {
      clearCell(cell);
    } else {
      cell.style.border = "2px solid #cccccc";
    }
  });

  // Limpiar matriz y variables de estado
  finalMatrix = Array.from({ length: finalMatrix.length }, () => Array(finalMatrix[0].length).fill(""));  
  currentPath = [];
  startValue = null;
  drawing = false;
}


// Función para limpiar una celda (restaurar su estado original)
function clearCell(cell) {
  const originalValue = cell.dataset.original;  // Valor original de la celda

  // Si la celda estaba vacía o sin valor original
  if (originalValue === "" || originalValue === undefined) {
    cell.dataset.value = "";  // Eliminar el valor de la celda
    cell.className = "cell";  // Eliminar cualquier clase de color
    cell.style.backgroundColor = "";  // Eliminar color de fondo
    cell.style.border = "2px solid #cccccc";  // Restaurar borde
    cell.textContent = "";  // Limpiar el texto de la celda
  }
}
