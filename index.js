// Babel plugin to transform class names into cssobj localized

var util = require('util')
var yaml = require('js-yaml')
var templateDelimiter = '_cssobj_template_delimiter_'

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
      Program(path){
        // console.log(util.inspect(path, {showHidden: false, depth: 5}))
      },
      TaggedTemplateExpression (path, state) {
        var source = path.scope.hub.file.code
        var cssobjName = state.cssobjName || (state.opts && state.opts.cssobjName)
        var node = path.node
        var yamlRe = /\n\s*---\s*\n/
        if(t.isIdentifier(node.tag, {name: 'CSSOBJ'})) {
          var texts = node.quasi.quasis.map(function(v) {
            return v.value.raw
          })
          var exps = node.quasi.expressions.map(function(v) {
            return source.substring(v.start, v.end)
          })
          // it's cssobj template
          if (texts[0].search(yamlRe)===0) {
            // options parser
            texts[0] = texts[0].replace(yamlRe, '')
            var yamlArr = [], i, pos
            for (i=0; i<texts.length; i++) {
              pos = texts[i].search(/\n\s*---\s*\n/)
              if(pos>-1) {
                yamlArr.push(texts[i].substr(0, pos))
                texts[i] = texts[i].substr(pos).replace(yamlRe, '')
                break
              } else {
                yamlArr.push(texts[i])
              }
            }
            var optionArr = JSON.stringify(yaml.load(yamlArr.join(templateDelimiter))).split('"'+templateDelimiter+'"')
            var option = optionArr.map(function(v,i) {
              if(i==optionArr.length-1) return v
              return v + exps[i]
            }).join('')
            console.log(option, texts[i])
          }
        }
      },
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
