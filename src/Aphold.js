import React, { useEffect, useState, useRef } from 'react';
import CryptoJS from 'crypto-js';
import CheckButton from './checkButton';

const App = () => {
  const [GRID_SIZE, setGRID_SIZE] = useState({ y: 6, x: 6 });

  const cellRefs = useRef({});
  const borderRefs = useRef({});

  const answerModeRef = useRef(false);
  const editModeRef = useRef(true);
  const borderModeRef = useRef("soft");
  const [checkKey, setCheckKey] = useState(0); // Check answear button
  const [_, forceRerender] = useState(0); // Used for refreshing buttons
  
  const [mouseDown, setMouseDown] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // Add or remove borders while holding mouse down

  const [enclosedAreas, setEnclosedAreas] = useState(1);
  const [groupedCoords, setGroups] = useState(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))); // Closed Areas

  const [message, setMessage] = useState(""); 

  const [secret, setSecret] = useState(''); // Secret message from input
  const [encodedSecret, setEncodedSecret] = useState(''); // Encoded secret
  const [KEY, setKEY] = useState('2');
  const [decodedGrid, setDecodedGrid] = useState();
  const [urlSize, setUrlSize] = useState();  

const forceButtonRerender = () => {
  setCheckKey(prev => prev + 1);
};

const switchToAnswerMode = () => {
  answerModeRef.current = true;
  editModeRef.current = false;
  forceRerender((n) => n + 1);
};

const switchToEditMode = () => {
  answerModeRef.current = false;
  editModeRef.current = true;
  forceRerender((n) => n + 1);
};

const switchBorderMode = (mode) => {
  borderModeRef.current = mode;
  forceRerender((n) => n + 1);
};
  
// Load once after loading component, to add information from url.
useEffect(() => {
  loadPuzzleFromUrl(); 
}, []);

const [svgElements, setSvgElements] = useState([]);

// Creates basic puzzle grid
useEffect(() => {
  const elements = renderSquaresAndBorders(grid);
  setSvgElements(elements);
}, []);

// Refreshes puzzle grid
const regenerateSvg = (grid) => {
  setSvgElements(renderSquaresAndBorders(grid));
};

// When puzzle is solved, the key is set and we can try to decode the encrypted message
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

// Create empty grid array of desired size
const createInitialGrid = (size) => {
  return Array.from({ length: size.y }, (_, row) =>
    Array.from({ length: size.x }, (_, col) => ({
      active: 0,
      borders: {
        top: row === 0 ? 2 : 0,
        right: col === size.x - 1 ? 2 : 0,
        bottom: row === size.y - 1 ? 2 : 0,
        left: col === 0 ? 2 : 0,
      },
      group: 0,
    }))
  );
};

