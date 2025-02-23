// FINAL FIX: Rock Paper Scissors - All Alerts Replaced with Popups

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM Fully Loaded!");

    // Correct WebSocket URL for your Render server
    const socket = new WebSocket("wss://backend-ewas.onrender.com"); 

    let playerRole = null;
    let playerScore = 0;
    let opponentScore = 0;
    let isAIMode = false;
    let roundCount = 0;

    // WebSocket Event Listeners
    socket.onopen = () => {
        console.log("✅ WebSocket Connected!");
        // Optional: Button enable kar sakte ho yahan
    };

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
            closePopup();
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

    // Helper Functions
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
        } else if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "MOVE", move }));
        } else {
            console.log("⏳ WebSocket not ready yet!");
            showPopup("⏳ Please wait, connecting to server...");
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

    // Button Functions with WebSocket State Check
    window.startFriendGame = () => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "CREATE_ROOM" }));
        } else {
            console.log("⏳ WebSocket not ready yet!");
            showPopup("⏳ Please wait, connecting to server...");
        }
    };
    window.joinFriendGame = () => {
        console.log("joinFriendGame function called!");
        const roomId = popup("Enter Room ID:");
        if (roomId && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "JOIN_ROOM", roomId }));
            console.log("Room join request sent!");
        } else if (roomId) {
            console.log("⏳ WebSocket not ready yet!");
            showPopup("⏳ Please wait, connecting to server...");
        }
    };
    window.findStranger = () => {
        if (socket.readyState === WebSocket.CONNECTING) {
            console.warn("⏳ WebSocket is still connecting. Retrying in 500ms...");
            setTimeout(window.findStranger, 500);
            return;
        }
        
        if (socket.readyState === WebSocket.OPEN) {
            showLoadingPopup("🔍 Finding a Stranger...");
            socket.send(JSON.stringify({ type: "FIND_STRANGER" }));
        } else {
            console.error("❌ WebSocket is not connected!");
            showPopup("❌ Connection lost! Please refresh and try again.");
        }
    };

    // AI Mode Functions
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
            const resultMessage = playerScore > opponentScore ? "🎉 You Won!" : 
                                  playerScore === opponentScore ? "🤝 It's a Draw!" : "💀 You Lost!";
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

    // Popup Functions
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
        let roomId = text.split(": ").pop(); 
        navigator.clipboard.writeText(roomId).then(() => {
            showPopup(`✅ Room ID copied: ${roomId}`);
        }).catch(err => {
            console.error("❌ Copy Failed!", err);
            showPopup("❌ Copy Failed!");
        });
    }

    function closePopup() {
        const popup = document.getElementById("roomPopup");
        if (popup) popup.remove();
    }

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

    // ESC Key to Close Popup
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closePopup();
    });
});

console.log("🛠️ FINAL CLIENT FIX APPLIED - All Alerts Replaced with Popups!");