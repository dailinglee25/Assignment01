const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let brushColor = '#000000';
let brushSize = 5;
let currentTool = 'brush';
let fillMode = true;
let startX = 0, startY = 0;
let savedImageData = null;

const brushBtn = document.getElementById('brush-btn');
const eraserBtn = document.getElementById('eraser-btn');
const rectBtn = document.getElementById('rect-btn');
const circleBtn = document.getElementById('circle-btn');
const triangleBtn = document.getElementById('triangle-btn');
const lineBtn = document.getElementById('line-btn');
const textBtn = document.getElementById('text-btn');
const fillToggleBtn = document.getElementById('fill-toggle-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const downloadBtn = document.getElementById('download-btn');
const imageUpload = document.getElementById('image-upload');
const sizeSlider = document.getElementById('brush-size');
const currentColorBox = document.getElementById('current-color');
const svPicker = document.getElementById('sv-picker');
const svCtx = svPicker.getContext('2d');
const hueBar = document.getElementById('hue-bar');
const hueCtx = hueBar.getContext('2d');
const textInput = document.getElementById('text-input');
const clearBtn = document.getElementById('clear-btn');
const fontSelect = document.getElementById('font-select');
const rainbowBrushBtn = document.getElementById('rainbow-brush-btn');


let hue = 0;
const undoStack = [];
const redoStack = [];

function saveState() {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  redoStack.length = 0;
}

function setTool(tool) {
  currentTool = tool;
  switch (tool) {
    case 'brush':
      canvas.style.cursor = "url('images/brush.png') 0 16, auto";
      break;
    case 'eraser':
      canvas.style.cursor = "url('images/eraser.png') 0 16, auto";
      break;
    case 'rectangle':
      canvas.style.cursor = "url('images/rectangle.png') 0 0, auto";
      break;
    case 'circle':
      canvas.style.cursor = "url('images/circle.png') 2 2, auto";
      break;
    case 'triangle':
      canvas.style.cursor = "url('images/triangle.png') 8 0, auto";
      break;
    case 'line':
      canvas.style.cursor = 'crosshair';
      break;
    case 'text':
      canvas.style.cursor = 'text';
      break;
    case 'rainbow-brush':
      canvas.style.cursor = "crosshair";
      break;
    default:
      canvas.style.cursor = 'default';
  }

  document.querySelectorAll('#toolbar button').forEach(btn => {
    btn.classList.remove('active', 'rainbow-active');
  });
  
  const toolBtnMap = {
    brush: brushBtn,
    eraser: eraserBtn,
    rectangle: rectBtn,
    circle: circleBtn,
    triangle: triangleBtn,
    line: lineBtn,
    text: textBtn,
    'rainbow-brush': rainbowBrushBtn
  };
  
  if (toolBtnMap[tool]) {
    if (tool === 'rainbow-brush') {
      toolBtnMap[tool].classList.add('active', 'rainbow-active');
    } else {
      toolBtnMap[tool].classList.add('active');
    }
  }
}

setTool('brush');

brushBtn.onclick = () => setTool('brush');
eraserBtn.onclick = () => setTool('eraser');
rectBtn.onclick = () => setTool('rectangle');
circleBtn.onclick = () => setTool('circle');
triangleBtn.onclick = () => setTool('triangle');
lineBtn.onclick = () => setTool('line');
textBtn.onclick = () => setTool('text');
rainbowBrushBtn.onclick = () => setTool('rainbow-brush');

fillToggleBtn.onclick = () => {
  fillMode = !fillMode;
  fillToggleBtn.textContent = fillMode ? 'Fill' : 'Stroke';
};

undoBtn.onclick = () => {
  if (undoStack.length > 0) {
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStack.push(current); 
    const prev = undoStack.pop();
    ctx.putImageData(prev, 0, 0);
  }
};

clearBtn.onclick = () => {
  saveState(); 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};



redoBtn.onclick = () => {
  if (redoStack.length > 0) {
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.push(current); 
    const next = redoStack.pop();
    ctx.putImageData(next, 0, 0);
  }
};


canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  startX = e.offsetX;
  startY = e.offsetY;

  if (['rectangle', 'circle', 'triangle', 'line'].includes(currentTool)) {
    savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } else {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const currX = e.offsetX;
  const currY = e.offsetY;

  if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'rainbow-brush') {
    ctx.lineTo(currX, currY);
  
    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (currentTool === 'rainbow-brush') {
      ctx.globalCompositeOperation = 'source-over'; 
      const timeHue = (Date.now() / 10) % 360;
      ctx.strokeStyle = `hsl(${timeHue}, 100%, 50%)`;
    } else {
      ctx.globalCompositeOperation = 'source-over'; 
      ctx.strokeStyle = brushColor;
    }
  
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  
    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    ctx.putImageData(savedImageData, 0, 0);
    ctx.fillStyle = brushColor;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';

    const width = currX - startX;
    const height = currY - startY;

    if (currentTool === 'rectangle') {
      fillMode ? ctx.fillRect(startX, startY, width, height)
               : ctx.strokeRect(startX, startY, width, height);
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(width * width + height * height);
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      fillMode ? ctx.fill() : ctx.stroke();
    } else if (currentTool === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currX, currY);
      ctx.lineTo(startX * 2 - currX, currY);
      ctx.closePath();
      fillMode ? ctx.fill() : ctx.stroke();
    } else if (currentTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currX, currY);
      ctx.stroke();
    }
  }
});
canvas.addEventListener('mouseup', () => {
  if (!drawing) return;
  drawing = false;
  savedImageData = null;
  saveState();
});