// Creates dots for the grid
const [grid, setGrid] = useState(createInitialGrid(GRID_SIZE));
    const renderDots = () => {
      const dotElements = [];
      for (let row = 0; row < GRID_SIZE.y - 1; row++) {
        for (let col = 0; col < GRID_SIZE.x - 1; col++) {
          dotElements.push(
            <circle
              key={`dot-${row}-${col}`}
              cx={(col + 0.96) * 50}
              cy={(row + 0.96) * 50}
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

// Create gridRef that will be updated and used to draw borders and toggle squares
let gridRef = useRef(grid);

// Creates squares and borders for the grid
const renderSquaresAndBorders = (grid) => {
  const elements = [];
  if (GRID_SIZE.y != grid.length || GRID_SIZE.x != grid[0].length) return;

  for (let row = 0; row < GRID_SIZE.y; row++) {
    for (let col = 0; col < GRID_SIZE.x; col++) {
      elements.push(
        <rect
          ref={(el) => { cellRefs.current[`square-${row}-${col}`] = el }}
          key={`square-${row}-${col}`}
          x={col * 50}
          y={row * 50}
          width={50}
          height={50}
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

      // Vertical borders
      if (col < GRID_SIZE.x - 1) {
        elements.push(
            <line
              key={`h-border-${row}-${col}`}
              ref={(el) => {
                borderRefs.current[`h-${row}-${col}`] = el;
              }}
              x1={(col + 1) * 50}
              y1={row * 50}
              x2={(col + 1) * 50}
              y2={(row + 1) * 50}
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

      // Horizontal borders
      if (row < GRID_SIZE.y - 1) {
        elements.push(
          <line
            key={`v-border-${row}-${col}`}
            ref={(el) => {
            borderRefs.current[`v-${row}-${col}`] = el;
            }}
            x1={(col - 0.025) * 50}
            y1={(row + 1) * 50}
            x2={(col + 1) * 50}
            y2={(row + 1) * 50}
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

  gridRef.current = grid
  
  findClosedAreas(grid)
  return elements;
};

// Selecting group that should be colored
const toggleTile = (x, y) => {
  if (!answerModeRef.current) return;

  const grid = gridRef.current.slice();

  const clickedGroup = grid[x][y].group;

  if (!clickedGroup) return;

  const groupNumber = clickedGroup.match(/^\d+/)?.[0];
  const isActive = grid[x][y].active === 2;

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      const cellGroup = cell.group;
      if (!cellGroup) continue;

      const cellGroupNumber = cellGroup.match(/^\d+/)?.[0];
      const ref = cellRefs.current[`square-${i}-${j}`];

      if (isActive) {
        if (cellGroupNumber === groupNumber) {
          cell.active = 0;
          ref?.setAttribute("fill", "white");
        }
      } else {
        if (cellGroup === clickedGroup) {
          cell.active = 2;
          ref?.setAttribute("fill", "black");
        } else if (cellGroupNumber === groupNumber) {
          cell.active = 1;
          ref?.setAttribute("fill", "green");
        }
      }
    }
  }

  const hasAnyZero = grid.some(row =>
    row.some(cell => cell.active === 0)
  );
  
  // If grid doesn't have any unactive tiles, then check for win
  if (!hasAnyZero) {
    setTerminatus(false)
     checkGroupsForWin(true, gridRef.current);
  }
};



// Updates border in the svg element
const updateBorderVisual = (row, col, orientation, borderValue) => {
  const key = orientation === 0 ? `h-${row}-${col}` : `v-${row}-${col}`;
  const ref = borderRefs.current[key];

  if (!ref) return;

  let stroke, width;
  if (borderValue === 1) {
    stroke = 'gray';
    width = 3;
  } else if (borderValue === 2) {
    stroke = 'black';
    width = 6;
  } else {
    stroke = 'transparent';
    width = 0;
  }

  ref.setAttribute("stroke", stroke);
  ref.setAttribute("stroke-width", width);
};

// Updtaes gridRef borders
const updateGridBorders = (row, col, isAdding, orientation) => {
  const grid = gridRef.current;
  const borderValue = isAdding ? { hard: 2, soft: 1 }[borderModeRef.current] || 0 : 0;

  if (orientation === 0) {
    grid[row][col].borders.right = borderValue;
    if (grid[row][col + 1]) {
      grid[row][col + 1].borders.left = borderValue;
    }
  } else {
    grid[row][col].borders.bottom = borderValue;
    if (grid[row + 1]) {
      grid[row + 1][col].borders.top = borderValue;
    }
  }

  updateBorderVisual(row, col, orientation, borderValue);
};

// Draw a border, and prepare for continuing drawing/removing of borders
const handleMouseDown = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!editModeRef.current) return; 

  setMouseDown(true);
  
  const { row, col, type } = getBorderCoordinates(e);

  if (type === "horizontal" && row >= 0 && row < GRID_SIZE.y && col >= 0 && col < GRID_SIZE.x - 1) {
    const isAdding = grid[row][col].borders.right === 0;
    setDrawingMode(isAdding ? "add" : "remove");

    updateGridBorders(row, col, isAdding, 0);
  }

  if (type === "vertical" && row >= 0 && row < GRID_SIZE.y - 1 && col >= 0 && col < GRID_SIZE.x) {
    const isAdding = grid[row][col].borders.bottom === 0;
    setDrawingMode(isAdding ? "add" : "remove");

    updateGridBorders(row, col, isAdding, 1);
  }
};

// Continue drawing/removing of borders
const handleMouseMove = (e) => {
    if (!mouseDown || !editModeRef.current) return;

    const { row, col, type } = getBorderCoordinates(e);

    if (type === "horizontal" && row >= 0 && row < GRID_SIZE.y && col >= 0 && col < GRID_SIZE.x - 1) {
    if (drawingMode === "add" && grid[row][col].borders.right === 0) {
            updateGridBorders(row, col, true, 0);
    }
    if (drawingMode === "remove" && grid[row][col].borders.right !== 0) {
            updateGridBorders(row, col, false, 0);
    }
    }

    if (type === "vertical" && row >= 0 && row < GRID_SIZE.y - 1 && col >= 0 && col < GRID_SIZE.x) {
    if (drawingMode === "add" && grid[row][col].borders.bottom === 0) {
            updateGridBorders(row, col, true, 1);
    }
    if (drawingMode === "remove" && grid[row][col].borders.bottom !== 0) {
            updateGridBorders(row, col, false, 1);
    }
    }
};

// Stop drawing/removing on mouse release
const handleMouseUp = () => {
    if (!editModeRef.current) return;

    findClosedAreas(gridRef.current)
    setMouseDown(false);
    setDrawingMode(null);
};

// Which border on the svg puzzle is clicked on
const getBorderCoordinates = (e) => {
  const svgElement = document.getElementById("grid-svg"); // Get the html svg puzzle
  const rect = svgElement.getBoundingClientRect(); // Get boundries of the grid
  const x = e.clientX - rect.left; // Position of mouse on x axis
  const y = e.clientY - rect.top;  // Position of mouse on y axis
  
  let col = Math.floor(x / 50);
  let row = Math.floor(y / 50);
  
  const xOffset = x % 50;
  const yOffset = y % 50;
  
  if (xOffset < 6 && yOffset > 15 && yOffset < 35) {
    col = col - 1
    return { row, col, type: "horizontal" };      
  } else if (xOffset > 46 && yOffset > 15 && yOffset < 35) {
      
    return { row, col, type: "horizontal" };
  } else if (yOffset < 6 && xOffset > 15 && xOffset < 35) {
      row = row - 1
    return { row, col, type: "vertical" };
  } else if (yOffset > 46 && xOffset > 15 && xOffset < 35) {
    return { row, col, type: "vertical" };
  }

  return { row, col, type: "none" };
};

// Group the grids areas divided by hard border, then group those areas that are divided by soft border
async function findClosedAreas(grid) {
  let groupIndex = 0; // Main group index
  const visited = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false)); // Visited cell
  let enclosedAreasCounter = 0 // How many closed areas have been created
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!visited[y][x]) {
        const cell = grid[y][x];

        // Search of the main groups
        await checkNeighbors(y, x, visited, groupIndex, grid);
        enclosedAreasCounter++;

        groupIndex++;
      }
    }
  }

  setEnclosedAreas(enclosedAreasCounter)

  const visitedSmall = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false)); // Visited cell
  let groupSuffix = "a" // Sub group index

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!visitedSmall[y][x]) { 
        const cell = grid[y][x];
        groupIndex = grid[y][x].group; // Main group index that will be parred with sub group index
        
        await checkSmallNeighbors(y, x, visitedSmall, groupIndex, groupSuffix, grid);

        groupSuffix = nextLetterSequence(groupSuffix);
      }
    }
  }
}

