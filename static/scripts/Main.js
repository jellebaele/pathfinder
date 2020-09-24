import Grid from "./Grid.js"
import A_star from "./algorithms/A_star.js";

// Canvas props
let canv = document.getElementById("myCanvas");
let ctx = canv.getContext('2d');
let myHeight = canv.height;
let myWidth = canv.width;

// Variable to drag start and target node
let isDraggingStart = false;
let isDraggingTarget = false;

// grid props
let grid;
const stepSize = 50;
const lineWidth = 1;

// Wall props
let wall = [];
let colorWall = "#00FFFF";

// Booleans to keep track of mouseclick events
let mouseDownLeft = false;
let mouseDownRight = false;

// Booleans to keep track of functions
let isCreatingStartNode = false;
let isCreatingTargetNode = false;

// A* pathfind algorithm
let a_star;
let isVisualized = false;

// Server configs
let serverURL = '/';

window.onload = function () {
    init();
    window.addEventListener('resize', init, false);
};

function init() {
    myWidth = window.innerWidth - 100;
    myHeight = window.innerHeight - 175;

    ctx.canvas.width = myWidth;
    ctx.canvas.height = myHeight;

    grid = new Grid(myWidth, myHeight, stepSize, lineWidth, ctx);

    grid.create();
    grid.fillNodes();

    a_star = new A_star(grid);

    let link = window.location.href;
    let splittedLink = link.split("?");
    if (splittedLink.length > 1) {
        let id = splittedLink[1].split("=")[1];
        getMessage('stored', id);
    }

    checkEnableVisualize();
}

window.oncontextmenu = function (e) {
    let coord = grid.shiftPosition(getClickPosition(canv, e));
    if (!isCreatingTargetNode && !isCreatingStartNode) {
        grid.adjustWall(coord, false);
        if (isVisualized){
            visualize();
        }
    }

    return false;
};

function createStartNode() {
    if (!isCreatingStartNode) {
        document.getElementById("idStart").value = "Placing start node...";
        isCreatingStartNode = true;
    } else {
        document.getElementById("idStart").value = "Place start node";
        isCreatingStartNode = false;
    }
}

function createTargetNode() {
    if (!isCreatingTargetNode) {
        document.getElementById("idTarget").value = "Placing target node...";
        isCreatingTargetNode = true;
    } else {
        document.getElementById("idTarget").value = "Place Target node";
        isCreatingTargetNode = false;
    }
    checkEnableVisualize();
}

function resetCanvas() {
    grid.resetNodes();
    isVisualized = false;
}

function visualize() {
    a_star.findPath(grid.startNode, grid.targetNode);
    grid.fillNodes();
    isVisualized = true;
}

function checkEnableVisualize() {
    document.getElementById("idVisualize").disabled = !(grid.startNode !== null && grid.targetNode !== null);
}

function save() {
    let dataURL = canv.toDataURL('png');

    let answer = window.prompt("File name:", "Save");
    if (answer !== null) {
        postMessage(answer, grid.nodes, dataURL);
    }
}

function clickEvent(e) {
    let coord = grid.shiftPosition(getClickPosition(canv, e));

    if (!isCreatingTargetNode && !isCreatingStartNode) {
        // Search for start
        checkWall(coord);
    } else if (isCreatingStartNode) {
        grid.adjustStartNode(coord);
        isCreatingStartNode = false;
        document.getElementById("idStart").value = "Place start node";
    } else if (isCreatingTargetNode) {
        grid.adjustTargetNode(coord);
        isCreatingTargetNode = false;
        document.getElementById("idTarget").value = "Place target node";
    }

    if (isVisualized)
        visualize();

    isDraggingStart = false;
    isDraggingTarget = false;

    checkEnableVisualize();
}

function onMouseDown(e) {
    if (e.button === 0) {
        mouseDownLeft = true;
    } else if (e.button === 2) {
        mouseDownRight = true;
    }

    if (isVisualized)
        visualize();
}

function onMouseUp(e) {
    mouseDownLeft = false;
    mouseDownRight = false;
    if (isVisualized) {
        visualize();
    }
}

function onMouseMove(e) {
    let coord = grid.shiftPosition(getClickPosition(canv, e));

    if (mouseDownLeft && !isCreatingStartNode && !isCreatingTargetNode) {
        checkWall(coord, e, canv);

        // Drag
        if (isDraggingStart) {
            grid.adjustStartNode(coord);

        } else if (isDraggingTarget) {
            grid.adjustTargetNode(coord);

        }
        if (isVisualized)
            visualize();
    } else if (mouseDownRight && !isCreatingStartNode && !isCreatingTargetNode) {
        grid.adjustWall(coord, false);
        if (isVisualized)
            visualize();
    }


}

function checkWall(coord, event, canv) {
    if (grid.isStartNode(coord)) {
        isDraggingStart = true;
    } else if (grid.isTargetNode(coord)) {
        isDraggingTarget = true
    } else if (!isDraggingStart && !isDraggingTarget) {
        grid.adjustWall(coord, true);
        if (isVisualized)
            visualize();
    }
}

function getClickPosition(el, event) {
    let xPosition = 0;
    let yPosition = 0;

    // while; loop over all parent elements
    while (el) {
        if (el.tagName === "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            // different browsers -> different ways of how to handle this
            var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
            var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

            // offsetLeft and top compated to parents
            // client to account for border as well
            xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
            yPosition += (el.offsetTop - yScrollPos + el.clientTop);
        } else {
            xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
        }

        el = el.offsetParent;
    }
    return {
        x: event.clientX - xPosition,
        y: event.clientY - yPosition
    };
}

function postMessage(title, content, picture) {
    fetch(serverURL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"title": title, "content": content, "picture": picture})
    }).then((response) => {
        if (response.status === 201) {
            console.log("Saved")
        } else {
            console.log("Something went wrong");
        }
    });
}

function getMessage(location, id) {
    fetch(serverURL + location + '/' + id)
        .then(data => data.json())
        .then(data => {
            grid.loadFromJSON(data.content);
            checkEnableVisualize();
        });
}


canv.addEventListener('click', clickEvent, false);
canv.addEventListener('mousedown', onMouseDown, false);
canv.addEventListener('mouseup', onMouseUp, false);
canv.addEventListener('mousemove', onMouseMove, false);
document.getElementById("idStart").onclick = createStartNode;
document.getElementById("idTarget").onclick = createTargetNode;
document.getElementById("idReset").onclick = resetCanvas;
document.getElementById("idVisualize").onclick = visualize;
document.getElementById("idSave").onclick = save;

