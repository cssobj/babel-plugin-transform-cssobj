const {expect} = require('chai')
const {transform} = require('babel-core')

describe('babel-plugin-transform-cssobj-jsx', () => {
  var lib  = function (code) {
    return transform(code, {
      plugins: ['./index']
    }).code
  }

  it('should mapClass for string literal', () => {
    const node = `var d= result.mapClass(<div className='a b c'><p class='abc' shouldNotMap='cde'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass('abc')} shouldNotMap="cde">test</p></div>;`)
  })

  it('should mapClass for expression container', () => {
    const node = `var d= result.mapClass(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass(getClass())}>test</p></div>;`)
  })

  it('should mapClass using complex cssobj result', () => {
    const node = `var d= state.result().mapClass(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={state.result().mapClass('a b c')}><p class={state.result().mapClass(getClass())}>test</p></div>;`)
  })

  it('should not work with computed object', () => {
    const node = `var d= result['mapClass'](<div className='a b c'><p class='abc'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = result['mapClass'](<div className="a b c"><p class="abc">test</p></div>);`)
  })

  it('should not work with non-member func call', () => {
    const node = `var d= mapClass(<div className='a b c'><p class='abc'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = mapClass(<div className="a b c"><p class="abc">test</p></div>);`)
  })

  it('should not work with non-jsx args', () => {
    const node = `var d= result.mapClass('abc')`
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
    const node = `var d= result.makeLocal(<div className='a b c'><p class='abc'>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass('abc')}>test</p></div>;`)
  })

  it('should mapClass for expression container', () => {
    const node = `var d= result.makeLocal(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}><p class={result.mapClass(getClass())}>test</p></div>;`)
  })

  it('should mapClass using complex cssobj result', () => {
    const node = `var d= state.result().makeLocal(<div className={'a b c'}><p class={getClass()}>test</p></div>)`
    expect(lib(node)).to.equal(`var d = <div className={state.result().mapClass('a b c')}><p class={state.result().mapClass(getClass())}>test</p></div>;`)
  })
})
