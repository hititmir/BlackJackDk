let balance = 1000, bet = 0, tempBet = 0, insuranceBet = 0;
let dealerSum = 0, dealerAceCount = 0, hiddenCard, deck = [];
let playerHands = [[]], playerSums = [0, 0], playerAceCounts = [0, 0];
let activeHandIndex = 0, canHit = false, isSplit = false;

window.onload = function() {
    document.getElementById("login-btn").onclick = () => login(document.getElementById("username").value.trim());
    document.getElementById("guest-btn").onclick = () => login("Гостин");
    document.getElementById("logout-btn").onclick = () => location.reload();

    document.querySelectorAll(".chip").forEach(chip => {
        chip.onclick = function() {
            let val = parseInt(this.getAttribute("data-value"));
            if (balance >= tempBet + val) {
                tempBet += val;
                document.getElementById("current-bet").innerText = tempBet;
            }
        };
    });

    document.getElementById("clear-bet").onclick = () => { tempBet = 0; document.getElementById("current-bet").innerText = 0; };
    document.getElementById("place-bet-btn").onclick = placeBet;
    document.getElementById("hit-btn").onclick = hit;
    document.getElementById("stand-btn").onclick = stand;
    document.getElementById("double-btn").onclick = doubleDown;
    document.getElementById("split-btn").onclick = splitCards;
    document.getElementById("surrender-btn").onclick = surrender;
    document.getElementById("next-hand-btn").onclick = resetForNextHand;
    document.getElementById("insure-yes").onclick = () => takeInsurance(true);
    document.getElementById("insure-no").onclick = () => takeInsurance(false);
}

function login(name) {
    if (!document.getElementById("age-confirm").checked) return alert("Мора да потврдите 18+ години!");
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("main-game").style.display = "block";
    document.getElementById("display-user").innerText = name || "Играч";
}

