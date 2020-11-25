function getStyle(element){
  if(!element.layoutStyle){
    element.layoutStyle = {};
  }

  for(let prop in element.computedStyle){
    const value = element.computedStyle[prop].value;
    element.layoutStyle[prop] = value;
    if(value.toString().match(/px$/)){
      element.layoutStyle[prop] = parseInt(value)
    }
    if(value.toString().match(/^[0-9\.]+$/)){
      element.layoutStyle[prop] = parseInt(value)
    }
  }
  return element.layoutStyle
}

// 初始化样式
function initFlexStyle(style){
  ['width','height'].forEach(size => {
    if(style[size] === 'auto' || style[size] === ''){
      style[size] = null;
    }
  })
  if(!style.flexDirection || style.flexDirection === 'auto'){
    style.flexDirection = 'row';
  }
  if(!style.alignItems || style.alignItems === 'auto'){
    style.alignItems = 'stretch';
  }
  if(!style.justifyContent || style.justifyContent === 'auto'){
    style.justifyContent = 'flex-start';
  }
  if(!style.flexWrap || style.flexWrap === 'auto'){
    style.flexWrap = 'nowrap';
  }
  if(!style.alignContent || style.alignContent === 'auto'){
    style.alignContent = 'stretch';
  }
}

// 初始化主从轴变量
function initMainAndCross(style){
  let mainSize,mainStart,mainEnd,mainSign,mainBase,
  crossSize,crossStart,crossEnd,crossSign,crossBase;
  if(style.flexDirection === 'row'){
    mainSize = 'width';
    mainStart = 'left';
    mainEnd = 'right';
    mainSign = +1;
    mainBase = 0;

    crossSize='height';
    crossStart='top';
    crossEnd='bottom';
  }
  if(style.flexDirection === 'row-reverse'){
    mainSize = 'width';
    mainStart = 'right';
    mainEnd = 'left';
    mainSign = -1;
    mainBase = style.width;

    crossSize='height';
    crossStart='top';
    crossEnd='bottom';
  }
  if(style.flexDirection === 'column'){
    mainSize = 'height';
    mainStart = 'top';
    mainEnd = 'bottom';
    mainSign = +1;
    mainBase = 0;

    crossSize='width';
    crossStart='left';
    crossEnd='right';
  }
  if(style.flexDirection === 'column-reverse'){
    mainSize = 'height';
    mainStart = 'bottom';
    mainEnd = 'top';
    mainSign = +1;
    mainBase = style.height;

    crossSize='width';
    crossStart='left';
    crossEnd='right';
  }
  if(style.flexWrap === 'wrap-reverse'){
    const tmp = crossStart;
    crossStart = crossEnd;
    crossEnd = tmp;
    crossSign = -1;
  }else {
    crossBase = 0;
    crossSign = 1;
  }
  return {
    mainSize,
    mainStart,
    mainEnd,
    mainSign,
    mainBase,
    crossSize,
    crossStart,
    crossEnd,
    crossSign,
    crossBase,
  }
}

