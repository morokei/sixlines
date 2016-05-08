// jshint -W097
'use strict';

var imageNames;
(function() {
  imageNames = [
    'roadsurface',
    'grass',
    'roadline',
    'player'
  ];
  for (var i = 1; i <= 17; i++) {
    imageNames.push('car-' + i);
  }
})();
var images; // {name:image}
var carImages; // [{direct:image,reverse:image},...]

var canvasRoad = document.getElementById('canvasRoad');
var contextRoad = canvasRoad.getContext('2d');

var canvasCars = document.getElementById('canvasCars');
var contextCars = canvasCars.getContext('2d');

var canvasPlayer = document.getElementById('canvasPlayer');
var contextPlayer = canvasPlayer.getContext('2d');

var player;
var playerLocation;
var roundStarted= false;

var carLocations = [];
var cars = [];

var carWidth = 128;
var carHeight = 90;

var k = 2;
var m = 2 * k + 1;

canvasRoad.width  = window.innerWidth;
canvasRoad.height = window.innerHeight;
canvasCars.width  = window.innerWidth;
canvasCars.height = window.innerHeight;
canvasPlayer.width  = window.innerWidth;
canvasPlayer.height = window.innerHeight;

var sceneWidth = canvasRoad.width;
var sceneHeight = canvasRoad.height;
var marginTop = sceneHeight/12;
var roadPart = Math.floor(sceneHeight/9);
var paintedLinesHeight = 4;

/*var range = 150;*/

var score = 0;

var timeoutfired = false;
window.setTimeout(function() {
  timeoutfired = true;
}, 100);

function generateRoad() {
  var y = marginTop;
  var h = paintedLinesHeight;
  var right = true;
  var patterns = [];
  patterns.push(images.roadsurface);
  patterns.push(images.grass);
  patterns.push(images.roadline);
  var roadColors = [2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 2, 0, 2, 0, 2];
  for (var i=0; i < roadColors.length; i++) {
    contextRoad.fillStyle = contextRoad.createPattern(patterns[roadColors[i]],'repeat');
    contextRoad.fillRect(0, y, sceneWidth, h);
    if (roadColors[i] === 2) {
      h = roadPart;
      y = y+paintedLinesHeight;
    }
    else if (roadColors[i] === 0) {
      var carsInit = {};
      carsInit.x = sceneWidth * (right ? 1 : 0) -  carWidth * (right ? -1 : 1);
      carsInit.y = y - carHeight/3;
      carsInit.a = (right ? -1 : 1);
      carsInit.v = k * (right ? -1 : 1);
      k = k+(right ? 1 : -1);
      carLocations.push(carsInit);    
      carsInit.line = carLocations.length - 1;
      h = paintedLinesHeight;
      y = y+roadPart;
    }
    else {
      h = paintedLinesHeight;
      playerLocation = {
        x: (sceneWidth - images.player.width)/2,
        y: y - images.player.height/2,
        line: carLocations.length - 0.5
      };
      y = y + roadPart;
      right = false;  
    }
  }
  contextRoad.fillStyle = 'white';
  contextPlayer.textAlign = 'end';
  contextRoad.fillText(' Car and player images are designed by Freepik.com', 0, sceneHeight - 10);

}

function generatePlayer() {
  player = {
    x: playerLocation.x,
    y: playerLocation.y,
    line: playerLocation.line,
    width:  images.player.width,
    height: images.player.height  
  };  
}

function generateNewCars() {
  var availableLocations = [];
  for (var candidate of carLocations) {
    if (!candidate.lastCar || Math.abs(candidate.lastCar.x - candidate.x) > carWidth){
      availableLocations.push(candidate);
    }
  }
  
  var j = getRandomIntInclusive(0, availableLocations.length - 1);
  var location = availableLocations[j];

  var image = carImages[getRandomIntInclusive(0, carImages.length - 1)];
  var car = {
    start: location,
    image: location.a < 0 ? image.direct : image.reverse,
    x: location.x,
    y: location.y,
    v: location.v,
    location: location
  };
  cars.push(car); 
  location.lastCar = car;
}


function movePlayer(key) {
 
  if (key.code === 'ArrowRight' && player.x <= (sceneWidth - player.width)) {
    player.x += m;
  }
  if (key.code === 'ArrowLeft' && player.x >= 0) {
    player.x -= m;
  }
  if (key.code === 'ArrowUp' && player.line > 0) {
    player.line = Math.ceil(player.line - 1);
    player.y = carLocations[player.line].y;
    roundStarted = true;
  }
  if (key.code === 'ArrowDown' && player.line < carLocations.length - 1) {
    player.line = Math.floor(player.line + 1);
    player.y = carLocations[player.line].y;
    roundStarted = true;
  }
}

function detectCollision(car) {
  if (player.line === car.location.line) {
    if (player.x >= car.x && player.x <= car.x + carWidth - player.width/2) {
      roundStarted = false;
      startRound();
      return true;
    }
  }
  
  return false;
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function startRound() {
  score = 0;
  cars = [];
  for (var location of carLocations) {
    location.lastCar = null;
  }
  generatePlayer();
}

function startTimers() {
  window.setInterval(function() {
    generateNewCars();
  }, 600);
  
  window.setInterval(function() {
    for (var i = cars.length - 1; i >= 0; i--) {
      var car = cars[i];
      car.x += car.v; 
      if (detectCollision(car)) {
        return;
      }
      if (Math.abs(car.x - car.start.x) >= sceneWidth + carWidth * 2) {
        if (car === car.location.lastCar) {
          car.location.lastCar = null;
        }
        cars.splice(i, 1);  
        continue;
      }
    }
    
    if (roundStarted) {
      score++;
    }
  }, 20);
}

function startDrawing() {
  window.requestAnimationFrame(function draw() {
    contextCars.clearRect(0, 0, sceneWidth, sceneHeight);
    for (var car of cars) {
      contextCars.drawImage(car.image, car.x, car.y);
    }
    contextPlayer.clearRect(0, 0, sceneWidth, sceneHeight);
    contextPlayer.drawImage(images.player, player.x, player.y);
    contextPlayer.font = '20px serif';
    contextPlayer.textAlign = 'right';
    contextPlayer.fillStyle = 'white';
    contextPlayer.fillText(score, sceneWidth-20, 20);
    
    window.requestAnimationFrame(draw);
  });
}

function flipImage(image) {
  var flipped = document.createElement('canvas');
  var contextFlip = flipped.getContext('2d');

  contextFlip.translate(image.width, 0);
  contextFlip.scale(-1, 1);
  contextFlip.drawImage(image, 0, 0);
  return flipped;
}

function loadImage(url) {
  var image = new Image();
  image.src = url;
  return new Promise(function (resolve) {
    image.addEventListener('load', function() {
      resolve(image);
    }, false);
  });
}

function loadAllImages() {
  return Promise.all(imageNames.map(function(name) {
    return loadImage('images/' + name + '.png').then(function(image) {
      return { name: name, image: image };
    });
  })).then(function (results) {
    var map = {};
    for (var result of results) {
      map[result.name] = result.image;
    }
    return map;
  });
}

loadAllImages().then(function(loadedImages) {
  images = loadedImages;
  carImages = Object.keys(images)
    .filter(function(name) { return /car-/.test(name); })
    .map(function(name) {
        return { direct: images[name], reverse: flipImage(images[name]) };
    });
    
  generateRoad();
  document.onkeydown = movePlayer;
  startRound();
  startTimers();
  startDrawing();
});


