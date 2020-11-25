const css = require('css');
const layout = require('./layout');

let currentToken = null;

let currentAttribute = null;

let stack = [{type:'document',children:[]}];
let currentTextNode = null;

let rules = [];
function addCSSRules(text){
  const ast = css.parse(text);
  rules.push(...ast.stylesheet.rules);
}

function match(element, selector){
  if(!selector || !element.attributes){
    return false;
  }

  // 忽略了复合选择器
  if(selector.charAt(0) === '#'){
    let attr = element.attributes.filter(attr => attr.name === 'id')[0]
    if(attr && attr.value === selector.replace('#','')){
      return true
    }
  }else if(selector.charAt(0) === '.'){
    let attr = element.attributes.filter(attr => attr.name === 'class')[0]
    if(attr && attr.value === selector.replace('.','')){
      return true
    }
  }else{
    if(element.tagName === selector){
      return true;
    }
  }

  return false
}

function specificity(selector){
  const sp = [0,0,0,0];
  const selectorParts = selector.split(' ');
  // 只考虑空格这种选择器
  for(let part of selectorParts){
    if(part.charAt(0) === '#'){
      sp[1] +=1;
    }else if(part.charAt(0) === '.'){
      sp[2] +=1;
    }else{
      sp[3] +=1;
    }
  }
  return sp;
}

function compare(sp1, sp2){
  if(sp1[0] - sp2[0])
    return sp1[0] - sp2[0];
  if(sp1[1] - sp2[1])
    return sp1[1] - sp2[1];
  if(sp1[2] - sp2[2])
    return sp1[2] - sp2[2];
  return sp1[3] - sp2[3]
}

function computeCSS(element){
  const elements = stack.slice().reverse();
  if(!element.computedStyle){
    element.computedStyle = {};
  }

  for(let rule of rules){
    // 暂时只考虑空格形式的css子代选择
    const selectorParts = rule.selectors[0].split(' ').reverse();

    if(!match(element, selectorParts[0])){
      continue;
    }

    let matched = false;
    let j = 1;
    for (let i = 0; i < elements.length; i++) {
      if(match(elements[i],selectorParts[j])){
        j++;
      }
    }

    if(j >= selectorParts.length){
      matched = true;
    }

    if(matched){
      const sp = specificity(rule.selectors[0]);
      const computedStyle = element.computedStyle;
      for(let declaration of rule.declarations){
        if(!computedStyle[declaration.property]){
          computedStyle[declaration.property] = {}
        }
        if(!computedStyle[declaration.property].specificity){
          computedStyle[declaration.property].value = declaration.value;
          computedStyle[declaration.property].specificity = sp;
        }else if(compare(computedStyle[declaration.property].specificity,sp) < 0){
          computedStyle[declaration.property].value = declaration.value;
          computedStyle[declaration.property].specificity = sp;
        }
      }
    }
  }
}


function emit(token){
  let top = stack[stack.length - 1];

  if(token.type === 'startTag'){
    let element = {
      type: 'element',
      children:[],
      attributes: []
    }
    element.tagName = token.tagName;
    for(let p in token){
      if( p !== 'type' && p !== 'tagName'){
        element.attributes.push({
          name:p,
          value: token[p]
        })
      }
    }

    // 计算样式
    computeCSS(element)

    top.children.push(element);
    element.parent = top;
    if(!token.isSelfClosing){
      stack.push(element)
    }else{
      // 自封闭标签排版计算
      layout(element);
    }
   
    currentTextNode = null;
  } else if (token.type === 'endTag'){
    if(top.tagName !== token.tagName){
      throw new Error('Tag start end doesn\'t match')
    }else {
      // 暂不考虑link link需要请求文件再解析
      if(top.tagName === 'style'){
        addCSSRules(top.children[0].content);
      }
      // 排版计算
      layout(top);
      stack.pop();
    }
    currentTextNode = null;
  } else if (token.type === 'text'){
    if(currentTextNode === null){
      currentTextNode = {
        type: 'text',
        content: ''
      }
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
}

const EOF = Symbol('EOF')

function data(c){
  if(c === '<'){
    return tagOpen
  }else if(c === EOF){
    emit({
      type:'EOF'
    })
    return ;
  }else{
    emit({
      type:'text',
      content:c
    })
    return data
  }
}

function tagOpen(c){
  if(c === '/'){
    return endTagOpen
  }else if(c.match(/^[a-zA-Z]$/)){
    currentToken = {
      type:'startTag',
      tagName:''
    }
    return tagName(c);
  }else {
     // 错误
  }
}

function endTagOpen(c){
  if(c.match(/^[a-zA-Z]$/)){
    currentToken = {
      type:'endTag',
      tagName:''
    }
    return tagName(c)
  }else if(c === '>'){
     // 错误
  }else if(c === EOF){
     // 错误
  }
}

function tagName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName;
  }else if(c === '/'){
    return selfClosingStartTag;
  }else if(c.match(/^[a-zA-Z0-9]$/)){
    currentToken.tagName +=c
    return tagName
  }else if(c === '>'){
    emit(currentToken);
    return data
  }else{
    return tagName
  }
}

