async function handleCheckGrid(grid, setEnclosedAreas) {
  const result = await findClosedAreas(grid);
  setEnclosedAreas(result.enclosedAreasCount);
}

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

  return {
    enclosedAreasCount: enclosedAreasCounter
  };
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

export default handleCheckGrid;