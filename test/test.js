const {expect} = require('chai')
const {transform} = require('babel-core')

describe('transform-plugins', () => {
  var lib  = function (code) {
    return transform(code, {
      plugins: ['./transform-plugins']
    }).code
  }

  it('should transform plugins literal, should not transform keywords', () => {
    let node = `!{"plugins": [{'default-unit-234': 'px'}, {selector: abc}]}`
    expect(lib(node)).to.equal(`!{ "plugins": [cssobj_plugin_default_unit_234('px'), { selector: abc }] };`)

    node = `!{"plugins": [{'default-unit-234': 'px'}, {localize: {space:'_my_'}}]}`
    expect(lib(node)).to.equal(`!{ "plugins": [cssobj_plugin_default_unit_234('px'), cssobj_plugin_localize({ space: '_my_' })] };`)
  })

  it('should transform plugins literal without options', () => {
    let node = `!{"plugins": [{'default-unit-234': 'px'}, 'flexbox']}`
    expect(lib(node)).to.equal(`!{ "plugins": [cssobj_plugin_default_unit_234('px'), cssobj_plugin_flexbox()] };`)
  })

  it('should work with empty or non-plugins', () => {
    let node = `!{"plugins": null}`
    expect(lib(node)).to.equal(`!{ "plugins": null };`)
    node = `!{"plugins": []}`
    expect(lib(node)).to.equal(`!{ "plugins": [] };`)
    node = `!{"plugins": {abc: 'def'}}`
    expect(lib(node)).to.equal(`!{ "plugins": { abc: 'def' } };`)
  })

  it('should not transform with normal exp', () => {
    let node = `var d = { "plugins": [{ 'default-unit-234': 'px' }, 'flexbox'] };`
    expect(lib(node)).to.equal(node)
  })

  it('should not transform with function in array', () => {
    let node = `!{ "plugins": [{ 'default-unit-234': 'px' }, console.log, {[Symbol()]: 1234} ] };`
    expect(lib(node)).to.equal(`!{ "plugins": [cssobj_plugin_default_unit_234('px'), console.log, { [Symbol()]: 1234 }] };`)
  })

})

describe('babel-plugin-transform-cssobj with templateLiteral', () => {
  var lib  = function (code) {
    return transform(code, {
      plugins: ['./index']
    }).code
  }

  it('should work with empty string', function() {
    let node = `
var getUnit = v=>v
var d= CSSOBJ\`
---
plugins:
  - default-unit: $\{getUnit()\}
  - default-unit-2: px
  - default-unit-3
  - flexbox:
      pref: 1234
      abc: def
---
body{color: red;}
body{color: ${v=>v};}
body{font-size: 234;}
\`
`
    expect(lib(node)).to.equal(`import cssobj from "cssobj";
import cssobj_plugin_default_unit from "cssobj-plugin-default-unit";
import cssobj_plugin_default_unit_2 from "cssobj-plugin-default-unit-2";
import cssobj_plugin_default_unit_3 from "cssobj-plugin-default-unit-3";
import cssobj_plugin_flexbox from "cssobj-plugin-flexbox";

var getUnit = v => v;
var d = cssobj({
  plugins: [cssobj_plugin_default_unit(getUnit()), cssobj_plugin_default_unit_2('px'), cssobj_plugin_default_unit_3(), cssobj_plugin_flexbox({
    pref: 1234,
    abc: 'def'
  })]
}, {
  body: [{
    color: 'red'
  }, {
    color: 'v=>v'
  }, {
    fontSize: 234
  }]
});`)
  })

  it('should work with empty string', function() {
    let node = 'CSSOBJ``'
    expect(lib(node)).to.equal(`import cssobj from "cssobj";
cssobj({}, {});`)
  })

  it('should work with only config', function() {
    let node = `
CSSOBJ\`
---
plugins:
  - default-unit: px
  - flexbox
---
\``
    expect(lib(node)).to.equal(`import cssobj from "cssobj";
import cssobj_plugin_default_unit from "cssobj-plugin-default-unit";
import cssobj_plugin_flexbox from "cssobj-plugin-flexbox";

cssobj({
  plugins: [cssobj_plugin_default_unit('px'), cssobj_plugin_flexbox()]
}, {});`)
  })

  it('should work with no config', function() {
    let node = `
var d = CSSOBJ\`
body { color: $\{getColor()\}; }
.p1 { color: blue; font-size: 12px; }
\`
`
    expect(lib(node)).to.equal(`import cssobj from "cssobj";

var d = cssobj({}, {
  body: {
    color: getColor()
  },
  '.p1': {
    color: 'blue',
    fontSize: '12px'
  }
});`)

        node = `
var d = CSSOBJ\`
---
---
body {color: red;}
\`
`
    expect(lib(node)).equal(`import cssobj from "cssobj";

var d = cssobj({}, {
  body: {
    color: 'red'
  }
});`)
  })

  it('should not change other templateLiteral', function() {
    let node = 'var d= test`body{color: red;}`'
    // only format changed, code no change
    expect(lib(node)).equal('var d = test`body{color: red;}`;')
  })


})


describe('babel-plugin-transform-cssobj-jsx', () => {
  var lib  = function (code) {
    return transform(code, {
      plugins: ['./index']
    }).code
  }

  it('should mapClass for string literal', () => {
    let node = `var d= result.mapClass(<div className='a b c'><p class='abc' shouldNotMap='cde'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass('abc')} shouldNotMap="cde">test</p></div>;`)
  })

  it('should mapClass for expression container', () => {
    let node = `var d= result.mapClass(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass(getClass())}>test</p></div>;`)
  })

  it('should mapClass using complex cssobj result', () => {
    let node = `var d= state.result().mapClass(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={state.result().mapClass('a b c')}><p class={state.result().mapClass(getClass())}>test</p></div>;`)
  })

  it('should not work with computed object', () => {
    let node = `var d= result['mapClass'](<div className='a b c'><p class='abc'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = result['mapClass'](<div className="a b c"><p class="abc">test</p></div>);`)
  })

  it('should not work with non-member func call', () => {
    let node = `var d= mapClass(<div className='a b c'><p class='abc'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = mapClass(<div className="a b c"><p class="abc">test</p></div>);`)
  })

  it('should not work with non-jsx args', () => {
    let node = `var d= result.mapClass('abc')`
    expect(lib(node)).to.equal(`var d = result.mapClass('abc');`)
  })

})


describe('babel-plugin-transform-cssobj-jsx with mapName option', () => {
  var lib  = function (code) {
    return transform(code, {
      plugins: [['./index', {mapName: 'makeLocal'}]]
    }).code
  }
  it('should mapClass for string literal', () => {
    let node = `var d= result.makeLocal(<div className='a b c'><p class='abc'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass('abc')}>test</p></div>;`)
  })

  it('should mapClass for expression container', () => {
    let node = `var d= result.makeLocal(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass(getClass())}>test</p></div>;`)
  })

  it('should mapClass using complex cssobj result', () => {
    let node = `var d= state.result().makeLocal(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={state.result().mapClass('a b c')}><p class={state.result().mapClass(getClass())}>test</p></div>;`)
  })

  it('should accept makeLocal only, without result', () => {
    let node = `var d= makeLocal(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={makeLocal('a b c')}><p class={makeLocal(getClass())}>test</p></div>;`)
  })
})


