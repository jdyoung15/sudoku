/**
 * @returns {Array} Returns this array with its contents in randomized order
 *
 * Source: https://www.kirupa.com/html5/shuffling_array_js.htm
 */
Array.prototype.shuffle = function() {
    var input = this;
     
    for (var i = input.length-1; i >=0; i--) {
     
        var randomIndex = Math.floor(Math.random()*(i+1)); 
        var itemAtIndex = input[randomIndex]; 
         
        input[randomIndex] = input[i]; 
        input[i] = itemAtIndex;
    }
    return input;
}

var Sudoku = function() {

  // ##################################################
  // Constants
  // ##################################################

  /**
   * The number of rows
   */
  const NUM_ROWS = 9;

  /**
   * The number of columns
   */
  const NUM_COLS = 9;

  /**
   * The total number of squares
   */
  const NUM_SQUARES = NUM_ROWS * NUM_COLS;

  /**
   * The width of a block, in terms of columns
   */
  const BLOCK_WIDTH = 3;

  /**
   * The height of a block, in terms of rows
   */
  const BLOCK_HEIGHT = 3;

  /**
   * The number of blocks in a row of blocks
   */
  const NUM_BLOCKS_PER_ROW = NUM_COLS / BLOCK_WIDTH;

  /**
   * The number of squares in one row of adjacent blocks
   */
  const NUM_SQUARES_PER_ROW_OF_BLOCKS = BLOCK_WIDTH * BLOCK_HEIGHT * NUM_BLOCKS_PER_ROW;

  /**
   * The likelihood that a square will be prefilled with an answer when the game starts
   */
  const DEFAULT_DIFFICULTY_PROBABILITY = 0.5;

  /**
   * The lowest position value for each row 
   */
  const ROW_START_POSITIONS = [0, 9, 18, 27, 36, 45, 54, 63, 72];

  /**
   * The lowest position value for each column
   */
  const COL_START_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  /**
   * The lowest position value for each block
   */
  const BLOCK_START_POSITIONS = [0, 3, 6, 27, 30, 33, 54, 57, 60]; 

  /**
   * The possible answers for a square
   */
  const POSSIBLE_ANSWERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];


  // ##################################################
  // Functions
  // ##################################################

  /**
   * A helper class to keep track of how many squares have been filled
   * in each row, column, and block.
   */
  var GroupSquareCounter = function() {
    const rowCounts = Array(ROW_START_POSITIONS.length).fill(0);
    const colCounts = Array(COL_START_POSITIONS.length).fill(0);
    const blockCounts = Array(BLOCK_START_POSITIONS.length).fill(0);

    function findRowCountIndex(position) {
      return ROW_START_POSITIONS.indexOf(findRowStart(position))
    }

    function findColCountIndex(position) {
      return COL_START_POSITIONS.indexOf(findColStart(position))
    }

    function findBlockCountIndex(position) {
      return BLOCK_START_POSITIONS.indexOf(findBlockStart(position))
    }

    /**
     * @param {Number} position - The position of a square
     * @returns {Number} A numerical value that represents the value of the given position
     */
    function getRank(position) {
      const rowCount = rowCounts[findRowCountIndex(position)];
      const colCount = colCounts[findColCountIndex(position)];
      const blockCount = blockCounts[findBlockCountIndex(position)];
      // The greater the number of squares in the same row/col/block, the lower the ranking
      return -1 * (rowCount + colCount + blockCount);
    }
    
    /**
     * @param {Number} position - The position of a square
     */
    function increment(position) {
      rowCounts[findRowCountIndex(position)]++;
      colCounts[findColCountIndex(position)]++;
      blockCounts[findBlockCountIndex(position)]++;
    }

    return {
      getRank: getRank,
      increment: increment,
    }

  }();

  /**
   * @param {Number} numSquares - The number of squares to generate
   * @param {Number} probability - The likelilhood that a square will be prefilled with an answer
   * @returns {Array} An array, of numSquares length, containing numbers and nulls. The numbers 
   *   represent answered squares, the nulls empty squares. 
   */
  function generateInitialSquares(numSquares, probability) {
    const initialSquares = Array(numSquares).fill(null);
    const answers = generateAnswers(numSquares);

    // initialize array of all 81 positions
    var positions = Array.apply(null, {length: NUM_SQUARES}).map(Number.call, Number).shuffle();

    // calculate number of squares to populate, based on difficulty level
    const numPrefilledSquares = Math.floor(numSquares * probability);

    const NUM_POSITIONS_TO_CONSIDER = 5;

    // for each square to populate:
    for (let i = 0; i < numPrefilledSquares; i++) {
      // "draw" 5-10 random square positions that have not already been populated
      let numSlice = positions.length < NUM_POSITIONS_TO_CONSIDER ? positions.length : NUM_POSITIONS_TO_CONSIDER;
      let possiblePositions = positions.slice(0, numSlice);
      // evaluate rank of each
      let selectedPosition = -1;
      let maxRank = Number.NEGATIVE_INFINITY;
      possiblePositions.forEach(p => {
        let rank = GroupSquareCounter.getRank(p);
        if (rank > maxRank) {
          selectedPosition = p;
          maxRank = rank;
        }
      });

      GroupSquareCounter.increment(selectedPosition);
      initialSquares[selectedPosition] = answers[selectedPosition];
      positions.splice(positions.indexOf(selectedPosition), 1);
      positions = positions.shuffle();
    }

    return initialSquares;
  }


  /**
   * @param {Number} numSquares - The number of answers to generate
   * @returns {Array} An array, of numSquares length, containing numbers representing answered squares
   *
   * Algorithm: https://www.codeproject.com/Articles/23206/Sudoku-Algorithm-Generates-a-Valid-Sudoku-in
   */
  function generateAnswers(numSquares) {
    const answers = Array(numSquares);
    const possibleAnswersBySquare = Array(numSquares).fill(null);
    possibleAnswersBySquare.forEach((possibleAnswer, index, ary) => {
      ary[index] = POSSIBLE_ANSWERS.slice().shuffle();
    });

    let position = 0;
    while (position < numSquares) {
      let possibleAnswers = possibleAnswersBySquare[position]; 

      // If no remaining possible answers for this square, replenish answers and backtrack one square
      if (possibleAnswers.length === 0) {
        possibleAnswersBySquare[position] = POSSIBLE_ANSWERS.slice().shuffle();
        answers[position] = null;
        if (position > 0) position--;
        continue;
      }

      answers[position] = possibleAnswers.pop();
      if (!isValid(position, answers)) {
        answers[position] = null;
        continue;
      }

      position++;
    }
    return answers; 
  }

  /**
   * @param {Number} position - Represents the position of the square containing the answer to be checked
   * @param {Array} squares - An array of numbers representing the squares of the Sudoku board
   * @returns {Boolean} Indicates whether the answer at the given position is valid, given the surrounding squares
   */
  function isValid(position, squares) {
    return findConflictingSquaresForPositions(squares, findSquaresInRow(position)).length === 0
      && findConflictingSquaresForPositions(squares, findSquaresInCol(position)).length === 0
     && findConflictingSquaresForPositions(squares, findSquaresInBlock(position)).length === 0;
  }

  /**
   * @param {Array} squares - An array of numbers representing the squares of the Sudoku board
   * @returns {Array} An array of numbers representing the positions of conflicting squares,
   *   that is, duplicate squares in the same row, column, or block.
   */
  function findConflictingSquares(squares) {
    let conflictingSquares = [];

    ROW_START_POSITIONS.forEach(position => {
      conflictingSquares = conflictingSquares.concat(findConflictingSquaresForPositions(squares, findSquaresInRow(position)));
    });
    COL_START_POSITIONS.forEach(position => {
      conflictingSquares = conflictingSquares.concat(findConflictingSquaresForPositions(squares, findSquaresInCol(position)));
    });
    BLOCK_START_POSITIONS.forEach(position => {
      conflictingSquares = conflictingSquares.concat(findConflictingSquaresForPositions(squares, findSquaresInBlock(position)));
    });

    return Array.from(new Set(conflictingSquares));
  }

  /**
   * @param {Array} squares - An array of numbers representing the squares of the Sudoku board
   * @param {Array} positions - An array of numbers representing a group of squares (e.g. a row, column, or block) 
   *   to be checked for duplicates
   * @returns {Array} An array of numbers representing the positions of conflicting squares
   */
  function findConflictingSquaresForPositions(squares, positions) {
    const conflictingSquares = new Set(); 
    // For each square, compare against the remaining squares and record any duplicates
    positions.forEach((position, index) => {
      let value = squares[position];
      // If value is null, no need to compare against other squares
      if (!value) {
        return;
      }
      let remainingPositions = positions.slice(index + 1);
      remainingPositions.forEach(comparisonPosition => {
        let comparisonValue = squares[comparisonPosition];
        if (!comparisonValue) {
          return;
        }
        
        if (value === comparisonValue) {
          conflictingSquares.add(position);
          conflictingSquares.add(comparisonPosition);
        }
      });
    });

    return Array.from(conflictingSquares);
  }

  /**
   * @param {Number} position - The position of a square
   * @returns {Array} An array of numbers representing all squares in the row of the given square
   */
  function findSquaresInRow(position) {
    const rowPositions = [];
    const start = findRowStart(position);
    for (let i = start; i < start + NUM_COLS; i++) {
      rowPositions.push(i);
    }
    return rowPositions;
  }

  /**
   * @param {Number} position - The position of a square
   * @returns {Number} The lowest position of the squares in the same row as the given square
   */
  function findRowStart(position) {
    return Math.floor(position / NUM_COLS) * NUM_COLS;
  }

  /**
   * @param {Number} position - The position of a square
   * @returns {Array} An array of numbers representing all squares in the column of the given square
   */
  function findSquaresInCol(position) {
    const colPositions = [];
    const start = findColStart(position);
    for (let i = start; i < NUM_SQUARES; i += NUM_COLS) {
      colPositions.push(i);
    }
    return colPositions;
  }

  /**
   * @param {Number} position - The position of a square
   * @returns {Number} The lowest position of the squares in the same column as the given square
   */
  function findColStart(position) {
    return position % NUM_COLS;
  }

  /**
   * @param {Number} position - The position of a square
   * @returns {Array} An array of numbers representing all squares in the 3x3 block of the given square
   */
  function findSquaresInBlock(position) {
    const blockPositions = [];
    const start = findBlockStart(position);
    for (let i = 0; i < BLOCK_WIDTH; i++) {
      for (let j = 0; j < BLOCK_HEIGHT; j++) {
        blockPositions.push((start + i) + (j * NUM_COLS));
      }
    }
    return blockPositions; 
  }

  /**
   * @param {Number} position - The position of a square
   * @returns {Number} The lowest position of the squares in the same block as the given square
   */
  function findBlockStart(position) {
    const startRow = Math.floor(position / NUM_SQUARES_PER_ROW_OF_BLOCKS) * BLOCK_HEIGHT;
    const startCol = Math.floor((position % NUM_COLS) / BLOCK_WIDTH) * BLOCK_WIDTH;
    return startRow * NUM_COLS + startCol;
  }

  /**
   * @param {Array} squares - An array of numbers representing the squares of the Sudoku board
   * @returns {Array} An array of numbers representing the positions of squares that contain an answer
   */
  function findFilledSquares(squares) {
    const filledSquares = [];
    squares.forEach((square, index) => {
      if (square) {
        filledSquares.push(index);
      }
    });
    return filledSquares;
  }

  /**
   * @param {Array} squares - An array of numbers representing the squares of the Sudoku board
   * @returns {Boolean} Indicates whether the game, given its current state, has been won
   */
  function isGameWon(squares) {
    if (squares.includes(null)) {
      return false;
    }

    return findConflictingSquares(squares).length == 0;
  }

  return {
    NUM_ROWS: NUM_ROWS,
    NUM_COLS: NUM_COLS,
    NUM_SQUARES: NUM_SQUARES,
    DEFAULT_DIFFICULTY_PROBABILITY: DEFAULT_DIFFICULTY_PROBABILITY,
    generateInitialSquares: generateInitialSquares,
    findConflictingSquares: findConflictingSquares,
    findFilledSquares: findFilledSquares,
    isGameWon: isGameWon
  }

}();