// 对元素进行布局，暂时只考虑flex
function layout(element){
  if(!element.computedStyle)
    return ;
  // 将各种px之类的数值转换成数字
  const layoutStyle = getStyle(element);

  if(layoutStyle.display !== 'flex')
    return ;

  const items = element.children.filter(e => e.type === 'element');

  items.sort((a,b) => ((a.order || 0) - (b.order||0)));

  const style = layoutStyle;

  // 初始化属性
  initFlexStyle(layoutStyle);

  // 主从轴设置
  let { 
    mainSize,
    mainStart,
    mainEnd,
    mainSign,
    mainBase,
    crossSize,
    crossStart,
    crossEnd,
    crossSign,
    crossBase
  } = initMainAndCross(layoutStyle);

  // 父级是否设置宽度没有就是子元素全部相加
  let isAutoMainSize = false;
  if(!style[mainSize]){
    layoutStyle[mainSize] = 0;
    for(let i = 0; i < items.length; i++){
      const item = items[i];
      const itemStyle = getStyle(item);
      if(itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0))
        layoutStyle[mainSize] += itemStyle[mainSize]
    }
    isAutoMainSize = true;
  }

  // 元素分行
  let flexLine = [];
  let flexLines = [flexLine];

  let mainSpace = layoutStyle[mainSize];
  let crossSpace = 0;

  for(let i = 0; i < items.length; i++){
    const item = items[i];
    const itemStyle = getStyle(item);

    if(itemStyle[mainSize] === null){
      itemStyle[mainSize] = 0;
    }

    // 拥有flex属性说明就在这行上
    if(itemStyle.flex){
      flexLine.push(item);
    }else if(style.flexWrap === 'nowrap' && isAutoMainSize){
      // 处理不换行或者自动填充时只有一行
      mainSpace -= itemStyle[mainSize];
      // 计算交叉轴空间取最大
      if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)){
        crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
      }
      flexLine.push(item);
    }else{
      // 换行的逻辑
      // 元素超过了父级的主轴长度，直接赋值父元素主轴长度
      if(itemStyle[mainSize]> layoutStyle[mainSize]){
        itemStyle[mainSize] = layoutStyle[mainSize]
      }
      // 剩余空间不足时换行
      if(mainSpace < itemStyle[mainSize]){
        flexLine.mainSpace = mainSpace;
        flexLine.crossSpace = crossSpace;
        // 新建行
        flexLine = [item];
        flexLines.push(flexLine);
        mainSpace = layoutStyle[mainSize];
        crossSpace = 0;
      }else{
        flexLine.push(item)
      }
      
      // 计算交叉轴空间取最大
      if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)){
        crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
      }
      // 处理不换行或者自动填充时只有一行
      mainSpace -= itemStyle[mainSize];
    }
  }
  // 最后一行的主从轴剩余空间赋值
  flexLine.mainSpace = mainSpace;
  if(style.flexWrap === 'nowrap' || isAutoMainSize){
    flexLine.crossSpace = layoutStyle[crossSize] !== (void 0) ? layoutStyle[crossSize] : crossSpace;
  }else{
    flexLine.crossSpace = crossSpace;
  }

  // 计算主轴
  // 超出了父容器主轴长度
  if(mainSpace < 0){
    // 计算压缩比
    const scale = layoutStyle[mainSize]/ (layoutStyle[mainSize] - mainSpace);
    let currentMain = mainBase;
    for(let i = 0; i < items.length; i++){
      const item = items[i];
      const itemStyle = getStyle(item);

      if(itemStyle.flex){
        itemStyle[mainSize] = 0;
      }
      // 计算子元素主轴方向的开始和结尾的位置
      itemStyle[mainSize] = itemStyle[mainSize] * scale;

      itemStyle[mainStart] = currentMain;
      itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
      currentMain = itemStyle[mainEnd];

    }
  }else{
    // 计算多行
    flexLines.forEach((items) => {
      const mainSpace = items.mainSpace;
      let flexTotal = 0;
      // 计算flex个数
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemStyle = getStyle(item);

        if(itemStyle.flex !== null && itemStyle.flex !== (void 0)){
          flexTotal += itemStyle.flex;
          continue;
        }
      }
      if(flexTotal > 0 ){
        let currentMain = mainBase;
        for(let i = 0; i< items.length; i++){
          const item = items[i];
          const itemStyle = getStyle(item);

          if(itemStyle.flex){
            itemStyle[mainSize] = (mainSpace/flexTotal) * itemStyle.flex;
          }
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign*itemStyle[mainSize];
          currentMain = itemStyle[mainEnd];
        }
      }else{
        let currentMain;
        let gap;
        if(style.justifyContent === 'flex-start'){
          currentMain = mainBase;
          gap = 0;
        }
        if(style.justifyContent === 'flex-end'){
          currentMain = mainSpace * mainSign + mainBase;
          gap = 0;
        }
        if(style.justifyContent === 'center'){
          currentMain = mainSpace / 2 * mainSign + mainBase;
          gap = 0;
        }
        if(style.justifyContent === 'space-between'){
          gap = mainSpace / (items.length - 1) * mainSign;
          currentMain = mainBase;
        }
        if(style.justifyContent === 'space-around'){
          gap = mainSpace / items.length * mainSign;
          currentMain = step / 2 + mainBase;
        }
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemStyle = getStyle(item);

          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd] + gap;
          
        }
      }

    })
  }

  // 计算从轴

  // 没有从轴的长度就设置剩余空间为零，整个盒子的从轴长度就是每个行之合
  if(!layoutStyle[crossSize]){
    crossSpace = 0;
    layoutStyle[crossSize] = 0;
    for (let i = 0; i < flexLines.length; i++) {
      layoutStyle[crossSize] += flexLines[i].crossSpace;
    }
  }else{
    crossSpace = layoutStyle[crossSize];
    for (let i = 0; i < flexLines.length; i++) {
      crossSpace -= flexLines[i].crossSpace;
    }
  }

  if(style.flexWrap === 'wrap-reverse'){
    crossBase = layoutStyle[crossSize];
  }else{
    crossBase = 0;
  }

  let gap;
  if(style.alignContent === 'flex-start'){
    crossBase +=0;
    gap = 0;
  }
  if(style.alignContent === 'flex-end'){
    crossBase += crossSign * crossSpace;
    gap = 0;
  }
  if(style.alignContent === 'center'){
    crossBase += crossSign * crossSpace / 2;
    gap = 0;
  }
  if(style.alignContent === 'space-between'){
    crossBase += 0;
    gap = crossSpace / (flexLines.length - 1);
  }
  if(style.alignContent === 'space-around'){
    gap = crossSpace / flexLines.length;
    crossBase += crossSign * gap / 2;
  }
  if(style.alignContent === 'stretch'){
   crossBase += 0;
   gap = 0;
  }
  flexLines.forEach((items) => {
    const lineCrossSize = layoutStyle.alignContent === 'stretch'?items.crossSpace + crossSpace / flexLines.length : items.crossSpace;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemStyle = getStyle(item);

      align = itemStyle.alignSelf || style.alignItems;
      

      if(itemStyle[crossSize] === null){
        itemStyle[crossSize] = (align === 'stretch')?lineCrossSize : 0;
      }
      if(align === 'flex-start'){
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
      }
      if(align === 'flex-end'){
        itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
        itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
      }
      if(align === 'center'){
        itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
      }
      if(align === 'stretch'){
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))? itemStyle[crossSize]:lineCrossSize);
        itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
      }
    }
  });
}

module.exports = layout;