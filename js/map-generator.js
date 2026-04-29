// 通向奥秘 - 迷宫生成器

var MapGenerator = (function () {

    // --- Tile types ---
    var WALL = 0;
    var PATH = 1;
    var DOOR = 2;
    var SPECIAL = 3;
    var EXIT = 4;
    var ENTRANCE = 5;
    var HIDDEN_PATH = 6;
    var WATER = 7;
    var BRIDGE = 8;
    var TRAP = 9;
    var PRESSURE_PLATE = 10;
    var TORCH = 11;
    var LORE_STONE = 12;
    var BREAKABLE_WALL = 13;
    var CRYSTAL = 14;

    // Door metadata: "x,y" → { keyId: string }
    var doorMap = {};

    // --- Room Templates ---
    var ROOM_TEMPLATES = [
        {
            name: 'cross',
            width: 5,
            height: 5,
            tiles: [
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0]
            ]
        },
        {
            name: 'chamber',
            width: 5,
            height: 5,
            tiles: [
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [1, 1, 3, 1, 1],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0]
            ]
        },
        {
            name: 'hall',
            width: 7,
            height: 3,
            tiles: [
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0]
            ]
        },
        {
            name: 'alcove',
            width: 3,
            height: 5,
            tiles: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0]
            ]
        },
        {
            name: 'sanctum',
            width: 7,
            height: 7,
            tiles: [
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 3, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 0, 0]
            ]
        },
        {
            name: 'corridor',
            width: 3,
            height: 7,
            tiles: [
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0]
            ]
        },
        {
            name: 'pool',
            width: 5,
            height: 5,
            tiles: [
                [0, 1, 1, 1, 0],
                [1, 1, 7, 1, 1],
                [1, 7, 7, 7, 1],
                [1, 1, 7, 1, 1],
                [0, 1, 1, 1, 0]
            ]
        },
        {
            name: 'shrine',
            width: 5,
            height: 5,
            tiles: [
                [0, 0, 1, 0, 0],
                [0, 1, 1, 1, 0],
                [1, 1, 12, 1, 1],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0]
            ]
        }
    ];

    // ===================================================================
    // DFS Maze Generation (original)
    // ===================================================================

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
        doorMap = {};
        if (config.doors) {
            for (var i = 0; i < config.doors.length; i++) {
                var door = config.doors[i];
                if (door.y < height && door.x < width) {
                    grid[door.y][door.x] = DOOR;
                    if (door.keyId) {
                        doorMap[door.x + ',' + door.y] = { keyId: door.keyId };
                    }
                }
            }
        }

        // Place hidden paths if specified
        if (config.hiddenPaths) {
            for (var i = 0; i < config.hiddenPaths.length; i++) {
                var hp = config.hiddenPaths[i];
                if (hp.y < height && hp.x < width) {
                    grid[hp.y][hp.x] = HIDDEN_PATH;
                }
            }
        }

        return grid;
    }

    // ===================================================================
    // Prim's Algorithm Maze Generation
    // ===================================================================

    /**
     * Generate a maze using randomized Prim's algorithm.
     * Produces mazes with more branching and shorter dead-ends than DFS.
     *
     * @param {number} width
     * @param {number} height
     * @param {object} config
     * @returns {number[][]}
     */
    function generatePrim(width, height, config) {
        config = config || {};

        var grid = [];
        var visited = [];
        for (var y = 0; y < height; y++) {
            grid[y] = [];
            visited[y] = [];
            for (var x = 0; x < width; x++) {
                grid[y][x] = WALL;
                visited[y][x] = false;
            }
        }

        // Start from (1,1)
        grid[1][1] = PATH;
        visited[1][1] = true;

        // Frontier: list of walls adjacent to visited cells
        var frontier = [];
        var directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 }
        ];

        function addFrontier(cx, cy) {
            for (var i = 0; i < directions.length; i++) {
                var nx = cx + directions[i].dx;
                var ny = cy + directions[i].dy;
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                    if (!visited[ny][nx] && grid[ny][nx] === WALL) {
                        // Check if not already in frontier
                        var found = false;
                        for (var f = 0; f < frontier.length; f++) {
                            if (frontier[f].x === nx && frontier[f].y === ny) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            frontier.push({ x: nx, y: ny, fx: cx, fy: cy });
                        }
                    }
                }
            }
        }

        addFrontier(1, 1);

        while (frontier.length > 0) {
            // Pick random frontier cell
            var idx = Math.floor(Math.random() * frontier.length);
            var cell = frontier[idx];
            frontier.splice(idx, 1);

            if (visited[cell.y][cell.x]) continue;

            // The cell is a maze node; the wall between it and the frontier source
            var wx = (cell.x + cell.fx) / 2;
            var wy = (cell.y + cell.fy) / 2;

            if (!visited[cell.y][cell.x]) {
                visited[cell.y][cell.x] = true;
                grid[cell.y][cell.x] = PATH;
                grid[wy][wx] = PATH;
                addFrontier(cell.x, cell.y);
            }
        }

        // Place entrance/exit and features
        _placeFeatures(grid, width, height, config);
        return grid;
    }

    // ===================================================================
    // Kruskal's Algorithm Maze Generation
    // ===================================================================

    /**
     * Generate a maze using randomized Kruskal's algorithm.
     * Produces mazes with uniform branching and many short dead-ends.
     *
     * @param {number} width
     * @param {number} height
     * @param {object} config
     * @returns {number[][]}
     */
    function generateKruskal(width, height, config) {
        config = config || {};

        var grid = [];
        for (var y = 0; y < height; y++) {
            grid[y] = [];
            for (var x = 0; x < width; x++) {
                grid[y][x] = WALL;
            }
        }

        // Collect all odd-coordinate cells as separate sets
        var parent = {};
        var rank = {};

        function makeSet(id) {
            parent[id] = id;
            rank[id] = 0;
        }

        function findSet(id) {
            if (parent[id] !== id) {
                parent[id] = findSet(parent[id]);
            }
            return parent[id];
        }

        function unionSets(a, b) {
            var ra = findSet(a);
            var rb = findSet(b);
            if (ra === rb) return false;
            if (rank[ra] < rank[rb]) {
                parent[ra] = rb;
            } else if (rank[ra] > rank[rb]) {
                parent[rb] = ra;
            } else {
                parent[rb] = ra;
                rank[ra]++;
            }
            return true;
        }

        // Initialize cells
        var cells = [];
        for (var y = 1; y < height - 1; y += 2) {
            for (var x = 1; x < width - 1; x += 2) {
                var id = x + ',' + y;
                makeSet(id);
                grid[y][x] = PATH;
                cells.push({ x: x, y: y });
            }
        }

        // Collect all walls between adjacent cells
        var walls = [];
        for (var y = 1; y < height - 1; y += 2) {
            for (var x = 1; x < width - 1; x += 2) {
                // Right neighbor
                if (x + 2 < width - 1) {
                    walls.push({ x1: x, y1: y, x2: x + 2, y2: y, wx: x + 1, wy: y });
                }
                // Bottom neighbor
                if (y + 2 < height - 1) {
                    walls.push({ x1: x, y1: y, x2: x, y2: y + 2, wx: x, wy: y + 1 });
                }
            }
        }

        // Shuffle walls (Fisher-Yates)
        for (var i = walls.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = walls[i];
            walls[i] = walls[j];
            walls[j] = tmp;
        }

        // Process walls: remove wall if cells are in different sets
        for (var i = 0; i < walls.length; i++) {
            var w = walls[i];
            var idA = w.x1 + ',' + w.y1;
            var idB = w.x2 + ',' + w.y2;
            if (unionSets(idA, idB)) {
                grid[w.wy][w.wx] = PATH;
            }
        }

        _placeFeatures(grid, width, height, config);
        return grid;
    }

    // ===================================================================
    // Room Placement & Hybrid Generation
    // ===================================================================

    /**
     * Place a room template into a grid at the given position.
     * Only overwrites WALL tiles.
     *
     * @param {number[][]} grid
     * @param {object} template - from ROOM_TEMPLATES
     * @param {number} ox - top-left x offset
     * @param {number} oy - top-left y offset
     * @returns {boolean} true if placement succeeded
     */
    function placeRoom(grid, template, ox, oy) {
        var rows = grid.length;
        var cols = grid[0].length;

        // Bounds check
        if (oy + template.height > rows || ox + template.width > cols) return false;
        if (ox < 0 || oy < 0) return false;

        // Check overlap — only allow placement on WALL tiles
        for (var y = 0; y < template.height; y++) {
            for (var x = 0; x < template.width; x++) {
                if (template.tiles[y][x] !== WALL && grid[oy + y][ox + x] !== WALL) {
                    return false;
                }
            }
        }

        // Place tiles
        for (var y = 0; y < template.height; y++) {
            for (var x = 0; x < template.width; x++) {
                if (template.tiles[y][x] !== WALL) {
                    grid[oy + y][ox + x] = template.tiles[y][x];
                }
            }
        }

        return true;
    }

    /**
     * Generate a maze with room templates placed first, then DFS fills remaining space.
     *
     * @param {number} width
     * @param {number} height
     * @param {object} config
     * @param {number} [roomCount=3] - number of rooms to attempt placing
     * @returns {number[][]}
     */
    function generateWithRooms(width, height, config, roomCount) {
        config = config || {};
        roomCount = roomCount || 3;

        // Initialize with walls
        var grid = [];
        for (var y = 0; y < height; y++) {
            grid[y] = [];
            for (var x = 0; x < width; x++) {
                grid[y][x] = WALL;
            }
        }

        // Place rooms at random positions
        var placedRooms = [];
        for (var r = 0; r < roomCount; r++) {
            var template = ROOM_TEMPLATES[Math.floor(Math.random() * ROOM_TEMPLATES.length)];
            var attempts = 0;
            var placed = false;

            while (attempts < 20 && !placed) {
                var ox = Math.floor(Math.random() * (width - template.width - 2)) + 1;
                var oy = Math.floor(Math.random() * (height - template.height - 2)) + 1;
                // Keep odd alignment for maze compatibility
                if (ox % 2 === 0) ox++;
                if (oy % 2 === 0) oy++;

                placed = placeRoom(grid, template, ox, oy);
                if (placed) {
                    placedRooms.push({ template: template, ox: ox, oy: oy });
                }
                attempts++;
            }
        }

        // Fill remaining space with DFS
        var visited = [];
        for (var y = 0; y < height; y++) {
            visited[y] = [];
            for (var x = 0; x < width; x++) {
                visited[y][x] = false;
            }
        }

        // Mark non-WALL cells as visited
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                if (grid[y][x] !== WALL) {
                    visited[y][x] = true;
                }
            }
        }

        var directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 }
        ];

        var stack = [];
        for (var y = 1; y < height - 1; y += 2) {
            for (var x = 1; x < width - 1; x += 2) {
                if (!visited[y][x]) {
                    visited[y][x] = true;
                    grid[y][x] = PATH;
                    stack.push({ x: x, y: y });

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
                            grid[next.wy][next.wx] = PATH;
                            stack.push({ x: next.x, y: next.y });
                        } else {
                            stack.pop();
                        }
                    }
                }
            }
        }

        _placeFeatures(grid, width, height, config);
        return grid;
    }

    // ===================================================================
    // Internal: Place entrance/exit/doors/hidden paths
    // ===================================================================

    function _placeFeatures(grid, width, height, config) {
        config = config || {};
        doorMap = {};

        var entrance = config.entrance || { x: 1, y: 1 };
        var exit = config.exit || { x: width - 2, y: height - 2 };

        var ex = exit.x;
        var ey = exit.y;
        if (ex % 2 === 0) ex = ex - 1;
        if (ey % 2 === 0) ey = ey - 1;
        if (ex < 1) ex = 1;
        if (ey < 1) ey = 1;

        // Ensure entrance/exit are on passable tiles
        if (entrance.y < height && entrance.x < width) {
            grid[entrance.y][entrance.x] = ENTRANCE;
        }
        if (ey < height && ex < width) {
            grid[ey][ex] = EXIT;
        }

        if (config.specialRooms) {
            for (var i = 0; i < config.specialRooms.length; i++) {
                var room = config.specialRooms[i];
                if (room.y < height && room.x < width) {
                    grid[room.y][room.x] = SPECIAL;
                }
            }
        }

        if (config.doors) {
            for (var i = 0; i < config.doors.length; i++) {
                var door = config.doors[i];
                if (door.y < height && door.x < width) {
                    grid[door.y][door.x] = DOOR;
                    if (door.keyId) {
                        doorMap[door.x + ',' + door.y] = { keyId: door.keyId };
                    }
                }
            }
        }

        if (config.hiddenPaths) {
            for (var i = 0; i < config.hiddenPaths.length; i++) {
                var hp = config.hiddenPaths[i];
                if (hp.y < height && hp.x < width) {
                    grid[hp.y][hp.x] = HIDDEN_PATH;
                }
            }
        }
    }

    // ===================================================================
    // Map Analysis
    // ===================================================================

    /**
     * Check if the map is fully connected (all non-WALL tiles reachable from entrance).
     * Uses BFS.
     *
     * @param {number[][]} map
     * @param {number} startX
     * @param {number} startY
     * @returns {boolean}
     */
    function isFullyConnected(map, startX, startY) {
        if (!map || map.length === 0) return false;

        var rows = map.length;
        var cols = map[0].length;
        var visited = [];
        for (var y = 0; y < rows; y++) {
            visited[y] = [];
            for (var x = 0; x < cols; x++) {
                visited[y][x] = false;
            }
        }

        // BFS
        var queue = [{ x: startX, y: startY }];
        visited[startY][startX] = true;
        var reachableCount = 0;

        var dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        while (queue.length > 0) {
            var current = queue.shift();
            reachableCount++;

            for (var i = 0; i < dirs.length; i++) {
                var nx = current.x + dirs[i].dx;
                var ny = current.y + dirs[i].dy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                    if (!visited[ny][nx] && map[ny][nx] !== WALL) {
                        visited[ny][nx] = true;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        // Count total non-WALL tiles
        var totalCount = 0;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (map[y][x] !== WALL) totalCount++;
            }
        }

        return reachableCount === totalCount;
    }

    /**
     * Get all reachable tiles from a starting point using BFS.
     *
     * @param {number[][]} map
     * @param {number} startX
     * @param {number} startY
     * @returns {Array<{x: number, y: number}>}
     */
    function getReachableTiles(map, startX, startY) {
        if (!map || map.length === 0) return [];

        var rows = map.length;
        var cols = map[0].length;
        var visited = [];
        for (var y = 0; y < rows; y++) {
            visited[y] = [];
            for (var x = 0; x < cols; x++) {
                visited[y][x] = false;
            }
        }

        var result = [];
        var queue = [{ x: startX, y: startY }];
        visited[startY][startX] = true;

        var dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        while (queue.length > 0) {
            var current = queue.shift();
            result.push({ x: current.x, y: current.y });

            for (var i = 0; i < dirs.length; i++) {
                var nx = current.x + dirs[i].dx;
                var ny = current.y + dirs[i].dy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                    if (!visited[ny][nx] && map[ny][nx] !== WALL) {
                        visited[ny][nx] = true;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return result;
    }

    /**
     * Calculate the shortest path length between two points using BFS.
     * Returns -1 if no path exists.
     *
     * @param {number[][]} map
     * @param {number} sx - start x
     * @param {number} sy - start y
     * @param {number} tx - target x
     * @param {number} ty - target y
     * @returns {number}
     */
    function getPathLength(map, sx, sy, tx, ty) {
        if (!map || map.length === 0) return -1;

        var rows = map.length;
        var cols = map[0].length;

        if (sx < 0 || sx >= cols || sy < 0 || sy >= rows) return -1;
        if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) return -1;
        if (map[sy][sx] === WALL || map[ty][tx] === WALL) return -1;

        var visited = [];
        var dist = [];
        for (var y = 0; y < rows; y++) {
            visited[y] = [];
            dist[y] = [];
            for (var x = 0; x < cols; x++) {
                visited[y][x] = false;
                dist[y][x] = -1;
            }
        }

        var queue = [{ x: sx, y: sy }];
        visited[sy][sx] = true;
        dist[sy][sx] = 0;

        var dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        while (queue.length > 0) {
            var current = queue.shift();

            if (current.x === tx && current.y === ty) {
                return dist[ty][tx];
            }

            for (var i = 0; i < dirs.length; i++) {
                var nx = current.x + dirs[i].dx;
                var ny = current.y + dirs[i].dy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                    if (!visited[ny][nx] && map[ny][nx] !== WALL) {
                        visited[ny][nx] = true;
                        dist[ny][nx] = dist[current.y][current.x] + 1;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return -1; // unreachable
    }

    /**
     * Calculate a difficulty score for the map based on size, path density, and features.
     * Higher score = harder maze.
     *
     * @param {number[][]} map
     * @returns {{ score: number, openRatio: number, deadEnds: number, branchPoints: number }}
     */
    function calculateDifficulty(map) {
        if (!map || map.length === 0) {
            return { score: 0, openRatio: 0, deadEnds: 0, branchPoints: 0 };
        }

        var rows = map.length;
        var cols = map[0].length;
        var passableCount = 0;
        var deadEnds = 0;
        var branchPoints = 0;

        var dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (map[y][x] === WALL) continue;
                passableCount++;

                // Count open neighbors
                var openNeighbors = 0;
                for (var i = 0; i < dirs.length; i++) {
                    var nx = x + dirs[i].dx;
                    var ny = y + dirs[i].dy;
                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                        if (map[ny][nx] !== WALL) openNeighbors++;
                    }
                }

                if (openNeighbors === 1) deadEnds++;
                if (openNeighbors >= 3) branchPoints++;
            }
        }

        var totalTiles = rows * cols;
        var openRatio = passableCount / totalTiles;

        // Score: higher for bigger mazes, more dead-ends, fewer branches (less obvious paths)
        var score = Math.round((rows * cols / 100) + deadEnds * 2 - branchPoints + (1 - openRatio) * 20);

        return {
            score: score,
            openRatio: Math.round(openRatio * 100) / 100,
            deadEnds: deadEnds,
            branchPoints: branchPoints
        };
    }

    // ===================================================================
    // Decoration Placement
    // ===================================================================

    /**
     * Place torch tiles on walls adjacent to path tiles.
     *
     * @param {number[][]} map
     * @param {number} count - number of torches to place
     * @returns {Array<{x: number, y: number}>} placed positions
     */
    function placeTorches(map, count) {
        count = count || 5;
        if (!map || map.length === 0) return [];

        var rows = map.length;
        var cols = map[0].length;
        var candidates = [];

        var dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        // Find wall tiles adjacent to path tiles
        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (map[y][x] !== WALL) continue;
                var adjacentPath = false;
                for (var i = 0; i < dirs.length; i++) {
                    var nx = x + dirs[i].dx;
                    var ny = y + dirs[i].dy;
                    if (map[ny][nx] === PATH || map[ny][nx] === ENTRANCE || map[ny][nx] === SPECIAL) {
                        adjacentPath = true;
                        break;
                    }
                }
                if (adjacentPath) {
                    candidates.push({ x: x, y: y });
                }
            }
        }

        // Shuffle candidates
        for (var i = candidates.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = candidates[i];
            candidates[i] = candidates[j];
            candidates[j] = tmp;
        }

        var placed = [];
        var toPlace = Math.min(count, candidates.length);
        for (var i = 0; i < toPlace; i++) {
            var c = candidates[i];
            map[c.y][c.x] = TORCH;
            placed.push(c);
        }

        return placed;
    }

    /**
     * Place lore stone tiles at random special/path positions.
     *
     * @param {number[][]} map
     * @param {Array<{x: number, y: number}>} positions
     * @returns {Array<{x: number, y: number}>}
     */
    function placeLoreStones(map, positions) {
        if (!map || map.length === 0 || !positions) return [];

        var placed = [];
        var rows = map.length;
        var cols = map[0].length;

        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            if (p.y >= 0 && p.y < rows && p.x >= 0 && p.x < cols) {
                if (map[p.y][p.x] === PATH || map[p.y][p.x] === SPECIAL) {
                    map[p.y][p.x] = LORE_STONE;
                    placed.push(p);
                }
            }
        }

        return placed;
    }

    /**
     * Place crystal tiles at random path positions.
     *
     * @param {number[][]} map
     * @param {number} count
     * @returns {Array<{x: number, y: number}>}
     */
    function placeCrystals(map, count) {
        count = count || 3;
        if (!map || map.length === 0) return [];

        var rows = map.length;
        var cols = map[0].length;
        var candidates = [];

        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (map[y][x] === PATH) {
                    candidates.push({ x: x, y: y });
                }
            }
        }

        // Shuffle
        for (var i = candidates.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = candidates[i];
            candidates[i] = candidates[j];
            candidates[j] = tmp;
        }

        var placed = [];
        var toPlace = Math.min(count, candidates.length);
        for (var i = 0; i < toPlace; i++) {
            var c = candidates[i];
            map[c.y][c.x] = CRYSTAL;
            placed.push(c);
        }

        return placed;
    }

    /**
     * Place trap tiles at random path positions.
     *
     * @param {number[][]} map
     * @param {number} count
     * @returns {Array<{x: number, y: number}>}
     */
    function placeTraps(map, count) {
        count = count || 3;
        if (!map || map.length === 0) return [];

        var rows = map.length;
        var cols = map[0].length;
        var candidates = [];

        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (map[y][x] === PATH) {
                    candidates.push({ x: x, y: y });
                }
            }
        }

        // Shuffle
        for (var i = candidates.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = candidates[i];
            candidates[i] = candidates[j];
            candidates[j] = tmp;
        }

        var placed = [];
        var toPlace = Math.min(count, candidates.length);
        for (var i = 0; i < toPlace; i++) {
            var c = candidates[i];
            map[c.y][c.x] = TRAP;
            placed.push(c);
        }

        return placed;
    }

    // ===================================================================
    // Tile Access & Passability
    // ===================================================================

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

    /**
     * Add hidden path tiles to an existing map.
     * @param {number[][]} map
     * @param {number} width
     * @param {number} height
     * @param {Array} hiddenPaths - [{x, y}, ...]
     */
    function addHiddenPaths(map, width, height, hiddenPaths) {
        if (!hiddenPaths) return;
        for (var i = 0; i < hiddenPaths.length; i++) {
            var hp = hiddenPaths[i];
            if (hp.y < height && hp.x < width) {
                map[hp.y][hp.x] = HIDDEN_PATH;
            }
        }
    }

    /**
     * Check if a tile is passable, considering hidden paths and locked doors.
     * @param {number[][]} map
     * @param {number} x
     * @param {number} y
     * @param {boolean} hasFailureFragment - if true, hidden paths are passable
     * @param {string[]} [keysArray] - player's collected key IDs
     * @returns {boolean}
     */
    function isPassable(map, x, y, hasFailureFragment, keysArray) {
        var tile = getTile(map, x, y);
        if (tile === WALL) return false;
        if (tile === BREAKABLE_WALL) return false;
        if (tile === HIDDEN_PATH) return !!hasFailureFragment;
        if (tile === DOOR) {
            var key = doorMap[x + ',' + y];
            if (!key) return true; // unlocked door
            if (!keysArray) return false;
            for (var i = 0; i < keysArray.length; i++) {
                if (keysArray[i] === key.keyId) return true;
            }
            return false;
        }
        if (tile === WATER) return false;
        return true;
    }

    /**
     * Check if a door tile is locked.
     * @param {number[][]} map
     * @param {number} x
     * @param {number} y
     * @param {string[]} [keysArray]
     * @returns {boolean}
     */
    function isDoorLocked(map, x, y, keysArray) {
        var tile = getTile(map, x, y);
        if (tile !== DOOR) return false;
        var key = doorMap[x + ',' + y];
        if (!key) return false;
        if (!keysArray) return true;
        for (var i = 0; i < keysArray.length; i++) {
            if (keysArray[i] === key.keyId) return false;
        }
        return true;
    }

    /**
     * Unlock a door by changing it to PATH.
     * @param {number[][]} map
     * @param {number} x
     * @param {number} y
     */
    function unlockDoor(map, x, y) {
        if (getTile(map, x, y) === DOOR) {
            map[y][x] = PATH;
            delete doorMap[x + ',' + y];
        }
    }

    /**
     * Get door metadata (keyId) before unlocking.
     * @param {number[][]} map
     * @param {number} x
     * @param {number} y
     * @returns {object|null} { keyId } or null
     */
    function getDoorInfo(map, x, y) {
        return doorMap[x + ',' + y] || null;
    }

    // ===================================================================
    // Map Expansion
    // ===================================================================

    /**
     * Expand an existing map by adding border regions and generating new maze paths.
     * The old map is placed at the center of the new larger grid.
     * Connections are carved between old and new areas.
     *
     * @param {number[][]} grid - current map
     * @param {number} cols - current width
     * @param {number} rows - current height
     * @param {number} expandCols - extra cols per side (must be even)
     * @param {number} expandRows - extra rows per side (must be even)
     * @returns {{ grid: number[][], offsetX: number, offsetY: number, newCols: number, newRows: number }}
     */
    function expandMap(grid, cols, rows, expandCols, expandRows) {
        var newCols = cols + expandCols * 2;
        var newRows = rows + expandRows * 2;

        // Create new grid filled with walls
        var newGrid = [];
        for (var y = 0; y < newRows; y++) {
            newGrid[y] = [];
            for (var x = 0; x < newCols; x++) {
                newGrid[y][x] = WALL;
            }
        }

        // Copy old map into center of new grid
        var offX = expandCols;
        var offY = expandRows;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                newGrid[y + offY][x + offX] = grid[y][x];
            }
        }

        // Generate new maze paths in border regions using DFS
        var visited = [];
        for (var y = 0; y < newRows; y++) {
            visited[y] = [];
            for (var x = 0; x < newCols; x++) {
                visited[y][x] = false;
            }
        }

        // Mark old map area as visited to prevent overwriting
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                visited[y + offY][x + offX] = true;
            }
        }

        // DFS directions
        var directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 }
        ];

        // Start DFS from odd-coordinate border cells
        var stack = [];
        for (var y = 1; y < newRows - 1; y += 2) {
            for (var x = 1; x < newCols - 1; x += 2) {
                if (!visited[y][x]) {
                    visited[y][x] = true;
                    newGrid[y][x] = PATH;
                    stack.push({ x: x, y: y });

                    while (stack.length > 0) {
                        var current = stack[stack.length - 1];
                        var neighbors = [];

                        for (var i = 0; i < directions.length; i++) {
                            var nx = current.x + directions[i].dx;
                            var ny = current.y + directions[i].dy;

                            if (nx > 0 && nx < newCols - 1 && ny > 0 && ny < newRows - 1) {
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
                            newGrid[next.y][next.x] = PATH;
                            newGrid[next.wy][next.wx] = PATH;
                            stack.push({ x: next.x, y: next.y });
                        } else {
                            stack.pop();
                        }
                    }
                }
            }
        }

        // Carve connections between old map edges and new border paths
        // Top edge
        for (var x = 1; x < cols - 1; x += 4) {
            var edgeY = offY;
            if (newGrid[edgeY - 1] && newGrid[edgeY - 1][x + offX] !== undefined) {
                newGrid[edgeY - 1][x + offX] = PATH;
            }
        }
        // Bottom edge
        for (var x = 1; x < cols - 1; x += 4) {
            var edgeY = offY + rows - 1;
            if (newGrid[edgeY + 1] && newGrid[edgeY + 1][x + offX] !== undefined) {
                newGrid[edgeY + 1][x + offX] = PATH;
            }
        }
        // Left edge
        for (var y = 1; y < rows - 1; y += 4) {
            var edgeX = offX;
            newGrid[y + offY][edgeX - 1] = PATH;
        }
        // Right edge
        for (var y = 1; y < rows - 1; y += 4) {
            var edgeX = offX + cols - 1;
            newGrid[y + offY][edgeX + 1] = PATH;
        }

        return {
            grid: newGrid,
            offsetX: offX,
            offsetY: offY,
            newCols: newCols,
            newRows: newRows
        };
    }

    // ===================================================================
    // Map Stats & Debug
    // ===================================================================

    /**
     * Get statistics about a map's tile distribution.
     *
     * @param {number[][]} map
     * @returns {{ width: number, height: number, totalTiles: number, tileCounts: object }}
     */
    function getMapStats(map) {
        if (!map || map.length === 0) {
            return { width: 0, height: 0, totalTiles: 0, tileCounts: {} };
        }

        var rows = map.length;
        var cols = map[0].length;
        var totalTiles = rows * cols;
        var tileCounts = {};

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var t = map[y][x];
                tileCounts[t] = (tileCounts[t] || 0) + 1;
            }
        }

        return {
            width: cols,
            height: rows,
            totalTiles: totalTiles,
            tileCounts: tileCounts
        };
    }

    /**
     * Print a text representation of the map for debugging.
     *
     * @param {number[][]} map
     * @returns {string}
     */
    function printMap(map) {
        if (!map || map.length === 0) return '';

        var chars = {
            0: '#',
            1: '.',
            2: 'D',
            3: 'S',
            4: 'E',
            5: '>',
            6: '~',
            7: 'W',
            8: '=',
            9: '!',
            10: 'O',
            11: 'T',
            12: 'L',
            13: 'B',
            14: 'C'
        };

        var lines = [];
        for (var y = 0; y < map.length; y++) {
            var line = '';
            for (var x = 0; x < map[y].length; x++) {
                line += chars[map[y][x]] || '?';
            }
            lines.push(line);
        }

        return lines.join('\n');
    }

    // ===================================================================
    // Exports
    // ===================================================================

    return {
        // Core generation
        generate: generate,
        generatePrim: generatePrim,
        generateKruskal: generateKruskal,
        generateWithRooms: generateWithRooms,

        // Room system
        ROOM_TEMPLATES: ROOM_TEMPLATES,
        placeRoom: placeRoom,

        // Tile access & passability
        getTile: getTile,
        addHiddenPaths: addHiddenPaths,
        isPassable: isPassable,
        isDoorLocked: isDoorLocked,
        unlockDoor: unlockDoor,
        getDoorInfo: getDoorInfo,

        // Tile constants
        WALL: WALL,
        PATH: PATH,
        DOOR: DOOR,
        SPECIAL: SPECIAL,
        EXIT: EXIT,
        ENTRANCE: ENTRANCE,
        HIDDEN_PATH: HIDDEN_PATH,
        WATER: WATER,
        BRIDGE: BRIDGE,
        TRAP: TRAP,
        PRESSURE_PLATE: PRESSURE_PLATE,
        TORCH: TORCH,
        LORE_STONE: LORE_STONE,
        BREAKABLE_WALL: BREAKABLE_WALL,
        CRYSTAL: CRYSTAL,

        // Map expansion
        expandMap: expandMap,

        // Map analysis
        isFullyConnected: isFullyConnected,
        getReachableTiles: getReachableTiles,
        getPathLength: getPathLength,
        calculateDifficulty: calculateDifficulty,

        // Decoration placement
        placeTorches: placeTorches,
        placeLoreStones: placeLoreStones,
        placeCrystals: placeCrystals,
        placeTraps: placeTraps,

        // Stats & debug
        getMapStats: getMapStats,
        printMap: printMap
    };
})();
