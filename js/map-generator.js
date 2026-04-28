// 通向奥秘 - 迷宫生成器

var MapGenerator = (function () {

    // Tile types
    var WALL = 0;
    var PATH = 1;
    var DOOR = 2;
    var SPECIAL = 3;
    var EXIT = 4;
    var ENTRANCE = 5;
    var HIDDEN_PATH = 6;

    /**
     * Generate a maze using recursive backtracking (DFS).
     * The grid uses odd coordinates as nodes, even coordinates as walls/passages.
     *
     * @param {number} width  - grid columns
     * @param {number} height - grid rows
     * @param {object} config - optional: entrance, exit, specialRooms, doors
     * @returns {number[][]} 2D tile array
     */
    function generate(width, height, config) {
        config = config || {};

        // Initialize grid with all walls
        var grid = [];
        for (var y = 0; y < height; y++) {
            grid[y] = [];
            for (var x = 0; x < width; x++) {
                grid[y][x] = WALL;
            }
        }

        // Collect odd-coordinate cells as maze nodes
        var visited = [];
        for (var y = 0; y < height; y++) {
            visited[y] = [];
            for (var x = 0; x < width; x++) {
                visited[y][x] = false;
            }
        }

        // Start DFS from (1,1)
        var stack = [];
        var startX = 1;
        var startY = 1;
        visited[startY][startX] = true;
        grid[startY][startX] = PATH;
        stack.push({ x: startX, y: startY });

        var directions = [
            { dx: 0, dy: -2 }, // up
            { dx: 0, dy: 2 },  // down
            { dx: -2, dy: 0 }, // left
            { dx: 2, dy: 0 }   // right
        ];

        while (stack.length > 0) {
            var current = stack[stack.length - 1];
            var neighbors = [];

            for (var i = 0; i < directions.length; i++) {
                var nx = current.x + directions[i].dx;
                var ny = current.y + directions[i].dy;

                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                    if (!visited[ny][nx]) {
                        neighbors.push({
                            x: nx,
                            y: ny,
                            wx: current.x + directions[i].dx / 2,
                            wy: current.y + directions[i].dy / 2
                        });
                    }
                }
            }

            if (neighbors.length > 0) {
                var next = neighbors[Math.floor(Math.random() * neighbors.length)];
                visited[next.y][next.x] = true;
                grid[next.y][next.x] = PATH;
                grid[next.wy][next.wx] = PATH; // carve wall between nodes
                stack.push({ x: next.x, y: next.y });
            } else {
                stack.pop();
            }
        }

        // Place entrance and exit
        var entrance = config.entrance || { x: 1, y: 1 };
        var exit = config.exit || { x: width - 2, y: height - 2 };

        // Ensure exit position is on a path tile (odd coordinates preferred)
        var ex = exit.x;
        var ey = exit.y;
        if (ex % 2 === 0) ex = ex - 1;
        if (ey % 2 === 0) ey = ey - 1;
        if (ex < 1) ex = 1;
        if (ey < 1) ey = 1;

        grid[entrance.y][entrance.x] = ENTRANCE;
        grid[ey][ex] = EXIT;

        // Place special rooms if specified
        if (config.specialRooms) {
            for (var i = 0; i < config.specialRooms.length; i++) {
                var room = config.specialRooms[i];
                if (room.y < height && room.x < width) {
                    grid[room.y][room.x] = SPECIAL;
                }
            }
        }

        // Place doors if specified
        if (config.doors) {
            for (var i = 0; i < config.doors.length; i++) {
                var door = config.doors[i];
                if (door.y < height && door.x < width) {
                    grid[door.y][door.x] = DOOR;
                }
            }
        }

        return grid;
    }

    /**
     * Safe tile accessor with bounds checking.
     * @param {number[][]} map
     * @param {number} x
     * @param {number} y
     * @returns {number} tile value, or WALL if out of bounds
     */
    function getTile(map, x, y) {
        if (!map) return WALL;
        if (y < 0 || y >= map.length) return WALL;
        if (x < 0 || x >= map[0].length) return WALL;
        return map[y][x];
    }

    return {
        generate: generate,
        getTile: getTile,
        WALL: WALL,
        PATH: PATH,
        DOOR: DOOR,
        SPECIAL: SPECIAL,
        EXIT: EXIT,
        ENTRANCE: ENTRANCE
    };
})();
