import React, { useState, useEffect, useRef } from 'react';
import GridEdit from './GridEdit'; // Za³ó¿my, ¿e importujesz GridEdit

const PlayMode = ({  
    grid,
    setGrid,
    gridRef,
    cellRefs,
    editModeRef,
    borderModeRef,
    setEnclosedAreas,
    renderDots,
    answerModeRef,
    encodedSecret,
    enclosedAreas,
    setMessage,
    setKEY,
    checkGroupsForWinRef,
}) => {
  useEffect(() => {
  if (checkGroupsForWinRef) {
    checkGroupsForWinRef.current = checkGroupsForWin; //
  }
}, []);

const [errorMessage, setErrorMessage] = useState("");
  const [wasError, setWasError] = useState(false);
  const [colors, setColors] = useState({});
  const resetErrorColors = () => {
    const grid = gridRef.current;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const ref = cellRefs.current[`square-${y}-${x}`];

        if (grid[y][x].color === 'red') {
          setColors(prevColors => ({
            ...prevColors,
            [`square-${y}-${x}`]: 'white',
          }));
          grid[y][x].color = null;
        }
      }
    }
  };

  const enclosedAreasRef = useRef(enclosedAreas);
    useEffect(() => {
      enclosedAreasRef.current = enclosedAreas;
      setEnclosedAreas(enclosedAreas);
    }, [enclosedAreas]);

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
            setColors(prevColors => ({
              ...prevColors,
              [`square-${i}-${j}`]: 'white',
            }));
          }
        } else {
          if (cellGroup === clickedGroup) {
            cell.active = 2;
            setColors(prevColors => ({
              ...prevColors,
              [`square-${i}-${j}`]: 'black',
            }));
          } else if (cellGroupNumber === groupNumber) {
            cell.active = 1;
            setColors(prevColors => ({
              ...prevColors,
              [`square-${i}-${j}`]: 'green',
            }));
          }
        }
      }
    }

    resetErrorColors();

    const hasAnyZero = grid.some(row => row.some(cell => cell.active === 0));
    if (!hasAnyZero) {
      checkGroupsForWin(true, gridRef.current);
    }
  };

  const checkGroupsForWin = async (onlyWin, grid) => {
    resetErrorColors();
    
    let visitedGroup = [];
    const visitedBool = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false));
    const visitedBool1 = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false));
    const visited = [];

    let emptyGroup = [];

    // Checking not filled places
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].active === 0) {
              if (!emptyGroup.includes(grid[y][x].group.split("")[0])) {
                  emptyGroup.push(grid[y][x].group.split("")[0]);
              }

              grid[y][x].color = 'red';
          }
      }
    }
    
    if (emptyGroup.length > 0) {
        setErrorMessage("You still have empty areas");
        setWasError(true);
        return;
    }
    
    // Check if there are areas creating 2x2 fillings
    const checkFoursPromises = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.active === 2) {
            checkFoursPromises.push(checkFours(y, x, onlyWin, grid));
        }
      }
    }

    const results = await Promise.all(checkFoursPromises);
    if (results.some(r => r === true)) return;
 
    let loopsToCheck = [];
    let loopIteration = 0;
    let loopOnce = false;

    // Group areas that are without fillings for later checking of the loops
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (!visitedBool1[y][x]) {
          const cell = grid[y][x];

          if (cell.active === 1) {

          loopsToCheck[loopIteration] ??= [];
          loopsToCheck[loopIteration].push([y, x]);
                        visitedBool1[y][x] = true;

            await groupLoops(y, x, null, loopsToCheck, loopIteration, visitedBool1, grid);
            loopIteration++;
          }
        }
      }
    }

    const directions = [
      { dy: -1, dx: 0 }, { dy: -1, dx: -1 }, { dy: 0, dx: -1 },
      { dy: 1, dx: -1 }, { dy: 1, dx: 0 }, { dy: 1, dx: 1 },
      { dy: 0, dx: 1 }, { dy: -1, dx: 1 },
    ];


    // Removing the loop areas near wall
    var mergedGroups = [];
    var validGroups = [];
    var parents = [];

    for (var i = 0; i < loopsToCheck.length; i++) {
      var group = loopsToCheck[i];
      var isAtWall = false;

      for (var k = 0; k < group.length; k++) {
        var y = group[k][0];
        var x = group[k][1];
        if (y === 0 || x === 0 || y === grid.length - 1 || x === grid[0].length - 1) {
          isAtWall = true;
          break;
        }
      }

      if (!isAtWall) {
        parents.push(validGroups.length);
        validGroups.push(group);
      }
    }

    // Joining near area loops
    for (var i = 0; i < validGroups.length; i++) {
      for (var j = i + 1; j < validGroups.length; j++) {
        if (areGroupsAdjacent(validGroups[i], validGroups[j])) {
          unionGroups(parents, i, j);
        }
      }
}


    var grouped = {};
    for (var i = 0; i < validGroups.length; i++) {
      var parent = findParent(parents, i);
      if (!grouped[parent]) grouped[parent] = [];

      for (var k = 0; k < validGroups[i].length; k++) {
        grouped[parent].push(validGroups[i][k]);
      }
    }

    // Checking if loop groups are actually looped
    for (var key in grouped) {
      var group = grouped[key];

      var groupKeys = {};
      for (var i = 0; i < group.length; i++) {
        var y = group[i][0];
        var x = group[i][1];
        groupKeys[y + "," + x] = true;
      }

      var isLooped = true;
      var outsideNeighbors = [];

      for (var i = 0; i < group.length; i++) {
        var y = group[i][0];
        var x = group[i][1];

        for (var d = 0; d < directions.length; d++) {
          var ny = y + directions[d].dy;
          var nx = x + directions[d].dx;

          if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;

          var keyCoord = ny + "," + nx;

          if (groupKeys[keyCoord]) continue;

          if (grid[ny][nx].active === 1) {
            isLooped = false;
            break;
          } else {
            outsideNeighbors.push({ ny: ny, nx: nx });
          }
        }

        if (!isLooped) break;
      }

      if (isLooped) {
        loopOnce = true;
        for (var n = 0; n < outsideNeighbors.length; n++) {
          var ny = outsideNeighbors[n].ny;
          var nx = outsideNeighbors[n].nx;
          grid[ny][nx].color = "red";
        }
      }
    }

      if (loopOnce && !onlyWin) {
       setErrorMessage("Loop");
       setWasError(true);
       return;
      }

    // Checking if every are is connected
    let z = 0;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (!visitedBool[y][x]) {
          const cell = grid[y][x];
          if (cell.active === 2) {
            visitedGroup[z] = [];
            visited.push([y, x]);
            visitedBool[y][x] = true;
            visitedGroup[z].push(cell.group);

            await checkPath(z, y, x, null, visitedGroup, visited, visitedBool, grid);

            z++; 
          }
        }
      }
    }

    // If there are more then one conneted groups, throw error
    if (visitedGroup.length > 1) {
      var maxLength = 0;
      for (var i = 0; i < visitedGroup.length; i++) {
        if (visitedGroup[i].length > maxLength) {
          maxLength = visitedGroup[i].length;
        }
      }

      var skipped = false;
      var shorterGroups = [];

      for (var j = 0; j < visitedGroup.length; j++) {
        var group = visitedGroup[j];
        if (group.length === maxLength) {
          if (!skipped) {
            skipped = true;
            continue;
          }
        }

        if (group.length < maxLength || (group.length === maxLength && skipped)) {
          shorterGroups.push(group);
        }
      }

        var targetGroups = [];
        for (var i = 0; i < shorterGroups.length; i++) {
          var groupArr = shorterGroups[i];
          for (var j = 0; j < groupArr.length; j++) {
            var groupId = groupArr[j];
            if (targetGroups.indexOf(groupId) === -1) {
              targetGroups.push(groupId);
            }
          }
        }

        for (var y = 0; y < grid.length; y++) {
          for (var x = 0; x < grid[0].length; x++) {
            var cell = grid[y][x];
            if (targetGroups.indexOf(cell.group) !== -1) {
              grid[y][x].color = "red";
            }
          }
        }

        if (!onlyWin) {
        setWasError(true);      
        setErrorMessage("You have not connected areas");
        }
    }

    // Create encoded message key
    if (encodedSecret) {
        const key = grid.map(row =>
        row.map(cell => (cell.active === 2 ? '1' : '0')).join('')
        ).join('').slice(0, 16);
        setKEY(key);
    }
  };

  const checkFours = async (y, x, onlyWin, grid) => {
    const directions = [
      { dy: -1, dx: 0 }, { dy: -1, dx: -1 }, { dy: 0, dx: -1 },
      { dy: 1, dx: -1 }, { dy: 1, dx: 0 }, { dy: 1, dx: 1 },
      { dy: 0, dx: 1 }, { dy: -1, dx: 1 },
    ];

    for (let i = 0; i < directions.length; i += 2) {
      let coords = [[y, x]];
      let detectedFour = 0;
      const dirsToCheck = [directions[i], directions[i + 1], directions[(i + 2) % 8]];

      for (const { dy, dx } of dirsToCheck) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length && grid[ny][nx].active === 2) {
          detectedFour++;
          coords.push([ny, nx]);
        }
      }

      if (detectedFour === 3) {
        for (const [cy, cx] of coords) {
          grid[cy][cx].color = "red";
        }

        if (!onlyWin) {
           setErrorMessage("You have 2x2 areas");
           setWasError(true);

           return true;
        }
      }
    }
    return false;
  };

  const groupLoops = async (y, x, lastDir, loopsToCheck, loopIteration, visitedBool, grid) => {
    const directions = [
      { dy: -1, dx: 0 }, { dy: 0, dx: -1 },
      { dy: 1, dx: 0 }, { dy: 0, dx: 1 }
    ];

    for (let dir = 0; dir < directions.length; dir++) {
      if (lastDir === dir) continue;
      const { dy, dx } = directions[dir];
      const ny = y + dy;
      const nx = x + dx;

      if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
        const nextCell = grid[ny][nx];
        
        if (visitedBool[ny][nx]) continue;
        visitedBool[ny][nx] = true;
        
        if (nextCell.active === 1) {           
            loopsToCheck[loopIteration].push([ny, nx]);
          if (nextCell.group !== grid[y][x].group) {
         
          }

          await groupLoops(ny, nx, (dir + 2) % 4, loopsToCheck, loopIteration, visitedBool, grid);
        }
      }
    }
  };

