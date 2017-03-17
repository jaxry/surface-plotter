export default function({rows, columns, orderFlip}) {
  const squareRows = rows - 1;
  const squareColumns = columns - 1;

  const uv = new Float32Array(2 * rows * columns);
  const elements = new Uint32Array(6 * squareRows * squareColumns);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      let u = j / squareColumns;
      let v = i / squareRows;
      const start = 2 * (columns * i + j);
      uv[start + 0] = u;
      uv[start + 1] = v;
    }
  }

  for (let i = 0; i <= squareRows; i++) {
    for (let j = 0; j <= squareColumns; j++) {
      const i0 = i, i1 = i + 1;
      const j0 = j, j1 = j + 1;
      
      const topLeft = columns * i0 + j0;
      const topRight = columns * i0 + j1;
      const bottomLeft = columns * i1 + j0;
      const bottomRight = columns * i1 + j1;

      const start = orderFlip ? 
        6 * (i + squareRows * j) : 
        6 * (squareColumns * i + j);
        
      if (i % 2 === j % 2) {
        elements[start] = bottomLeft;
        elements[start + 1] = bottomRight;
        elements[start + 2] = topLeft;
        elements[start + 3] = topLeft;
        elements[start + 4] = bottomRight;
        elements[start + 5] = topRight;
      }
      else {
        elements[start] = topLeft;
        elements[start + 1] = bottomLeft;
        elements[start + 2] = topRight;
        elements[start + 3] = bottomRight;
        elements[start + 4] = topRight;
        elements[start + 5] = bottomLeft;
      }
    }
  }
  return {uv, elements};
}