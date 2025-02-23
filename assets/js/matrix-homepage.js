var canvas = document.getElementById('matrix-canvas');
ctx = canvas.getContext('2d');

var letters = 'ABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZ';
letters = letters.split('');

// Setting up the columns
var fontSize = 18,
  columns = canvas.width / fontSize;

// Setting up the drops
var drops = [];

function resize() {
  canvas.height = document.documentElement.scrollHeight;
  canvas.width = canvas.offsetWidth;
  ncolumns = Math.ceil(canvas.width / fontSize);
  //firefox mobile specific tweak
  if (Math.abs(columns - ncolumns) > 1) {
    columns = ncolumns;
    for (var i = 0; i < columns; i++) {
      drops[i] = 1;
    }
  }
  //console.log(document.documentElement.scrollHeight, canvas.offsetWidth, columns)
}

// Setting up the draw function
function draw() {
  ctx.fillStyle = 'rgba(0, 0, 0, .1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < drops.length; i++) {
    var text = letters[Math.floor(Math.random() * letters.length)];
    ctx.fillStyle = 'rgb(255, 165, 0)';
    //ctx.fillStyle = '#0f0';
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > .95) {
      drops[i] = 0;
    }
  }
}

resize()
setInterval(draw, 33);

window.onresize = function () {
  resize()
}

function rot13(message) {
  return message.replace(/[a-z]/gi, letter => String.fromCharCode(letter.charCodeAt(0) + (letter.toLowerCase() <= 'm' ? 13 : -13)));
} 

function changeEmail() {
  document.getElementById("email-addr").innerText =  rot13("pbagnpg@ghkyh.se") 
}

setTimeout(changeEmail, 100)