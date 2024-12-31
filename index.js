import express from 'express';
import net from 'net';
import path from 'path';
import dns from 'dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';  // Import to convert URL to file path
import { dirname } from 'path';  // To get the directory name

dotenv.config();  // Load environment variables from .env file

const app = express();

// Configuration
const BACKGROUND_IMAGE = "under_water.png";
const color_codes = {
    "red": "#e74c3c",
    "green": "#16a085",
    "blue": "#2980b9",
    "pink": "#be2edd",
    "darkblue": "#130f40"
};


const APP_NAME = process.env.APP_NAME || "Connectivity Test App";
const BG_COLOR = process.env.BG_COLOR || "red";

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse form data

// Workaround for `__dirname` in ES modules
const __filename = fileURLToPath(import.meta.url); // Convert URL to path
const __dirname = dirname(__filename); // Get the directory of the current module

// Add this line to set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory if you want to use a custom location for EJS templates
app.set('views', path.join(__dirname, 'templates'));

// Serve static files (e.g., images, CSS)
app.use(express.static(path.join(__dirname, 'static')));

async function resolveHost(host) {
    return new Promise((resolve, reject) => {
        dns.lookup(host, (err, address, family) => {
            if (err) {
                console.error(`Error resolving hostname "${host}": ${err.message}`);
                reject({ status: false, message: `Cannot resolve hostname "${host}".` });
            } else {
                console.log(`Resolved hostname "${host}" to IP address "${address}" (IPv${family})`);
                resolve({ address, family });
            }
        });
    });
}

// Test TCP Connection
function socketTest(host, port) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);

        console.log(`Attempting to connect to ${host}:${port}`);
        socket.on('connect', function () {
            console.log(`Successfully connected to ${host}:${port}`);
            socket.end();
            resolve({ status: true, message: "Success!" });
        });

        socket.on('timeout', function () {
            console.error(`Connection to ${host}:${port} timed out`);
            socket.destroy();
            reject({ status: false, message: "Connection timeout" });
        });

        socket.on('error', function (err) {
            console.error(`Error connecting to ${host}:${port} - ${err.message}`);
            socket.destroy();
            reject({ status: false, message: err.message });
        });

        socket.connect(port, host);
    });
}

// POST Route to Test Connection
app.post('/test', async (req, res) => {
    const { host, port } = req.body;

    console.log(`Received request to test connectivity to host: ${host}, port: ${port}`);
    
    if (isNaN(port)) {
        console.error(`Invalid port: ${port}. Must be a number.`);
        return res.render('index', {
            app_name: APP_NAME,
            backgroundcolor: color_codes[BG_COLOR],
            status: { status: false, message: "Invalid port. Port must be a number." }
        });
    }

    try {
        const resolvedHost = await resolveHost(host);
        console.log("Resolved host: ", resolvedHost);
        const testResults = await socketTest(host, port);
        res.json({ success: testResults.status, message: testResults.message, ipAddress: resolvedHost.address });
    } catch (error) {
        console.error(`Error during connection test: ${error.message}`);
        res.json({ success: false, message: error.message});
    }
});

// GET Route to Serve EJS Template
app.get('/', (req, res) => {
    try {
        console.log("Rendering home page");
        res.render('index', {
            app_name: APP_NAME,
            backgroundcolor: color_codes[BG_COLOR],  // Color code for background
            status: null // No test results initially
        });
    } catch (error) {
        console.error(`Error rendering home page: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Start the Server
const port = 8080;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