function buildDeck() {
    let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let types = ["club", "diamond", "heart", "spade"];
    deck = [];
    for (let t of types) for (let v of values) deck.push(t + v);
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function placeBet() {
    if (tempBet <= 0) return alert("Постави облог!");
    bet = tempBet; balance -= bet; buildDeck();
    document.getElementById("betting-section").style.display = "none";
    document.getElementById("game-table").style.display = "block";
    canHit = true; startGame();
    updateUI();
}

function startGame() {
    hiddenCard = deck.pop(); dealerSum = getValue(hiddenCard); dealerAceCount = checkAce(hiddenCard);
    let dCard = deck.pop(); dealerSum += getValue(dCard); dealerAceCount += checkAce(dCard);
    renderCard("dealer-cards", dCard);

    playerHands = [[]]; playerSums = [0, 0]; playerAceCounts = [0, 0];
    for (let i = 0; i < 2; i++) {
        let pCard = deck.pop();
        playerHands[0].push(pCard);
        playerSums[0] += getValue(pCard);
        playerAceCounts[0] += checkAce(pCard);
        renderCard("player-cards-0", pCard);
    }

    let pSum = reduceAce(playerSums[0], playerAceCounts[0]);
    document.getElementById("player-sum-0").innerText = pSum;

    if (dCard.endsWith("A")) {
        document.getElementById("insurance-panel").style.display = "block";
        canHit = false;
    }

    if (pSum === 21) finishDealer();
    if (getValue(playerHands[0][0]) === getValue(playerHands[0][1])) document.getElementById("split-btn").style.display = "inline-block";
}

function hit() {
    if (!canHit) return;
    document.getElementById("split-btn").style.display = "none";
    document.getElementById("surrender-btn").style.display = "none";
    let card = deck.pop();
    playerHands[activeHandIndex].push(card);
    playerSums[activeHandIndex] += getValue(card);
    playerAceCounts[activeHandIndex] += checkAce(card);
    renderCard("player-cards-" + activeHandIndex, card);

    let s = reduceAce(playerSums[activeHandIndex], playerAceCounts[activeHandIndex]);
    document.getElementById("player-sum-" + activeHandIndex).innerText = s;
    if (s > 21) isSplit && activeHandIndex === 0 ? stand() : finishDealer();
}

function stand() {
    if (isSplit && activeHandIndex === 0) {
        activeHandIndex = 1;
        document.getElementById("hand-0").classList.remove("active-hand");
        document.getElementById("hand-1").classList.add("active-hand");
    } else {
        finishDealer();
    }
}

function doubleDown() {
    if (!canHit || balance < bet) return;
    balance -= bet; bet *= 2; updateUI();
    hit(); if (canHit) stand();
}

function splitCards() {
    if (balance < bet) return;
    isSplit = true; balance -= bet; updateUI();
    document.getElementById("split-btn").style.display = "none";
    document.getElementById("hand-1").style.display = "block";
    let c2 = playerHands[0].pop(); playerHands.push([c2]);
    playerSums = [getValue(playerHands[0][0]), getValue(playerHands[1][0])];
    playerAceCounts = [checkAce(playerHands[0][0]), checkAce(playerHands[1][0])];
    document.getElementById("player-cards-0").innerHTML = "";
    renderCard("player-cards-0", playerHands[0][0]);
    renderCard("player-cards-1", playerHands[1][0]);
    for (let i = 0; i < 2; i++) {
        let c = deck.pop(); playerHands[i].push(c);
        playerSums[i] += getValue(c); playerAceCounts[i] += checkAce(c);
        renderCard("player-cards-" + i, c);
        document.getElementById("player-sum-" + i).innerText = reduceAce(playerSums[i], playerAceCounts[i]);
    }
}

function surrender() {
    if (!canHit || isSplit) return;
    balance += bet / 2;
    document.getElementById("results").innerText = "Surrendered (-50%)";
    canHit = false; endRound();
}

function takeInsurance(choice) {
    document.getElementById("insurance-panel").style.display = "none";
    if (choice && balance >= bet / 2) { insuranceBet = bet / 2; balance -= insuranceBet; }
    canHit = true; updateUI();
}

function finishDealer() {
    canHit = false;
    let hImg = document.getElementById("hidden-card");
    hImg.classList.add("flipping");
    setTimeout(() => {
        hImg.src = "./cards/" + hiddenCard + ".png";
        hImg.classList.remove("flipping");
        setTimeout(() => {
            while (reduceAce(dealerSum, dealerAceCount) < 17) {
                let c = deck.pop(); dealerSum += getValue(c); dealerAceCount += checkAce(c);
                renderCard("dealer-cards", c);
            }
            let fD = reduceAce(dealerSum, dealerAceCount);
            document.getElementById("dealer-sum").innerText = fD;
            
            let finalMsg = "", totalWin = 0;
            if (insuranceBet > 0 && fD === 21 && hiddenCard.endsWith("A") || hiddenCard.match(/10|J|Q|K/)) {
                balance += insuranceBet * 3;
            }

            for (let i = 0; i <= (isSplit ? 1 : 0); i++) {
                let fP = reduceAce(playerSums[i], playerAceCounts[i]);
                let isBJ = (fP === 21 && playerHands[i].length === 2);
                let res = "";
                if (fP > 21) res = "Bust";
                else if (fD > 21 || fP > fD) { 
                    res = isBJ ? "Blackjack!" : "Победи"; 
                    totalWin += isBJ ? (bet * 2.5) : (bet * 2);
                } else if (fP < fD) res = "Изгуби";
                else { res = "Push"; totalWin += bet; }
                finalMsg += (isSplit ? `Hand ${i+1}: ${res} | ` : res);
            }
            balance += totalWin; document.getElementById("results").innerText = finalMsg;
            endRound();
        }, 500);
    }, 300);
}

function endRound() {
    document.getElementById("next-hand-btn").style.display = "block";
    updateUI();
}

function resetForNextHand() {
    bet = 0; tempBet = 0; insuranceBet = 0; activeHandIndex = 0; isSplit = false;
    document.getElementById("results").innerText = "";
    document.getElementById("current-bet").innerText = "0";
    document.getElementById("dealer-sum").innerText = "??";
    document.getElementById("player-cards-0").innerHTML = "";
    document.getElementById("player-cards-1").innerHTML = "";
    document.getElementById("dealer-cards").innerHTML = '<img id="hidden-card" src="./cards/redBack.png">';
    document.getElementById("hand-1").style.display = "none";
    document.getElementById("hand-0").classList.add("active-hand");
    document.getElementById("next-hand-btn").style.display = "none";
    document.getElementById("game-table").style.display = "none";
    document.getElementById("betting-section").style.display = "block";
    document.getElementById("surrender-btn").style.display = "inline-block";
}

function getValue(c) {
    let v = c.replace(/club|diamond|heart|spade/g, "");
    return isNaN(v) ? (v === "A" ? 11 : 10) : parseInt(v);
}
function checkAce(c) { return c.endsWith("A") ? 1 : 0; }
function reduceAce(s, a) { while (s > 21 && a > 0) { s -= 10; a--; } return s; }
function renderCard(id, c) {
    let img = document.createElement("img");
    img.src = "./cards/" + c + ".png";
    img.classList.add("card-anim");
    document.getElementById(id).append(img);
}
function updateUI() { document.getElementById("balance").innerText = Math.floor(balance); }