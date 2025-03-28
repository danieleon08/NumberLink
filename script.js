const gridSize = 5;
const gameGrid = document.getElementById('gameGrid');
let selectedCell = null;
let path = [];

// Representación de la grilla de valores
const gridData = [
  "", "", "1", "", "",
  "", "", "", "", "",
  "1", "", "", "", "",
  "", "", "2", "", "",
  "", "", "", "2", ""
];

// Crear las celdas con atributos de posición
gridData.forEach((value, index) => {
  const cell = document.createElement('div');
  cell.classList.add('cell');

  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  cell.dataset.index = index;
  cell.dataset.row = row;
  cell.dataset.col = col;
  cell.dataset.value = value;

  if (value === "1") {
    cell.textContent = "1";
    cell.classList.add('color-1');
  } else if (value === "2") {
    cell.textContent = "2";
    cell.classList.add('color-2');
  }

  cell.addEventListener('click', handleCellClick);

  gameGrid.appendChild(cell);
});

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

// Agregar el evento al botón "Limpiar"
document.getElementById('clearButton').addEventListener('click', clearGrid);
