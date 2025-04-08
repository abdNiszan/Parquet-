import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';

const App = () => {
  const [GRID_SIZE, setGRID_SIZE] = useState({ y: 6, x: 6 });
  const [enclosedAreas, setEnclosedAreas] = useState(1);
  const [groupedCoords, setGroups] = useState(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))); // Closed Areas
  const [horizontalBorders, setHorizontalBorders] = useState(
    Array.from({ length: GRID_SIZE.y }, () => Array(GRID_SIZE.x - 1).fill(0)) 
  );
  const [verticalBorders, setVerticalBorders] = useState(
    Array.from({ length: GRID_SIZE.y - 1 }, () => Array(GRID_SIZE.x).fill(0)) 
  );
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState(true);
  const [answerMode, setAnswerMode] = useState(false); // Answear mode (Solving puzzle)
  const [borderMode, setBorderMode] = useState("none"); // Painting borders in edit mode (Chosing soft border/hard border)
  const [mouseDown, setMouseDown] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // Add or remove borders while holding mouse down
  const [secret, setSecret] = useState(''); // Secret message from input
  const [encodedSecret, setEncodedSecret] = useState(''); // Encoded secret
  const [KEY, setKEY] = useState('2');
  
  useEffect(() => {
    const decryptedSecret = decryptAES(encodedSecret);
      setMessage(decryptedSecret);
  }, [KEY]);
 
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGRID_SIZE((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

const createInitialGrid = () => {
  const rows = GRID_SIZE?.y ?? 6;
  const cols = GRID_SIZE?.x ?? 6;

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      active: 0,
      borders: {
        top: row === 0 ? 2 : 0,
        right: col === cols - 1 ? 2 : 0,
        bottom: row === rows - 1 ? 2 : 0,
        left: col === 0 ? 2 : 0,
      },
      group: 0
    }))
  );

  console.log(grid)
};

const [grid, setGrid] = useState(createInitialGrid());
    const renderDots = () => {
      const dotElements = [];
      for (let row = 0; row < GRID_SIZE.y - 1; row++) {
        for (let col = 0; col < GRID_SIZE.x - 1; col++) {
          dotElements.push(
            <circle
              key={`dot-${row}-${col}`}
              cx={(col + 0.96) * 30}
              cy={(row + 0.96) * 30}
              r={0.5}
              fill="black"
              stroke="black"
              strokeWidth="0.25"
            />
          );
        }
      }

      return dotElements;
    };

const renderSquaresAndBorders = () => {
  const elements = [];

  for (let row = 0; row < GRID_SIZE.y; row++) {
    for (let col = 0; col < GRID_SIZE.x; col++) {
      elements.push(
        <rect
          key={`square-${row}-${col}`}
          x={col * 30}
          y={row * 30}
          width={30}
          height={30}
          fill={
            grid[row][col].color === "red" && wasError
              ? 'blue'
              : grid[row][col].active === 2
              ? 'black'
              : grid[row][col].active === 1
              ? 'green'
              : 'white'
          }
          onClick={() => toggleTile(row, col)}
        />
      );

      // Border prawa
      if (col < GRID_SIZE.x - 1) {
        elements.push(
          <line
            key={`h-border-${row}-${col}`}
            x1={(col + 1) * 30}
            y1={row * 30}
            x2={(col + 1) * 30}
            y2={(row + 1) * 30}
            stroke={
              grid[row][col].borders.right === 1
                ? 'gray'
                : grid[row][col].borders.right === 2
                ? 'black'
                : 'transparent'
            }
            strokeWidth={
              grid[row][col].borders.right === 1
                ? '3'
                : grid[row][col].borders.right === 2
                ? '6'
                : '0'
            }
          />
        );
      }

      // Border dó³
      if (row < GRID_SIZE.y - 1) {
        elements.push(
          <line
            key={`v-border-${row}-${col}`}
            x1={(col - 0.025) * 30}
            y1={(row + 1) * 30}
            x2={(col + 1) * 30}
            y2={(row + 1) * 30}
            stroke={
              grid[row][col].borders.bottom === 1
                ? 'gray'
                : grid[row][col].borders.bottom === 2
                ? 'black'
                : 'transparent'
            }
            strokeWidth={
              grid[row][col].borders.bottom === 1
                ? '3'
                : grid[row][col].borders.bottom === 2
                ? '6'
                : '0'
            }
          />
        );
      }
    }
  }

  return elements;
};
  useEffect(() => {
  const hasAnyZero = grid.some(row =>
    row.some(cell => cell.active === 0)
  );
  console.log(hasAnyZero)
  console.log("Po zmianie grid:", hasAnyZero ? "yes" : myFunction());
}, [grid]);

