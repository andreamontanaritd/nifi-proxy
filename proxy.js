var https = require('https'),
http = require('http'),
httpProxy = require('http-proxy');
var url = require('url');
var fs = require('fs');

const USER_NAME = 'administrator',
USER_PWD = 'password',
USER_ROOT = '61634ac2-0165-1000-4579-b394588f7d9b';

// import Nifi API client
var nifiApiClient = require('./nifi-client');
// Create  Nifi API client from a Yaml config file.
var nifiApi = nifiApiClient.fromYamlFile('./conf.yml', 'plain');

// Create a proxy server with custom application logic
var proxy = httpProxy.createProxyServer({
    ssl: {
      key: fs.readFileSync('keys/server-key.pem', 'utf8'),
      cert: fs.readFileSync('keys/server-crt.pem', 'utf8')
    },
    secure: false // Depends on your needs, could be false
});
 
// SSL options if requests come in HTTPS
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
  proxyReq.setHeader('X-ProxyScheme', 'https');
  proxyReq.setHeader('X-ProxyHost', 'localhost');
  proxyReq.setHeader('X-ProxyPort', '8179');
  proxyReq.setHeader('X-ProxyContextPath', '/');
  if (token == '') {
    getToken({user: USER_NAME, pwd: USER_PWD});
  }
  proxyReq.setHeader('Authorization' , 'Bearer ' + token);

  console.log('RESPONSE');
  console.log(res.body);
});

// if requests come in https use: 
// var server = https.createServer(options, function(req, res) {
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  var urlParts = url.parse(req.url, true),
          urlParams = urlParts.query, 
          urlPathname = urlParts.pathname;

    console.log('Path: ' + urlPathname);  
    console.log('Method: ' + req.method);
    console.log(req.headers);
    req.url = req.url.replace('root', USER_ROOT);
    console.log('URL: ' + req.url);
    console.log('Status Code - Message: ' + res.statusCode + ' - ' + res.statusMessage);

    proxy.web(req, res, {
      target: 'https://0.0.0.0' + ':' + '18079'  
    });
});

console.log("Proxy Server listening on port 8179");
server.listen(8179);

// stores access token by passing username and password
function getToken(arg) {
  nifiApi.getAccessToken(arg.user, arg.pwd, function(data) {
    token = data;
  });
}

// Get token on first run
setImmediate(getToken, {user: USER_NAME, pwd: USER_PWD});

// Get token every hour
setInterval(getToken, 60*60*1000, {user: USER_NAME, pwd: USER_PWD});

