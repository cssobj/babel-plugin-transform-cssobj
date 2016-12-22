const {expect} = require('chai')
const {transform} = require('babel-core')

describe('transform-plugins', () => {
  var lib  = function (code) {
    return transform(code, {
      plugins: ['./transform-plugins']
    }).code
  }

  it('should transform plugins literal, should not transform non-literal', () => {
    let node = `!{plugins: [{'default-unit-234': 'px'}, {selector: abc}]}`
    expect(lib(node)).to.equal(`import cssobj_plugin_default_unit_234 from 'cssobj-plugin-default-unit-234';
!{ plugins: [cssobj_plugin_default_unit_234('px'), { selector: abc }] };`)

    node = `!{plugins: [{'default-unit-234': 'px'}, {'localize': {space:'_my_'}}]}`
    expect(lib(node)).to.equal(`import cssobj_plugin_localize from 'cssobj-plugin-localize';
import cssobj_plugin_default_unit_234 from 'cssobj-plugin-default-unit-234';
!{ plugins: [cssobj_plugin_default_unit_234('px'), cssobj_plugin_localize({ space: '_my_' })] };`)
  })

  it('should work with empty or non-plugins', () => {
    let node = `!{plugins: null}`
    expect(lib(node)).to.equal(`!{ plugins: null };`)
    node = `!{plugins: []}`
    expect(lib(node)).to.equal(`!{ plugins: [] };`)
    node = `!{plugins: {abc: 'def'}}`
    expect(lib(node)).to.equal(`!{ plugins: { abc: 'def' } };`)
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
