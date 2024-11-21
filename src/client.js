class ProxyClient {
    constructor(baseUrl = window.location.origin) {
        this.baseUrl = baseUrl;
        console.log('ProxyClient initialized with baseUrl:', this.baseUrl);
    }

    async get(key) {
        console.log('ProxyClient.get called with key:', key);
        const encodedKey = encodeURIComponent(key);
        const url = `${this.baseUrl}/proxy/${encodedKey}`;
        console.log('Making request to:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        // Check if response is JSON (dictionary result) or raw data (URL proxy)
        const contentType = response.headers.get('content-type');
        console.log('Response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return response;
    }
}

// Remove the test function since we're using the UI now
console.log('ProxyClient class loaded'); 