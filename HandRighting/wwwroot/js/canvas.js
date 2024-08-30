let canvas = document.getElementById('handwritingCanvas');
let context = canvas.getContext('2d');

let offScreenCanvas = document.createElement('canvas');
let offScreenContext = offScreenCanvas.getContext('2d');

offScreenCanvas.width = 5000;
offScreenCanvas.height = 5000;

let drawing = false;
let scale = 1;
let panX = 0, panY = 0;
let startX = 0, startY = 0;
let isPanning = false;
let isPinching = false;
let fingerCount = 0;
let drawingActions = [];

document.addEventListener('DOMContentLoaded', function () {
    let drawingData = document.getElementById("drawingData");
    if (drawingData) {
        console.log(drawingData.value);
        drawingActions = JSON.parse(drawingData.value);
        drawingActions.forEach(action => {
            if (action.type === 'beginPath') {
                offScreenContext.beginPath();
                offScreenContext.moveTo(action.x, action.y);
            } else if (action.type === 'lineTo') {
                offScreenContext.lineTo(action.x, action.y);
                offScreenContext.strokeStyle = "black";
                offScreenContext.lineWidth = action.lineWidth;
                offScreenContext.stroke();
            }

            redrawCanvas();
        })

        redrawCanvas();
    } else {
        console.log("no Drawing Data");
    }
});

canvas.addEventListener('pointerdown', (event) => startDrawing(event));
canvas.addEventListener('pointerup', (event) => stopDrawing(event));
canvas.addEventListener('pointerout', (event) => stopDrawing(event));
canvas.addEventListener('pointermove', (event) => draw(event));

// Handle zooming with mouse wheel only
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    // Calculate new scale
    const zoomIntensity = 0.1;
    const wheel = event.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity);

    // Adjust the scale and pan to focus on the cursor
    const mouseX = (event.clientX - canvas.offsetLeft - panX) / scale;
    const mouseY = (event.clientY - canvas.offsetTop - panY) / scale;

    panX -= mouseX * (zoom - 1);
    panY -= mouseY * (zoom - 1);

    scale *= zoom;

    redrawCanvas();
});

function startDrawing(event) {
    if ((event.pointerType === 'mouse' && event.ctrlKey) || (event.pointerType === 'touch' && !isPinching)) {
        startX = event.clientX - panX;
        startY = event.clientY - panY;
        isPanning = true;
        console.log("start pan");
    } else if (event.pointerType === 'mouse' && !event.ctrlKey || event.pointerType === 'pen') {
        drawing = true;
        offScreenContext.beginPath();
        offScreenContext.moveTo(
            (event.clientX - canvas.offsetLeft - panX) / scale,
            (event.clientY - canvas.offsetTop - panY) / scale
        );
        let action = {
            type: 'beginPath',
            x: (event.clientX - canvas.offsetLeft - panX) / scale,
            y: (event.clientY - canvas.offsetTop - panY) / scale
        }
        drawingActions.push(action);
        console.log("start");
        //console.log(drawingActions);
    }
    fingerCount++;
    event.preventDefault();
}

function stopDrawing(event) {
    if ((event.pointerType === 'mouse' && event.ctrlKey) || (event.pointerType === 'touch' && fingerCount == 1)) {
        isPanning = false;
        console.log("end pan");
    } else if (event.pointerType === 'pen' || event.pointerType === 'mouse') {
        drawing = false;
        offScreenContext.closePath();
        console.log("stop");
    }
    event.preventDefault();
    fingerCount--;
}

function draw(event) {
    if (isPanning && !isPinching && ((event.pointerType === 'mouse' && event.ctrlKey) || (event.pointerType === 'touch'))) {
        panX = event.clientX - startX;
        panY = event.clientY - startY;
        redrawCanvas();
        console.log("panning");
    } else if (drawing && (event.pointerType === 'pen' || event.pointerType === 'mouse')) {
        offScreenContext.lineTo(
            (event.clientX - canvas.offsetLeft - panX) / scale,
            (event.clientY - canvas.offsetTop - panY) / scale
        );
        offScreenContext.strokeStyle = "black";
        offScreenContext.lineWidth = event.pressure > 0 ? event.pressure * 5 : 2;
        offScreenContext.stroke();

        let action = {
            type: 'lineTo',
            x: (event.clientX - canvas.offsetLeft - panX) / scale,
            y: (event.clientY - canvas.offsetTop - panY) / scale,
            lineWidth: event.pressure > 0 ? event.pressure * 5 : 2
        };
        drawingActions.push(action);
        // console.log(drawingActions);
        redrawCanvas();
    }
}

// Handle pinch zooming
canvas.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
        isPinching = true;
        lastDistance = getDistance(event.touches[0], event.touches[1]);
    }
});

canvas.addEventListener('touchmove', (event) => {
    if (isPinching && event.touches.length === 2) {
        event.preventDefault();
        let currentDistance = getDistance(event.touches[0], event.touches[1]);
        let zoom = currentDistance / lastDistance;

        const touchCenterX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const touchCenterY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        const mouseX = (touchCenterX - canvas.offsetLeft - panX) / scale;
        const mouseY = (touchCenterY - canvas.offsetTop - panY) / scale;

        scale *= zoom;
        panX -= mouseX * (zoom - 1);
        panY -= mouseY * (zoom - 1);

        lastDistance = currentDistance;

        redrawCanvas();
    }
});

canvas.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) {
        isPinching = false;
    }
    /*
    if (event.touches.length === 0) {
        isPanning = false;
    }
    */
});

// Helper function to calculate distance between two touch points
function getDistance(touch1, touch2) {
    return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
}

// Helper function to calculate the center point between two touch points
function getTouchCenter(touches) {
    return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
    };
}

function clearCanvas() {
    offScreenContext.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);

    // Optional resetting of scale and panning
    /*
    scale = 1;
    panX = canvas.width / 2;
    panY = canvas.height / 2;
    */

    redrawCanvas();
}

function redrawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(panX, panY);
    context.scale(scale, scale);

    context.drawImage(offScreenCanvas, 0, 0);

    context.restore();
}

document.querySelector('form').addEventListener('submit', function () {
    document.getElementById('DrawingData').value = JSON.stringify(drawingActions);
});

document.querySelector('form').addEventListener('submit', function () {
    document.getElementById('drawingData').value = JSON.stringify(drawingActions);
})