// Divide grid into main groups
async function checkNeighbors(y, x, visited, groupIndex, grid) {
  const directions = [
    { dy: 0, dx: -1 },  // Left cell
    { dy: -1, dx: 0 },   // Top cell
    { dy: 0, dx: 1 },  // Right cell
    { dy: 1, dx: 0 }  // Bottom cell
  ];

  // If cell wasn't visited mark it, and set it group index
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

        // Next direction of the cell can't be the same as the opposite of the last recursion
        if (
            nextCell.borders.left != 2 ||
            nextCell.borders.top != 2 ||
            nextCell.borders.bottom != 2
        ) {
            // If direction is available go further
            await checkNeighbors(nextY, nextX, visited, groupIndex, grid);
        }
      } else if (dir === 1 && !visited[nextY][nextX] && grid[y][x].borders.top != 2) {
        visited[nextY][nextX] = true;
        grid[nextY][nextX].group = groupIndex

        if (
            nextCell.borders.left != 2 ||
            nextCell.borders.top != 2 ||
            nextCell.borders.right != 2
        ) {
            await checkNeighbors(nextY, nextX, visited, groupIndex, grid);
        }
      } else if (dir === 2 && !visited[nextY][nextX] && grid[y][x].borders.right != 2) {
        visited[nextY][nextX] = true;
        grid[nextY][nextX].group = groupIndex

        if (
            nextCell.borders.top != 2 ||
            nextCell.borders.bottom != 2 ||
            nextCell.borders.right != 2
        ) {
            await checkNeighbors(nextY, nextX, visited, groupIndex, grid);
        }
      } else if (dir === 3 && !visited[nextY][nextX] && grid[y][x].borders.bottom != 2) {
        visited[nextY][nextX] = true;
        grid[nextY][nextX].group = groupIndex
        if (
            nextCell.borders.left != 2 ||
            nextCell.borders.bottom != 2 ||
            nextCell.borders.right != 2
        ) {
            await checkNeighbors(nextY, nextX, visited, groupIndex, grid);
        }
      }
    }
  }
}

