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
const stepSize = 30;
const lineWidth = 1;

// Wall props

// Booleans to keep track of mouseclick events
let mouseDownLeft = false;
let mouseDownRight = false;

// Booleans to keep track of creating start and target nodes
let isCreatingStartNode = false;
let isCreatingTargetNode = false;

// A* pathfind algorithm
let a_star;
let isVisualized = false;
let isVisualizing = false;
let loop;
let loopSpeed;
const speeds = [1000, 500, 200, 50, 10];

// Server configs
let serverURL = '/';

// Colors
let colorGrid = "#4A5954";
let colorWall = "#CC3314";
let colorStart = "#58BC82";
let colorTarget = "#EFA00B";
let colorPath = "#22AED1";
let colorEvaluated = "#AED8EA";

let timer;

let tutCounter = 1;

// Resize: redraw canvas
window.onload = function () {
    init();
    window.addEventListener('resize', init, false);
};

function init() {
    // Create canvas that fits in the screen
    myWidth = window.innerWidth - 100;
    myHeight = window.innerHeight - 175;

    ctx.canvas.width = myWidth;
    ctx.canvas.height = myHeight;

    // Create a grid object
    grid = new Grid(myWidth, myHeight, stepSize, lineWidth, ctx, colorGrid, colorWall, colorStart,
        colorTarget, colorEvaluated, colorPath);

    // Create grid
    grid.create();
    // Fill nodes
    grid.fillNodes();

    // Create A_star object
    a_star = new A_star(grid);

    // Check if the url contains any information
    // If so, load grid from server
    let link = window.location.href;
    let splittedLink = link.split("?");
    if (splittedLink.length > 1) {
        let id = splittedLink[1].split("=")[1];
        getMessage('stored', id);
    }

    // Check if button "idVisualize" can be enabled
    checkEnableVisualize();

    // Set label of speed
    setLabel();

    document.getElementById("idAlert").hidden = true;
    document.getElementById("idBtnClose").onclick = function () {
        document.getElementsByClassName("pop-outer")[0].hidden = true;
    }

}

// Function to update button to create startnode
function createStartNode() {
    if (!isCreatingStartNode) {
        document.getElementById("idStart").value = "Placing start node...";
        isCreatingStartNode = true;
    } else {
        document.getElementById("idStart").value = "Place start node";
        isCreatingStartNode = false;
    }
}

// Function to update button to create a target node
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

// Function to reset the nodes
function resetCanvas() {
    grid.resetNodes();
    isVisualized = false;
    isVisualizing = false;
    location.replace("/");
}

function visualizeIncrement() {
    isVisualized = false;
    if (!isVisualizing) {
        isVisualizing = true;
        loop = window.setInterval(findPathLoop, loopSpeed);
    } else {
        window.clearInterval(loop);
        a_star.list_open = [];
        loop = window.setInterval(findPathLoop, loopSpeed);
    }
}

function findPathLoop() {
    let found = a_star.getPathStepByStep(grid.startNode, grid.targetNode);
    if (found) {
        isVisualized = true;
        window.clearInterval(loop);
        drawPathIncrement();
    } else if (found === null) {
        window.clearInterval(loop);
        isVisualizing = false;
    }
    grid.fillNodes();
}

function drawPathIncrement() {
    let i = 0;
    loop = window.setInterval(function () {
        if (grid.path[i] === undefined) {
            isVisualizing = false;
            window.clearInterval(loop);
            return;
        }

        grid.drawPathIncrement(grid.path[i]);

        i++;
    }, speeds[3]);

}

// Function to execute A* algorithm
function visualize() {
    a_star.getPath(grid.startNode, grid.targetNode);
    grid.fillNodes();
    grid.drawPath();
    isVisualized = true;
}

// Check if button idVisualize can be enabled
function checkEnableVisualize() {
    document.getElementById("idVisualize").disabled = !(grid.startNode !== null && grid.targetNode !== null);
}

// Save current grid
function save() {
    // Get picture of canvas
    let dataURL = canv.toDataURL('png');
    let answer = window.prompt("File name:", "Layout name");
    if (answer !== null) {
        postMessage(answer, grid.nodes, dataURL);
    }
}

// Function when clicking on the canvas
function clickEvent(e) {
    // Get coordinate of mouse
    let coord = grid.shiftPosition(getClickPosition(canv, e));

    // Check which function has to be activated
    if (!isCreatingTargetNode && !isCreatingStartNode) {
        // Check if clicking position is a start/target node
        // If not, create a wall
        checkWall(coord);
    } else if (isCreatingStartNode) {
        // If btn "place start node" is clicked, place start node
        grid.adjustStartNode(coord);
        isCreatingStartNode = false;
        document.getElementById("idStart").value = "Place start node";
    } else if (isCreatingTargetNode) {
        // if btn "place target node" is click, place target node
        grid.adjustTargetNode(coord);
        isCreatingTargetNode = false;
        document.getElementById("idTarget").value = "Place target node";
    }

    // If a* algorithm is already executed, execute again since something has changed in this function
    if (isVisualizing)
        visualizeIncrement();

    if (isVisualized)
        visualize();

    isDraggingStart = false;
    isDraggingTarget = false;

    checkEnableVisualize();
}

