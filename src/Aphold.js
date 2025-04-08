import React, { useState } from 'react';

const GRID_SIZE = 6;

const App = () => {
  const [grid, setGrid] = useState(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))); // Stan dla kwadratów
  const [horizontalBorders, setHorizontalBorders] = useState(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(0)) // 8x7 (granice poziome)
  );
  const [verticalBorders, setVerticalBorders] = useState(
    Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(0)) // 7x8 (granice pionowe)
  );
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState(true); // Tryb edytowania
  const [answerMode, setAnswerMode] = useState(false); // Tryb odpowiedzi
  const [borderMode, setBorderMode] = useState("none"); // Tryb border (soft/hard)
  const [mouseDown, setMouseDown] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // "add" lub "remove"
  const enclosedAreas = []; // Zmienna przechowuj¹ca obszary
  
  // Borders and dots
  // Dots
  const renderDots = () => {
  const dotElements = [];
    for (let row = 0; row < GRID_SIZE - 1; row++) {
      for (let col = 0; col < GRID_SIZE -1; col++) {
        // Dodajemy kropkê w odpowiedniej pozycji
        dotElements.push(
          <circle
            key={`dot-${row}-${col}`}
            cx={(col + 0.960) * 30}  // Pozycja X (œrodek kropki)
            cy={(row + 0.960) * 30}  // Pozycja Y (œrodek kropki)
            r={0.5}               // Promieñ kropki
            fill={verticalBorders[row][col] === 1 ? 'black' : verticalBorders[row][col] === 2 ? 'black' : 'black'}
            stroke="black"
            strokeWidth="0.25"
            onClick={() => toggleVerticalBorder(row, col)} // Klikaj¹c na kropkê, zmieniamy granicê pionow¹
          />
        );
      }
    }

    return dotElements;  
  };

  // Borders
  // Funkcja renderuj¹ca kwadraty z borderami w SVG
  const renderSquaresAndBorders = () => {
    const elements = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Dodanie kwadratu
        elements.push(
          <rect
            key={`square-${row}-${col}`}
            x={col * 30} // X: pozycja pozioma
            y={row * 30} // Y: pozycja pionowa
            width={30}
            height={30}
            fill={grid[row][col] === 1 ? 'blue' : 'white'}

            onClick={() => toggleTile(row, col)} // Zmieniamy stan kwadratu
          />
        );

        // Dodanie granic poziomych
        if (col < GRID_SIZE - 1) {
          elements.push(
            <line
              key={`h-border-${row}-${col}`}
              x1={(col + 1) * 30}
              y1={row * 30}
              x2={(col + 1) * 30}
              y2={(row + 1) * 30}
              stroke={horizontalBorders[row][col] === 1 ? 'gray' : horizontalBorders[row][col] === 2 ? 'black' : 'transparent'}
              strokeWidth="3"
              onClick={() => toggleHorizontalBorder(row, col)} // Zmieniamy granicê poziom¹
            />
          );
        }

        // Dodanie granic pionowych
        if (row < GRID_SIZE - 1) {
          elements.push(
            <line
              key={`v-border-${row}-${col}`}
              x1={(col + -0.025) * 30}
              y1={(row + 1) * 30}
              x2={(col + 1) * 30}
              y2={(row + 1) * 30}
              stroke={verticalBorders[row][col] === 1 ? 'gray' : verticalBorders[row][col] === 2 ? 'black' : 'transparent'}
              strokeWidth="3"
              onClick={() => toggleVerticalBorder(row, col)} // Zmieniamy granicê pionow¹
            />
          );
        }
      }
    }

    return elements;
  };


  // Grid interaction
  // Funkcja do zmiany stanu w klikniêtym kwadracie
  const toggleTile = (x, y) => {
    if (!answerMode) return; // Tylko w trybie odpowiedzi

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row, i) =>
        row.map((cell, j) => (i === x && j === y ? (cell === 1 ? 0 : 1) : cell))
      );

      return newGrid;
    });
  };

  // Borders interaction
    const toggleHorizontalBorder = (row, col, isAdding) => {
      setHorizontalBorders((prev) =>
        prev.map((r, i) =>
          r.map((border, j) => {
            if (i === row && j === col) {
              // Sprawdzenie borderMode i przypisanie odpowiedniej wartoœci
              if (borderMode === "soft") {
                return isAdding ? 1 : 0; // Dla soft border, u¿ywamy wartoœci 1 (dodaj) lub 0 (usuñ)
              } else if (borderMode === "hard") {
                return isAdding ? 2 : 0; // Dla hard border, u¿ywamy wartoœci 2 (dodaj) lub 0 (usuñ)
              }
            }
            return border; // Jeœli nie znaleŸliœmy dopasowania, zostawiamy granicê bez zmian
          })
        )
      );
    };

    const toggleVerticalBorder = (row, col, isAdding) => {
      setVerticalBorders((prev) =>
        prev.map((r, i) =>
          r.map((border, j) => {
            if (i === row && j === col) {
              // Sprawdzamy borderMode i przypisujemy odpowiedni¹ wartoœæ
              if (borderMode === "soft") {
                return isAdding ? 1 : 0; // Dla soft border, u¿ywamy wartoœci 1 (dodaj) lub 0 (usuñ)
              } else if (borderMode === "hard") {
                return isAdding ? 2 : 0; // Dla hard border, u¿ywamy wartoœci 2 (dodaj) lub 0 (usuñ)
              }
            }
            return border; // Jeœli nie znaleŸliœmy dopasowania, zostawiamy granicê bez zmian
          })
        )
      );
    };

      const handleMouseDown = (e) => {
  if (!editMode) return; 

  setMouseDown(true);
  
  // Pobieramy wspó³rzêdne klikniêcia
  const { row, col, type } = getBorderCoordinates(e);
  
  if (type === "horizontal" && row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE - 1) {
    const isAdding = horizontalBorders[row][col] === 0;
    setDrawingMode(isAdding ? "add" : "remove");
    toggleHorizontalBorder(row, col, isAdding);
  }

  if (type === "vertical" && row >= 0 && row < GRID_SIZE - 1 && col >= 0 && col < GRID_SIZE) {
    const isAdding = verticalBorders[row][col] === 0;
    setDrawingMode(isAdding ? "add" : "remove");
    toggleVerticalBorder(row, col, isAdding);
  }
};

    const handleMouseMove = (e) => {
      if (!mouseDown || !editMode) return;

      const { row, col, type } = getBorderCoordinates(e);

      if (type === "horizontal" && row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE - 1) {
        if (drawingMode === "add" && horizontalBorders[row][col] === 0) {
          toggleHorizontalBorder(row, col, true);
        }
        if (drawingMode === "remove" && horizontalBorders[row][col] !== 0) {
          toggleHorizontalBorder(row, col, false);
        }
      }

      if (type === "vertical" && row >= 0 && row < GRID_SIZE - 1 && col >= 0 && col < GRID_SIZE) {
        if (drawingMode === "add" && verticalBorders[row][col] === 0) {
          toggleVerticalBorder(row, col, true);
        }
        if (drawingMode === "remove" && verticalBorders[row][col] !== 0) {
          toggleVerticalBorder(row, col, false);
        }
      }
    };
    const handleMouseUp = () => {
        findClosedAreas()
      setMouseDown(false);
      setDrawingMode(null);
    };

