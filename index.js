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
      var callee = t.isMemberExpression(this.callee)
          ? t.memberExpression(this.callee.object, t.identifier('mapClass'))
          : this.callee
      node.value = t.jSXExpressionContainer (
        t.callExpression(callee, [exp])
      )
    }
  }
  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      CallExpression (path, state) {
        // get mapClass name from plugin options
        var mapName = state.mapName || (state.opts && state.opts.mapName)
        var callee = path.node.callee
        var args = path.node.arguments
        // this form: result.mapClass(JSX)
        // or this form: customName(JSX)
        if((t.isMemberExpression(callee)
            && !callee.computed
            && t.isIdentifier(callee.property, {name: mapName || 'mapClass'})
            ||
            mapName && t.isIdentifier(callee, {name: mapName}))
           && t.isJSXElement(args[0])) {
          path.traverse(transformClassVisitor, { callee: callee, mapName: mapName })
          path.replaceWith(args[0])
        }
      }
    }
  }
}