const checkPath = async (z, y, x, lastDir, visitedGroup, visited, visitedBool, grid) => {
  const directions = [
    { dy: -1, dx: 0 }, { dy: 0, dx: -1 },
    { dy: 1, dx: 0 }, { dy: 0, dx: 1 }
  ];

  for (let dir = 0; dir < directions.length; dir++) {
    if (lastDir === dir) continue;

    const { dy, dx } = directions[dir];
    const ny = y + dy;
    const nx = x + dx;

    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
      const nextCell = grid[ny][nx];

      if (visitedBool[ny][nx]) continue;

      visitedBool[ny][nx] = true;

      if (nextCell.active === 2) {
        visited.push([ny, nx]);

        if (!visitedGroup[z].includes(nextCell.group)) {
          visitedGroup[z].push(nextCell.group);
        }

        await checkPath(z, ny, nx, (dir + 2) % 4, visitedGroup, visited, visitedBool, grid);
      }
    }
  }
};

// Helping functions to group potential looping areas.
function findParent(parents, i) {
  if (parents[i] !== i) {
    parents[i] = findParent(parents, parents[i]);
  }
  return parents[i];
}

function unionGroups(parents, i, j) {
  var parentI = findParent(parents, i);
  var parentJ = findParent(parents, j);
  if (parentI !== parentJ) {
    parents[parentJ] = parentI;
  }
}

