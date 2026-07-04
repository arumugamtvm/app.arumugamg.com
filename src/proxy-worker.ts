export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Route requests to the GitHub Pages site
    url.hostname = "arumugamtvm.github.io";
    
    // Prefix the pathname with the repository name (since GitHub Pages is hosted at /repo-name/)
    if (url.pathname === "/") {
      url.pathname = "/app.arumugamg.com/";
    } else {
      url.pathname = "/app.arumugamg.com" + url.pathname;
    }
    
    // Fetch and return the response from GitHub Pages
    const response = await fetch(url.toString(), {
      headers: request.headers,
      method: request.method,
      body: request.body
    });

    // Return the response with original headers
    return response;
  }
};