// Funkcja do zmiany stanu 'active' w komórce
const toggleTile = (x, y) => {
  if (!answerMode) return;

  const clickedGroup = grid[x][y].group;
  if (!clickedGroup) return;
  console.log(1)
  let newGrid = []
  const groupNumber = clickedGroup.match(/^\d+/)?.[0];
  const isActive = grid[x][y].active === 2;

  setGrid((prevGrid) => {
    newGrid = prevGrid.map((row, i) =>
      row.map((cell, j) => {
        const cellGroup = grid[i][j].group;
        if (!cellGroup) return cell;

        const cellGroupNumber = cellGroup.match(/^\d+/)?.[0];

        if (isActive) {
          if (cellGroupNumber === groupNumber) {
            return { ...cell, active: 0 };
          }
        } else {
          if (cellGroup === clickedGroup) {
            return { ...cell, active: 2 };
          } else if (cellGroupNumber === groupNumber) {
            return { ...cell, active: 1 };
          }
        }
        return cell;
      })
    );
    console.log(2);

    return newGrid;
  });
    console.log(3)
  console.log(newGrid)
        // Sprawdzenie czy jest chocia¿ jedna komórka z active === 0
    const hasAnyZero = newGrid.some(row =>
      row.some(cell => cell.active === 0)
    );
};
  // Borders interaction
const toggleHorizontalBorder = (row, col, isAdding) => {
    console.log(row,col)
  setHorizontalBorders((prev) => {
    const updated = prev.map((r, i) =>
      r.map((border, j) => {
        if (i === row && j === col) {
          if (borderMode === "soft") return isAdding ? 1 : 0;
          if (borderMode === "hard") return isAdding ? 2 : 0;
        }
        return border;
      })
    );
    
    updateGridBorders(row, col, updated, verticalBorders.slice(), grid.slice(), 1, isAdding);

    return updated;
  });
};

const toggleVerticalBorder = (row, col, isAdding) => {
  setVerticalBorders((prev) => {
    const updated = prev.map((r, i) =>
      r.map((border, j) => {
        if (i === row && j === col) {
          if (borderMode === "soft") return isAdding ? 1 : 0;
          if (borderMode === "hard") return isAdding ? 2 : 0;
        }
        return border;
      })
    );

      let newGrid = [...grid];
        updateGridBorders(row, col, horizontalBorders, updated, newGrid, 0, isAdding);
    return updated;
  });
};

