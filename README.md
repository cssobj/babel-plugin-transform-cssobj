# babel-plugin-transform-cssobj-jsx
Babel plugin to transform class names into cssobj localized names, easily transform existing code into cssobj.

[![Join the chat at https://gitter.im/css-in-js/cssobj](https://badges.gitter.im/css-in-js/cssobj.svg)](https://gitter.im/css-in-js/cssobj)
[![Build Status](https://travis-ci.org/cssobj/babel-plugin-transform-cssobj-jsx.svg?branch=master)](https://travis-ci.org/cssobj/babel-plugin-transform-cssobj-jsx)
[![Coverage Status](https://coveralls.io/repos/github/cssobj/babel-plugin-transform-cssobj-jsx/badge.svg?branch=master)](https://coveralls.io/github/cssobj/babel-plugin-transform-cssobj-jsx?branch=master)
[![npm](https://img.shields.io/npm/v/babel-plugin-transform-cssobj-jsx.svg "Version")](https://www.npmjs.com/package/cssobj)

## Usage

1. Install

  ``` bash
  npm install --save-dev babel-plugin-transform-cssobj-jsx
  ```

2. In your `.babelrc`:

  ``` json
  {
    "plugins": ["transform-cssobj-jsx"]
  }
  ```

3. **Wrap your JSX in result.mapClass()**

    ``` javascript
    const style = cssobj(obj)

    const html = style.mapClass(
      <div className='container'>
        <div className={func()}>
        <p className='!news item active'> </p></div></div>
    )
    ```

    Which transform into below code:

    ``` javascript
    const html = (
      <div className={style.mapClass('container')}>
        <div className={style.mapClass(func())}>
        <p className={style.mapClass('!news item active')}> </p></div></div>
    )
    ```

  **Note**: According to **cssobj** `mapClass` rule, the `!news` will become `news` and not localized (aka keep AS IS).

## More Usage

  This plugin transform the below formats:

  - **result.mapClass(JSX)**

  - **result.mapName(JSX)** (alias of result.mapClass)

  - **mapName(JSX)** (function reference of result.mapClass)


  If your existing code already has the form, .e.g:

  ```Javascript
  // existing code, you don't want below to transform
  myObj.mapClass(<div className='abc'>should not be transformed</div>)
  ```

You have two way to escape the transform

1. Change the original method call as `myObj['mapClass']`, that way this plugin don't touch it

2. Pass **plugin option** `mapName` to use other name rather than `mapClass`

  ``` json
  {
    "plugins": [ ["transform-cssobj-jsx", {"mapName": "makeLocal"}] ]
  }
  ```

  Then you can use `makeLocal` instead of `mapClass`, as a alias property of cssobj result (it's **must not exists** in your scope)

  ```javascript
  // below will be transformed, using alias property
  style.makeLocal( <div className='nav'></div> )
  // <div className={ style.mapClass('nav') }></div>

  // your existing code keep untouched
  myObj.mapClass( <div className='abc'> )
  ```

  Or, if you discard the cssobj result part, then the `mapName` is not alias, it's a real function (it **must exists** in your scope)

  ```javascript
  // makeLocal is not alias, it's have to be assigned
  const makeLocal = style.mapClass

  // will inject to className prop
  makeLocal( <div className='nav'></div> )
  // <div className={ makeLocal('nav') }></div>
  ```

  This feature is to keep the generated code optimized, both in bundle size and perf

## TODO

 - [ ] Support JSX Spread
 - [x] Child element should regard to parent cssobj scope
