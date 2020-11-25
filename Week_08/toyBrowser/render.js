const images = require('images');

module.exports = function render(viewport, element){
  if(element.layoutStyle){
    const img = images(element.layoutStyle.width, element.layoutStyle.height);
    if(element.layoutStyle['background-color']){
      let color = element.layoutStyle['background-color'] || 'rgb(0,0,0)';
      color.match(/rgb\((\d+),(\d+),(\d+)\)/);
      img.fill(Number(RegExp.$1),Number(RegExp.$2),Number(RegExp.$3),1);
      viewport.draw(img,element.layoutStyle.left || 0,element.layoutStyle.top||0)
    }
  }

  if(element.children){
    for(const child of element.children){
      render(viewport,child)
    }
  }
}