// When clicking on the right button of mouse
window.oncontextmenu = function (e) {
    let coord = grid.shiftPosition(getClickPosition(canv, e));
    if (!isCreatingTargetNode && !isCreatingStartNode) {
        // Delete wall
        grid.adjustWall(coord, false);
        // If a* algorithm is already executed, execute again since something has changed in this function
        if (isVisualizing)
            visualizeIncrement();

        if (isVisualized) {
            visualize();
        }
    }
    // Disable menu from right click
    return false;
};


function onMouseDown(e) {
    if (e.button === 0) {
        mouseDownLeft = true;
    } else if (e.button === 2) {
        mouseDownRight = true;
    }

    if (isVisualizing)
        visualizeIncrement();
    // If a* algorithm is already executed, execute again since something has changed in this function
    if (isVisualized)
        visualize();
}

function onMouseUp() {
    mouseDownLeft = false;
    mouseDownRight = false;
}

// If mouse moves
function onMouseMove(e) {
    let coord = grid.shiftPosition(getClickPosition(canv, e));
    // If mouse has clicked
    if (mouseDownLeft && !isCreatingStartNode && !isCreatingTargetNode) {
        // Check if click coord was on a start/target node
        checkWall(coord);
        // Drag
        if (isDraggingStart) {
            grid.adjustStartNode(coord);

        } else if (isDraggingTarget) {
            grid.adjustTargetNode(coord);
        }

        if (isVisualizing)
            visualizeIncrement();
        if (isVisualized)
            visualize();
        // Check right click mouse
    } else if (mouseDownRight && !isCreatingStartNode && !isCreatingTargetNode) {
        grid.adjustWall(coord, false);

        if (isVisualizing)
            visualizeIncrement();
        if (isVisualized)
            visualize();
    }
}

// Function to check if a start/target node is clicked
function checkWall(coord) {
    if (grid.isStartNode(coord)) {
        isDraggingStart = true;
    } else if (grid.isTargetNode(coord)) {
        isDraggingTarget = true
    } else if (!isDraggingStart && !isDraggingTarget) {
        grid.adjustWall(coord, true);

        if (isVisualizing)
            visualizeIncrement();
        if (isVisualized)
            visualize();
    }
}

// Get position of mouse click
function getClickPosition(el, event) {
    let xPosition = 0;
    let yPosition = 0;

    // while; loop over all parent elements
    while (el) {
        if (el.tagName === "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            // different browsers -> different ways of how to handle this
            let xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
            let yScrollPos = el.scrollTop || document.documentElement.scrollTop;

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

// Post message to server
function postMessage(title, content, picture) {
    fetch(serverURL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"title": title, "content": content, "picture": picture})
    }).then((response) => {
        if (response.status === 201) {
            success();
        } else {
            fail();
        }
    });
}

function success() {
    let alert = document.getElementById("idAlert");
    alert.innerText = "";

    let div = document.createElement("div");
    div.setAttribute("class", "alert alert-success");
    div.setAttribute("role", "alert");
    div.innerHTML = "Layout successfully saved !";
    alert.appendChild(div);

    alert.hidden = false;
    timer = window.setInterval(hide, 10000);
}

function fail() {
    let alert = document.getElementById("idAlert");
    alert.innerText = "";

    let div = document.createElement("div");
    div.setAttribute("class", "alert alert-fail");
    div.setAttribute("role", "alert");
    div.innerHTML = "Something went wrong";
    alert.appendChild(div);

    alert.hidden = false;
    timer = window.setInterval(hide, 10000);
}

function hide() {
    clearInterval(timer);
    document.getElementById("idAlert").hidden = true;
}

// Get message from server
function getMessage(location, id) {
    fetch(serverURL + location + '/' + id)
        .then(data => data.json())
        .then(data => {
            grid.loadFromJSON(data.content);
            checkEnableVisualize();
        })
        .catch(() => {
            fail();
        });
}

function setLabel() {
    let slider = document.getElementById("idSlider");
    let label = document.getElementById("idSpeed");
    let txtLabels = ['Very slow', 'Slow', 'Intermediate', 'Fast', 'Very fast'];
    label.innerHTML = "Speed: " + txtLabels[slider.value];

    loopSpeed = speeds[slider.value];
    if (isVisualizing) {
        window.clearInterval(loop);
        loop = window.setInterval(findPathLoop, loopSpeed);
    }
}

function clearPath() {
    grid.resetPath();
    isVisualized = false;
}

function clearWalls() {
    grid.resetWalls();
    isVisualized = false;
}