const updateGridBorders = (row, col, horizontalBorders, verticalBorders, prevGrid, orientation, isAdding) => {

  const newGrid = [...prevGrid];

  const cell = { ...newGrid[row][col], borders: { ...newGrid[row][col].borders } };

  if (orientation === 0) {
    const cell1 = { ...newGrid[row + 1][col], borders: { ...newGrid[row + 1][col].borders } };

    const borderValue = isAdding ? { hard: 2, soft: 1 }[borderMode] || 0 : 0;
    cell.borders.bottom = borderValue;
    cell1.borders.top = borderValue;

      newGrid[row + 1][col] = cell1;
  } else {
      const cell1 = { ...newGrid[row][col + 1], borders: { ...newGrid[row][col + 1].borders } };
    const borderValue = isAdding ? { hard: 2, soft: 1 }[borderMode] || 0 : 0;
    cell.borders.right = borderValue;
    cell1.borders.left = borderValue;

    newGrid[row][col + 1] = cell1;
  }

  newGrid[row][col] = cell;
  
  return newGrid;
};

      const handleMouseDown = (e) => {

        e.preventDefault();
  e.stopPropagation();

  if (!editMode) return; 

  setMouseDown(true);
  
  // Pobieramy wspó³rzêdne klikniêcia
  const { row, col, type } = getBorderCoordinates(e);
  console.log(row, col, type);
  if (type === "horizontal" && row >= 0 && row < GRID_SIZE.y && col >= 0 && col < GRID_SIZE.x - 1) {
    const isAdding = horizontalBorders[row][col] === 0;
    setDrawingMode(isAdding ? "add" : "remove");
    toggleHorizontalBorder(row, col, isAdding);
  }

  if (type === "vertical" && row >= 0 && row < GRID_SIZE.y - 1 && col >= 0 && col < GRID_SIZE.x) {
    const isAdding = verticalBorders[row][col] === 0;
    setDrawingMode(isAdding ? "add" : "remove");
    toggleVerticalBorder(row, col, isAdding);
  }
};

    const handleMouseMove = (e) => {
      if (!mouseDown || !editMode) return;

      const { row, col, type } = getBorderCoordinates(e);

      if (type === "horizontal" && row >= 0 && row < GRID_SIZE.y && col >= 0 && col < GRID_SIZE.x - 1) {
        if (drawingMode === "add" && horizontalBorders[row][col] === 0) {
          toggleHorizontalBorder(row, col, true);
        }
        if (drawingMode === "remove" && horizontalBorders[row][col] !== 0) {
          toggleHorizontalBorder(row, col, false);
        }
      }

      if (type === "vertical" && row >= 0 && row < GRID_SIZE.y - 1 && col >= 0 && col < GRID_SIZE.x) {
        if (drawingMode === "add" && verticalBorders[row][col] === 0) {
          toggleVerticalBorder(row, col, true);
        }
        if (drawingMode === "remove" && verticalBorders[row][col] !== 0) {
          toggleVerticalBorder(row, col, false);
        }
      }
    };
    const handleMouseUp = () => {
        if (!editMode) return;

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


const closedAreases = [];
  

async function findClosedAreas() {
  let groupIndex = 0; // Indeks grupy
  const visited = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false)); // Tablica odwiedzonych komórek
  let enclosedAreasCounter = 0
  
  // Iteracja przez wszystkie komórki w gridzie
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!visited[y][x]) { // Je¿eli komórka nie by³a odwiedzona
        const cell = grid[y][x];

        // Wywo³ujemy asynchronicznie funkcjê do sprawdzania s¹siadów
        await checkNeighbors(y, x, visited, groupIndex);
        enclosedAreasCounter++;

        groupIndex++;
      }
    }
  }

  setEnclosedAreas(enclosedAreasCounter)

  const visitedSmall = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false)); // Tablica odwiedzonych komórek
  let groupSuffix = "a"
    // Iteracja przez wszystkie komórki w gridzie
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!visitedSmall[y][x]) { // Je¿eli komórka nie by³a odwiedzona
        const cell = grid[y][x];
        groupIndex = grid[y][x].group;
        
        // Wywo³ujemy asynchronicznie funkcjê do sprawdzania s¹siadów
        await checkSmallNeighbors(y, x, visitedSmall, groupIndex, groupSuffix);

        groupSuffix = nextLetterSequence(groupSuffix);
      }
    }
  }
}

