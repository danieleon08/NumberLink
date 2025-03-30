const gameGrid = document.getElementById('gameGrid');
let selectedCell = null;
let path = [];

// Función que se activa al hacer clic en una celda
function handleCellClick(e) {
  const cell = e.currentTarget;

  // Si la celda está vacía, cambiar el color de fondo
  if (cell.dataset.value === "") {
    // Cambiar el color de fondo de la celda vacía
    cell.style.backgroundColor = cell.style.backgroundColor === "lightgreen" ? "" : "lightgreen";
  } else {
    // Si es una celda con número, cambiar solo el borde
    if (cell.style.border === "3px solid gold") {
      cell.style.border = "2px solid #ccc"; // Restablecer el borde si ya está resaltado
    } else {
      cell.style.border = "3px solid gold"; // Resaltar la celda con un borde dorado
    }
  }
}

// Función para limpiar las celdas y restaurarlas a su estado inicial
function clearGrid() {
  const cells = gameGrid.querySelectorAll('.cell');

  cells.forEach(cell => {
    // Restaurar color de fondo a blanco para celdas vacías
    if (cell.dataset.value === "") {
      cell.style.backgroundColor = "";
    }

    // Restaurar borde predeterminado para todas las celdas
    cell.style.border = "2px solid #cccccc";
  });

  // Resetear el color y borde de las celdas seleccionadas
  selectedCell = null;
  path = [];
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
