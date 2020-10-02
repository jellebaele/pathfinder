export default class Node {
    constructor(pos, wall, size, start = false, target = false) {
        this.x = pos.x;
        this.y = pos.y;
        this.wall = wall;
        this.start = start;
        this.target = target;
        this.size = size;

        // Distance from this node to start_node
        this.gCost = 0;
        // Distance from this node to target_node
        this.hCost = 0;
        // Node to which it has the lowest cost
        this.parentNode = null;
    }

    getFCost() {
        return this.gCost + this.hCost;
    }
}
