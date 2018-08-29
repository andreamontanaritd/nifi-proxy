var http = require('http'),
httpProxy = require('http-proxy');
var url = require('url');


// Specify a dir you downloaded the nifi-api-client-js project
var nifiApiClient = require('./nifi-client');
// Create a client instance from a Yaml config file.
var nifiApi = nifiApiClient.fromYamlFile('./conf.yml', 'plain');
//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

// To modify the proxy connection before data is sent, you can listen
// for the 'proxyReq' event. When the event is fired, you will receive
// the following arguments:
// (http.ClientRequest proxyReq, http.IncomingMessage req,
//  http.ServerResponse res, Object options). This mechanism is useful when
// you need to modify the proxy request before the proxy connection
// is made to the target.
//
proxy.on('proxyReq', function(proxyReq, req, res, options) {
  proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
});

var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  console.log('new request: ' + req.url);
var urlParts = url.parse(req.url, true),
        urlParams = urlParts.query, 
        urlPathname = urlParts.pathname,
        body = '',
        reqInfo = {};

nifiApi.getAccessToken('usera', 'password', function(data) {
  console.log('tadaaa:' + data.toString());

  console.log('Redirect to: ' + 'http://127.0.0.1:8079' + urlPathname);  
proxy.web(req, res, {
    target: 'https://0.0.0.0' + ':' + '18079'  
  });
});
});

console.log("listening on port 8179")
server.listen(8179);
