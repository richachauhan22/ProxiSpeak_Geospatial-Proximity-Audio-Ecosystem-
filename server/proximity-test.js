import { io } from "socket.io-client";

const clientA = io("http://localhost:4000");
const clientB = io("http://localhost:4000");

let receivedA = false;
let receivedB = false;

clientA.on("connect", () => {
    console.log("User A connected");
    clientA.emit("office:join", {
        officeId: "main-office",
        id: "test-user-A",
        displayName: "User A"
    });
});

clientB.on("connect", () => {
    console.log("User B connected");
    clientB.emit("office:join", {
        officeId: "main-office",
        id: "test-user-B",
        displayName: "User B"
    });
});

clientA.on("office:joined", (data) => {
    console.log("User A joined:", data.user.id);
});

clientB.on("office:joined", (data) => {
    console.log("User B joined:", data.user.id);
});

clientA.on("proximity:update", (data) => {
    console.log("User A proximity:", data);
    receivedA = true;
});

clientB.on("proximity:update", (data) => {
    console.log("User B proximity:", data);
    receivedB = true;
});

clientA.on("error", (err) => {
    console.log("A server error:", err.message);
});

clientB.on("error", (err) => {
    console.log("B server error:", err.message);
});

setTimeout(() => {
    console.log("\n--- Test Results ---");
    console.log("User A received update:", receivedA);
    console.log("User B received update:", receivedB);

    clientA.disconnect();
    clientB.disconnect();

    process.exit(receivedA && receivedB ? 0 : 1);
}, 3000);
