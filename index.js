// Babel plugin to transform class names into cssobj localized

module.exports = function (babel) {
  var t = babel.types

  var transformClassVisitor = {
    JSXAttribute (path) {
      var node = path.node
      if (!node.name || !node.value || ['className', 'class'].indexOf(node.name.name)<0) return
      // get the right mapClass arguments
      var exp = t.isJSXExpressionContainer(node.value)
          ? node.value.expression
          : node.value
      // transform ExpressionContainer to be result.mapClass(exp)
      node.value = t.jSXExpressionContainer(
        t.callExpression(
          t.memberExpression(this.resultObj, t.identifier('mapClass')),
          [exp]
        )
      )
    }
  }
  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      CallExpression (path, state) {
        // get mapClass name from plugin options
        var mapName = state.mapName || (state.opts && state.opts.mapName) || 'mapClass'
        var callee = path.node.callee
        var args = path.node.arguments
        // only this form: result.mapClass(JSX)
        if(!callee.computed &&
           t.isMemberExpression(callee) &&
           t.isIdentifier(callee.property, {name: mapName}) &&
           t.isJSXElement(args[0])) {
          path.traverse(transformClassVisitor, { resultObj: callee.object })
          path.replaceWith(args[0])
        }
      }
    }
  }
}
