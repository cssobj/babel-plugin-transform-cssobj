module.exports = function (babel) {
  var t = babel.types

  return {
    visitor: {
      Program (path) {
        var firstExp = path.node.body[0]
        if(!t.isExpressionStatement(firstExp)
           || !t.isUnaryExpression(firstExp.expression, {operator: '!'})
           || !t.isObjectExpression(firstExp.expression.argument)) return
        // get target expression
        var node = firstExp.expression.argument
        // get plugins prop
        var pluginsNode = node.properties.filter(function(v) {
          return t.isIdentifier(v.key, {name: 'plugins'})
            && t.isArrayExpression(v.value)
        }).shift()
        if(!pluginsNode) return
        // only transform literal keys with plugin names
        var elements = pluginsNode.value.elements
        for (var v, i = 0; i < elements.length; i++) {
          v = elements[i]
          if (t.isObjectExpression(v)
              && v.properties.length == 1
              && t.isLiteral(v.properties[0].key)
              // plugin name cannot be below keywords
              && ['selector', 'value', 'post'].indexOf(v.properties[0].key.value) < 0) {
            var prop = v.properties[0].key.value
            var pluginIden = 'cssobj_plugin_' + prop.replace(/-/g, '_')
            var value = v.properties[0].value
            elements[i] = t.callExpression(
              t.identifier(pluginIden),
              value ? [value] : []
            )
            path.unshiftContainer(
              'body',
              t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(pluginIden))],
                t.stringLiteral('cssobj-plugin-'+prop)
              )
            )
          }
        }

      }
    }
  }
}