// Divide main groups into sub groups
async function checkSmallNeighbors(y, x, visited, groupIndex, groupSuffix, grid) {
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
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix, grid);
        }

      } else if (dir === 1 && !visited[nextY][nextX] && grid[y][x].borders.top == 0) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex + groupSuffix

        if (
          nextCell.borders.left == 0 ||
          nextCell.borders.top == 0 ||
          nextCell.borders.right == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix, grid);
        }

      } else if (dir === 2 && !visited[nextY][nextX] && grid[y][x].borders.right == 0) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex + groupSuffix

        if (
          nextCell.borders.top == 0 ||
          nextCell.borders.bottom == 0 ||
          nextCell.borders.right == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix, grid);
        }

      } else if (dir === 3 && !visited[nextY][nextX] && grid[y][x].borders.bottom == 0) {
        visited[nextY][nextX] = true;
       grid[nextY][nextX].group = groupIndex + groupSuffix

        if (
          nextCell.borders.left == 0 ||
          nextCell.borders.bottom == 0 ||
          nextCell.borders.right == 0
        ) {
          await checkSmallNeighbors(nextY, nextX, visited, groupIndex, groupSuffix, grid);
        }
      }
    }
  }
}

const [wasError, setWasError] = useState(false);
const [terminatus, setTerminatus] = useState(false);
const [checkWin, setCheckWin] = useState(false);

const checkGroupsForWin = async (onlyWin, grid) => {
   //   if (terminatus) return
   console.log(onlyWin)
   console.log(grid)
  let visitedGroup = []
   const visitedBool = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false)); // Tablica odwiedzonych komórek
   const visited = []
  // Iteracja przez wszystkie komórki w gridzie
      
  outerLoop:
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.active === 2) {
          await checkFours(y, x, terminatus, onlyWin, grid);

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

          setTerminatus(await checkPath(y, x, null, visitedGroup, visited, visitedBool, grid))

          if (terminatus) break secondOuterLoop;       
        }
      }
    }
  }

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
      console.log(encodedSecret)
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
      console.log(grid)
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

//renderSquaresAndBorders(); // Rêcznie wymuszamy renderowanie lub jak¹œ inn¹ akcjê  
}, [wasError]); // Tylko gdy wasError siê zmienia