canvas.addEventListener('mouseleave', () => {
  drawing = false;
  savedImageData = null;
});

  let textX = 0, textY = 0;

  canvas.addEventListener('click', (e) => {
    if (currentTool !== 'text') return;
  
    textX = e.offsetX;
    textY = e.offsetY;
  
    textInput.style.left = `${canvas.offsetLeft + textX}px`;
    textInput.style.top = `${canvas.offsetTop + textY}px`;
    textInput.style.fontSize = `${brushSize * 2}px`;
    textInput.style.color = brushColor;
    textInput.value = '';
    textInput.style.display = 'block';
    textInput.focus();
  });
  
  textInput.onkeydown = (event) => {
    if (event.key === 'Enter') {
      const selectedFont = fontSelect.value;
      ctx.font = `${brushSize * 2}px ${selectedFont}`;
      ctx.fillStyle = brushColor;
      ctx.fillText(textInput.value, textX, textY);
      textInput.style.display = 'none';
      saveState();
    }
  };
  
sizeSlider.addEventListener('input', () => {
  brushSize = sizeSlider.value;
});

function drawHueBar() {
  const gradient = hueCtx.createLinearGradient(0, 0, 0, hueBar.height);
  gradient.addColorStop(0.0, "red");
  gradient.addColorStop(0.15, "orange");
  gradient.addColorStop(0.3, "yellow");
  gradient.addColorStop(0.45, "green");
  gradient.addColorStop(0.6, "blue");
  gradient.addColorStop(0.75, "indigo");
  gradient.addColorStop(0.9, "violet");
  gradient.addColorStop(1.0, "pink");
  hueCtx.fillStyle = gradient;
  hueCtx.fillRect(0, 0, hueBar.width, hueBar.height);
}
drawHueBar();

function drawSVPanel(hue) {
  const width = svPicker.width;
  const height = svPicker.height;

  const hueGradient = svCtx.createLinearGradient(0, 0, width, 0);
  hueGradient.addColorStop(0, 'white');
  hueGradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
  svCtx.fillStyle = hueGradient;
  svCtx.fillRect(0, 0, width, height);

  const blackGradient = svCtx.createLinearGradient(0, 0, 0, height);
  blackGradient.addColorStop(0, 'rgba(0,0,0,0)');
  blackGradient.addColorStop(1, 'rgba(0,0,0,1)');
  svCtx.fillStyle = blackGradient;
  svCtx.fillRect(0, 0, width, height);
}
drawSVPanel(hue);

hueBar.addEventListener('click', (e) => {
  const y = e.offsetY;
  hue = (y / hueBar.height) * 360;
  drawSVPanel(hue);
});

svPicker.addEventListener('click', (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  const pixel = svCtx.getImageData(x, y, 1, 1).data;
  const [r, g, b] = pixel;
  brushColor = `rgb(${r}, ${g}, ${b})`;
  currentColorBox.style.backgroundColor = brushColor;
});

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    saveState();
  };  
  img.src = URL.createObjectURL(file);
});


downloadBtn.onclick = () => {
  const link = document.createElement('a');
  link.download = 'canvas-drawing.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};


window.onload = () => {
  saveState();
};
