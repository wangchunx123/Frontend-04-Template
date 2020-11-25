const net = require('net');
const images = require('images');
const parser = require('./parser');
const render = require('./render');

class Request {
    constructor(options){
      this.method = options.method || 'GET',
      this.host = options.host;
      this.port = options.port || 80;
      this.path = options.path || '/';
      this.body = options.body || {};
      this.headers = options.headers || {};
      if(!this.headers['Content-Type']){
        this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      if(this.headers['Content-Type'] === 'application/json'){
        this.bodyText = JSON.stringify(this.body);
      }else if(this.headers['Content-Type'] === 'application/x-www-form-urlencoded'){
        this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&')
      }

      this.headers['Content-Length'] = this.bodyText.length;
    }

    send(connection){
      return new Promise((resolve,reject) => {
        const parser = new ResponseParser();
        if(connection){
          connection.write(this.toString());
        }else {
          connection = net.createConnection({
            host: this.host,
            port: this.port,
          },() => {
            connection.write(this.toString());
          })
        }

        connection.on('data',(data)=>{
          parser.receive(data.toString());
          if(parser.isFinished){
            resolve(parser.response);
            connection.end();
          }
        })

        connection.on('error', (err) => {
          reject(err);
          connection.end();
        })
      })
    }

    toString(){
      return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r\n\r\n${this.bodyText}`
    }
}

class ResponseParser {
    constructor(){
      this.current = this.waitingStatusLine;
      this.statusLine = '';
      this.headers = {};
      this.headerName = '';
      this.headerValue = '';
      this.bodyParser = null;
    }

    get isFinished(){
      return this.bodyParser && this.bodyParser.isFinished;
    }

    get response(){
      this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
      return {
        statusCode: RegExp.$1,
        statusText: RegExp.$2,
        headers: this.headers,
        body: this.bodyParser.content.join('')
      }
    }

    receive(string){
      for(let i = 0; i < string.length; i++){
        this.current(string.charAt(i))
      }
    }

    // 处理http首行
    waitingStatusLine(char){
      if(char === '\r'){
        this.current = this.waitingStatusLineEnd;
      }else{
        this.statusLine +=char;
      }
    }

    // 处理http首行尾部
    waitingStatusLineEnd(char){
      if(char === '\n'){
        this.current = this.waitingHeaderName;
      }
    }

    // 处理http头部key
    waitingHeaderName(char){
      if(char === ':'){
        this.current = this.waitingHeaderSpace
      }else if (char === '\r'){
        this.current = this.waitingHeaderBlockEnd
        if(this.headers['Transfer-Encoding'] === 'chunked'){
          this.bodyParser = new TrunkedBodyParser();
        }
      }else {
        this.headerName += char
      }
    }

     // 处理http头部冒号后空格
    waitingHeaderSpace(char){
      if(char === ' '){
        this.current = this.waitingHeaderValue
      }
    }

    // 处理http头部value
    waitingHeaderValue(char){
      if(char === '\r'){
        this.current = this.waitingHeaderLineEnd
        this.headers[this.headerName] = this.headerValue;
        this.headerName = '';
        this.headerValue = '';
      }else{
        this.headerValue += char;
      }
    }

    // 处理http头部行结束
    waitingHeaderLineEnd(char){
      if(char === '\n'){
        this.current = this.waitingHeaderName;
      }
    }

    // 处理http头部结束
    waitingHeaderBlockEnd(char){
      if(char === '\n'){
        this.current = this.waitingBody
      }
    }

    // 处理http body
    waitingBody(char){
      this.bodyParser.receiveChar(char);
    }
}

class TrunkedBodyParser{
  constructor(){
    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.current = this.waitingLength
  }

  receiveChar(char){
    this.current(char);
  }

  // 等待接收长度
  waitingLength(char){
    if(char === '\r'){
      if(this.length === 0){
        this.isFinished = true;
      }
      this.current = this.waitingLengthEnd;
    }else{
      this.length *= 16; // 增长位数 十进制10倍 十六进制 16倍
      this.length += parseInt(char,16);
    }
  }

  // 等待接收长度结束
  waitingLengthEnd(char){
    if(char === '\n'){
      this.current = this.readingTrunk
    }
  }

  // 接收数据
  readingTrunk(char){
    this.content.push(char);
    this.length --;
    if(this.length === 0){
      this.current = this.waitingNewLine
    }
  }

  // 开始新行
  waitingNewLine(char){
    if( char === '\r'){
      this.current = this.waitingNewLineEnd
    }
  }

  // 新行结束
  waitingNewLineEnd(char){
    if( char === '\n'){
      this.current = this.waitingLength
    }
  }

}

void async function(){
  let request = new Request({
    method: 'POST',
    host: '127.0.0.1',
    port: '3002',
    path: '/',
    headers:{
      Customed: '123'
    },
    body:{
      name:'yangzx'
    }
  });

  let response = await request.send();

  // 实际上是像流一样来一点解析一点不会一次给完
  let dom = parser.parseHTML(response.body);
  
  // 渲染
  let viewport = images(800, 600);

  render(viewport,dom);
  viewport.save('viewport.jpg');
}()