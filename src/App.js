import React from 'react';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    const width = 20;
    const height = 20;

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
      gameSpeed: 200,
      openBorders: false,
      maxScore: 0
    };
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
      currentMat: Array(this.state.boardHeight).fill().map(() => Array(this.state.boardWidth).fill(0))
    });
  }

  onBorderRule() {
    const borderRule = this.state.openBorders;
    this.setState({
      openBorders: !borderRule
    });
  }

  moveSnake() {
    const newHead = this.getNewPosition(this.state.currentHead, this.state.headDirection);
    // End if new head is off the board
    if (newHead < 0 || newHead >= this.state.boardWidth * this.state.boardHeight) {
      this.gameOver();
      return;
    }
    // Deep copy matrix
    var newMatrix = this.state.currentMat.map(arr => arr.slice());
    // Copy snake queue
    var snake = this.state.snakeQueue.slice();
    // Check if food consumed
    var newFoodLoc = this.state.foodLoc;
    if (this.state.foodLoc === newHead) {
      // Snake ate food
      newMatrix[this.getRow(newHead)][this.getCol(newHead)] = 1;
      snake.push(newHead);
      newFoodLoc = this.getRandomFoodLoc(snake);
      newMatrix[this.getRow(newFoodLoc)][this.getCol(newFoodLoc)] = 2;
    } else if (newMatrix[this.getRow(newHead)][this.getCol(newHead)] === 1) {
      // Snake ran into itself
      this.gameOver();
      return;
    } else {
      // Snake went into a legal, empty space
      const snakeEnd = snake.shift();
      newMatrix[this.getRow(snakeEnd)][this.getCol(snakeEnd)] = 0;
      snake.push(newHead);
      newMatrix[this.getRow(newHead)][this.getCol(newHead)] = 1;
    }

    this.setState({
      currentHead: newHead,
      snakeQueue: snake,
      foodLoc: newFoodLoc,
      currentMat: newMatrix
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
    var randomLoc = Math.floor(Math.random() * this.state.boardWidth * this.state.boardHeight);
    while (snake.includes(randomLoc)) {
      randomLoc = Math.floor(Math.random() * this.state.boardWidth * this.state.boardHeight);
    }
    return randomLoc;
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