async function checkNeighbors(y, x, visited, groupIndex) {
  const directions = [
    { dy: 0, dx: -1, left: true },  // Lewo
    { dy: -1, dx: 0, top: true },   // Góra
    { dy: 0, dx: 1, right: true },  // Prawo
    { dy: 1, dx: 0, bottom: true }  // Dó³
  ];

  if (!visited[y][x]) {
    visited[y][x] = true;

    grid[y][x].group = groupIndex
  }

  for (let dir = 0; dir < directions.length; dir++) {
    const { dy, dx } = directions[dir];
    const nextY = y + dy;
    const nextX = x + dx;

    if (nextY >= 0 && nextY < grid.length && nextX >= 0 && nextX < grid[y].length) {
      const nextCell = grid[nextY][nextX];

      if (dir === 0 && !visited[nextY][nextX] && grid[y][x].borders.left != 2) {
        visited[nextY][nextX] = true;

       grid[nextY][nextX].group = groupIndex
        if (
          nextCell.borders.left != 2 ||
          nextCell.borders.top != 2 ||
          nextCell.borders.bottom != 2
        ) {
          await checkNeighbors(nextY, nextX, visited, groupIndex);
        }

      } else if (dir === 1 && !visited[nextY][nextX] && grid[y][x].borders.top != 2) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex

        if (
          nextCell.borders.left != 2 ||
          nextCell.borders.top != 2 ||
          nextCell.borders.right != 2
        ) {
          await checkNeighbors(nextY, nextX, visited, groupIndex);
        }

      } else if (dir === 2 && !visited[nextY][nextX] && grid[y][x].borders.right != 2) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex

        if (
          nextCell.borders.top != 2 ||
          nextCell.borders.bottom != 2 ||
          nextCell.borders.right != 2
        ) {
          await checkNeighbors(nextY, nextX, visited, groupIndex);
        }

      } else if (dir === 3 && !visited[nextY][nextX] && grid[y][x].borders.bottom != 2) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex

        if (
          nextCell.borders.left != 2 ||
          nextCell.borders.bottom != 2 ||
          nextCell.borders.right != 2
        ) {
          await checkNeighbors(nextY, nextX, visited, groupIndex);
        }
      }
    }
  }
}


async function checkSmallNeighbors(y, x, visited, groupIndex, groupSuffix) {
  const directions = [
    { dy: 0, dx: -1, left: true },  // Lewo
    { dy: -1, dx: 0, top: true },   // Góra
    { dy: 0, dx: 1, right: true },  // Prawo
    { dy: 1, dx: 0, bottom: true }  // Dó³
  ];

  if (!visited[y][x]) {
    visited[y][x] = true;

    grid[y][x].group = groupIndex + groupSuffix
  }

  for (let dir = 0; dir < directions.length; dir++) {
    const { dy, dx } = directions[dir];
    const nextY = y + dy;
    const nextX = x + dx;

    if (nextY >= 0 && nextY < grid.length && nextX >= 0 && nextX < grid[y].length) {
      const nextCell = grid[nextY][nextX];

      if (dir === 0 && !visited[nextY][nextX] && grid[y][x].borders.left == 0) {
        visited[nextY][nextX] = true;

       grid[nextY][nextX].group = groupIndex + groupSuffix
        if (
          nextCell.borders.left == 0 ||
          nextCell.borders.top == 0 ||
          nextCell.borders.bottom == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix);
        }

      } else if (dir === 1 && !visited[nextY][nextX] && grid[y][x].borders.top == 0) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex + groupSuffix

        if (
          nextCell.borders.left == 0 ||
          nextCell.borders.top == 0 ||
          nextCell.borders.right == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix);
        }

      } else if (dir === 2 && !visited[nextY][nextX] && grid[y][x].borders.right == 0) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex + groupSuffix

        if (
          nextCell.borders.top == 0 ||
          nextCell.borders.bottom == 0 ||
          nextCell.borders.right == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix);
        }

      } else if (dir === 3 && !visited[nextY][nextX] && grid[y][x].borders.bottom == 0) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex + groupSuffix

        if (
          nextCell.borders.left == 0 ||
          nextCell.borders.bottom == 0 ||
          nextCell.borders.right == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix);
        }
      }
    }
  }
}

const [wasError, setWasError] = useState(false);
const [terminatus, setTerminatus] = useState(false);
const [checkWin, setCheckWin] = useState(false);

const myFunction = async () => {
    console.log("ser")
    setTerminatus(false)
  await checkGroupsForWin(true); // 
}

