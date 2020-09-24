import Coordinate from "./objects/Coordinate.js";
import Node from "./objects/Node.js";

export default class Grid {
    constructor(width, height, step, lineWidth, ctx) {
        this.width = width;
        this.height = height;
        this.step = step;
        this.lineWidth = lineWidth;
        this.nodes = [];
        this.startNode = null;
        this.targetNode = null;
        this.ctx = ctx;
        this.path = [];
    }

    // Create list of nodes and draw on screen
    create() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#808080";
        this.ctx.lineWidth = this.lineWidth;

        // Start with x = 0 and y = 0
        for (let x = 0; x <= this.width - (this.width % this.step); x += this.step) {
            for (let y = 0; y <= this.height - (this.height % this.step); y += this.step) {
                if (x < this.width - (this.width % this.step) && y < this.height - (this.height % this.step))
                    this.nodes.push(new Node(new Coordinate(x, y), false, this.step - 2 * this.lineWidth));

                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.height - (this.height % this.step));

                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.width - (this.width % this.step), y);
            }
        }
        this.ctx.stroke();
    }

    // adjust position of start node
    adjustStartNode(coord) {
        let _startNode = this.searchNode(coord);

        if (!_startNode.wall && !_startNode.target) {
            // Look for start node if startNode is not null and reset it
            if (this.startNode !== null) {
                let prevStart = this.nodes.find(n => n.start);
                prevStart.start = false;
            }

            _startNode.start = true;
            _startNode.wall = false;
            this.startNode = _startNode;
        }
        // Draw nodes on screen
        this.fillNodes();
    }

    // Function to check if coordinate is the start node
    isStartNode(coord) {
        if (this.startNode === null)
            return false;

        let node = this.searchNode(coord);
        return node.start;
    }

    // Adjust position of a target node
    adjustTargetNode(coord) {
        let _targetNode = this.searchNode(coord);

        if (!_targetNode.wall && !_targetNode.start) {
            // Look for start node if targetNode is not null and reset it
            if (this.targetNode !== null) {
                let prevTarget = this.nodes.find(n => n.target);
                prevTarget.target = false;
            }

            _targetNode.target = true;
            _targetNode.wall = false;
            this.targetNode = _targetNode;
        }
        this.fillNodes();
    }

    // Function to check if coord is the targetnode
    isTargetNode(coord) {
        if (this.targetNode === null)
            return false;

        let node = this.searchNode(coord);
        return node.target;
    }

    // Function to create / delete a wall
    adjustWall(coord, insert) {
        // Search for node with same coordinate
        let wallNode = this.searchNode(coord);
        if (insert && !wallNode.start && !wallNode.target)
            wallNode.wall = true;
        else wallNode.wall = false;

        //wallNode.wall = !!insert;

        this.fillNodes()
    }

    // Function to search a node in particular
    searchNode(node) {
        let found = false;
        let i = 0;

        while (i < this.nodes.length && !found) {
            if (this.nodes[i].x === node.x && this.nodes[i].y === node.y) {
                return this.nodes[i];
            }
            i++;
        }
    }

    // Shift position of a coordinate to the upper left corner
    shiftPosition(pos) {
        let result = new Coordinate(pos.x, pos.y);
        result.x = pos.x - (pos.x % this.step);
        result.y = pos.y - (pos.y % this.step);

        return result;
    }

    // Get adjacent nodes
    getNeighbours(centerNode) {
        let result = [];

        for (let x = Math.max(0, centerNode.x - this.step); x <= Math.min(centerNode.x + this.step, this.width - (this.width % this.step)); x += this.step) {
            for (let y = Math.max(0, centerNode.y - this.step); y <= Math.min(centerNode.y + this.step, this.height - (this.height % this.step)); y += this.step) {
                if ((x < this.width - (this.width % this.step)) && (y < this.height - (this.height % this.step))
                    && (x !== centerNode.x || y !== centerNode.y)
                    && ((y === centerNode.y && x !== centerNode.x) || (x === centerNode.x && y !== centerNode.y))) {
                    result.push(this.searchNode(new Coordinate(x, y)));
                }
            }
        }

        return result;
    }

    // Function to draw the nodes[]
    fillNodes() {
        this.ctx.beginPath();

        this.nodes.forEach(n => {
            if (n.wall)
                this.ctx.fillStyle = "#000000";
            else if (n.start)
                this.ctx.fillStyle = "#00FF00";
            else if (n.target)
                this.ctx.fillStyle = "#FF00FF";
            else this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillRect(n.x + this.lineWidth, n.y + this.lineWidth, n.size, n.size);
        });

        this.path.forEach(n => {
            this.ctx.fillStyle = "#5F9F9F";
            if (!n.target && !n.wall)
                this.ctx.fillRect(n.x + this.lineWidth, n.y + this.lineWidth, n.size, n.size);
        })
    }

    // Reset all nodes
    resetNodes() {
        this.nodes.forEach(n => {
            n.wall = false;
            n.start = false;
            this.startNode = null;
            n.target = false;
            this.targetNode = null;
            this.path = [];
        });

        this.fillNodes();
    }

    // Load data from JSON string
    loadFromJSON(data) {
        this.nodes = [];
        this.startNode = null;
        this.targetNode = null;

        let d1 = data.split('},');
        d1.forEach(d => {
            d = d.replace(/[\'[{}]+/g, "").replaceAll(']', '');
            d = d.replaceAll(' ', '');

            let myArr = d.split(',');
            // (pos, wall, size, start = false, target = false)
            let x = myArr[0].split(':')[1];
            let y = myArr[1].split(':')[1];
            let isWall = (myArr[2].split(':')[1] === 'True');
            let isStart = (myArr[3].split(':')[1] === 'True');
            let isTarget = (myArr[4].split(':')[1] === 'True');
            let size = parseInt(myArr[5].split(':')[1]);

            let newNode = new Node(new Coordinate(parseInt(x), parseInt(y)), isWall, size, isStart, isTarget)
            this.nodes.push(newNode);

            if (newNode.start) this.startNode = newNode;
            if (newNode.target) this.targetNode = newNode;
        });

        this.fillNodes();
    }
}
