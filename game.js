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

// Exemple de fonction pour afficher une image du monstre ou de l'objet
function displayItemOrMonsterImage(imageUrl) {
    const imageElement = document.getElementById('itemOrMonsterImage');
    imageElement.src = imageUrl;
}

// Exemple d'appel pour afficher un monstre ou un objet spécifique
// Par exemple, si un monstre est rencontré
function encounterMonster() {
    const monsterImage = 'images/gobelin.png'; // Remplacez par le chemin de votre image de monstre
    displayItemOrMonsterImage(monsterImage);
}

// Exemple d'appel si un objet est à ramasser
function findItem() {
    const itemImage = 'path/to/item-image.jpg'; // Remplacez par le chemin de votre image d'objet
    displayItemOrMonsterImage(itemImage);
}

// Utilisez ces fonctions selon les actions dans votre jeu


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
            [null, new Monster("Gobelin", 50, 10, 20, 1), null, new Monster("monstre dragon", 5000, 10, 20, 1), new Item("Potion de Soin", "heal")],
            [null, null, new Item("Potion de Mana", "mana"), new Monster("démon", 80, 20, 40, 2), new Item("Potion d'Attaque", "attackBuff")],
            [new Item("Potion de Mana", "mana"), new Monster("Troll", 500, 10, 10, 5), null, new Item("Potion de Défense", "defenseBuff"), new Item("Potion de Soin", "heal")],
            [new Item("Potion de Soin", "heal"), new Monster("roi démon", 200, 50, 100, 10), null, null, new Item("Marché", "market")],
            [new Monster("monstre lion", 5000, 10, 20, 1), null, new Monster("Monstre lvl 1", 150000, 5, 2, 3), new Item("Potion de Soin", "heal"), new Item("Potion de Soin", "heal")],
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
        if (combatActive) {
            document.getElementById("message").textContent = "Vous êtes en combat et ne pouvez pas vous déplacer !";
            return;
        }

        if (direction === "up" && this.playerPosition.x > 0) this.playerPosition.x--;
        if (direction === "down" && this.playerPosition.x < this.grid.length - 1) this.playerPosition.x++;
        if (direction === "left" && this.playerPosition.y > 0) this.playerPosition.y--;
        if (direction === "right" && this.playerPosition.y < this.grid[0].length - 1) this.playerPosition.y++;

        const tile = this.getCurrentTile();
        this.monster = tile instanceof Monster ? tile : null;

        if (tile && tile.effect === "market") {
            this.showMarket();
        } else {
            this.hideMarket();
        }

        renderMap();
        checkForCombat();
    }

    getCurrentTile() {
        return this.grid[this.playerPosition.x][this.playerPosition.y];
    }

    pickItem() {
        if (combatActive) {
            document.getElementById("message").textContent = "Vous êtes en combat et ne pouvez pas ramasser d'objet !";
            return;
        }

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

    hideMarket() {
        const marketDiv = document.getElementById("market");
        marketDiv.innerHTML = "<h3>Marché</h3>";
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
    
        // Vérifie si la case actuelle contient un monstre et si ce dernier est vaincu
        if (tile instanceof Monster && !tile.isAlive()) {
            // Si le monstre est vaincu, on enlève le monstre de la grille
            this.grid[position.x][position.y] = null;
            this.monster = null;
    
            // Message de victoire du joueur
            document.getElementById("message").textContent = `${tile.name} est vaincu !`;
    
            // Le joueur gagne de l'expérience et de l'or en fonction du monstre
            player.gainExp(tile.dropExp());
            player.gainGold(tile.dropGold());
    
            // Réactiver les déplacements et les actions du joueur après la victoire
            enableMovement();
            enableActions();
    
            // Mettre à jour l'affichage de l'état du jeu
            updateGameStatus();
        }
    }
    

    monsterAttack() {
        if (this.monster && this.monster.isAlive()) {
            const damage = this.monster.attack(player);
            document.getElementById("message").textContent = `Le ${this.monster.name} riposte et inflige ${damage} dégâts !`;
            updateGameStatus();
        }
    }

    checkForCombat() {
        const tile = this.getCurrentTile();
        if (tile instanceof Monster && tile.isAlive()) {
            engageCombat(tile);
        }
    }
}

