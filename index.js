// WebSocket 서버 생성
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });

let unrealSocket = null; // 언리얼 소켓 저장
let lastState = { sofa: false };  // 소파 상태 저장

server.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            // Unreal Engine 클라이언트 등록
            if (data.type === "register" && data.clientId === "unreal") {
                unrealSocket = socket;
                console.log("✅ Unreal client registered");

                // Unreal이 재연결되었을 때, 기존 소파 상태를 다시 전송
                if (lastState.sofa !== undefined) {
                    const restoreData = {
                        type: "update",
                        clientId: "sofa",
                        interaction: "seat",
                        value: lastState.sofa
                    };
                    const jsonData = JSON.stringify(restoreData);
                    console.log("📡 Restoring state to Unreal:", jsonData);
                    unrealSocket.send(jsonData);
                }

            } else if (data.type === "update") {
                console.log(`📩 Received data from ${data.clientId}:`, data);

                // Unreal Engine으로 전송
                if (unrealSocket && unrealSocket.readyState === WebSocket.OPEN) {
                    const jsonData = JSON.stringify(data);
                    console.log("📡 Sending JSON to Unreal:", jsonData);
                    unrealSocket.send(jsonData);
                } else {
                    console.log("⚠️ Unreal client not connected");
                }

                // 값이 변하지 않았다면 Unreal로 전송하지 않음
                if (lastState[data.clientId] === data.value) {
                    console.log(`⚠️ 상태 변경 없음: ${data.clientId} (value=${data.value})`);
                    return;
                }

                // 상태 업데이트
                lastState[data.clientId] = data.value;

                
            }
        } catch (error) {
            console.error("❌ Error parsing message:", error);
        }
    });

    socket.on("close", () => {
        console.log("Client disconnected");

        if (socket === unrealSocket) {
            console.log("🚫 Unreal client disconnected");
            unrealSocket = null;
        }
    });
});

console.log("✅ WebSocket server running on ws://localhost:3000");
