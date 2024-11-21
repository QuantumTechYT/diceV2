class ProxyClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    async get(key) {
        const encodedKey = encodeURIComponent(key);
        const response = await fetch(`${this.baseUrl}/proxy/${encodedKey}`);
        
        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        // Check if response is JSON (dictionary result) or raw data (URL proxy)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return response;
    }
}

// Usage example
async function test() {
    const proxy = new ProxyClient();

    // Test dictionary lookup
    try {
        const wordResult = await proxy.get('hello');
        console.log('Dictionary result:', wordResult);
    } catch (error) {
        console.error('Dictionary error:', error);
    }

    // Test URL proxy
    try {
        const urlResult = await proxy.get('https://example.com');
        const text = await urlResult.text();
        console.log('URL proxy result:', text.substring(0, 100) + '...');
    } catch (error) {
        console.error('URL proxy error:', error);
    }
}

test(); 