const checkGroupsForWin = async (onlyWin) => {
   //   if (terminatus) return

  let visitedGroup = []
   const visitedBool = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false)); // Tablica odwiedzonych komórek
   const visited = []
  // Iteracja przez wszystkie komórki w gridzie
      
  outerLoop:
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.active === 2) {
          await checkFours(y, x, terminatus, onlyWin);

          if (terminatus) break outerLoop;
        
      }
    }
  }

  secondOuterLoop:
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!visitedBool[y][x]) { // Je¿eli komórka nie by³a odwiedzona
        const cell = grid[y][x];
        if (cell.active === 2) {
          visitedGroup = []

          visited.push([y,x])
          visitedBool[y][x] = true;
          visitedGroup.push(cell.group)
   //       console.log("Return", await checkPath(y, x, null, visitedGroup, visited, visitedBool))
          setTerminatus(await checkPath(y, x, null, visitedGroup, visited, visitedBool))

          if (terminatus) break secondOuterLoop;       
        }
      }
    }
  }
  console.log(visitedGroup)
  if (visitedGroup.length < enclosedAreas || visitedGroup.includes("wrong")) {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (visitedGroup.includes(grid[i][j].group)) {
          grid[i][j].color = 'red'; // Zmieniamy kolor komórki
        }
      }
    }

    if (onlyWin) return;
    setWasError(true); // Ustawiamy stan na true, aby wywo³aæ renderowanie
  }
  else {
  if (encodedSecret) {
const key = grid
  .map(row => row.map(cell => cell.active === 2 ? '1' : '0').join(''))
  .join('');
      const decryptedSecret = decryptAES(encodedSecret); // Przyk³adowy klucz do odszyfrowania
      setMessage(decryptedSecret);
  setKEY(key)
  }
      setTerminatus(true)
      return;
  }

   // setTerminatus(false)
}

const renderErrorMessage = () => {
  if (wasError) {
    return (
      <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-lg flex justify-between items-center z-50">
        <p className="text-lg">Oh no, you made some mistake.</p>
        <button 
          className="ml-4 bg-white text-red-500 px-3 py-1 rounded hover:bg-gray-200"
          onClick={() => {
            setWasError(false); 
            resetErrorColors();
          }}
        >
          Ok
        </button>
      </div>
    );
  }
  return null;
};


useEffect(() => {

renderSquaresAndBorders(); // Rêcznie wymuszamy renderowanie lub jak¹œ inn¹ akcjê  
}, [wasError]); // Tylko gdy wasError siê zmienia

const checkFours = async (y, x, terminatus, onlyWin) => {
if (terminatus) return;

  const directions = [
    { dy: -1, dx: 0 },   // Top
    { dy: -1, dx: -1 },  // TopLeft
    { dy: 0, dx: -1 },   // Left
    { dy: 1, dx: -1 },   // BottomLeft
    { dy: 1, dx: 0 },    // Bottom
    { dy: 1, dx: 1 },    // BottomRight
    { dy: 0, dx: 1 },    // Right
    { dy: -1, dx: 1 },   // TopRight
  ];

  // Iterujemy po kierunkach z wykorzystaniem cyklicznych grup
  for (let i = 0; i < directions.length; i += 2) {
    let coords = [
          [y,x]
        ]
    let detectedFour = 0;
    const dir1 = directions[i];       // np. Top
    const dir2 = directions[(i + 1)];  // np. TopLeft (Nie musia³o byæ tu modulo bo maksymalnie osi¹gnie 7)
    const dir3 = directions[(i + 2) % 8];  // np. Left (cyklicznie z modulo)

    const directionsToCheck = [dir1, dir2, dir3];

    // Iterujemy po kierunkach w bie¿¹cej grupie
    for (let j = 0; j < directionsToCheck.length; j++) {
      const { dy, dx } = directionsToCheck[j];
      const ny = y + dy;
      const nx = x + dx;

      // Sprawdzamy, czy s¹siednia komórka jest w granicach siatki i aktywna
      if (ny >= 0 && ny < GRID_SIZE.y && nx >= 0 && nx < GRID_SIZE.x && grid[ny][nx].active === 2) {
        detectedFour++;
        coords.push([ny, nx])
      }
    }
    if (detectedFour === 3) {        
      for (i = 0; i < coords.length; i++) {
        grid[coords[i][0]][coords[i][1]].color = "red"
      }

      if (!onlyWin) {

          setWasError(true)
      }
      setTerminatus(true);
      return true;
    } else {
        return false;
    }
  }
};