// Initialisation des objets
let player = new Character("Héro", 100, 50, 50, 500, 1, 0, 100);
let map = new Map();

let combatActive = false; // Indique si un combat est en cours

// Fonction pour gérer le début du combat
function engageCombat(monster) {
    combatActive = true;
    document.getElementById("message").textContent = `Un ${monster.name} apparaît ! Combattez ou fuyez.`;
    updateGameStatus();

    // Désactiver les déplacements
    disableMovement();

    // Afficher les boutons de combat
    showCombatControls();
}

function disableMovement() {
    document.getElementById("moveUp").disabled = true;
    document.getElementById("moveDown").disabled = true;
    document.getElementById("moveLeft").disabled = true;
    document.getElementById("moveRight").disabled = true;
    document.getElementById("pickItem").disabled = true;
}

function enableMovement() {
    document.getElementById("moveUp").disabled = false;
    document.getElementById("moveDown").disabled = false;
    document.getElementById("moveLeft").disabled = false;
    document.getElementById("moveRight").disabled = false;
    document.getElementById("pickItem").disabled = false;
}


function showCombatControls() {
    document.getElementById("combatControls").style.display = "block";
}

function hideCombatControls() {
    document.getElementById("combatControls").style.display = "none";
}

// Fonction pour fuir le combat
function attemptEscape(monster) {
    const success = Math.random() > 0.5; // 50% de chances de s'échapper
    if (success) {
        document.getElementById("message").textContent = `Vous avez réussi à fuir le ${monster.name} !`; 
        combatActive = false;
        enableMovement();
        hideCombatControls();
    } else {
        const damage = Math.floor(Math.random() * 10) + 5;
        player.takeDamage(damage);
        document.getElementById("message").textContent = `Vous avez échoué à fuir et subissez ${damage} dégâts !`;
        if (!player.isAlive()) {
            document.getElementById("message").textContent = "Vous êtes mort en essayant de fuir !";
            disableActions();
        } else {
            // Le monstre attaque après une tentative échouée
            monster.attack(player);
            document.getElementById("message").textContent += ` Le ${monster.name} riposte et inflige des dégâts !`;
        }
    }
    updateGameStatus();
}

// Fonction pour attaquer un monstre  
function attackMonster(monster) {
    if (combatActive && monster.isAlive()) {
        const damage = player.attack(monster);
        document.getElementById("message").textContent = `Vous attaquez ${monster.name} et infligez ${damage} dégâts !`;

        // Ajoutez l'animation de mouvement  
        const playerDisplay = document.getElementById("rightPanel");  // Assurez-vous que cet ID est correct  
        playerDisplay.classList.add("character-move");
        playerDisplay.classList.add("damage-animation");

        // Créer un effet de particules  
        createParticles();

        // Vérification si le monstre est vaincu  
        if (!monster.isAlive()) {
            document.getElementById("message").textContent += ` ${monster.name} est vaincu !`;
            player.gainExp(monster.dropExp());
            player.gainGold(monster.dropGold());
            combatActive = false;
            enableMovement();
            hideCombatControls();
            map.checkMonsterDefeated();
        } else {
            // Le monstre riposte  
            const damageFromMonster = monster.attack(player);
            document.getElementById("message").textContent += ` Le ${monster.name} riposte et inflige ${damageFromMonster} dégâts !`;
            
            // Ajoutez une animation de pulsation sur la barre de vie  
            document.getElementById("playerHP").classList.add("hp-pulse");

            // Vérifie si le joueur est toujours en vie après l'attaque du monstre  
            if (!player.isAlive()) {
                document.getElementById("message").textContent = "Vous êtes mort !";
                disableActions();
            }
        }
        
        updateGameStatus();

        // Retirez la classe d'animation après un délai pour permettre la réapplication  
        setTimeout(() => {
            playerDisplay.classList.remove("character-move");
        }, 500); // Durée de l'animation  
    }
}


// Fonction pour créer des particules  
function createParticles() {
    const particleCount = 10; // Nombre de particules à créer  
    const gameBoard = document.getElementById("gameBoard");

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Positionner au hasard  
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        gameBoard.appendChild(particle);

        // Retirer la particule après l'animation  
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}


