import React from 'react';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    const width = 10;
    const height = 10;

    var matrix = Array(height).fill().map(() => Array(width).fill(0));

    this.state = {
      currentMat: matrix,
      currentHead: 0,
      headDirection: null,
      snakeQueue: [],
      foodLoc: 0,
      boardWidth: width,
      boardHeight: height,
      timer: null,
      gameSpeed: 50,
      openBorders: false,
      maxScore: 0,
      hamCycle: [],
      aiRunning: false
    };
  }

  buildHamCycle() {
    let cycle = [0];
    for (let row = 0; row < this.state.boardHeight; row++) {
      if (row % 2 === 0) {
        for (let col = 1; col < this.state.boardWidth; col++) {
          cycle.push(row * this.state.boardWidth + col);
        }
      } else {
        for (let col = this.state.boardWidth - 1; col > 0; col--) {
          cycle.push(row * this.state.boardWidth + col);
        }
      }
    }
    for (let row = this.state.boardHeight - 1; row > 0; row--) {
      cycle.push(row * this.state.boardWidth);
    }
    console.log(cycle);
    return cycle;
  }

  getCycleDistance(dir) {
    const totalBoardSize = this.state.boardWidth * this.state.boardHeight;
    const newSpot = this.getNewPosition(this.state.currentHead, dir);
    // const oldHamIndex = this.state.hamCycle.indexOf(this.state.currentHead);
    const hamFoodIndex = this.state.hamCycle.indexOf(this.state.foodLoc);

    if (newSpot > -1 && newSpot < totalBoardSize) {
      const newSpotHamIndex = this.state.hamCycle.indexOf(newSpot);
      let isValidMove = true;
      const expectedFoodPadding = Math.round(this.state.boardWidth / 2);
      for (let i = 0; i < this.state.snakeQueue.length + expectedFoodPadding; i++) {
        // This for loop checks if this move would doom the snake
        const hamIndexToCheck = (newSpotHamIndex + i) % totalBoardSize;
        const tileToCheck = this.state.hamCycle[hamIndexToCheck];
        const snakeToCheck = this.state.snakeQueue.slice(i < expectedFoodPadding ? 0 : i - expectedFoodPadding);
        // console.log(tileToCheck);
        // console.log(snakeToCheck);
        if (snakeToCheck.includes(tileToCheck)) {
          isValidMove = false;
          break;
        }
      }
      if (isValidMove) {
        // At this point we want to return foodDist
        const foodDist = (hamFoodIndex - newSpotHamIndex + totalBoardSize) % totalBoardSize;
        // console.log(foodDist, dir);
        return foodDist;
      }
    }
    // console.log(totalBoardSize, dir);
    return totalBoardSize;
  }

  getDirectionToFollowHamCycle() {
    const oldHead = this.state.currentHead;
    const oldHamIndex = this.state.hamCycle.indexOf(oldHead);

    const totalBoardSize = this.state.boardWidth * this.state.boardHeight;
    const nextPos = this.state.hamCycle[(oldHamIndex + 1) % totalBoardSize];

    if (this.getNewPosition(oldHead, 'up') === nextPos) {
      return 'up';
    }
    if (this.getNewPosition(oldHead, 'right') === nextPos) {
      return 'right';
    }
    if (this.getNewPosition(oldHead, 'down') === nextPos) {
      return 'down';
    }
    if (this.getNewPosition(oldHead, 'left') === nextPos) {
      return 'left';
    }
  }

  getNextDirection() {
    const totalBoardSize = this.state.boardWidth * this.state.boardHeight;
    const currentDir = this.state.headDirection;

    let minDist = totalBoardSize;
    let bestDir;

    console.log('getNextDirection');
    console.log(this.state);

    if (currentDir !== 'down') {
      const upDist = this.getCycleDistance('up');
      if (upDist < minDist) {
        minDist = upDist;
        bestDir = 'up';
      }
    }

    if (currentDir !== 'left') {
      const upDist = this.getCycleDistance('right');
      if (upDist < minDist) {
        minDist = upDist;
        bestDir = 'right';
      }
    }

    if (currentDir !== 'up') {
      const upDist = this.getCycleDistance('down');
      if (upDist < minDist) {
        minDist = upDist;
        bestDir = 'down';
      }
    }

    if (currentDir !== 'right') {
      const upDist = this.getCycleDistance('left');
      if (upDist < minDist) {
        minDist = upDist;
        bestDir = 'left';
      }
    }

    console.log('bestDir', bestDir);

    if (!bestDir) {
      bestDir = this.getDirectionToFollowHamCycle();
    }

    return bestDir;


  }

  onRunAI() {
    const cycle = this.buildHamCycle();
    this.setState({
      hamCycle: cycle,
      aiRunning: true
    });
    this.onStart();
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  handleKeyDown(e) {
    switch (e.which) {
      case 37: // left
        this.inputHandler('left');
        break;

      case 38: // up
        this.inputHandler('up');
        break;

      case 39: // right
        this.inputHandler('right');
        break;

      case 40: // down
        this.inputHandler('down');
        break;

      default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  }

  inputHandler(newDir) {
    const inputMap = {
      up: 0,
      right: 1,
      down: 2,
      left: 3
    }
    if (inputMap[newDir] % 2 !== inputMap[this.state.headDirection] % 2) {
      // Only react to the key input if the new direction is perpendicular to the current direction
      console.log('change direction', newDir);
      clearInterval(this.state.timer);
      this.setState({
        headDirection: newDir,
        timer: setInterval(() => this.moveSnake(), this.state.gameSpeed)
      });
      this.moveSnake();
    }

  }

  onStart() {
    var newMat = Array(this.state.boardHeight).fill().map(() => Array(this.state.boardWidth).fill(0));
    newMat[0][0] = 1;
    newMat[0][1] = 1;
    var newFoodLoc = Math.random() * this.state.boardWidth * (this.state.boardHeight - 1);
    newFoodLoc = Math.floor(newFoodLoc) + this.state.boardWidth;
    newMat[this.getRow(newFoodLoc)][this.getCol(newFoodLoc)] = 2;

    clearInterval(this.state.timer);

    this.setState({
      timer: setInterval(() => this.moveSnake(), this.state.gameSpeed),
      currentHead: 1,
      headDirection: 'right',
      snakeQueue: [0, 1],
      foodLoc: newFoodLoc,
      currentMat: newMat
    });
  }

  onStop() {
    clearInterval(this.state.timer);
    this.setState({
      timer: null,
      // currentMat: Array(this.state.boardHeight).fill().map(() => Array(this.state.boardWidth).fill(0))
    });
  }

  onBorderRule() {
    const borderRule = this.state.openBorders;
    this.setState({
      openBorders: !borderRule
    });
  }

  moveSnake() {
    let direction = this.state.headDirection;
    if (this.state.aiRunning) {
      direction = this.getNextDirection();
    }

    const nextPos = this.getNewPosition(this.state.currentHead, direction);
    // End if new head is off the board
    if (nextPos < 0 || nextPos >= this.state.boardWidth * this.state.boardHeight) {
      console.log('off board')
      this.gameOver();
      return;
    }
    // Deep copy matrix
    var newMatrix = this.state.currentMat.map(arr => arr.slice());
    // Copy snake queue
    var snake = this.state.snakeQueue.slice();
    // Check if food consumed
    var newFoodLoc = this.state.foodLoc;
    if (this.state.foodLoc === nextPos) {
      // Snake ate food
      newMatrix[this.getRow(nextPos)][this.getCol(nextPos)] = 1;
      snake.push(nextPos);
      newFoodLoc = this.getRandomFoodLoc(snake);
      newMatrix[this.getRow(newFoodLoc)][this.getCol(newFoodLoc)] = 2;
    } else if (newMatrix[this.getRow(nextPos)][this.getCol(nextPos)] === 1) {
      // Snake ran into itself
      console.log('ran into self');
      console.log(this.state);
      console.log(direction);
      console.log(nextPos);
      this.gameOver();
      return;
    } else {
      // Snake went into a legal, empty space
      const snakeEnd = snake.shift();
      newMatrix[this.getRow(snakeEnd)][this.getCol(snakeEnd)] = 0;
      snake.push(nextPos);
      newMatrix[this.getRow(nextPos)][this.getCol(nextPos)] = 1;
    }

    this.setState({
      currentHead: nextPos,
      snakeQueue: snake,
      foodLoc: newFoodLoc,
      currentMat: newMatrix,
      headDirection: direction
    });
  }

  gameOver() {
    console.log('gameOver');
    const score = this.state.snakeQueue.length;
    if (score > this.state.maxScore) {
      this.setState({
        maxScore: score
      });
    }
    this.onStop();
  }

  getRandomFoodLoc(snake) {
    const totalBoardSize = this.state.boardWidth * this.state.boardHeight;
    const possibleSpots = [];
    for (let i = 0; i < totalBoardSize; i++) {
      if (!snake.includes(i)) {
        possibleSpots.push(i);
      }
    }
    const randomIndex = Math.floor(Math.random() * possibleSpots.length);
    return possibleSpots[randomIndex];
  }

  getNewPosition(oldPos, direction) {
    const width = this.state.boardWidth;
    if (direction === 'right') {
      const onEdge = (oldPos + 1) % width === 0;
      if (onEdge) {
        if (this.state.openBorders) {
          // Wrap to other side
          return oldPos + 1 - width;
        } else {
          // Return bad position
          return -1;
        }
      }
      return oldPos + 1;
    }
    if (direction === 'left') {
      const onEdge = oldPos % width === 0;
      if (onEdge) {
        if (this.state.openBorders) {
          // Wrap to other side
          return oldPos + width - 1;
        } else {
          // Return bad position
          return -1;
        }
      }
      return oldPos - 1;
    }
    if (direction === 'up') {
      const onEdge = oldPos - width < 0;
      if (onEdge && this.state.openBorders) {
        console.log(oldPos + ((this.state.boardHeight - 1) * width));
        return oldPos + ((this.state.boardHeight - 1) * width);
      }
      return oldPos - width;
    }
    if (direction === 'down') {
      const onEdge = oldPos >= width * (this.state.boardHeight - 1);
      if (onEdge && this.state.openBorders) {
        return oldPos % width;
      }
      return oldPos + width;
    }
    console.log('Error: getNewPosition was not provided a valid direction.');
  }

  getRow(position) {
    return Math.floor(position / this.state.boardWidth);
  }

  getCol(position) {
    return position % this.state.boardWidth;
  }

  render() {
    var uniqueKey = 0;
    var boxes = this.state.currentMat.map(arr => {
      const elements = arr.map(el => {
        const clsName = 'GridBox' + el;
        uniqueKey++;
        return (<div className={clsName} key={'inside' + uniqueKey}></div>);
      });
      uniqueKey++;
      return (<div className="GridRow" key={'outside' + uniqueKey}>{elements}</div>);
    });
    return (
      <div className="App">
        <header className="App-header">
          <div className="Title">Snake AI</div>
          <div className="GameBoard">
            {boxes}
          </div>
          <div className="Buttons">
            <button className="StartButton ButtonSpace" onClick={() => this.onStart()}>Start</button>
            <button className="StopButton ButtonSpace" onClick={() => this.onStop()}>Stop</button>
            <button className="BorderRule ButtonSpace" onClick={() => this.onBorderRule()}>{this.state.openBorders ? 'Open Borders' : 'Closed Borders'}</button>
            <button className="BorderRule ButtonSpace" onClick={() => this.onRunAI()}>Run AI</button>
          </div>
          <div className="Buttons">
            Max Score: {this.state.maxScore}
          </div>
        </header>

      </div>
    );
  }
}

export default App;