const getBorderCoordinates = (e) => {
  const svgElement = document.getElementById("grid-svg"); // Pobieramy g³ówny SVG


  const rect = svgElement.getBoundingClientRect(); // Pobieramy bounding box ca³ego SVG
  const x = e.clientX - rect.left; // Pozycja X wzglêdem ca³ego SVG
  const y = e.clientY - rect.top;  // Pozycja Y wzglêdem ca³ego SVG
  
  // Obliczamy indeksy w siatce
  let col = Math.floor(x / 30);
  let row = Math.floor(y / 30);
  
  // Pozycja wzglêdna w komórce (czy jesteœmy blisko krawêdzi?)
  const xOffset = x % 30;
  const yOffset = y % 30;
  
  // Sprawdzamy, czy bli¿ej granicy poziomej czy pionowej


  if (xOffset < 4) {
    col = col - 1
    return { row, col, type: "horizontal" };      
  } else if (xOffset > 28) {
      
    return { row, col, type: "horizontal" };
  } else if (yOffset < 4) {
      row = row - 1
    return { row, col, type: "vertical" };
  } else if (yOffset > 28) {
    return { row, col, type: "vertical" };
  }

  return { row, col, type: "none" };
};


const checkForClosedAreas = () => {
  const closedAreas = findClosedAreas();
  if (closedAreas.length > 0) {
    setMessage(`Znaleziono ${closedAreas.length} zamkniêtych obszarów.`);
  } else {
    setMessage("Brak zamkniêtych obszarów.");
  }
};


const findClosedAreas = () => {
  const updatedHorizontalBorders = horizontalBorders.map(col => [0, ...col]);
  const combinedBorders = [];
  const potentialArea = [];
  for (let i = 0; i < (2 * GRID_SIZE) - 1; i++) {
    if (i % 2 === 0) {
        combinedBorders.push(updatedHorizontalBorders[i/2])
    } else {
        combinedBorders.push(verticalBorders[(i-1)/2])
    }
  }
  
const visited = Array.from({ length: combinedBorders.length }, () => 
    Array(combinedBorders[0].length).fill(false)
);

for (let i = 0; i < combinedBorders.length; i++) {
    for (let j = 0; j < combinedBorders[i].length; j++) {
        if (combinedBorders[i][j] == 2 && !visited[i][j]) {

            visited[i][j] = true;
            checkNeighbour(i,j, combinedBorders, visited, false, 0, potentialArea, [], "", [])
        } else {
            continue;
        
        }
    }
}
  return combinedBorders 
};
const dirNames = [
    ["Lewo"],
    ["Prawo"],
    ["Dó³"],
    ["Góra"]
];

