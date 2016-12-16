const {expect} = require('chai')
const {transform} = require('babel-core')

function lib (code) {
  return transform(code, {
    plugins: ['./index']
  }).code
}

describe('babel-plugin-transform-cssobj-jsx', () => {
  describe('single level test', () => {
    it('should add mapClass', () => {
      const node = `var d=<div className={'a b c', result}>test</div>`
      expect(lib(node)).to.equal(`var d = <div className={result.mapClass('a b c')}>test</div>;`)
    })

    it('should not mapClass (use global)', () => {
      const node = `var d=<div className={'a b c', null}>test</div>`
      expect(lib(node)).to.equal(`var d = <div className={'a b c'}>test</div>;`)
    })

    it('should regard to existing SequenceExpression', () => {
      const node = `var d=<div className={init(), get(), true}>test</div>`
      expect(lib(node)).to.equal(`var d = <div className={(init(), get())}>test</div>;`)
    })
  })
})
