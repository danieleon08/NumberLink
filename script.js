const gameGrid = document.getElementById('gameGrid');
let selectedCell = null;
let path = [];

let currentPath = [];
let drawing = false;
let startValue = null;


// Función que se activa al hacer clic en una celda
function handleCellClick(e) {
  const cell = e.currentTarget;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const value = cell.dataset.value;

  // Si haces clic en una celda con número
  if (value !== "") {
    // Empezar a dibujar si no estás dibujando
    if (!drawing) {
      startValue = value;
      currentPath = [cell];
      drawing = true;
      highlightCell(cell, value);
    }
    // Intentar cerrar camino
    else if (value === startValue && cell !== currentPath[0]) {
      // Validar que la celda final esté adyacente
      const lastCell = currentPath[currentPath.length - 1];
      if (isAdjacent(lastCell, cell)) {
        currentPath.push(cell);
        highlightCell(cell, value);
        drawing = false;
      
        // Verificamos si el juego fue completado
        if (checkVictory()) {
          setTimeout(() => {
            document.getElementById('victoryModal').style.display = 'block';
          }, 100);
        }        
      
        // Limpiar estado
        currentPath = [];
        startValue = null;
      }
      
    } else {
      alert("No puedes conectar con un número distinto o no adyacente.");
    }
  }

  // Si es una celda vacía
  else if (drawing && value === "") {
    const lastCell = currentPath[currentPath.length - 1];

    // Validar adyacencia
    if (!isAdjacent(lastCell, cell)) {
      alert("Solo puedes avanzar a celdas adyacentes.");
      return;
    }

    // Validar que la celda no haya sido ocupada
    if (cell.classList.length > 1) {
      alert("Esa celda ya fue ocupada.");
      return;
    }

    currentPath.push(cell);
    highlightCell(cell, startValue);
  }

  // Permitir retroceso
  else if (drawing && currentPath.length >= 2 && cell === currentPath[currentPath.length - 2]) {
    const last = currentPath.pop();
    clearCell(last);
  }
}



function isAdjacent(cell1, cell2) {
  const r1 = parseInt(cell1.dataset.row);
  const c1 = parseInt(cell1.dataset.col);
  const r2 = parseInt(cell2.dataset.row);
  const c2 = parseInt(cell2.dataset.col);

  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function highlightCell(cell, value) {
  const colorClass = `color-${String(value).trim()}`;
  cell.classList.add(colorClass);
  cell.dataset.value = value; // Para que la celda quede registrada como parte del camino
}


function clearCell(cell) {
  const originalValue = cell.dataset.original;

  if (originalValue === "" || originalValue === undefined) {
    cell.dataset.value = "";
    cell.className = "cell"; // Elimina cualquier clase de color
    cell.style.backgroundColor = "";
    cell.style.border = "2px solid #cccccc";
    cell.textContent = "";
  }
}


// Función para limpiar las celdas y restaurarlas a su estado inicial
function clearGrid() {
  const cells = gameGrid.querySelectorAll('.cell');

  cells.forEach(cell => {
    if (cell.dataset.original === "" || cell.dataset.original === undefined) {
      clearCell(cell); // solo limpiar si era una celda vacía originalmente
    } else {
      // Restaurar solo su borde si es un número original
      cell.style.border = "2px solid #cccccc";
    }
  });

  // Resetear variables
  currentPath = [];
  startValue = null;
  drawing = false;
}


// Función para leer el archivo de texto y procesarlo
function readTextFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(event) {
    const fileContent = event.target.result;
    console.log("Contenido del archivo: ", fileContent);  // Verificar el contenido del archivo
    processTextFile(fileContent);
  };
  
  reader.onerror = function(error) {
    console.error("Error al leer el archivo: ", error);
  };

  reader.readAsText(file);
}

