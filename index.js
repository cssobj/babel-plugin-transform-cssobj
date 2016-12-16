// Babel plugin to transform class names into cssobj localized
module.exports = function (babel) {
  var t = babel.types

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXAttribute: function (path) {
        var node = path.node
        if (!node.name || !node.value || ['className', 'class'].indexOf(node.name.name)<0) return
        if (t.isJSXExpressionContainer(node.value)) {
          if(t.isSequenceExpression(node.value.expression)) {
            var values = node.value.expression.expressions
            var resultObj = values[values.length-1]
            var classStr = values[0]
            var exp =  /Literal$/.test(resultObj.type)
                ? (resultObj.value == null
                   ? classStr
                   : t.sequenceExpression(node.value.expression.expressions.slice(0,-1)))
                : t.callExpression(
                  t.memberExpression(resultObj, t.identifier('mapClass')),
                  [classStr]
                )
            node.value = t.jSXExpressionContainer(exp)
          }
        }
      }
    }
  }
}