// Checking if the looping areas are near each other
function areGroupsAdjacent(groupA, groupB) {
  for (var i = 0; i < groupA.length; i++) {
    var y1 = groupA[i][0];
    var x1 = groupA[i][1];
    for (var j = 0; j < groupB.length; j++) {
      var y2 = groupB[j][0];
      var x2 = groupB[j][1];
      if (Math.abs(y1 - y2) <= 1 && Math.abs(x1 - x2) <= 1) {
        return true;
      }
    }
  }
  return false;
}

  const renderErrorMessage = () => wasError && (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-lg flex justify-between items-center z-50">
      <p className="text-lg">Oh no, you made some mistake. {errorMessage}</p>
      <button onClick={() => setWasError(false)} className="ml-4 bg-white text-red-500 px-3 py-1 rounded hover:bg-gray-200">Ok</button>
    </div>
  );

  return (
    <div>
      <GridEdit
        grid={grid}
        setGrid={setGrid}
        gridRef={gridRef}
        editModeRef={editModeRef}
        borderModeRef={borderModeRef}
        enclosedAreas={enclosedAreas}
        setEnclosedAreas={setEnclosedAreas}
        toggleTile={toggleTile}
        wasError={wasError}
      />
      {renderErrorMessage()}
    </div>
  );
};

export default PlayMode;