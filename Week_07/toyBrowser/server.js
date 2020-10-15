const http = require('http')

const serve = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('X-Foo', 'bar')
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end(
  `<html maaa=a >
  <head>
      <style>
  body div #myid{
      width:100px;
      background-color: #ff5000;
  }
  body div img{
      width:30px;
      background-color: #ff1111;
  }
      </style>
  </head>
  <body>
      <div>
          <img id="myid"/>
          <img />
      </div>
  </body>
  </html>`)
})

serve.listen(3001)

// http.createServer((request, response) => {
//   let body = []
//   request.on('error', err => {
//     console.log(err)
//   }).on('data', (chunk) => {
//     body.push(chunk)
//   }).on('end', () => {
//     body = Buffer.concat(body).toString()
//     console.log('body:', body)
//     response.writeHead(200, {'Content-Type': 'text/html'});
//     response.end(
// `<html maaa=a >
// <head>
// <style>
// body div #myid{
// width:100px;
// background-color: #ff5000;
// }
// body div img{
// width:30px;
// background-color: #ff1111;
// }
// </style>
// </head>
// <body>
// <div>
// <img id="myid"/>
// <img />
// </div>
// </body>
// </html>`);
//   })
// }).listen(3001)
console.log('Serve started')