function beforeAttributeName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName;
  }else if(c === '/' || c === '>' || c === EOF){
    return afterAttributeName(c);
  }else if(c === '='){
    // 错误
  }else{
    currentAttribute = {
      name: '',
      value: ''
    }
    return attributeName(c)
  }
}

function attributeName(c){
  if(c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF){
    return afterAttributeName(c);
  }else if(c === '='){
    return beforeAttributeValue;
  }else if(c === '\u0000'){
    // 错误
  }else if(c === '"' || c === "'" || c == '<'){
    // 错误
  }else{
    currentAttribute.name += c;
    return attributeName;
  }
}

function afterAttributeName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return afterAttributeName;
  }else if(c === "/"){
    return selfClosingStartTag;
  }else if(c === '>'){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
   return data
  }else if(c === EOF){
    // 错误
  }else{
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name:'',
      value: ''
    }
    return attributeName(c);
  }
}

function beforeAttributeValue(c){
  if(c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF){
    return beforeAttributeValue;
  }else if(c === '"'){
    return doubleQuotedAttributeValue;
  }else if(c === "'"){
    return singleQuotedAttributeValue;
  }else if(c === '>'){
   // 错误
  }else{
    return unquotedAttributeValue(c);
  }
}

function doubleQuotedAttributeValue(c){
  if(c === '"'){
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue;
  }else if(c === "\u0000"){
    // 错误
  }else if(c === EOF){
   // 错误
  }else{
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function singleQuotedAttributeValue(c){
  if(c === "'"){
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue;
  }else if(c === "\u0000"){
    // 错误
  }else if(c === EOF){
   // 错误
  }else{
    currentAttribute.value += c;
    return singleQuotedAttributeValue;
  }
}

function unquotedAttributeValue(c){
  if(c.match(/^[\t\n\f ]$/)){
    currentToken[currentAttribute.name] = currentAttribute.value
    return beforeAttributeName;
  }else if(c === "/"){
    currentToken[currentAttribute.name] = currentAttribute.value
    return selfClosingStartTag;
  }else if(c === '>'){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
   return data
  }else if(c === '\u0000'){
    // 错误
  }else if(c === '"' || c === "'" || c === '<' || c === '=' || c === '`' ){
    // 错误
  }else if(c === EOF){
    // 错误
  }else{
    currentAttribute.value += c;
    return unquotedAttributeValue;
  }
}

function afterQuotedAttributeValue(c){
  if(c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName;
  }else if(c === "/"){
    return selfClosingStartTag;
  }else if(c === '>'){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
   return data
  }else if(c === EOF){
    // 错误
  }else{
    return beforeAttributeName(c);
  }
}

function selfClosingStartTag(c){
  if(c === '>'){
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data
  }else if(c === EOF){
    // 错误
  }else{

  }
}

module.exports.parseHTML = function parseHTML(html){
  let state = data;
  for (const c of html) {
    state = state(c)
  }
  state = state(EOF);

  return stack[0];
}