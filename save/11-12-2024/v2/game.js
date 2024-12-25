class Character {
    constructor(name, hp, attackPower, mana, defense = 0, level = 1, exp = 0, gold = 0) {
        this.name = name;
        this.hp = hp;
        this.attackPower = attackPower;
        this.mana = mana;
        this.defense = defense;
        this.level = level;
        this.exp = exp;
        this.gold = gold;
        this.inventory = [];
    }

    attack(target) {
        const damage = Math.floor(Math.random() * this.attackPower);
        target.takeDamage(damage);
        return damage;
    }

    takeDamage(damage) {
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
                this.attackPower += 10;
            } else if (item.effect === "defenseBuff") {
                this.defense += 5;
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

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.level * 100) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.hp += 20;
        this.attackPower += 5;
        this.defense += 2;
        this.exp = 0;
        document.getElementById("message").textContent = `${this.name} a atteint le niveau ${this.level}!`;
        updateGameStatus();
    }

    gainGold(amount) {
        this.gold += amount;
        updateGameStatus();
    }
}

class Monster extends Character {
    constructor(name, hp, attackPower, mana, level) {
        super(name, hp, attackPower, mana, 0, level);
    }

    attack(target) {
        const damage = Math.floor(Math.random() * this.attackPower);
        target.takeDamage(damage);
        return damage;
    }

    dropGold() {
        return Math.floor(Math.random() * 20) + 10;
    }

    dropExp() {
        return this.level * 10;
    }
}

class Item {
    constructor(name, effect, price = 0) {
        this.name = name;
        this.effect = effect;
        this.price = price;
    }
}

class Map {
    constructor() {
        this.grid = [
            [null, new Monster("Gobelin", 50, 10, 20, 1), null, null, new Item("Potion de Soin", "heal")],
            [null, null, new Item("Potion de Mana", "mana"), new Monster("Orc", 80, 20, 40, 2), new Item("Potion d'Attaque", "attackBuff")],
            [new Item("Potion de Mana", "mana"), new Monster("Troll", 500, 10, 10, 5), null, new Item("Potion de Défense", "defenseBuff"), new Item("Potion de Soin", "heal")],
            [new Item("Potion de Soin", "heal"), new Monster("Dragon", 200, 50, 100, 10), null, null, new Item("Marché", "market")],
            [null, null, new Monster("Golem", 150, 40, 60, 3), new Item("Potion de Soin", "heal"), new Item("Potion de Soin", "heal")],
        ];

        this.playerPosition = { x: 0, y: 0 };
        this.monster = null;
        this.marketItems = [
            new Item("Potion de Soin", "heal", 20),
            new Item("Potion de Mana", "mana", 15),
            new Item("Potion d'Attaque", "attackBuff", 25)
        ];
    }

    move(direction) {
        if (direction === "up" && this.playerPosition.x > 0) this.playerPosition.x--;
        if (direction === "down" && this.playerPosition.x < this.grid.length - 1) this.playerPosition.x++;
        if (direction === "left" && this.playerPosition.y > 0) this.playerPosition.y--;
        if (direction === "right" && this.playerPosition.y < this.grid[0].length - 1) this.playerPosition.y++;

        const tile = this.getCurrentTile();
        this.monster = tile instanceof Monster ? tile : null;

        if (tile && tile.effect === "market") {
            this.showMarket();
        }

        renderMap();
    }

    getCurrentTile() {
        return this.grid[this.playerPosition.x][this.playerPosition.y];
    }

    pickItem() {
        const tile = this.getCurrentTile();
        if (tile instanceof Item) {
            if (tile.effect !== "market") {
                player.addItemToInventory(tile);
                this.grid[this.playerPosition.x][this.playerPosition.y] = null;
                document.getElementById("message").textContent = `Vous avez ramassé ${tile.name}.`;
                updateGameStatus();
            }
        } else {
            document.getElementById("message").textContent = "Il n'y a pas d'objet ici.";
        }
    }