function tutorialPrevious() {
    if (tutCounter > 1) tutCounter--;
    tutorialHandler();
}

function tutorialNext() {
    if (tutCounter < 8) tutCounter++;
    tutorialHandler();
}

function tutorialHandler() {
    let tutorialBody = document.getElementById("idTutorialText");

    if (tutCounter === 1) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">This is a short tutorial that takes you through the different aspects and\n" +
            "                functionalities of this website and how to use it.</h4>\n" +
            "            <h5>Let's get started by clicking on the right arrow!</h5>"
    } else if (tutCounter === 2) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">Concept</h4>\n" +
            "<h5 class='mb-3'>This site visualizes a pathfinding algorithm, more specifically the A*-algorithm. This " +
            "algorithm is capable of finding a path between two points.</h5> <img src=\"/static/images/Tutorial_1.gif\" " +
            "alt=\"pathfinding example\" height=\"100px\"/>"
    } else if (tutCounter === 3) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">How it works:</h4>\n" +
            "<h5 class='mb-3'>A path is calculated between a start and target point (=node). You can add the starting node and the target node as follows: " +
            "<h5> To begin, click on the button \"Place start node\" and click on a spot in the grid to add the start node. </h5>" +
            "<h5 class='mb-3'> The same goes for the target node. Once these nodes are placed, you can drag them to another spot on the grid.</h5>" +
            "<img src=\"/static/images/Tutorial_6.gif\" " +
            "alt=\"pathfinding example\" height=\"150px\"/>"
    } else if (tutCounter === 4) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">Add and remove walls</h4>\n" +
            "<h5 class='mb-3'>To make things more interesting, you can add walls which block the path. To create and draw one wall node, simply left-click on the grid. To create multiple wall nodes, left-click on the grid and hold. " +
            "To remove a wall node, right-click on an existing wall node or hold to remove multiple wall nodes.</h5> <br>" +
            "<img src=\"/static/images/Tutorial_2.gif\" " +
            "alt=\"pathfinding example\" height=\"100px\"/>"
    } else if (tutCounter === 5) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">Visualize path</h4>\n" +
            "<h5 class='mb-3'>Finally, you can visualize the path by clicking \"Visualize !\". The speed " +
            "can be adapted while the visualisation process is running by going to Options > speed.</h5>" +
            "<img src=\"/static/images/Tutorial_3.gif\" " +
            "alt=\"pathfinding example\" height=\"150px\"/>"
    } else if (tutCounter === 6) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">Visualize path</h4>\n" +
            "<h5 class='mb-3'>Once the path is calculated and visualized, the path is automatically updated when you drag the start and target node around " +
            "and place walls on different locations.</h5>" +
            "<img src=\"/static/images/Tutorial_4.gif\" " +
            "alt=\"pathfinding example\" height=\"100px\"/>"
    } else if (tutCounter === 7) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">Saving & Loading</h4>\n" +
            "<h5 class='mb-3'>If you want, you can save the current grid layout by going to Options > Save current layout. " +
            "Type a file name and click \"Ok\" to save the layout. Saved layouts can be found under Options > Load layouts.</h5>"
    } else if (tutCounter === 8) {
        tutorialBody.innerHTML = "<h4 class=\"mb-3\">What else? Enjoy!</h4>\n" +
            "<h5 class='mb-3'>Now all that is left for you, is to enjoy! Other functions can be found in the navigation bar such as clearing the walls, clearing the path, etc.</h5>" +
            "<img src=\"/static/images/Tutorial_5.JPG\" " +
            "alt=\"pathfinding example\" width=\"80%\"/>" +
            "<h6 class='mt-5'> The full source code of this website can be found via " +
            "<a href=\"https://github.com/jellebaele/pathfinder\">GitHub</a>.</h6>"
    }
}

function showTutorial() {
    tutCounter = 1;
    tutorialHandler();
    document.getElementsByClassName("pop-outer")[0].hidden = false;
}

// Add events to screen
canv.addEventListener('click', clickEvent, false);
canv.addEventListener('mousedown', onMouseDown, false);
canv.addEventListener('mouseup', onMouseUp, false);
canv.addEventListener('mousemove', onMouseMove, false);
document.getElementById("idStart").onclick = createStartNode;
document.getElementById("idTarget").onclick = createTargetNode;
document.getElementById("idVisualize").onclick = visualizeIncrement;
document.getElementById("idSave").onclick = save;
document.getElementById("idReset").onclick = resetCanvas;
document.getElementById("idSlider").onmousemove = setLabel;
document.getElementById("idClearPath").onclick = clearPath;
document.getElementById("idClearWall").onclick = clearWalls;
document.getElementById("idArrowLeft").onclick = tutorialPrevious;
document.getElementById("idArrowRight").onclick = tutorialNext;
document.getElementById("idShowTutorial").onclick = showTutorial;
