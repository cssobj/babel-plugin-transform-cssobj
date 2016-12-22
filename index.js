// Babel plugin to transform class names into cssobj localized

// imports
var util = require('util')
var converter = require('cssobj-converter')
var yaml = require('js-yaml')
var objutil = require('objutil')
var syntaxJsx = require('babel-plugin-syntax-jsx')

// constants
var templateDelimiter = '_cssobj_template_delimiter_'

// helpers
function transformObjecctToFunction (babel, code, option) {
  var result = babel.transform('!' + code, {
    plugins: [['./transform-plugins', option]]
  })
  // console.log(result.code)
  // result.ast.program have: .cssobjConfig, .cssobjImports
  return result
}

module.exports = function (babel) {
  var t = babel.types
  return {
    inherits: syntaxJsx,
    visitor: {
      TaggedTemplateExpression (path, state) {
        var root = path.hub.file
        var source = root.code
        var option = state.opts // babel5: state===opts
        option = objutil.defaults(option, {
          names: {
            cssobj: {name: 'cssobj', path: 'cssobj'}
          }
        })
        var node = path.node
        // console.log(node)
        var yamlRe = /\n\s*---\s*\n/
          if (t.isIdentifier(node.tag, {name: 'CSSOBJ'})) {
            var texts = node.quasi.quasis.map(function (v) {
              return v.value.raw
            })
            var exps = node.quasi.expressions.map(function (v) {
              return source.substring(v.start, v.end)
            })
            // it's cssobj template
            var i = 0, cssobjConfig, cssobjConfigNode, config = '{}'
            if (texts[0].search(yamlRe) === 0) {
              // config parser
              texts[0] = texts[0].replace(yamlRe, '\n')
              var yamlArr = [], pos
              for (i = 0; i < texts.length; i++) {
                pos = texts[i].search(yamlRe)
                if (pos > -1) {
                  yamlArr.push(texts[i].substr(0, pos))
                  texts[i] = texts[i].substr(pos).replace(yamlRe, '')
                  break
                } else {
                  yamlArr.push(texts[i])
                }
              }
              cssobjConfig = yaml.load(yamlArr.join(templateDelimiter))
              if (cssobjConfig) {
                cssobjConfig = util.inspect(cssobjConfig, {depth: null})
                  .split('\'' + templateDelimiter + '\'')
                  .map(function (v, i, arr) {
                    if (i == arr.length - 1) return v
                    return v + exps.shift()
                  })
                  .join('')
                cssobjConfigNode = transformObjecctToFunction(babel, cssobjConfig, option)
                root.path.unshiftContainer('body', cssobjConfigNode.ast.program.cssobjImports)
                config = cssobjConfigNode.code.substr(1).replace(/;+$/, '')
              }
              // console.log(yamlArr, config, 111, texts[i])
              texts = texts.slice(i)
            }

            // css object transform
            var obj = converter(texts.join(templateDelimiter))
            var objStr = util.inspect(obj, {depth: null})
              .split('\'' + templateDelimiter + '\'')
              .map(function (v, i, arr) {
                if (i == arr.length - 1) return v
                return v + exps.shift()
              })
              .join('')
            // got css object
            // console.log(objStr)
            var cssobjNS = option.names['cssobj']
            var cssobjName = cssobjNS.name || 'cssobj'
            root.path.unshiftContainer('body', t.importDeclaration(
              [t.importDefaultSpecifier(t.identifier(cssobjName))],
              t.stringLiteral(cssobjNS.path || 'cssobj')
            ))

            path.replaceWithSourceString(`${cssobjName} (${config}, ${objStr})`)
          }
      },
      CallExpression (path, state) {
        // get mapClass name from plugin options
        var mapName = state.mapName || (state.opts && state.opts.mapName)
        var callee = path.node.callee
        var args = path.node.arguments
        // this form: result.mapClass(JSX)
        // or this form: customName(JSX)
        if ((t.isMemberExpression(callee)
             && !callee.computed
             && t.isIdentifier(callee.property, {name: mapName || 'mapClass'})
             ||
             mapName && t.isIdentifier(callee, {name: mapName}))
            && t.isJSXElement(args[0])) {
          path.traverse(transformClassVisitor(), { callee: callee, mapName: mapName })
          path.replaceWith(args[0])
        }
      }
    }
  }

  function transformClassVisitor () {
    return {
      JSXAttribute (path) {
        var node = path.node
        if (!node.name || !node.value || ['className', 'class'].indexOf(node.name.name) < 0) return
        // get the right mapClass arguments
        var exp = t.isJSXExpressionContainer(node.value)
          ? node.value.expression
          : node.value
        // transform ExpressionContainer to be result.mapClass(exp)
        var callee = t.isMemberExpression(this.callee)
          ? t.memberExpression(this.callee.object, t.identifier('mapClass'))
          : this.callee
        node.value = t.jSXExpressionContainer(
          t.callExpression(callee, [exp])
        )
      }
    }
  }
}
