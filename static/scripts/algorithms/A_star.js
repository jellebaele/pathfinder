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
        this.grid = grid;
        this.loop = null;
        this.startNode = null;
        this.targetNode = null;
        this.list_open = [];
        this.list_closed = [];
        this.i = 0;
    }

    getPath(startNode, targetNode) {
        if (startNode === null || targetNode === null)
            return false;

        let pathFound = false;
        // Create list with nodes to be evaluated
        this.list_open = [];
        // Create list which have been evaluated
        this.list_closed = [];
        // Add startnode to list open
        this.list_open.push(startNode);


        // Loop until solution is found or there are no nodes left to be evaluated
        while (!pathFound && this.list_open.length > 0) {
            if (this.calculatePath(startNode, targetNode)) {
                pathFound = true;
                return true;
            }
        }

        // After while loop; in order to delete the visualised path on the grid
        if (!pathFound) {
            this.grid.path = [];
            return false;
        }
    }

    getPathStepByStep(startNode, targetNode) {
        if (startNode === null || targetNode === null) {
            return null;
        }

        // Check if it's the first init
        if (this.list_open.length < 1) {
            // Create list with nodes to be evaluated
            this.list_open = [];
            // Create list which have been evaluated
            this.list_closed = [];
            // Add startnode to list open
            this.list_open.push(startNode);
            // Delete path from grid
            this.grid.path = [];
        }

        let found = this.calculatePath(startNode, targetNode);

        if (this.list_open.length < 1 && !found) {
            this.grid.path = [];
            return true;
        }

        return found;
    }

    calculatePath(startNode, targetNode) {
        // get the node with the lowest f_cost
        let current_node = this.list_open[0];
        this.list_open.forEach(node => {
            if (node.getFCost() < current_node.getFCost() ||
                (node.getFCost === current_node.getFCost && node.hCost < current_node.hCost)) {
                current_node = node;
            }
        });

        // Remove the node with the lowest cost (current_node) from list_open since it will be evaluated
        let removed = false;
        let i = 0;
        while (i < this.list_open.length && !removed) {
            if (this.list_open[i] === current_node) {
                this.list_open.splice(i, 1);
                removed = true;
            }
            i++;
        }

        // Add current_node to the list_closed
        this.list_closed.push(current_node);

        // If the position of the current_node == position of the target node,
        // the path is found
        if (current_node.x === targetNode.x && current_node.y === targetNode.y) {
            this.retracePath(startNode, targetNode);
            this.list_open = [];
            this.list_closed = [];
            return true;
        }

        // Get the neighbors of the current_node that is being evaluated
        let neighbors = this.grid.getNeighbours(current_node);

        // Loop over all neighbors and check if it is a wall or it has already been evaluated
        neighbors.forEach(neighbor => {
            if (!neighbor.wall && !this.list_closed.includes(neighbor)) {
                // Define the gCost (= Distance from this node (=current neighbor) to start_node-
                let costMovement = current_node.gCost + this.getDistance(current_node, neighbor);
                // If the neighbor is not yet in the open_list (= not yet considered)
                // Or the cost is smaller than the current gCost, the current_node is the
                // node for the current neighbor
                if (!this.list_open.includes(neighbor) || costMovement < neighbor.gCost) {
                    neighbor.gCost = costMovement;
                    neighbor.hCost = this.getDistance(neighbor, targetNode);
                    neighbor.parentNode = current_node;

                    if (!this.list_open.includes(neighbor))
                        this.list_open.push(neighbor)
                }
            }
        });
        this.grid.evaluated = this.list_closed;
        // console.log(this.list_open.length < 1);
        return false;
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

        this.grid.path = path.reverse();
    }
}
