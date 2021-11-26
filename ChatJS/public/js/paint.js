let canvas;
let stroke_color;
let stroke_weight;
let colorInput = document.querySelector('#color');
let weight = document.querySelector('#weight');

function drawOnDrag() {
	  let stroke_color = colorInput.value;
	  let stroke_weight = weight.value;
	  strokeWeight(stroke_weight);
	  stroke(stroke_color);
	  line(mouseX, mouseY, pmouseX, pmouseY);
	  let line_data = {
		    "x1": mouseX,
		    "y1": mouseY,
		    "x2": pmouseX,
		    "y2": pmouseY,
		    "weight": stroke_weight,
		    "color": stroke_color
	  }
    socket.emit('draw_event', line_data);
}

function drawOnClick() {
	  let stroke_color = colorInput.value;
	  let stroke_weight = weight.value;
	  strokeWeight(stroke_weight);
	  stroke(stroke_color);
	  line(mouseX, mouseY, mouseX, mouseY);
	  let line_data = {
		    "x1": mouseX,
		    "y1": mouseY,
		    "x2": mouseX,
		    "y2": mouseY,
		    "weight": stroke_weight,
		    "color": stroke_color
	  }
    socket.emit('draw_event', line_data);
}

function setup() {
	  canvas = createCanvas(windowWidth, windowHeight);
	  socket.on('draw_data', drawReceivedData);
	  canvas.parent('draw-window');
}

function drawReceivedData(data) {
	  strokeWeight(data.weight);
	  stroke(data.color);
	  line(data.x1, data.y1, data.x2, data.y2)
}