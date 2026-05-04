const BASE_URL = "http://20.207.122.201/evaluation-service";
const PORT = 3000;

const myDetails = {
  email: "himeshg4@gmial.com",
  name: "himeshg4",
  mobileNo: "8076496709",
  githubUsername: "HIMMUU",
  rollNo: "18079",
  accessCode: "uksdWT",
};

const registeredDetails = {
  email: "himeshg4@gmial.com",
  name: "himeshg4",
  rollNo: "18079",
  accessCode: "uksdWT",
  clientID: "ddaf3aca-da3d-44c6-b7ba-c510c3020e45",
  clientSecret: "DuvuDeEHjKPdRYYH",
};

let bearerToken = "";

async function post(endpoint, body, token = "") {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = token;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function get(endpoint, token = "") {
  const headers = {};

  if (token) {
    headers.Authorization = token;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function register() {
  try {
    return await post("/register", myDetails);
  } catch (error) {
    if (error.message.includes("email already exists")) {
      return registeredDetails;
    }

    throw error;
  }
}

async function auth(registerResponse = registeredDetails) {
  const authResponse = await post("/auth", {
    email: myDetails.email,
    name: myDetails.name,
    rollNo: myDetails.rollNo,
    accessCode: myDetails.accessCode,
    clientID: registerResponse.clientID,
    clientSecret: registerResponse.clientSecret,
  });

  bearerToken = `${authResponse.token_type} ${authResponse.access_token}`;
  return bearerToken;
}

async function log(stack, level, packageName, message) {
  if (!bearerToken) {
    await auth();
  }

  return post(
    "/logs",
    {
      stack,
      level,
      package: packageName,
      message,
    },
    bearerToken,
  );
}

function getToken() {
  return bearerToken;
}

async function notifications(token = bearerToken) {
  if (!token) {
    token = await auth();
  }

  return get("/notifications", token);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      resolve(body ? JSON.parse(body) : {});
    });
  });
}

function startServer() {
  const server = require("http").createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      sendJson(res, 200, {});
      return;
    }

    try {
      if (req.method === "GET" && req.url === "/token") {
        const token = bearerToken || (await auth());
        sendJson(res, 200, { token });
        return;
      }

      if (req.method === "GET" && req.url === "/notifications") {
        const token = req.headers.authorization || bearerToken || (await auth());
        const data = await notifications(token);
        sendJson(res, 200, data);
        return;
      }

      if (req.method === "POST" && req.url === "/logs") {
        const data = await readBody(req);
        const response = await log(data.stack, data.level, data.package, data.message);
        sendJson(res, 200, response);
        return;
      }

      sendJson(res, 404, {
        message: "Use GET /token, GET /notifications, or POST /logs",
      });
    } catch (error) {
      sendJson(res, 500, { message: error.message });
    }
  });

  server.listen(PORT, () => {
    console.log(`Logging middleware server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  register,
  auth,
  log,
  getToken,
  notifications,
  startServer,
};
