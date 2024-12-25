class Character {
    constructor(name, hp, attackPower, mana, defense = 0) {
        this.name = name;
        this.hp = hp;
        this.attackPower = attackPower;
        this.mana = mana;
        this.defense = defense;  // Nouveau attribut pour la défense
        this.inventory = [];
    }

    attack(target) {
        const damage = Math.floor(Math.random() * this.attackPower);
        target.takeDamage(damage);
        return damage;
    }

    takeDamage(damage) {
        // Applique la défense
        const actualDamage = Math.max(damage - this.defense, 0); 
        this.hp -= actualDamage;
        if (this.hp < 0) this.hp = 0;
    }

    isAlive() {
        return this.hp > 0;
    }

    addItemToInventory(item) {
        this.inventory.push(item);
        updateInventoryDisplay();
    }

    useItem(item) {
        if (this.inventory.includes(item)) {
            if (item.effect === "heal") {
                this.hp += 30;
                if (this.hp > 100) this.hp = 100;
            } else if (item.effect === "mana") {
                this.mana += 30;
                if (this.mana > 100) this.mana = 100;
            } else if (item.effect === "attackBuff") {
                this.attackPower += 10;  // Augmenter la puissance d'attaque
            } else if (item.effect === "defenseBuff") {
                this.defense += 5;  // Augmenter la défense
            }
            this.removeItemFromInventory(item);
            updateGameStatus();
            updateInventoryDisplay();
        }
    }

    removeItemFromInventory(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
            updateInventoryDisplay();
        }
    }
}

class Item {
    constructor(name, effect) {
        this.name = name;
        this.effect = effect;
    }
}

class Monster extends Character {
    constructor(name, hp, attackPower, mana) {
        super(name, hp, attackPower, mana);
    }

    attack(target) {
        const damage = Math.floor(Math.random() * this.attackPower);
        target.takeDamage(damage);
        return damage;
    }
}

class Map {
    constructor() {
        this.grid = [
            [null, new Monster("Gobelin", 50, 10, 20), null, null, new Item("Potion de Soin", "heal")],
            [null, null, new Item("Potion de Mana", "mana"), new Monster("Orc", 80, 20, 40), new Item("Potion d'Attaque", "attackBuff")],
            [new Item("Potion de Mana", "mana"), new Monster("Troll", 500, 10, 10), null, new Item("Potion de Défense", "defenseBuff"), new Item("Potion de Soin", "heal")],
            [new Item("Potion de Soin", "heal"), new Monster("Dragon", 200, 50, 100), null, null, null],
            [null, null, new Monster("Golem", 150, 40, 60), new Item("Potion de Soin", "heal"), new Item("Potion de Soin", "heal")],
            [null, new Monster("Dragon", 2000, 10, 10), null, null, null],
            [new Item("Potion de Soin", "heal"), null, new Item("Potion de Mana", "mana"), new Monster("monstre des mers", 18000, 1, 1), new Item("Potion d'Attaque", "attackBuff")],
        ];

        this.playerPosition = { x: 0, y: 0 }; // Initialisation de la position du joueur
        this.monster = null;
    }

    move(direction) {
        if (direction === "up" && this.playerPosition.x > 0) this.playerPosition.x--;
        if (direction === "down" && this.playerPosition.x < this.grid.length - 1) this.playerPosition.x++;
        if (direction === "left" && this.playerPosition.y > 0) this.playerPosition.y--;
        if (direction === "right" && this.playerPosition.y < this.grid[0].length - 1) this.playerPosition.y++;

        // Mettre à jour le monstre actif après déplacement
        const tile = this.getCurrentTile();
        this.monster = tile instanceof Monster ? tile : null;

        renderMap(); // Met à jour la carte après déplacement
    }

    getCurrentTile() {
        return this.grid[this.playerPosition.x][this.playerPosition.y];
    }

    pickItem() {
        const tile = this.getCurrentTile();
        if (tile instanceof Item) {
            player.addItemToInventory(tile);
            this.grid[this.playerPosition.x][this.playerPosition.y] = null;
            document.getElementById("message").textContent = `Vous avez ramassé ${tile.name}.`;
            updateGameStatus();
        } else {
            document.getElementById("message").textContent = "Il n'y a pas d'objet ici.";
        }
    }

    checkMonsterDefeated() {
        const position = this.playerPosition;
        const tile = this.grid[position.x][position.y];
        if (tile instanceof Monster && !tile.isAlive()) {
            this.grid[position.x][position.y] = null;
            this.monster = null;
            document.getElementById("message").textContent = `${tile.name} est vaincu !`;
        }
    }

