/*
 * Node class to be used in the tree structure
 * each node has zero or one parent and zero or more children
 */

class PositionNode {
  constructor(position) {
    this.position = position;
    this.parent = null;
    this.children = [];
  }

  setParent(parent) {
    this.parent = parent;
  }

  addChild(child) {
    this.children.push(child);
  }
}

/*
 * KnightPathfinder class to do the actual pathfinding
 * each position on the board is marked as a tuple [x, y] representing row and column number
 */

class KnightPathfinder {
  constructor(startPosition) {
    if (!this._isValidPosition(startPosition))
      throw new Error(`Invalid board position: ${startPosition}`);

    this._rootNode = new PositionNode(startPosition);
    this._positionsAlreadyConsidered = [startPosition];
    this._buildMoveTree();
  }

  findShortestPath(endPosition) {
    if (!this._isValidPosition(endPosition))
      throw new Error(`Invalid board position: ${endPosition}`);

    if (this._comparePositions(this._rootNode.position, endPosition)) return;

    // Run a breadth-first search along the tree to find shortest path to end position
    let queue = [...this._rootNode.children];

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (this._comparePositions(currentNode.position, endPosition)) {
        // Found it!
        const path = this._tracePath(currentNode);
        return path;
      }
      queue = queue.concat(currentNode.children);
    }
  }

  _tracePath(currentNode) {
    // Trace a path backwards from node to root
    const path = [currentNode.position];
    while (currentNode.parent !== null) {
      currentNode = currentNode.parent;
      path.push(currentNode.position);
    }
    // Return reversed path, from root to end
    return path.reverse();
  }

  _buildMoveTree() {
    // Create a tree with all possible moves from root position without repeating positions on the board
    const queue = [this._rootNode];

    while (queue.length > 0) {
      // Get current position from the queue and generate all of its possible next moves
      const currentNode = queue.shift();
      const possibleNextMoves = this._generatePossibleMoves(
        currentNode.position
      );

      possibleNextMoves.forEach((move) => {
        // Check that we're not repeating positions we've already considered
        if (
          this._positionsAlreadyConsidered.find((position) =>
            this._comparePositions(position, move)
          )
        ) {
          return;
        } else {
          this._positionsAlreadyConsidered.push(move);
        }

        // Create a new position node for possible next move, add it as a child of the current position node
        const nextPositionNode = new PositionNode(move);
        currentNode.addChild(nextPositionNode);
        nextPositionNode.setParent(currentNode);

        // Push next position to the queue to be iterated on and generate its own possible unique moves next...
        queue.push(nextPositionNode);
      });
    }
  }

  _isValidPosition(position) {
    // Check if position is a tuple containing valid coordinates
    if (position.length !== 2) return false;
    const x = position[0];
    const y = position[1];
    return x >= 0 && x <= 9 && y >= 0 && y <= 9;
  }

  _comparePositions(pos1, pos2) {
    // Helper function given that we can't directly compare arrays
    return pos1[0] === pos2[0] && pos1[1] === pos2[1];
  }

  _generatePossibleMoves(position) {
    const x = position[0];
    const y = position[1];

    // In chess the Knight piece can move 2 steps on one plane + 1 step on the other plane in any direction
    const possibleMoves = [
      [x + 2, y + 1],
      [x + 2, y - 1],
      [x - 2, y + 1],
      [x - 2, y - 1],
      [x + 1, y + 2],
      [x + 1, y - 2],
      [x - 1, y + 2],
      [x - 1, y - 2],
      // Filter illegal moves (moves that go beyond the borders of the board)
    ].filter((possibleMove) => this._isValidPosition(possibleMove));

    return possibleMoves;
  }
}

/*
 * App interface
 */

class Interface {
  constructor() {
    this._board = document.getElementById("board");
    this._message = document.getElementById("message");

    // Properties to be assigned later
    this._startingPoint = null;
    this._endingPoint = null;
    this._pathfinder = null;
    this._path = null;

    // Bind 'this' context to event handlers
    this._startingPointClickHandler = this._startingPointClickHandler.bind(this);
    this._endingPointClickHandler = this._endingPointClickHandler.bind(this);
  }

  renderBoard() {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i <= 9; i++) {
      // new row
      const row = document.createElement("tr");

      for (let j = 0; j <= 9; j++) {
        // columns
        const rowNumber = 9 - i;
        const colNumber = j;
        const square = document.createElement("td");
        square.classList.add("square");
        square.id = `${colNumber}-${rowNumber}`;
        row.appendChild(square);
      }

      fragment.appendChild(row);
    }

    this._board.appendChild(fragment);
  }

  _renderPath() {
    // Iterate over path excluding starting point
    for (let i = 1; i < this._path.length; i++) {
      const idString = this._idStringFromPosition(this._path[i]);
      const square = document.getElementById(idString);
      square.classList.add("active");
      square.innerText = i;
    }
  }

  setStartingPoint() {
    this._message.innerText = "Choose a starting point";
    // Add one event listener to parent instead of adding one to each individual square
    this._board.addEventListener("click", this._startingPointClickHandler);
  }

  _setEndingPoint() {
    this._message.innerText = "Choose an ending point";
    this._board.addEventListener("click", this._endingPointClickHandler);
  }

  _startingPointClickHandler(event) {
    const { target } = event;
    // Check that the user clicked on a square rather than a part of the board itself (like the border)
    if (target.id === "board") return;

    // Parse position
    this._startingPoint = this._parsePosition(target.id);

    // Add starting position status to clicked square
    target.classList.add("start");
    target.innerText = "O";

    // Remove event listener
    this._board.removeEventListener("click", this._startingPointClickHandler);

    // Initialize new pathfinder instance
    this._pathfinder = new KnightPathfinder(this._startingPoint);

    this._setEndingPoint();
  }

  _endingPointClickHandler(event) {
    const { target } = event;

    if (target.id === "board") return;

    this._endingPoint = this._parsePosition(target.id);

    // Remove event listener
    this._board.removeEventListener("click", this._endingPointClickHandler);

    // Get shortest path and render it
    this._path = this._pathfinder.findShortestPath(this._endingPoint);
    this._message.innerText = `Completed in ${this._path.length - 1} steps`;
    this._renderPath();
  }

  _parsePosition(idString) {
    return idString.split("-").map((num) => parseInt(num));
  }

  _idStringFromPosition(position) {
    return position.join("-");
  }
}

/*
 * Initialize app
 */

document.addEventListener("DOMContentLoaded", () => {
  const interface = new Interface();
  interface.renderBoard();
  interface.setStartingPoint();
});
