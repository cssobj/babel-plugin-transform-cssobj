# babel-plugin-transform-cssobj-jsx
Babel plugin to transform class names into cssobj localized names, easily transform existing code into cssobj.

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

3. In you JSX, consume cssobj result as below:

    ``` javascript
    const style = cssobj(obj)

    const html = (
        <div className={'nav', style}>
        <p className={'!news item active', style}> </p></div>
    )
    ```

    Which transform into below code:

    ``` javascript
    const html = (
        <div className={result.mapClass('nav')}>
        <p className={result.mapClass('!news item active')}> </p></div>
    )
    ```

  Note: According to **cssobj** `mapClass` rule, the `news` will not localized (aka keep AS IS).

## More Usage

  - **Case 1** Your existing code already use Sequence Expression

    Use below to prevent this plugin to transform:

    ```Javascript
    // existing code
    <div className={init(), get()}>

    // prevent transform
    <div className={init(), get(), true}>

    // will result as (same as existing code)
    <div className={init(), get()}>
    ```

  - **Case 2** You are debugging, want temp disable the transform

    Use below to keep you class names untouched (not mapped)

    ```Javascript
    // pass null as last object
    <div className={'a b c', null}>

    // will result as
    <div className={'a b c'}>
    ```

## TODO

 - [ ] Support JSX Spread
 - [ ] Child element should regard to parent cssobj scope