// Fonction pour mettre à jour l'affichage de la carte
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
                if (tile instanceof Monster && tile.isAlive() && !combatActive) {
                    engageCombat(tile);
                }
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

// Fonction pour mettre à jour le statut du jeu avec sécurité pour l'accès aux objets
function updateGameStatus() {
    const playerAlive = player && player.isAlive(); // Vérifie que le joueur est vivant
    const monsterAlive = map.monster && map.monster.isAlive(); // Vérifie que le monstre est vivant

    // Mise à jour du statut avec les informations du joueur et de l'ennemi
    const status = `Ennemi: ${monsterAlive ? map.monster.hp : 'Aucun'} HP`;
    document.getElementById("gameStatus").textContent = status;
    // Mise à jour des statistiques du joueur  
    document.getElementById("playerName").textContent = player.name;
    document.getElementById("playerHP").textContent = player.hp;
    document.getElementById("playerMana").textContent = player.mana;
    document.getElementById("playerAttackPower").textContent = player.attackPower;
    document.getElementById("playerDefense").textContent = player.defense;
    document.getElementById("playerLevel").textContent = player.level;
    document.getElementById("playerExp").textContent = `${player.exp}`;
    document.getElementById("playerGold").textContent = player.gold;

    // Autres mises à jour de statut, par exemple pour vérifier si le joueur est vivant ou non  
    if (!player.isAlive()) {
        document.getElementById("message").textContent = "Vous êtes mort !";
        disableActions();
    }

    // Si le monstre est vivant et que le combat est toujours actif
    if (monsterAlive) {
        // Si le monstre est encore vivant, le message est adapté au combat
        if (!map.monster.isAlive()) {
            map.checkMonsterDefeated();
            enableActions(); // Réactive les actions après la victoire du monstre
            document.getElementById("message").textContent = `${map.monster.name} est vaincu !`;
        }
    } else if (!playerAlive) {
        // Si le joueur est mort
        document.getElementById("message").textContent = "Vous avez perdu !";
        disableActions(); // Désactive les actions après la défaite du joueur
    } else {
        // Ne pas afficher le message "C'est votre tour d'attaquer !" si le combat est terminé
        if (!combatActive) {
            enableActions(); // Réactive les actions lorsque le joueur est vivant et hors combat
        }
    }
}

function removeAnimationClasses() {
    const playerDisplay = document.getElementById("gameBoard"); // Supposons que le joueur soit affiché ici  
    playerDisplay.classList.remove("attack-animation");

    document.getElementById("playerHP").classList.remove("damage-animation");
}

// Appeler cette fonction après l'attaque  
setTimeout(removeAnimationClasses, 500); // Attendre la durée de l'animation


function disableActions() {
    document.getElementById("playerAttack").disabled = true;
    document.getElementById("pickItem").disabled = true;
}

function enableActions() {
    document.getElementById("playerAttack").disabled = false;
    document.getElementById("pickItem").disabled = false;
}

// Fonction pour gérer les actions de combat
window.onload = function() {
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

    // Boutons de combat
    document.getElementById("attackMonster").addEventListener("click", () => {
        if (map.monster) attackMonster(map.monster);
    });

    document.getElementById("flee").addEventListener("click", () => {
        if (map.monster) attemptEscape(map.monster);
    });

    // Bouton de ramassage d'objet
    document.getElementById("pickItem").addEventListener("click", () => {
        map.pickItem();
        renderMap();
        updateGameStatus();
    });

    // Écouteur des touches du clavier pour le déplacement et les actions
    document.addEventListener("keydown", (event) => {
        if (combatActive) {
            // Si en combat, seules les touches de combat sont actives
            switch (event.key) {
                case "a":
                    if (map.monster && map.monster.isAlive()) {
                        attackMonster(map.monster);
                    }
                    break;
                case "e":
                    if (map.monster && map.monster.isAlive()) {
                        attemptEscape(map.monster);
                    }
                    break;
                default:
                    break;
            }
        } else {
            // Si pas en combat, les déplacements et actions normales sont actives
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
                        engageCombat(map.monster);
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
        }
    });

    renderMap();
    updateGameStatus();
};


