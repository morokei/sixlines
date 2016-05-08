// jshint -W097
'use strict';

var imageNames;
(function() {
  imageNames = [
    'roadsurface',
    'grass',
    'roadline',
    'mack'
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

var canvasMack = document.getElementById('canvasMack');
var contextMack = canvasMack.getContext('2d');

var mack;
var mackLine = 5/2;
var mackLocationReset;
var roundStarted= false;

var carsLocations = [];
var cars = [];

var carWidth = 128;
var carHeight = 128;

var k = 2;
canvasRoad.width  = window.innerWidth;
canvasRoad.height = window.innerHeight;
canvasCars.width  = window.innerWidth;
canvasCars.height = window.innerHeight;
canvasMack.width  = window.innerWidth;
canvasMack.height = window.innerHeight;

var sceneWidth = canvasRoad.width;
var sceneHeight = canvasRoad.height;
var marginTop = sceneHeight/16;
var roadPart = Math.floor(sceneHeight/8);
var paintedLines = 4;

/*var range = 150;*/
var mackLocation = {};

var score = 0;

var timeoutfired = false;
window.setTimeout(function() {
  timeoutfired = true;
}, 100);

function generateRoad() {
  var y = marginTop;
  var h = paintedLines;
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
      y = y+paintedLines;
    }
    else if (roadColors[i] === 0) {
      var carsInit = {};
      carsInit.x = sceneWidth * (right ? 1 : 0) - (carWidth / 2);
      carsInit.y = y - carHeight/3;
      carsInit.a = (right ? -1 : 1);
      carsInit.v = k * (right ? -1 : 1);
      k = k+(right ? 1 : -1);
      carsLocations.push(carsInit);
      h = paintedLines;
      y = y+roadPart;
    }
    else {
      mack = images.mack;
      mackLocation.y = y - mack.width/2;
      mackLocation.x = (sceneWidth - mack.width)/2;
      contextMack.drawImage(mack, mackLocation.x, mackLocation.y);
      mack = {
        x: mackLocation.x,
        y: mackLocation.y
      };
      console.log(mack.x + ' ' + mack.y);
      mackLocationReset = mack.y;
      h = paintedLines;
      y = y + roadPart;
      right = false;  
    }
  }
}

function generateNewCars() {
  var availableLocations = [];
  for (var candidate of carsLocations) {
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
  location.available = false;
}


function moveMack(key) {
 
  if (key.code === 'ArrowRight') {
    mack.x += 2 * k + 1;
  }
  if (key.code === 'ArrowLeft') {
    mack.x -= 2 * k + 1;
  }
  if (key.code === 'ArrowUp') {
    mackLine = Math.round(mackLine - 1);
    mack.y = carsLocations[mackLine].y;
    roundStarted = true;
  }
  if (key.code === 'ArrowDown') {
    mackLine = Math.floor(mackLine + 1);
    mack.y = carsLocations[mackLine].y;
    roundStarted = true;

  }
  /*canvasMack.width = canvasMack.width;*/
}


function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function startRound() {
  window.setInterval(function() {
    generateNewCars();
  }, 800);
  
  window.setInterval(function() {
    for (var i = cars.length - 1; i >= 0; i--) {
      var car = cars[i];
      car.x += car.v; 

      if (Math.abs(car.x - car.start.x) >= sceneWidth + carWidth * 2) {
        if (car === car.location.lastCar) {
          car.location.lastCar = null;
        }
        cars.splice(i, 1);  
        
        continue;
      }
      
    }
  }, 20);
  
  document.onkeydown = moveMack;
  
  window.requestAnimationFrame(function draw() {
    contextCars.clearRect(0, 0, sceneWidth, sceneHeight);
    for (var car of cars) {
      contextCars.drawImage(car.image, car.x, car.y);
    }
    contextMack.clearRect(0, 0, sceneWidth, sceneHeight);
    contextMack.drawImage(images.mack, mack.x, mack.y);
    contextMack.font = '20px serif';
    contextMack.textAlign = 'right';
    contextMack.fillStyle = 'black';
    contextMack.strokeText(score, sceneWidth-20, 20);
    if (roundStarted) {
      score++;
    }
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
  startRound();
});


