import { createServer } from "node:http";
import { isMainThread, Worker } from "node:worker_threads";
import { hashPassword } from "./src/crypto.ts";
import { addUser, isValidUser } from "./src/database.ts";

type AuthLoginRequest = {
  username: string;
  password: string;
};

function handleRequest(req, res) {
  console.log("Request received");
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);

  const fullUrl = new URL(req.url, `http://${req.headers.host}`);
  console.log("Request URL Object: ", fullUrl);

  if (fullUrl.pathname === "/AuthLogin") {
    const username = fullUrl.searchParams.get("username");
    const password = fullUrl.searchParams.get("password");
    console.log("Username: ", username);
    console.log("Password received: [REDACTED]");
    if (typeof username === "undefined" || typeof password === "undefined") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid request" }));
      return;
    }

    const hashedPassword = hashPassword(password, 16);
    console.log("Hashed password: ",
      Number.parseInt(hashedPassword, 16).toString(2).padStart(256, "0"));

    const isPasswordCorrect = isValidUser(username, hashedPassword);
    if (!isPasswordCorrect) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid username or password" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Login successful" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, World!");
}

function startWebserver() {
  console.log("Starting server...");
  const server = createServer(handleRequest);
  server.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
}

let isRunning = false;

if (isMainThread) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (typeof ADMIN_PASSWORD === "undefined") {
    console.error("ADMIN_PASSWORD environment variable is not set");
    process.exit(1);
  }

  const hashedAdminPassword = hashPassword(process.env.ADMIN_PASSWORD, 16);

  try {
    addUser('admin', hashedAdminPassword);

  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('Admin user already exists');
    } else {
      throw error;
    }

  }

  console.log("This is the main thread, running at ", import.meta.filename);
  console.log("Starting worker thread...");
  const webWorker = new Worker(import.meta.filename);
  webWorker.on("message", (message) => {
    console.log("Message from worker: ", message);
  });
  webWorker.on("error", (error) => {
    console.log("Error from worker: ", error);
  });
  webWorker.on("exit", (code) => {
    console.log("Worker exited with code: ", code);
  });
} else {
  console.log("This is the worker thread, running at ", import.meta.filename);
  startWebserver();
  setInterval(() => {
    console.log("Worker thread is still running...");
  }, 5000);
}