const checkFours = async (y, x, terminatus, onlyWin, grid) => {
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

const checkPath = async (y, x, lastDir, visitedGroup, visited, visitedBool, grid) => {
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
        setTerminatus(await checkPath(nextY, nextX, 2, visitedGroup, visited, visitedBool, grid))        
      } else if (dir === 1 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 3, visitedGroup, visited, visitedBool, grid))
      } else if (dir === 2 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 0, visitedGroup, visited, visitedBool, grid))
      } else if (dir === 3 && nextCell.active == 2) {
        setTerminatus(await checkPath(nextY, nextX, 1, visitedGroup, visited, visitedBool, grid))
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

// Convert border state into binary value
const getBorderBinary = (value) => {
  switch (value) {
    case 0:
      return '00'; // 00 for no border
    case 1:
      return '01'; // 01 for 1 (soft border)
    case 2:
      return '10'; // 10 for 2 (hard border)
    default:
      return '00';
  }
};

const GenerateLink = () => {
  // Convert grid data to binary string
  const binaryStr = grid.flatMap((row, i) =>
    row.map((cell, j) => {
        const right = getBorderBinary(cell.borders.right);  // Border right is later determined to create border left
        const bottom = getBorderBinary(cell.borders.bottom); // Border bottom is later determined to create border top

        return right + bottom; // Every cell has 4 bits
    })
  ).join(''); // Create single string

  const encodedGrid = binaryToBase64(binaryStr);
  let encryptedSecret = ""

  if (secret) {
      encryptedSecret = encryptAES(secret) // Encrypt secret if added to input
  }

  const newUrl = `${window.location.origin}${window.location.pathname}?s=${GRID_SIZE.y}x${GRID_SIZE.x}_${encodedGrid}_${encodeURIComponent(encryptedSecret)}`;

  window.history.pushState({ path: newUrl }, '', newUrl); // Push the information to url
};

// Convert binary grid to Base64
const binaryToBase64 = (binaryStr) => {   
  const bytes = [];
  for (let i = 0; i < binaryStr.length; i += 8) {
    const byte = binaryStr.slice(i, i + 8);
    bytes.push(parseInt(byte, 2));
  }

  const base64String = btoa(String.fromCharCode(...bytes));
  return base64String;
};

useEffect(() => {
    console.log(urlSize)
  if (urlSize != undefined) {
    generateGridByLink(decodedGrid)
  }
 // grid.slice(0, GRID_SIZE.y, 0 GRID_SIZE.x)
}, [urlSize]); // U¿ywamy efektu do obserwacji zmiany flagi

// Decode saved game data (Size, borders, secret message)
const DecodeLink = (encodedStr) => {
  // Rozdzielenie zakodowanego gridu i zaszyfrowanego secret
  const [gridSize, encodedGrid, encryptedSecret] = encodedStr.split('_');
    console.log(gridSize)
    
    console.log(encryptedSecret)
  
  const [y, x] = gridSize.split('x').map(Number);
  setGRID_SIZE({y:y,x:x})
  setGrid(createInitialGrid(GRID_SIZE))

  setUrlSize({y:y, x:x})

  if (encryptedSecret) {
      setEncodedSecret(encryptedSecret)
  }

  if (encodedGrid != undefined) {

  
  const decodedBinary = base64ToBinary(encodedGrid);

  const gridDecoded = [];
  let bitIndex = 0;

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j = j + 2) {
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

  return gridDecoded;
  }
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
  const encodedPuzzle = urlParams.get('s');
  
  if (encodedPuzzle) {
    // Jeœli parametr 'puzzle' istnieje, to dekodujemy i ustawiamy grid
    const decoded = DecodeLink(encodedPuzzle);
    setDecodedGrid(decoded)
    console.log(decodedGrid)
    console.log(decoded)
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




const generateGridByLink = (gridDecoded) => {
  //let newGrid = [...grid]; // Tworzymy kopiê obecnego gridu, by nie mutowaæ stanu bezpoœrednio
  console.log(GRID_SIZE)
  let newGrid = createInitialGrid(GRID_SIZE);
  console.log(newGrid)
  let bitIndex = 0;
  console.log("NEW", GRID_SIZE);
  console.log(gridDecoded)
  console.log(newGrid)
  // Iterujemy po wszystkich komórkach w siatce
  for (let y = 0; y < GRID_SIZE.y; y++) {
    for (let x = 0; x < GRID_SIZE.x; x++) {
      const cell = newGrid[y][x]; // Odwo³ujemy siê do odpowiedniej komórki w nowym gridzie

      // Przypisujemy granice z gridDecoded
      const decodedCell = gridDecoded[bitIndex]; // Zbieramy odpowiedni¹ komórkê z gridDecoded

      // Aktualizujemy tylko granice
      if (decodedCell.borders.right > 0) {
        cell.borders.right = decodedCell.borders.right;
      } else {
        cell.borders.right = 0;
      }
      if (decodedCell.borders.bottom > 0) {
          cell.borders.bottom = decodedCell.borders.bottom;
      } else {
          cell.borders.bottom = 0;
      }
      
      if (newGrid[y][x+1]) {
          if (decodedCell.borders.right > 0) {
            newGrid[y][x+1].borders.left = decodedCell.borders.right;
          } else {
            newGrid[y][x+1].borders.left = 0;
          }
      }
      if (newGrid[y+1]) {
          if (decodedCell.borders.bottom > 0) {
              newGrid[y+1][x].borders.top = decodedCell.borders.bottom
          }
          else {
              newGrid[y+1][x].borders.top = 0;
          }
      }

    const isTop = y === 0;
    const isBottom = y === GRID_SIZE.y - 1;
    const isLeft = x === 0;
    const isRight = x === GRID_SIZE.x - 1;

    if (isTop) cell.borders.top = 2;
    if (isBottom) cell.borders.bottom = 2;
    if (isLeft) cell.borders.left = 2;
    if (isRight) cell.borders.right = 2;

      bitIndex++; // Zwiêkszamy indeks, by przejœæ do nastêpnej komórki
    }
  }
  gridRef.current = newGrid
  console.log(gridRef)
  regenerateSvg(gridRef.current)
  setGrid(newGrid); // Zaktualizowanie stanu gridu
};

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-2xl font-bold mb-4">Parquet Game</h1>

      <div className="grid grid-cols-1 gap-10 mb-4">
        <div className="space-y-4">
<button
  key={checkKey}
  onClick={() => {
    forceButtonRerender(); // jeœli chcesz odœwie¿yæ go
    checkGroupsForWin(false, gridRef.current);
  }}
>
  Check answer
</button>
    <button
        onClick={switchToEditMode}
        className={`px-4 py-2 border-2 rounded ${
        editModeRef.current ? "bg-blue-500 text-white" : "bg-white text-black"
        }`}
    >
        Edit Mode
    </button>
    <button
      onClick={() => switchBorderMode("soft")}
      className={`px-4 py-2 border-2 rounded ${borderModeRef.current === "soft" ? "bg-blue-500 text-white" : "bg-white text-black"}`}
    >
      Soft Border
    </button>

    <button
      onClick={() => switchBorderMode("hard")}
      className={`px-4 py-2 border-2 rounded ${borderModeRef.current === "hard" ? "bg-blue-500 text-white" : "bg-white text-black"}`}
    >
      Hard Border
    </button>
        </div>

        <div className="space-y-4">


    <button
      onClick={switchToAnswerMode}
      className={`px-4 py-2 border-2 rounded ${
        answerModeRef.current ? "bg-blue-500 text-white" : "bg-white text-black"
      }`}
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
          width={GRID_SIZE.x * 50}
          height={GRID_SIZE.y * 50}
          id="grid-svg"
          className="border-4 border-black"
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseUp={() => handleMouseUp()}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          {svgElements}
          {editModeRef.current && renderDots()}
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