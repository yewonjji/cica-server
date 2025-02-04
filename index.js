const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000; // Cloudtype이 자동으로 포트를 할당할 수 있도록 설정

// HTTP 서버 생성 (Cloudtype이 요청을 처리할 수 있도록 함)
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebSocket Server is running\n");
});

// WebSocket 서버 생성
const wss = new WebSocket.Server({ server });

let unrealSocket = null; // Unreal 소켓 저장
let lastState = { sofa: false }; // 소파 상태 저장

wss.on("connection", (socket) => {
    console.log("✅ Client connected");

    socket.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            // Unreal Engine 클라이언트 등록
            if (data.type === "register" && data.clientId === "unreal") {
                unrealSocket = socket;
                console.log("✅ Unreal client registered");

                // Unreal이 재연결되었을 때 기존 소파 상태 전송
                if (lastState.sofa !== undefined) {
                    const restoreData = {
                        type: "update",
                        clientId: "sofa",
                        interaction: "seat",
                        value: lastState.sofa,
                    };
                    console.log("📡 Restoring state to Unreal:", restoreData);
                    unrealSocket.send(JSON.stringify(restoreData));
                }
            } else if (data.type === "update") {
                console.log(`📩 Received data from ${data.clientId}:`, data);

                // Unreal Engine으로 전송
                if (unrealSocket && unrealSocket.readyState === WebSocket.OPEN) {
                    console.log("📡 Sending JSON to Unreal:", data);
                    unrealSocket.send(JSON.stringify(data));
                } else {
                    console.log("⚠️ Unreal client not connected");
                }

                // 상태 업데이트
                lastState[data.clientId] = data.value;
            }
        } catch (error) {
            console.error("❌ Error parsing message:", error);
        }
    });

    socket.on("close", () => {
        console.log("❌ Client disconnected");

        if (socket === unrealSocket) {
            console.log("🚫 Unreal client disconnected");
            unrealSocket = null;
        }
    });
});

// Cloudtype에서 자동으로 할당된 포트에서 서버 실행
server.listen(PORT, () => {
    console.log(`✅ WebSocket server running on port ${PORT}`);
});
