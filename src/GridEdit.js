import React, { useRef, useState, useEffect } from 'react';
    import handleCheckGrid from './GridAreas';

const GridEdit = ({
  grid,
  setGrid,
  gridRef,
  editModeRef,
  borderModeRef,
  enclosedAreas,
  setEnclosedAreas,
  toggleTile,
  handleTouchStart,
  handleTouchEnd,
  wasError
}) => {


useEffect(() => {
  if (handleCheckGrid && gridRef.current && setEnclosedAreas) {
      handleCheckGrid(gridRef.current, setEnclosedAreas) 
  }
}, []);

  const [mouseDown, setMouseDown] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const svgRef = useRef();
  const cellRefs = useRef({}); // Referencje do komórek
  const borderRefs = useRef({}); // Referencje do granic

  const updateBorderVisual = (row, col, orientation, borderValue) => {
    const key = orientation === 0 ? `h-${row}-${col}` : `v-${row}-${col}`;
    const ref = borderRefs.current[key];
    if (!ref) return;

    const stroke = borderValue === 1 ? 'gray' : borderValue === 2 ? 'black' : 'transparent';
    const width = borderValue === 1 ? 3 : borderValue === 2 ? 6 : 0;

    ref.setAttribute("stroke", stroke);
    ref.setAttribute("stroke-width", width);
  };

  const updateGridBorders = (row, col, isAdding, orientation) => {
    const grid = gridRef.current;
    const borderValue = isAdding
      ? { hard: 2, soft: 1 }[borderModeRef.current] || 0
      : 0;

    if (orientation === 0) {
      grid[row][col].borders.right = borderValue;
      if (grid[row][col + 1]) grid[row][col + 1].borders.left = borderValue;
    } else {
      grid[row][col].borders.bottom = borderValue;
      if (grid[row + 1]) grid[row + 1][col].borders.top = borderValue;
    }

    updateBorderVisual(row, col, orientation, borderValue);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (!editModeRef.current) return;

    setMouseDown(true);
    const { row, col, type } = getBorderCoordinates(e);

    if (type === "horizontal" && col >= 0 && col < grid[0].length - 1) {
      const isAdding = grid[row][col].borders.right === 0;
      setDrawingMode(isAdding ? "add" : "remove");
      updateGridBorders(row, col, isAdding, 0);
    }

    if (type === "vertical" && row >= 0 && row < grid.length - 1) {
      const isAdding = grid[row][col].borders.bottom === 0;
      setDrawingMode(isAdding ? "add" : "remove");
      updateGridBorders(row, col, isAdding, 1);
    }
  };

  const handleMouseMove = (e) => {
    if (!mouseDown || !editModeRef.current) return;

    const { row, col, type } = getBorderCoordinates(e);

    if (type === "horizontal" && col >= 0 && col < grid[0].length - 1) {
      const shouldUpdate =
        (drawingMode === "add" && grid[row][col].borders.right === 0) ||
        (drawingMode === "remove" && grid[row][col].borders.right !== 0);
      if (shouldUpdate) updateGridBorders(row, col, drawingMode === "add", 0);
    }

    if (type === "vertical" && row >= 0 && row < grid.length - 1) {
      const shouldUpdate =
        (drawingMode === "add" && grid[row][col].borders.bottom === 0) ||
        (drawingMode === "remove" && grid[row][col].borders.bottom !== 0);
      if (shouldUpdate) updateGridBorders(row, col, drawingMode === "add", 1);
    }
  };

  const handleMouseUp = () => {
    if (!editModeRef.current) return;

    handleCheckGrid(gridRef.current, setEnclosedAreas);
    setMouseDown(false);
    setDrawingMode(null);
  };

  const getBorderCoordinates = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let col = Math.floor(x / 50);
    let row = Math.floor(y / 50);

    const xOffset = x % 50;
    const yOffset = y % 50;

    if (xOffset < 6 && yOffset > 15 && yOffset < 35) {
      col--;
      return { row, col, type: "horizontal" };
    } else if (xOffset > 46 && yOffset > 15 && yOffset < 35) {
      return { row, col, type: "horizontal" };
    } else if (yOffset < 6 && xOffset > 15 && xOffset < 35) {
      row--;
      return { row, col, type: "vertical" };
    } else if (yOffset > 46 && xOffset > 15 && xOffset < 35) {
      return { row, col, type: "vertical" };
    }

    return { row, col, type: "none" };
  };

const renderSquaresAndBorders = (grid) => {
  const elements = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      elements.push(
        <rect
          ref={(el) => (cellRefs.current[`square-${row}-${col}`] = el)}
          key={`square-${row}-${col}`}
          x={col * 50}
          y={row * 50}
          width={50}
          height={50}
          fill={
            grid[row][col].color === "red" && wasError
              ? "blue"
              : grid[row][col].active === 3
              ? "gray"
              : grid[row][col].active === 2
              ? "black"
              : grid[row][col].active === 1
              ? "green"
              : "white"
          }
          onMouseDown={(e) => toggleTile(row, col, e)}
          onTouchStart={() => handleTouchStart(row, col)}
          onTouchEnd={() => handleTouchEnd(row, col)}
          onContextMenu={(e) => e.preventDefault()}
        />
      );

      // Right border
      if (col < grid[0].length - 1) {
        elements.push(
          <line
            key={`h-border-${row}-${col}`}
            ref={(el) => (borderRefs.current[`h-${row}-${col}`] = el)}
            x1={(col + 1) * 50}
            y1={row * 50}
            x2={(col + 1) * 50}
            y2={(row + 1) * 50}
            stroke={
              grid[row][col].borders.right === 1
                ? "gray"
                : grid[row][col].borders.right === 2
                ? "black"
                : "transparent"
            }
            strokeWidth={
              grid[row][col].borders.right === 1
                ? 3
                : grid[row][col].borders.right === 2
                ? 6
                : 0
            }
          />
        );
      }

      // Bottom border
      if (row < grid.length - 1) {
        elements.push(
          <line
            key={`v-border-${row}-${col}`}
            ref={(el) => (borderRefs.current[`v-${row}-${col}`] = el)}
            x1={(col - 0.025) * 50}
            y1={(row + 1) * 50}
            x2={(col + 1) * 50}
            y2={(row + 1) * 50}
            stroke={
              grid[row][col].borders.bottom === 1
                ? "gray"
                : grid[row][col].borders.bottom === 2
                ? "black"
                : "transparent"
            }
            strokeWidth={
              grid[row][col].borders.bottom === 1
                ? 3
                : grid[row][col].borders.bottom === 2
                ? 6
                : 0
            }
          />
        );
      }
    }
  }

  gridRef.current = grid;
  return elements;
};

  const renderDots = () => {
    const dotElements = [];
    for (let row = 0; row < grid.length - 1; row++) {
      for (let col = 0; col < grid[0].length - 1; col++) {
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

  return (
    <svg
      ref={svgRef}
      width={grid[0].length * 50}
      height={grid.length * 50}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="border-4 border-black"
      id="grid-svg"
    >
      {renderSquaresAndBorders(grid)}
      {editModeRef.current && renderDots()}
    </svg>
  );
};

export default GridEdit;