// Function to display an image for the encountered monster or item
function displayItemOrMonsterImage(imageUrl, altText = '') {
    const imagePanel = document.getElementById('itemOrMonsterImage');
    if (imagePanel) {
        imagePanel.src = imageUrl;
        imagePanel.alt = altText;
        imagePanel.style.display = 'block';
    }
}

// Function to clear the image display
function clearItemOrMonsterImage() {
    const imagePanel = document.getElementById('itemOrMonsterImage');
    if (imagePanel) {
        imagePanel.src = '';
        imagePanel.alt = '';
        imagePanel.style.display = 'none';
    }
}

// Update engageCombat to include monster image display
function engageCombat(monster) {
    combatActive = true;
    document.getElementById("message").textContent = `Un ${monster.name} apparaît ! Combattez ou fuyez.`;

    // Display monster image
    const monsterImage = `images/${monster.name.toLowerCase()}.png`; // Ex. 'images/gobelin.png'
    displayItemOrMonsterImage(monsterImage, monster.name);

    updateGameStatus();
    disableMovement();
    showCombatControls();
}


// Update pickItem to include item image display
Map.prototype.pickItem = function () {
    if (combatActive) {
        document.getElementById("message").textContent = "Vous êtes en combat et ne pouvez pas ramasser d'objet !";
        return;
    }

    const tile = this.getCurrentTile();
    if (tile instanceof Item) {
        if (tile.effect !== "market") {
            player.addItemToInventory(tile);
            this.grid[this.playerPosition.x][this.playerPosition.y] = null;
            document.getElementById("message").textContent = `Vous avez ramassé ${tile.name}.`;

            // Display item image
            const itemImage = `images/${tile.name.toLowerCase().replace(/\s+/g, '_')}.png`; // Ex. 'images/potion_de_soin.png'
            displayItemOrMonsterImage(itemImage, tile.name);

            updateGameStatus();
        }
    } else {
        document.getElementById("message").textContent = "Il n'y a pas d'objet ici.";
    }
};


// Clear image when player moves to an empty tile
Map.prototype.move = function (direction) {
    if (combatActive) {
        document.getElementById("message").textContent = "Vous êtes en combat et ne pouvez pas vous déplacer !";
        return;
    }

    if (direction === "up" && this.playerPosition.x > 0) this.playerPosition.x--;
    if (direction === "down" && this.playerPosition.x < this.grid.length - 1) this.playerPosition.x++;
    if (direction === "left" && this.playerPosition.y > 0) this.playerPosition.y--;
    if (direction === "right" && this.playerPosition.y < this.grid[0].length - 1) this.playerPosition.y++;

    const tile = this.getCurrentTile();
    this.monster = tile instanceof Monster ? tile : null;

    // Clear the image display if moving to an empty tile
    if (!this.monster && !(tile instanceof Item)) {
        clearItemOrMonsterImage();
    }

    if (tile && tile.effect === "market") {
        this.showMarket();
    } else {
        this.hideMarket();
    }

    renderMap();
    checkForCombat();
};


function showMessage(html, type = 'info') {
    const messageElement = document.getElementById("message");
    
    // Retirer toutes les classes précédentes  
    messageElement.className = '';
    
    // Ajouter la classe en fonction du type de message  
    messageElement.classList.add(type); // 'success', 'error', 'warning', 'info'
    messageElement.classList.add('show'); // Classe pour rendre visible

    // Mettre à jour le contenu HTML du message  
    messageElement.innerHTML = html;

    // Ajouter une animation d'apparition  
    messageElement.style.animation = 'slideIn 0.5s forwards';

    // Retirer le message après quelques secondes  
    setTimeout(() => {
        messageElement.classList.remove('show'); // Rendre l'élément invisible  
        setTimeout(() => {
            messageElement.innerHTML = ''; // Effacer le contenu après disparition  
        }, 500); // Correspond à la durée de la transition  
    }, 3000); // Durée d'affichage du message  
}

// Exemples d'utilisation :
showMessage("Vous avez gagné de l'expérience !", "success");
showMessage("Vous avez perdu tous vos points de vie !", "error");
showMessage("Attention, un monstre approche !", "warning");
showMessage("Bienvenue dans le jeu ! <span id='playerName'>" + player.name + "</span>", "info");