const checkNeighbour = (i, j, combinedBorders, visited, continuation, orientation = 1, potentialArea, tmpArea, direction, [...path]) => {
  console.log("Orientation", direction)
  path.push([i,j]);
  let directions = [];
  if (i % 2 === 0) {
    for (let x = 0; x < j; x++) {
        const newPair = [i / 2, x];

        if (!potentialArea.some(area => area.some(pair => pair[0] === newPair[0] && pair[1] === newPair[1]))) {
            tmpArea.push(newPair);
        }
    }

       directions = [
        [1, -1], // Lewo
        [1, 0],   // Prawo
        [2, 0],  // Dó³
        [-2, 0] // Góra
      ];             
  } else {
        directions = [
            [0, -1], // Lewo
            [0, 1],   // Prawo
            [1, 0],  // Dó³
            [-1, 1] // Góra
        ]
  }
  

  // Sprawdzamy s¹siadów w trzech kierunkach
  for (let d = 0; d < directions.length; d++) {
      
    const [dx, dy] = directions[d];
    const newX = i + dx;
    const newY = j + dy;

    if (newX >= 0 && newY >= 0 && newX < combinedBorders.length && newY < combinedBorders[newX].length) {
        if (combinedBorders[newX][newY] === 2) {
            if (!visited[newX][newY]) {
                visited[newX][newY] = true;  // Oznaczamy s¹siada jako odwiedzonego

                // Rekurencyjne wywo³anie
                checkNeighbour(newX, newY, combinedBorders, visited, true, d, potentialArea, tmpArea, dirNames[d], path);
                
            } else if (continuation) {
            //    potentialArea.push(tmpArea);
                
            }
        }
    } else {
        potentialArea.push(tmpArea);
        tmpArea = []
        console.log(tmpArea)
        console.log(potentialArea)
        console.error(`Out of bounds: (${newX}, ${newY})`);
    }     
  }
  console.log("Path", path)
};

  // Funkcja resetuj¹ca planszê
  const resetGrid = () => {
    setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
    setMessage("");
  };

const size = 11; // Rozmiar siatki (11x11)
const gridg = Array.from({ length: size }, (_, row) =>
  Array.from({ length: size }, (_, col) => 0) // Startowo same zera
);

// Funkcja do zmiany wartoœci (np. klikniêcie u¿ytkownika)
const updateGrid = (row, col, value) => {
  if (row < 0 || col < 0 || row >= size || col >= size) return; // Sprawdzenie zakresu
  gridg[row][col] = value; // Aktualizacja wartoœci
};

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-2xl font-bold mb-4">Parquet Game</h1>

      <div className="grid grid-cols-1 gap-10 mb-4">
        <div className="space-y-4">
        <button
          onClick={() => {
            setEditMode(true);
            setAnswerMode(false);
          }}
          className={`px-4 py-2 border-2 rounded ${
            editMode ? "bg-blue-500 text-white" : "bg-white text-black"
          }`}
        >
          Edit Mode
        </button>
          <button
            onClick={() => setBorderMode("soft")}
            className={`px-4 py-2 border-2 rounded ${borderMode === "soft" ? "bg-blue-500 text-white" : "bg-white text-black"}`}
          >
            Soft Border
          </button>
          <button
            onClick={() => setBorderMode("hard")}
            className={`px-4 py-2 border-2 rounded ${borderMode === "hard" ? "bg-blue-500 text-white" : "bg-white text-black"}`}
          >
            Hard Border
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setAnswerMode(true);
              setEditMode(false);
            }}
            className={`px-4 py-2 border-2 rounded ${answerMode ? "bg-blue-500 text-white" : "bg-white text-black"}`}
          >
            Answer Mode
          </button>
          <button
            onClick={resetGrid}
            className="px-4 py-2 border-2 rounded bg-white text-black"
          >
            Reset All Answers
          </button>
        </div>
      </div>

      {/* Siatka SVG */}
        <svg
          width={GRID_SIZE * 30}
          height={GRID_SIZE * 30}
          id="grid-svg"
          className="border-4 border-black"
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseUp={() => handleMouseUp()}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          {renderSquaresAndBorders()}
          {editMode && renderDots()}
        </svg>
      

      {message && <div className="mt-4 text-xl font-bold text-green-500">{message}</div>}
    </div>
  );
};

//export default App;