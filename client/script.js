// FINAL FIX: Rock Paper Scissors - All Alerts Replaced with Popups

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM Fully Loaded!");
});

const socket = new WebSocket("ws://localhost:8080");

let playerRole = null;
let playerScore = 0;
let opponentScore = 0;
let isAIMode = false;
let roundCount = 0;

socket.onopen = () => console.log("✅ WebSocket Connected!");
socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
socket.onclose = () => console.warn("⚠️ Connection lost!");
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("📩 Message from server:", data);

    if (data.type === "MATCH_FOUND") {
        hideLoadingPopup();
        playerRole = data.player;
        isAIMode = false;
        roundCount = 0;
        startGame();
    }

    if (data.type === "ROOM_CREATED") {
        if (!document.getElementById("roomPopup")) {
            showPopup(`🏠 Room Created! Share this Room ID: ${data.roomId}`, data.roomId);
        }
    }

    if (data.type === "ROUND_START") {
        console.log("🟢 Round Start Received:", data.round);
        closePopup(); // Purane popups hata do
        showPopup(`🚀 Round ${data.round} Start!`);
    }
    
    if (data.type === "ROUND_RESULT") {
        console.log(`✅ ROUND RESULT -> You: ${data.p1Move}, Opponent: ${data.p2Move}`);
        document.getElementById("your-move").innerText = `You chose: ${data.p1Move}`;
        document.getElementById("opponent-move").innerText = `Opponent chose: ${data.p2Move}`;
        updateScore(data.winner);
    }

    if (data.type === "ROUND_END") {
        showPopup(`🏁 Round ${data.round} End!`);
    }

    if (data.type === "GAME_OVER") {
        const resultMessage = data.winner === playerRole ? "🎉 You Won!" : 
                              data.winner === "draw" ? "🤝 It's a Draw!" : "💀 You Lost!";
        showEndPopup(resultMessage);
    }

    if (data.type === "PLAYER_LEFT") {
        showEndPopup("⚠️ Opponent disconnected.");
        resetGame();
    }
};


function updateScore(winner) {
    if (winner === playerRole) {
        playerScore++;
    } else if (winner !== "draw") {
        opponentScore++;
    }
    document.getElementById("score").innerText = `You: ${playerScore} | Opponent: ${opponentScore}`;
}

function sendMove(move) {
    console.log(`📤 Move Sent -> ${move}`);
    if (isAIMode) {
        playWithAI(move);
    } else {
        socket.send(JSON.stringify({ type: "MOVE", move }));
    }
}

function startGame() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
}

function resetGame() {
    playerScore = 0;
    opponentScore = 0;
    roundCount = 0;
    document.getElementById("score").innerText = `You: 0 | Opponent: 0`;
}

window.startFriendGame = () => socket.send(JSON.stringify({ type: "CREATE_ROOM" }));
function popup(message) {
    return prompt(message); // Simple prompt-based popup
}

window.joinFriendGame = () => {
    console.log("joinFriendGame function called!"); // Debugging log
    const roomId = popup("Enter Room ID:");
    console.log("Entered Room ID:", roomId); // Debugging log
    if (roomId) {
        socket.send(JSON.stringify({ type: "JOIN_ROOM", roomId }));
        console.log("Room join request sent!");
    }
};


window.findStranger = () => {
    showLoadingPopup("🔍 Finding a Stranger...");
    socket.send(JSON.stringify({ type: "FIND_STRANGER" }));
};

// Jab WebSocket se response aaye


// **Loading Popup Functions**
function showLoadingPopup(message) {
    const existingPopup = document.getElementById("loadingPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "loadingPopup";
    popup.className = "popup-overlay";
    popup.innerHTML = `
        <div class="popup">
            <h2>${message}</h2>
            <p>⌛ Please wait...</p>
            <div class="spinner"></div>
        </div>
    `;

    document.body.appendChild(popup);
}

function hideLoadingPopup() {
    const popup = document.getElementById("loadingPopup");
    if (popup) popup.remove();
}
// AI Game Mode with 3 Rounds
window.startAIGame = () => {
    console.log("🤖 Starting AI Game...");
    isAIMode = true;
    playerScore = 0;
    opponentScore = 0;
    roundCount = 0;
    updateScore("reset");
    startGame();
};

function playWithAI(playerMove) {
    let moves = ["rock", "paper", "scissors"];
    let aiMove = moves[Math.floor(Math.random() * moves.length)];

    console.log(`🤖 AI Move -> ${aiMove}`);
    console.log(`🆚 You: ${playerMove} | AI: ${aiMove}`);

    document.getElementById("your-move").innerText = `You chose: ${playerMove}`;
    document.getElementById("opponent-move").innerText = `AI chose: ${aiMove}`;

    let winner = decideWinner(playerMove, aiMove);
    updateScore(winner);
    roundCount++;

    if (roundCount >= 3) {
        const resultMessage = playerScore > opponentScore ? "🎉 You Won!" : "💀 You Lost!";
        showEndPopup(resultMessage);
    }
}

function decideWinner(playerMove, aiMove) {
    if (playerMove === aiMove) return "draw";
    if ((playerMove === "rock" && aiMove === "scissors") ||
        (playerMove === "paper" && aiMove === "rock") ||
        (playerMove === "scissors" && aiMove === "paper")) {
        return "p1";
    } else {
        return "p2";
    }
}
function showPopup(message, roomId = null) {
    if (document.getElementById("roomPopup")) return;

    const popup = document.createElement("div");
    popup.id = "roomPopup";
    popup.className = "popup-container";
    popup.innerHTML = `
        <h2>${message}</h2>
        ${roomId ? `<p class="room-id">Room ID: <span id="room-id-text">${roomId}</span></p>` : ""}
        <div class="popup-buttons">
            ${roomId ? `<button class="copy-btn" onclick="copyRoomID()">📋 Copy</button>` : ""}
            <button class="close-btn" onclick="closePopup()">❌ Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}
function copyRoomID() {
    let text = document.getElementById("room-id-text").textContent.trim();
    
    // **Sirf Room ID extract karne ke liye last word lo**
    let roomId = text.split(": ").pop(); 
    
    navigator.clipboard.writeText(roomId).then(() => {
        // alert(`✅ Room ID copied: ${roomId}`); // Confirm karega
    }).catch(err => {
        alert("❌ Copy Failed!");
        console.error(err);
    });
}


// Close popup function
function closePopup() {
    const popup = document.getElementById("roomPopup");
    if (popup) {
        popup.remove();
    }
}

// Close with ESC Key
document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closePopup();
    }
});

// Show popup with main menu and retry options
function showEndPopup(message) {
    const popup = document.createElement("div");
    popup.className = "popup-overlay";
    popup.innerHTML = `
        <div class="popup">
            <h2>${message}</h2>
            <button onclick="goToMenu()">🏠 Main Menu</button>
            <button onclick="retryGame()">🔄 Retry</button>
        </div>
    `;
    document.body.appendChild(popup);
}

window.goToMenu = () => {
    document.querySelector(".popup-overlay").remove();
    resetGame();
    document.getElementById("game").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
};

window.retryGame = () => {
    document.querySelector(".popup-overlay").remove();
    resetGame();
    startGame();
};


console.log("🛠️ FINAL CLIENT FIX APPLIED - All Alerts Replaced with Popups!");