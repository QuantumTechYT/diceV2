const express = require('express');
const cors = require('cors');
const { createServer } = require('node:http');
const { createBareServer } = require('@tomphttp/bare-server-node');

const app = express();
const server = createServer();
const bareServer = createBareServer('/bare/');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('src'));

// Dictionary proxy handler
class DictionaryProxy {
    constructor() {
        this.cache = new Map();
    }

    async get(word) {
        // Check cache first
        if (this.cache.has(word)) {
            return this.cache.get(word);
        }

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await response.json();
            this.cache.set(word, data);
            return data;
        } catch (error) {
            console.error('Dictionary API Error:', error);
            return null;
        }
    }
}

// URL proxy handler
class URLProxy {
    async fetch(url) {
        try {
            const response = await bareServer.fetch(url);
            return response;
        } catch (error) {
            console.error('Bare Server Error:', error);
            return null;
        }
    }
}

// Combined proxy handler
class CombinedProxy {
    constructor() {
        this.dictionary = new DictionaryProxy();
        this.urlProxy = new URLProxy();
    }

    async get(key) {
        // Check if the key is a URL
        try {
            const url = new URL(key);
            return await this.urlProxy.fetch(url.toString());
        } catch {
            // If not a URL, treat as a dictionary word
            return await this.dictionary.get(key);
        }
    }
}

// Create proxy instance
const proxy = new CombinedProxy();

// Routes
app.get('/proxy/:key', async (req, res) => {
    const { key } = req.params;
    console.log('Received proxy request for:', decodeURIComponent(key));
    
    const result = await proxy.get(decodeURIComponent(key));
    
    if (result === null) {
        console.log('No result found');
        return res.status(404).json({ error: 'Not found' });
    }

    if (result instanceof Response) {
        console.log('Proxying URL response');
        const headers = Object.fromEntries(result.headers.entries());
        res.set(headers);
        result.body.pipe(res);
    } else {
        console.log('Sending dictionary response');
        res.json(result);
    }
});

// Handle requests
server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app.handle(req, res);
    }
});

// Handle upgrades
server.on('upgrade', (req, socket, head) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 