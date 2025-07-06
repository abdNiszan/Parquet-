import React, { useEffect, useState, useRef } from 'react';
import CryptoJS from 'crypto-js';
import CheckButton from './checkButton';
import GridEdit from './GridEdit';
import handleCheckGrid from './GridAreas';
import PlayMode from './PlayMode';  // Make sure the path is correct

const App = () => {
  const [GRID_SIZE, setGRID_SIZE] = useState({ y: 6, x: 6 });

  const cellRefs = useRef({});
  const borderRefs = useRef({});

  const answerModeRef = useRef(true);
  const editModeRef = useRef(false);
  const borderModeRef = useRef("soft");
  const [checkKey, setCheckKey] = useState(0); // Check answer button
  const [_, forceRerender] = useState(0); // Used to refresh buttons
  const checkRef = useRef(null);
  
  const [mouseDown, setMouseDown] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // Add or remove borders while holding mouse down

  const [enclosedAreas, setEnclosedAreas] = useState(1);
  const [groupedCoords, setGroups] = useState(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))); // Closed Areas

  const [message, setMessage] = useState(""); 

  const [secret, setSecret] = useState(''); // Secret message from input
  const [encodedSecret, setEncodedSecret] = useState(''); // Encrypted secret
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
  
  // Load once after loading component, to add information from URL
  useEffect(() => {
    loadPuzzleFromUrl(); 
  }, []);

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

  // Create dots for the grid
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

  // Grid reference that will be updated and used to draw borders and toggle squares
  let gridRef = useRef(grid);

  // Function to reset the board
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
      case 0: return '00';
      case 1: return '01';
      case 2: return '10';
      default: return '00';
    }
  };

  const GenerateLink = () => {
    const binaryStr = grid.flatMap((row) =>
      row.map((cell) => {
        const right = getBorderBinary(cell.borders.right);
        const bottom = getBorderBinary(cell.borders.bottom);
        return right + bottom;
      })
    ).join('');

    const encodedGrid = binaryToBase64(binaryStr);
    let encryptedSecret = "";

    if (secret) {
      encryptedSecret = encryptAES(secret);
    }

    const newUrl = `${window.location.origin}${window.location.pathname}?s=${GRID_SIZE.y}x${GRID_SIZE.x}_${encodedGrid}_${encodeURIComponent(encryptedSecret)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Convert binary grid to Base64
  const binaryToBase64 = (binaryStr) => {
    const bytes = [];
    for (let i = 0; i < binaryStr.length; i += 8) {
      const byte = binaryStr.slice(i, i + 8);
      bytes.push(parseInt(byte, 2));
    }
    return btoa(String.fromCharCode(...bytes));
  };

  useEffect(() => {
    if (urlSize != undefined) {
      generateGridByLink(decodedGrid);
    }
  }, [urlSize]);

  // Decode saved game data (size, borders, secret message)
  const DecodeLink = (encodedStr) => {
    const [gridSize, encodedGrid, encryptedSecret] = encodedStr.split('_');
    const [y, x] = gridSize.split('x').map(Number);
    setGRID_SIZE({ y, x });
    setGrid(createInitialGrid(GRID_SIZE));
    setUrlSize({ y, x });

    if (encryptedSecret) {
      setEncodedSecret(encryptedSecret);
    }

    if (encodedGrid != undefined) {
      const decodedBinary = base64ToBinary(encodedGrid);
      const gridDecoded = [];
      let bitIndex = 0;

      for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j += 2) {
          let right = parseInt(decodedBinary.slice(bitIndex, bitIndex + 2), 2);
          let bottom = parseInt(decodedBinary.slice(bitIndex + 2, bitIndex + 4), 2);

          gridDecoded.push({
            borders: { right, bottom },
            active: false,
            group: 0
          });

          right = parseInt(decodedBinary.slice(bitIndex + 4, bitIndex + 6), 2);
          bottom = parseInt(decodedBinary.slice(bitIndex + 6, bitIndex + 8), 2);

          gridDecoded.push({
            borders: { right, bottom },
            active: false,
            group: 0
          });

          bitIndex += 8;
        }
      }
      return gridDecoded;
    }
  };

  // Convert Base64 to binary string
  const base64ToBinary = (base64Str) => {
    const bytes = atob(base64Str);
    let binaryStr = '';

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes.charCodeAt(i);
      binaryStr += byte.toString(2).padStart(8, '0');
    }

    return binaryStr;
  };

  // Load puzzle from URL
  const loadPuzzleFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedPuzzle = urlParams.get('s');

    if (encodedPuzzle) {
      const decoded = DecodeLink(encodedPuzzle);
      setDecodedGrid(decoded);
    }
  };

  // AES Encryption
  function encryptAES(plainText) {
    const key = grid.map(row =>
      row.map(cell => (cell.active === 2 ? '1' : '0')).join('')
    ).join('');
    setKEY(key);
    plainText = encodeURIComponent(plainText);
    const encrypted = CryptoJS.AES.encrypt(plainText, KEY);
    return encrypted;
  }

  // AES Decryption
function decryptAES(encryptedText) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, KEY);
        const decrypted = decodeURIComponent(bytes.toString(CryptoJS.enc.Utf8));
        return decrypted;
    } catch (e) {
        return "";
    }
}

  // Create grid from decoded data
  const generateGridByLink = (gridDecoded) => {
    let newGrid = createInitialGrid(GRID_SIZE);
    let bitIndex = 0;

    for (let y = 0; y < GRID_SIZE.y; y++) {
      for (let x = 0; x < GRID_SIZE.x; x++) {
        const cell = newGrid[y][x];
        const decodedCell = gridDecoded[bitIndex];

        cell.borders.right = decodedCell.borders.right > 0 ? decodedCell.borders.right : 0;
        cell.borders.bottom = decodedCell.borders.bottom > 0 ? decodedCell.borders.bottom : 0;

        if (newGrid[y][x + 1]) {
          newGrid[y][x + 1].borders.left = decodedCell.borders.right > 0 ? decodedCell.borders.right : 0;
        }
        if (newGrid[y + 1]) {
          newGrid[y + 1][x].borders.top = decodedCell.borders.bottom > 0 ? decodedCell.borders.bottom : 0;
        }

        if (y === 0) cell.borders.top = 2;
        if (y === GRID_SIZE.y - 1) cell.borders.bottom = 2;
        if (x === 0) cell.borders.left = 2;
        if (x === GRID_SIZE.x - 1) cell.borders.right = 2;

        bitIndex++;
      }
    }

    gridRef.current = newGrid;
    handleCheckGrid(gridRef.current, setEnclosedAreas);
    setGrid(newGrid);
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-2xl font-bold mb-4">Parquet Game</h1>

      <div className="flex grid-cols-1 gap-10 mb-4">        
        <button
          onClick={() => {
            if (checkRef.current) {
              checkRef.current(false, gridRef.current);
            }
          }}
          className="px-4 py-2 border-2 rounded bg-white text-black"
        >
          Check answer
        </button>

        <button
          onClick={resetGrid}
          className="px-4 py-2 border-2 rounded bg-white text-black"
        >
          Reset All Answers
        </button>        
      </div>

      <div className="p-4">
        <PlayMode
          grid={grid}
          setGrid={setGrid}
          gridRef={gridRef}
          cellRefs={cellRefs}
          editModeRef={editModeRef}
          borderModeRef={borderModeRef}
          setEnclosedAreas={setEnclosedAreas}
          renderDots={renderDots}
          answerModeRef={answerModeRef}
          encodedSecret={encodedSecret}
          enclosedAreas={enclosedAreas}
          setMessage={setMessage}
          setKEY={setKEY}
          checkGroupsForWinRef={checkRef}
        />
      </div>

      {message && <div className="mt-4 text-xl font-bold text-green-500">{message}</div>}

      <div class="text-left max-w-xl mx-auto my-6 p-4 bg-white shadow-md rounded-lg">
  <h2 class="text-xl font-bold mb-3">Parquet Puzzle Rules</h2>
  <ul class="list-disc list-inside space-y-2 text-gray-800">
    <li>
      Each bold-outlined region is divided into two subregions. 
      <strong>Exactly one</strong> of them must be fully shaded.
    </li>
    <li>
      All shaded cells must form a <strong>single orthogonally connected group </strong> 
       (connected only through edges, not diagonals).
    </li>
    <li>
      <strong>No loops</strong> are allowed in the shaded area. 
      A loop is a continuous path of shaded cells that closes on itself without branches.
    </li>
    <li>
      <strong>2x2 blocks</strong> of shaded cells are not allowed.
    </li>
  </ul>
</div>
    </div>
  );
};

export default App;