    monsterAttack() {
        if (this.monster && this.monster.isAlive()) {
            const damage = this.monster.attack(player);
            document.getElementById("message").textContent = `Le monstre attaque et inflige ${damage} dégâts !`;
            updateGameStatus();
        }
    }
}

// Initialisation des objets
let player = new Character("Héros", 100, 200, 100, 1);
let map = new Map();

function updateGameStatus() {
    const status = `Joueur: ${player.hp} HP | Mana: ${player.mana} | Défense: ${player.defense} | Attaque: ${player.attackPower} | Ennemi: ${map.monster ? map.monster.hp : 'Aucun'} HP`;
    document.getElementById("gameStatus").textContent = status;

    if (map.monster && !map.monster.isAlive()) {
        map.checkMonsterDefeated();
    } else if (!player.isAlive()) {
        document.getElementById("message").textContent = "Vous avez perdu !";
        disableActions();
    } else {
        document.getElementById("message").textContent = "C'est votre tour d'attaquer !";
    }
}

function disableActions() {
    document.getElementById("playerAttack").disabled = true;
    document.getElementById("pickItem").disabled = true;
}

function renderMap() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = ""; // Efface l'ancienne carte

    // Remplir la grille avec les éléments
    for (let x = 0; x < map.grid.length; x++) {
        for (let y = 0; y < map.grid[x].length; y++) {
            const tile = map.grid[x][y];
            const tileElement = document.createElement("div");
            tileElement.classList.add("tile");

            // Afficher le joueur à sa nouvelle position
            if (x === map.playerPosition.x && y === map.playerPosition.y) {
                tileElement.classList.add("player");
                tileElement.textContent = player.name;
            } else if (tile instanceof Monster) {
                tileElement.classList.add("monster");
                tileElement.textContent = tile.name;
            } else if (tile instanceof Item) {
                tileElement.classList.add("item");
                tileElement.textContent = tile.name;
            }

            gameBoard.appendChild(tileElement);
        }
    }
}

function updateInventoryDisplay() {
    const inventoryDiv = document.getElementById("inventory");
    inventoryDiv.innerHTML = "";

    if (player.inventory.length === 0) {
        inventoryDiv.textContent = "Votre inventaire est vide.";
    } else {
        player.inventory.forEach((item) => {
            const itemDiv = document.createElement("div");
            itemDiv.textContent = `${item.name} (${item.effect})`;
            const useButton = document.createElement("button");
            useButton.textContent = "Utiliser";
            useButton.onclick = () => player.useItem(item);
            itemDiv.appendChild(useButton);
            inventoryDiv.appendChild(itemDiv);
        });
    }
}

// Boutons de déplacement
document.getElementById("moveUp").addEventListener("click", () => {
    map.move("up");
});

document.getElementById("moveDown").addEventListener("click", () => {
    map.move("down");
});

document.getElementById("moveLeft").addEventListener("click", () => {
    map.move("left");
});

document.getElementById("moveRight").addEventListener("click", () => {
    map.move("right");
});

// Écouteur des touches du clavier pour le déplacement
document.addEventListener("keydown", (event) => {
    event.preventDefault(); // Empêche le comportement par défaut du navigateur
    switch (event.key) {
        case "ArrowUp":
            map.move("up");
            break;
        case "ArrowDown":
            map.move("down");
            break;
        case "ArrowLeft":
            map.move("left");
            break;
        case "ArrowRight":
            map.move("right");
            break;
        case "a": // Touche pour attaquer
            if (map.monster && map.monster.isAlive()) {
                const damage = player.attack(map.monster);
                document.getElementById("message").textContent = `Vous attaquez ${map.monster.name} et infligez ${damage} dégâts !`;
                map.monsterAttack();
                updateGameStatus();
            }
            break;
        case "e": // Touche pour ramasser un objet
            map.pickItem();
            renderMap();
            updateGameStatus();
            break;
        default:
            break;
    }
});

// Initialiser l'affichage de la carte
renderMap();

document.getElementById("playerAttack").addEventListener("click", () => {
    if (map.monster && map.monster.isAlive()) {
        const damage = player.attack(map.monster);
        document.getElementById("message").textContent = `Vous attaquez ${map.monster.name} et infligez ${damage} dégâts !`;
        map.monsterAttack();
        updateGameStatus();
    }
});

document.getElementById("pickItem").addEventListener("click", () => {
    map.pickItem();
    renderMap();
    updateGameStatus();
});

updateGameStatus();
updateInventoryDisplay();