const checkPath = async (y, x, lastDir, visitedGroup, visited, visitedBool) => {
    //if (terminatus) return true
  const directions = [
    { dy: -1, dx: 0 },   // Top
    { dy: 0, dx: -1 },   // Left
    { dy: 1, dx: 0 },    // Bottom
    { dy: 0, dx: 1 }    // Right
  ];
  let alreadyVisited = false
  for (let dir = 0; dir < directions.length; dir++) {
    const { dy, dx } = directions[dir];
    const nextY = y + dy;
    const nextX = x + dx;

    if (lastDir == dir) {
        continue;
    }
    alreadyVisited = visited.some(([vy, vx]) => vy === nextY && vx === nextX);

    if (alreadyVisited) {
        setTerminatus(true)

        visitedGroup.push("wrong")
        return true
    }

    if (nextY >= 0 && nextY < grid.length && nextX >= 0 && nextX < grid[y].length) {
      const nextCell = grid[nextY][nextX];
      visitedBool[nextY][nextX] = true;

      if (nextCell.active == 2) {
        visited.push([nextY, nextX]);

          if (nextCell.group != grid[y][x].group)
          {      
            visitedGroup.push(nextCell.group)
          }
      }

      if (dir === 0 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 2, visitedGroup, visited, visitedBool))        
      } else if (dir === 1 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 3, visitedGroup, visited, visitedBool))
      } else if (dir === 2 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 0, visitedGroup, visited, visitedBool))
      } else if (dir === 3 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 1, visitedGroup, visited, visitedBool))
      }
    }
  }
}


// Helping function
function nextLetterSequence(suffix) {
  let chars = suffix.split('');
  let i = chars.length - 1;

  while (i >= 0) {
    if (chars[i] === 'z') {
      chars[i] = 'a';
      i--;
    } else {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      return chars.join('');
    }
  }

  return 'a' + chars.join('');
}

  // Funkcja resetuj¹ca planszê
const resetGrid = () => {
  setGrid((prevGrid) =>
    prevGrid.map((row) =>
      row.map((cell) => ({
        ...cell,
        active: 0
      }))
    )
  );
  setMessage("");
};

const resetErrorColors = () => {
  setGrid((prevGrid) =>
    prevGrid.map((row) =>
      row.map((cell) => ({
        ...cell,
        color: ""
      }))
    )
  );
  setMessage("");
};
// Funkcja do konwersji wartoœci granicy na ci¹g binarny
const getBorderBinary = (value) => {
  switch (value) {
    case 0:
      return '00'; // 00 dla wartoœci 0
    case 1:
      return '01'; // 01 dla wartoœci 1
    case 2:
      return '10'; // 10 dla wartoœci 2
    default:
      return '00'; // Domyœlna wartoœæ, w razie czego
  }
};


const GenerateLink = () => {
  // Przekszta³cenie siatki w ci¹g binarny
  const binaryStr = grid.flatMap((row, i) =>
    row.map((cell, j) => {
      // Zapisujemy tylko borders.right i borders.bottom dla komórek w pierwszym wierszu i pierwszej kolumnie
      // Ignorujemy ostatni¹ kolumnê i ostatni wiersz
      if (true) { // Ostatnia komórka w siatce jest ignorowana
        const right = getBorderBinary(cell.borders.right);  // borders.right
        const bottom = getBorderBinary(cell.borders.bottom); // borders.bottom

        return right + bottom; // Ka¿da komórka ma 4 bity (2 bity dla borders.right, 2 bity dla borders.bottom)
      }
      return ''; // Pomiñ komórki w ostatnim wierszu i ostatniej kolumnie
    })
  ).join(''); // Po³¹cz wszystko w jeden ci¹g binarny

  let newBinaryStr;
  for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {

      }
  }

 var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase");

  // Zakodowanie siatki w Base64
  const encodedGrid = binaryToBase64(binaryStr); // Zakodowanie do Base64
  //let puzzleKey = [0,1,0,1,1,0,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1,1,0,1,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0,0,1,1,0,0,1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,1,0]; // Klucz do szyfrowania (przyk³ad)
 let puzzleKey = [2]
  // Szyfrowanie 'secret' - szyfrujemy tylko secret
  const encryptedSecret = encryptAES(secret) // encryptXOR(secret, puzzleKey); // Zak³adaj¹c, ¿e masz funkcjê encrypt

  // Dodanie zaszyfrowanego secret do URL (oddzielone podkreœleniem)
  const newUrl = `${window.location.origin}${window.location.pathname}?puzzle=${encodedGrid}_${encodeURIComponent(encryptedSecret)}`;

  // Aktualizacja URL bez prze³adowania strony
  window.history.pushState({ path: newUrl }, '', newUrl); 

  // (Opcjonalnie) Mo¿esz wywo³aæ funkcjê do dekodowania lub innych operacji
  DecodeLink(encodedGrid); // Dekodowanie samej siatki

  return newUrl;
};

