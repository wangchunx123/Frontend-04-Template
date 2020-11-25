const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((request,response) => {
  let body = [];
  request.on('error',(err)=>{
    console.log(err)
  }).on('data',(chunk) => {
    body.push(chunk);
  }).on('end',() => {
    body = Buffer.concat(body).toString();
    console.log('body',body);
    const html = fs.readFileSync(path.join(__dirname,'test.html'))
    response.writeHead(200,{'Content-Type':'text/html'});
    response.end(html);
  })
}).listen(3002);

console.log('server started');