// Función para procesar el contenido del archivo de texto
function processTextFile(content) {
  const lines = content.split('\n'); // Dividir el contenido en líneas
  const size = lines[0].split(','); // Obtener tamaño de la grilla de la primera línea
  const rows = parseInt(size[0]);
  const cols = parseInt(size[1]);

  // Crear una matriz vacía con las dimensiones correctas
  const gridData = Array.from({ length: rows }, () => Array(cols).fill(""));

  // Procesar las celdas del archivo de texto
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');

    // Verificar que haya tres valores: fila, columna y valor
    if (cells.length === 3) {
      const row = parseInt(cells[0]) - 1; // Restar 1 para convertir de 1-index a 0-index
      const col = parseInt(cells[1]) - 1; // Restar 1 para convertir de 1-index a 0-index
      const value = cells[2];  // El valor que debe ir en la celda (ahora correctamente ubicado en cells[2])

      // Asignar el valor a la celda correspondiente
      gridData[row][col] = value;
    }
  }

  // Verificar el contenido de gridData para asegurarse de que los datos sean correctos
  console.log("Datos procesados del tablero: ", gridData);

  // Llamar a la función que genera el tablero con los datos procesados
  generateGrid(rows, cols, gridData);

  // Mostrar el botón de limpiar después de cargar el archivo
  document.getElementById('cleanButtonContainer').style.display = 'block'; // Hacer visible el contenedor
  document.getElementById('cancelButtonContainer').style.display = 'block'; // Hacer visible el contenedor
  
}

// Función para generar el tablero dinámicamente
function generateGrid(rows, cols, gridData) {
  gameGrid.innerHTML = ""; // Limpiar el tablero

  // Establecer el tamaño de las celdas según las dimensiones del tablero
  gameGrid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
  gameGrid.style.gridTemplateRows = `repeat(${rows}, 60px)`;

  // Crear las celdas con los valores de la grilla
  gridData.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.dataset.value = value;
      cell.dataset.original = value; // Guardamos valor original para limpieza


      if (value !== "") {
        cell.textContent = value;

        // Verificar que el valor es un número
        if (!isNaN(value)) {
          // Eliminar espacios al principio y final sin agregar guiones bajos
          const colorClass = `color-${String(value).trim()}`;

          // Agregar la clase directamente (color-1, color-2, etc.)
          cell.classList.add(colorClass);
        }
      }

      cell.addEventListener('click', handleCellClick);
      gameGrid.appendChild(cell);
    });
  });
}

// Función para reiniciar el juego
document.getElementById('restartButton').addEventListener('click', function() {
  // Limpiar la grilla y restablecer las celdas
  gameGrid.innerHTML = ""; // Limpiar el tablero

  // Limpiar el input de archivo
  document.getElementById('fileInput').value = "";

  // Ocultar la grilla
  gameGrid.style.display = 'none';

  // Ocultar el botón de "Limpiar" hasta que se cargue un archivo
  document.getElementById('cleanButtonContainer').style.display = 'none';
  document.getElementById('cancelButtonContainer').style.display = 'none';

  // Mostrar un mensaje temporal antes de volver a mostrar la grilla
  setTimeout(function() {
    // Mostrar la grilla nuevamente
    gameGrid.style.display = 'grid'; // Restaurar el estilo de la grilla
    alert("Juego reiniciado. Carga un nuevo archivo para comenzar.");
  }, 200);  // Retardo para el cambio de visualización
});


// Agregar el evento al botón "Limpiar"
document.getElementById('clearButton').addEventListener('click', clearGrid);

// Vincular el botón de "Seleccionar archivo" para activar el input de archivo
document.getElementById('fileButton').addEventListener('click', function() {
  document.getElementById('fileInput').click(); // Activa el input de archivo al hacer clic en el botón
});

// Agregar evento al input para cargar el archivo
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file && file.name.endsWith('.txt')) {
    readTextFile(file);
  } else {
    alert("Por favor, carga un archivo .txt");
  }
});


document.getElementById('cancelButton').addEventListener('click', () => {
  if (!drawing || currentPath.length === 0) {
    alert("No estás dibujando ningún camino.");
    return;
  }

  // Eliminar todas las celdas del camino actual (excepto números originales)
  for (let i = 1; i < currentPath.length; i++) {
    clearCell(currentPath[i]);
  }

  // Restaurar solo el borde de la celda de inicio si era un número
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

function checkVictory() {
  const cells = gameGrid.querySelectorAll('.cell');

  for (const cell of cells) {
    if (!cell.dataset.value || cell.dataset.value === "") {
      return false; // Hay al menos una celda vacía → no hay victoria
    }
  }

  return true; // Todas las celdas están ocupadas correctamente
}

window.addEventListener('DOMContentLoaded', () => {
  const closeModalBtn = document.getElementById('closeModal');
  const victoryModal = document.getElementById('victoryModal');

  closeModalBtn.addEventListener('click', () => {
    victoryModal.style.display = 'none';
  });
});