// Funkcja do konwersji binarnego ci¹gu na Base64
const binaryToBase64 = (binaryStr) => {
    
  const bytes = [];
  for (let i = 0; i < binaryStr.length; i += 8) {
    const byte = binaryStr.slice(i, i + 8);
    bytes.push(parseInt(byte, 2));
  }

  const base64String = btoa(String.fromCharCode(...bytes)); // Konwersja do Base64
  return base64String;
};
const DecodeLink = (encodedStr) => {
  // Rozdzielenie zakodowanego gridu i zaszyfrowanego secret
  const [encodedGrid, encryptedSecret] = encodedStr.split('_');
  setEncodedSecret(encryptedSecret)
  // Dekodowanie zakodowanego gridu z Base64 na binarny ci¹g
  const decodedBinary = base64ToBinary(encodedGrid);
 // const gridSize = GRID_SIZE
  
  const gridDecoded = [];
  let bitIndex = 0;


  for (let i = 0; i < GRID_SIZE.x; i++) {
    for (let j = 0; j < GRID_SIZE.y; j = j + 2) {
      let right = parseInt(decodedBinary.slice(bitIndex, bitIndex + 2), 2); // 2 bity dla granicy right
      let bottom = parseInt(decodedBinary.slice(bitIndex + 2, bitIndex + 4), 2); // 2 bity dla granicy bottom
      
      gridDecoded.push({
        borders: { right, bottom },
        active: false,
        group: 0
      });

      right = parseInt(decodedBinary.slice(bitIndex + 4, bitIndex + 6), 2); // 2 bity dla granicy bottom
      bottom = parseInt(decodedBinary.slice(bitIndex + 6, bitIndex + 8), 2); // 2 bity dla granicy bottom
      gridDecoded.push({
        borders: { right, bottom },
        active: false,
        group: 0
      });

      bitIndex += 8; // Ka¿de 2 komórki zajmuje 4 bity
    }
  }

   // let puzzleKey = [0,1,0,1,1,0,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1,1,0,1,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0,0,1,1,0,0,1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,1,0]; // Klucz do szyfrowania (przyk³ad)


  return gridDecoded;
};

// Funkcja do konwersji Base64 na binarny ci¹g
const base64ToBinary = (base64Str) => {
  const bytes = atob(base64Str); // Dekodowanie Base64 do ci¹gu znaków
  let binaryStr = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes.charCodeAt(i);
    binaryStr += byte.toString(2).padStart(8, '0'); // Zamiana ka¿dego bajtu na ci¹g binarny
  }

  return binaryStr;
};


// Funkcja do ³adowania danych z URL
const loadPuzzleFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedPuzzle = urlParams.get('puzzle');

  if (encodedPuzzle) {
    // Jeœli parametr 'puzzle' istnieje, to dekodujemy i ustawiamy grid
    const decodedGrid = DecodeLink(encodedPuzzle);
    if (decodedGrid) {
      generateGridByLink(decodedGrid); // Funkcja, która aktualizuje grid na podstawie decodedGrid
    }
  }
};

