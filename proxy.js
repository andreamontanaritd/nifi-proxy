var https = require('https'),
httpProxy = require('http-proxy');
var url = require('url');
var fs = require('fs');

// Specify a dir you downloaded the nifi-api-client-js project
var nifiApiClient = require('./nifi-client');
// Create a client instance from a Yaml config file.
var nifiApi = nifiApiClient.fromYamlFile('./conf.yml', 'plain');
//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({
    ssl: {
      key: fs.readFileSync('keys/server-key.pem', 'utf8'),
      cert: fs.readFileSync('keys/server-crt.pem', 'utf8')
    },
    secure: false // Depends on your needs, could be false
});

var options = { 
  key: fs.readFileSync('keys/server-key.pem'), 
  cert: fs.readFileSync('keys/server-crt.pem'), 
  ca: fs.readFileSync('keys/ca-crt.pem'), 
}; 

var token = '';

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
  proxyReq.setHeader('X-ProxyScheme', 'https');
  proxyReq.setHeader('X-ProxyHost', 'localhost');
  proxyReq.setHeader('X-ProxyPort', '8179');
  proxyReq.setHeader('X-ProxyContextPath', '/');
  if (token == '') {
    getToken({ user: 'usera', pwd: 'password'});
  }
  proxyReq.setHeader('Authorization' , 'Bearer ' + token);
});

var server = https.createServer(options, function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  console.log('new request: ' + req.url);
  var urlParts = url.parse(req.url, true),
          urlParams = urlParts.query, 
          urlPathname = urlParts.pathname,
          body = '',
          reqInfo = {};

    console.log('Redirect to: ' + 'https://127.0.0.1:18079' + urlPathname);  

    proxy.web(req, res, {
      target: 'https://0.0.0.0' + ':' + '18079'  
    });
});

console.log("listening on port 8179")
server.listen(8179);

function getToken(arg) {
  console.log(`arg was => ${arg}`);
  nifiApi.getAccessToken(arg.user, arg.pwd, function(data) {
    console.log('TIME BASED TOKEN:' + data.toString());
    token = data;
  });
}

setImmediate(getToken, { user: 'usera', pwd: 'password'});

setInterval(getToken, 60*60*1000, { user: 'usera', pwd: 'password'});

