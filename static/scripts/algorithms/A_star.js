/**
 * http://csis.pace.edu/~benjamin/teaching/cs627/webfiles/Astar.pdf
 * ALGORITHM
 *  list_open   // list of nodes to be evaluated
 *  list_closed  // list of nodes already evaluated
 *  add start node to list_open
 *
 *  loop
 *      current_node = node in list_open with the lowest f-cost
 *      remove current_node from list_op
 *      add current_node to list_closed
 *
 *      if current_node = target_node
 *          return // Path has been found
 *
 *      foreach neighbor of the current node
 *          if neighbor is wall or neighbor is in list_closed
 *              pass current_neighbor
 *
 *          if new path to neighbor is shorter OR neightbor is not in list_open
 *              set f_cost to neighbor
 *              set parent of neighbor to current_node
 *              if neighbor is not in list_open
 *                  add neighbor to list_open
 */
import Node from "../objects/Node.js";
import Grid from "../Grid.js";

export default class A_star {
    // Start & target
    constructor(grid) {
        this.grid = grid
    }

    findPath(startNode, targetNode) {
        console.log("Start alg");
        if (startNode === null || targetNode === null)
            return false;

        let pathFound = false;

        this.list_open = [];
        this.list_closed = [];
        // Add startnode to list open
        this.list_open.push(startNode);
        // console.log(this.list_open);

        //let counter = 0;
        while (this.list_open.length > 0) {
            // get the node with the lowest f_cost
            let current_node = this.list_open[0];
            this.list_open.forEach(node => {
                if (node.getFCost() < current_node.getFCost() ||
                    (node.getFCost === current_node.getFCost && node.hCost < current_node.hCost)) {
                    current_node = node;
                }
            });

            let removed = false;
            let i = 0;
            while (i < this.list_open.length && !removed) {
                if (this.list_open[i] === current_node) {
                    this.list_open.splice(i, 1);
                    removed = true;
                }
                i++;
            }

            this.list_closed.push(current_node);

            if (current_node.x === targetNode.x && current_node.y === targetNode.y) {
                pathFound = true;
                this.retracePath(startNode, targetNode);
                return true;
            }

            let neighbors = this.grid.getNeighbours(current_node);

            neighbors.forEach(neighbor => {
                if (!neighbor.wall && !this.list_closed.includes(neighbor)) {
                    let costMovement = current_node.gCost + this.getDistance(current_node, neighbor);
                    if (!this.list_open.includes(neighbor) || costMovement < neighbor.gCost){
                        neighbor.gCost = costMovement;
                        neighbor.hCost = this.getDistance(neighbor, targetNode);
                        neighbor.parentNode = current_node;

                        if (!this.list_open.includes(neighbor))
                            this.list_open.push(neighbor)
                    }
                }
            });


        }

        if (!pathFound) {
            this.grid.path = [];
            return false;
        }
    }

    // Get distance:
    // diagonally = sqrt(1+1) * 10 = 14
    // vertical or horizontal = sqrt (1 + 0) * 10 = 10
    getDistance(nodeA, nodeB) {
        let distX = Math.abs(nodeA.x - nodeB.x) / this.grid.step;
        let distY = Math.abs(nodeA.y - nodeB.y) / this.grid.step;

        if (distX > distY)
            return 14 * distY + 10 * (distX - distY);
        return 14 * distX + 10 * (distY - distX);
    }

    // Retrace path backwards from parent to parent
    retracePath(startNode, targetNode) {
        let path = [];
        let current_node = targetNode;

        while (!(current_node.x === startNode.x && current_node.y === startNode.y)) {
            path.push(current_node);
            current_node = current_node.parentNode;
            if (current_node === null) {
                break;
            }
        }

        this.grid.path = path;
    }

}
