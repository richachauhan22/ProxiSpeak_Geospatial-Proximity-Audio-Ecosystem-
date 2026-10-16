
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:4000";

const clientA = io(SERVER_URL);
const clientB = io(SERVER_URL);

let joinedA = false;
let joinedB = false;
let nearbyA = [];
let nearbyB = [];
let testStarted = false;

function runTest() {
    if (!joinedA || !joinedB || testStarted) return;

    testStarted = true;

    clientA.emit("office:move", {
        x: 100,
        y: 100,
        officeId: "main-office"
    });

    clientB.emit("office:move", {
        x: 160,
        y: 100,
        officeId: "main-office"
    });

    setTimeout(() => {
        const aDetectsB = nearbyA.includes("test-user-B");
        const bDetectsA = nearbyB.includes("test-user-A");
        const passed = aDetectsB && bDetectsA;

        console.log("\n--- Proximity Test Results ---");
        console.log("Distance: 60 pixels");
        console.log("User A detects User B:", aDetectsB);
        console.log("User B detects User A:", bDetectsA);
        console.log("Test:", passed ? "PASSED" : "FAILED");

        clientA.disconnect();
        clientB.disconnect();

        process.exit(passed ? 0 : 1);
    }, 1500);
}

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
    joinedA = true;
    runTest();
});

clientB.on("office:joined", (data) => {
    console.log("User B joined:", data.user.id);
    joinedB = true;
    runTest();
});

clientA.on("proximity:update", (data) => {
    nearbyA = data.nearbyUserIds ?? [];
    console.log("User A proximity:", nearbyA);
});

clientB.on("proximity:update", (data) => {
    nearbyB = data.nearbyUserIds ?? [];
    console.log("User B proximity:", nearbyB);
});

clientA.on("connect_error", (err) => {
    console.log("User A connection error:", err.message);
});

clientB.on("connect_error", (err) => {
    console.log("User B connection error:", err.message);
});

