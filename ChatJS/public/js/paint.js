//let canvas;

const canvas = document.querySelector("#workspace");

const colorInput = document.querySelector('#color');
const weight = document.querySelector('#weight');
let stroke_color = colorInput.value;
let stroke_weight = weight.value;



canvas.width = 950;
canvas.height = 600;
let background = "white";
let backgroundColor = "white";
let isDrawing = false;
let drawWidth = 10;
let drawColor = "black";
let arrImg = [];
let indexDraw = -1;
const ctx = canvas.getContext('2d');
ctx.fillStyle = background;
ctx.fillRect(0, 0, canvas.width, canvas.height);
canvas.addEventListener("mousedown", start, false);
canvas.addEventListener("mousemove", draw, false);
canvas.addEventListener("mouseup", end, false);
canvas.addEventListener("mouseover", end, false);

function start(e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;
    socket.emit('startDraw', {
        isDrawing: true,
        x,
        y
    });
    e.preventDefault();
}

function draw(e) {
    if (isDrawing) {
        ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
        const x = e.clientX - canvas.offsetLeft;
        const y = e.clientY - canvas.offsetTop;
        let stroke_weight = weight.value;
        ctx.lineWidth = stroke_weight;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        let stroke_color = colorInput.value;
        ctx.strokeStyle = colorInput.value;
        socket.emit('Drawing', {
            isDrawing: true,
            x,
            y,
            stroke_color,
            stroke_weight
        });
    }
    e.preventDefault();
}

function end(e) {
    if (isDrawing) {
        ctx.closePath();
        indexDraw += 1;
        arrImg.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        isDrawing = false;
        socket.emit('stopDraw', {
            isDrawing,
            indexDraw,
        })
    }
    e.preventDefault();
}

// clear canvas
const buttonClearElement = document.querySelector("#clear-button");

buttonClearElement.addEventListener("click", clearr);

function clearr() {
    ctx.fillStyle = background;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawColor = "black";
    socket.emit('clear', {
        backgroundColor,
        drawColor
    });
}

// get color for 
// const drawColor = document.querySelectorAll(".color");

// drawColor.forEach(element => {
//     element.addEventListener("click", switchColor);
// })

// function switchColor(event) {
//     drawColor = event.target.style.backgroundColor;
// }

// change size pen to draw
// const size = document.querySelector(".size-pen");

// size.addEventListener("change", changeSize);

// function changeSize(event) {
//     drawWidth = event.target.value;
// }

// undo draw handle
// const buttonUndoElement = document.querySelector(".button-undo");

// buttonUndoElement.addEventListener("click", undo);

// function undo() {
//     if (indexDraw > 0) {
//         arrImg.pop();
//         indexDraw -= 1;
//         const image = arrImg[indexDraw];
//         ctx.putImageData(image, 0, 0);
//         socket.emit('undo', {
//             indexDraw,
//             image,
//         })
//     } else {
//         clear();
//     }
// }
let socketId = null;
socket.on('getInstanceId', (res) => {
    socketId = res.id
});

socket.on('startFromServer', (res) => {
    console.log(res.id, socketId)
    if (res.id !== socketId) {
        ctx.beginPath();
        ctx.moveTo(res.x, res.y);
    }
});

socket.on('drawingFromServer', (res) => {
    if (res.id !== socketId) {
        ctx.lineTo(res.x, res.y);
        ctx.lineWidth = res.stroke_weight;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.strokeStyle = res.stroke_color;
    }
});
socket.on('stopFromServer', (res) => {
    if (res.isDrawing) {
        ctx.closePath();
        res.isDrawing = false;
    }
});
socket.on('clearFromServer', res => {
    ctx.fillStyle = res.backgroundColor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawColor = res.drawColor;
});
// function drawOnDrag() {
//     let stroke_color = colorInput.value;
//     let stroke_weight = weight.value;
//     strokeWeight(stroke_weight);
//     stroke(stroke_color);
//     line(mouseX, mouseY, pmouseX, pmouseY);
//     let line_data = {
//         "x1": mouseX,
//         "y1": mouseY,
//         "x2": pmouseX,
//         "y2": pmouseY,
//         "weight": stroke_weight,
//         "color": stroke_color
//     }
//     socket.emit('draw_event', line_data);
// }

// function drawOnClick() {
//     let stroke_color = colorInput.value;
//     let stroke_weight = weight.value;
//     strokeWeight(stroke_weight);
//     stroke(stroke_color);
//     line(mouseX, mouseY, mouseX, mouseY);
//     let line_data = {
//         "x1": mouseX,
//         "y1": mouseY,
//         "x2": mouseX,
//         "y2": mouseY,
//         "weight": stroke_weight,
//         "color": stroke_color
//     }
//     socket.emit('draw_event', line_data);
// }

// function setup() {
//     canvas = createCanvas(windowWidth, windowHeight);
//     socket.on('draw_data', drawReceivedData);
//     canvas.parent('draw-window');
// }

// function drawReceivedData(data) {
//     strokeWeight(data.weight);
//     stroke(data.color);
//     line(data.x1, data.y1, data.x2, data.y2)
// }