    showMarket() {
        const marketDiv = document.getElementById("market");
        marketDiv.innerHTML = "<h3>Marché</h3>";

        this.marketItems.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.textContent = `${item.name} (${item.effect}) - ${item.price} pièces d'or`;
            const buyButton = document.createElement("button");
            buyButton.textContent = "Acheter";
            buyButton.onclick = () => this.buyItem(item);
            itemDiv.appendChild(buyButton);
            marketDiv.appendChild(itemDiv);
        });
    }

    buyItem(item) {
        if (player.gold >= item.price) {
            player.gold -= item.price;
            player.addItemToInventory(item);
            document.getElementById("message").textContent = `Vous avez acheté ${item.name}.`;
            updateGameStatus();
        } else {
            document.getElementById("message").textContent = "Vous n'avez pas assez d'or pour acheter cet objet.";
        }
    }

    checkMonsterDefeated() {
        const position = this.playerPosition;
        const tile = this.grid[position.x][position.y];
        if (tile instanceof Monster && !tile.isAlive()) {
            this.grid[position.x][position.y] = null;
            this.monster = null;
            document.getElementById("message").textContent = `${tile.name} est vaincu !`;
            player.gainExp(tile.dropExp());
            player.gainGold(tile.dropGold());
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
let player = new Character("Héros", 100, 200, 100, 1, 1, 0, 0);
let map = new Map();

function updateGameStatus() {
    const status = `Joueur: ${player.hp} HP | Mana: ${player.mana} | Défense: ${player.defense} | Attaque: ${player.attackPower} | Niveau: ${player.level} | Exp: ${player.exp} | Or: ${player.gold} | Ennemi: ${map.monster ? map.monster.hp : 'Aucun'} HP`;
    document.getElementById("gameStatus").textContent = status;

    if (map.monster && !map.monster.isAlive()) {
        map.checkMonsterDefeated();
        enableActions(); // Réactive les actions après la victoire du monstre
    } else if (!player.isAlive()) {
        document.getElementById("message").textContent = "Vous avez perdu !";
        disableActions(); // Désactive les actions après la défaite du joueur
    } else {
        document.getElementById("message").textContent = "C'est votre tour d'attaquer !";
        enableActions(); // Assurez-vous que les actions sont disponibles lorsque le joueur est vivant
    }
}

function disableActions() {
    document.getElementById("playerAttack").disabled = true;
    document.getElementById("pickItem").disabled = true;
}

function enableActions() {
    document.getElementById("playerAttack").disabled = false;
    document.getElementById("pickItem").disabled = false;
}

function renderMap() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";

    for (let x = 0; x < map.grid.length; x++) {
        for (let y = 0; y < map.grid[x].length; y++) {
            const tile = map.grid[x][y];
            const tileElement = document.createElement("div");
            tileElement.classList.add("tile");

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
    event.preventDefault();
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
        case "a":
            if (map.monster && map.monster.isAlive()) {
                const damage = player.attack(map.monster);
                document.getElementById("message").textContent = `Vous attaquez ${map.monster.name} et infligez ${damage} dégâts !`;
                map.monsterAttack();
                updateGameStatus();
            }
            break;
        case "e":
            map.pickItem();
            renderMap();
            updateGameStatus();
            break;
        default:
            break;
    }
});

window.onload = function() {
    // Attacher les événements aux boutons
    document.getElementById("playerAttack").addEventListener("click", playerAttackHandler);
    document.getElementById("pickItem").addEventListener("click", pickItemHandler);

    // Fonction pour attaquer le monstre
    function playerAttackHandler() {
        if (map.monster && map.monster.isAlive()) {
            const damage = player.attack(map.monster);
            document.getElementById("message").textContent = `Vous attaquez ${map.monster.name} et infligez ${damage} dégâts !`;
            map.monsterAttack();
            updateGameStatus();
        }
    }

    // Fonction pour ramasser l'objet
    function pickItemHandler() {
        map.pickItem();
        renderMap();
        updateGameStatus();
    }
};


// Initialisation de l'affichage de la carte et de l'état du jeu
renderMap();
updateGameStatus();