function encryptAES(plainText) {
    // Szyfrowanie wiadomoœci
    plainText = encodeURIComponent(plainText);
    const encrypted = CryptoJS.AES.encrypt(plainText, KEY);
    return encrypted; // Zwracamy zaszyfrowany tekst w formacie Base64
}

// Funkcja do deszyfrowania
function decryptAES(encryptedText) {
    // Deszyfrowanie wiadomoœci
    const bytes = CryptoJS.AES.decrypt(encryptedText, KEY);
    let decrypted = bytes.toString(CryptoJS.enc.Utf8); // Odszyfrowany tekst w formacie Utf8
    decrypted = decodeURIComponent(decrypted);
    return decrypted; // Zwracamy odszyfrowany tekst
}



// U¿ywamy useEffect do za³adowania gridu po za³adowaniu komponentu
useEffect(() => {
  loadPuzzleFromUrl(); // Sprawdzamy, czy w URL jest parametr 'puzzle'
}, []); // Pusty dependency array, wiêc wykonuje siê tylko raz po za³adowaniu komponentu

const generateGridByLink = (gridDecoded) => {
  let newGrid = [...grid]; // Tworzymy kopiê obecnego gridu, by nie mutowaæ stanu bezpoœrednio

  let bitIndex = 0;

  // Iterujemy po wszystkich komórkach w siatce
  for (let y = 0; y < GRID_SIZE.y; y++) {
    for (let x = 0; x < GRID_SIZE.x; x++) {
      const cell = newGrid[y][x]; // Odwo³ujemy siê do odpowiedniej komórki w nowym gridzie

      // Przypisujemy granice z gridDecoded
      const decodedCell = gridDecoded[bitIndex]; // Zbieramy odpowiedni¹ komórkê z gridDecoded

      // Aktualizujemy tylko granice
      cell.borders.right = decodedCell.borders.right;
      cell.borders.bottom = decodedCell.borders.bottom;
      
      if (newGrid[y][x+1]) {
        const cell1 = newGrid[y][x+1]; // Odwo³ujemy siê do odpowiedniej komórki w nowym gridzie
        cell1.borders.left = decodedCell.borders.right;
        cell1.borders.top = decodedCell.borders.bottom;
      }

      if (y == 0) {
          if (x == 0) {
              cell.borders.left = 2;
              cell.borders.top = 2;
          }
          else if (x == GRID_SIZE.x - 1) {
              cell.borders.top = 2;
          } else {
              cell.borders.top = 2;
          }
      } else if (x == 0 && y > 0 && y < GRID_SIZE.y) {
          cell.borders.left = 2;         
      }

      bitIndex++; // Zwiêkszamy indeks, by przejœæ do nastêpnej komórki
    }
  }

  setGrid(newGrid); // Zaktualizowanie stanu gridu
  findClosedAreas()
};

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-2xl font-bold mb-4">Parquet Game</h1>

      <div className="grid grid-cols-1 gap-10 mb-4">
        <div className="space-y-4">
        <button onClick={() => checkGroupsForWin(false)}>Check answear</button>
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
          width={GRID_SIZE.x * 30}
          height={GRID_SIZE.y * 30}
          id="grid-svg"
          className="border-4 border-black"
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseUp={() => handleMouseUp()}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          {renderSquaresAndBorders()}
          {editMode && renderDots()}
        </svg>
      
        {renderErrorMessage()} {/* Renderujemy komunikat b³êdu */}
      {message && <div className="mt-4 text-xl font-bold text-green-500">{message}</div>}

      <button
      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      onClick={GenerateLink}
    >
      Save puzzle
      </button>

      <div className="mt-4 flex flex-col items-center">
        <label htmlFor="secret" className="mb-2 text-lg">Enter Secret:</label>
        <input
        id="secret"
        type="text"
        className="px-4 py-2 border-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Enter secret text here"
        value={secret} // Zwi¹zane z stanem `secret`
        onChange={(e) => setSecret(e.target.value)} // Aktualizuje stan `secret`
        />
      </div>

    </div>
  );
};

export default App;