// transform from object into cssobj config, with plugins transformed

module.exports = function (babel) {
  var t = babel.types

  return {
    visitor: {
      Program (path, state) {
        var firstExp = path.node.body[0]

        // only transform !{plugins:[]}
        if(!t.isExpressionStatement(firstExp)
           || !t.isUnaryExpression(firstExp.expression, {operator: '!'})
           || !t.isObjectExpression(firstExp.expression.argument)) return

        // get target expression
        var node = firstExp.expression.argument
        // get "plugins" prop, it's from JSON.stringify

        var pluginsNode = node.properties.filter(function(v) {
          return getKeyValue(v) === 'plugins'
            && t.isArrayExpression(v.value)
        }).shift()

        // plugins transform part
        if (pluginsNode) {
          // only transform literal keys with plugin names
          var elements = pluginsNode.value.elements
          var cssobjImports = path.node.cssobjImports = []
          for (var v, prop, value, i = 0; i < elements.length; i++) {
            v = elements[i]
            if (t.isLiteral(v) && (value='', prop = v.value)
                || t.isObjectExpression(v)
                && v.properties.length == 1
                && (prop = getKeyValue(v.properties[0]))
                // plugin name cannot be below keywords
                && ['selector', 'value', 'post'].indexOf(prop) < 0
                && (value = v.properties[0].value)) {
              var pluginIden = 'cssobj_plugin_' + prop.replace(/-/g, '_')
              elements[i] = t.callExpression(
                t.identifier(pluginIden),
                value ? [value] : []
              )
              cssobjImports.push(t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(pluginIden))],
                t.stringLiteral('cssobj-plugin-'+prop)
              ))
            }
          }
          path.node.cssobjConfig = node
        }
      }
    }
  }

  function getKeyValue (v) {
    if (t.isLiteral(v.key)) return v.key.value
    if (t.isIdentifier(v.key)) return v.key.name
  }

}
