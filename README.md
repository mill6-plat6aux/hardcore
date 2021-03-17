![Hardcore.js](https://raw.github.com/mill6-plat6aux/hardcore/main/hardcore.png)

Front-end components for Pure JavaScript lovers❤️

```js
var Sample = ViewController(function(self) {
    self.parent = "body";
    self.view = View([
        TextField({label: "Name", dataKey: "name"}),
        TextField({label: "Address", dataKey: "address"}),
        TextField({label: "Phone number", dataKey: "phoneNumber"}),
        Button({label: "JOIN", tapHandler: function() {
            var data = self.data;
            // Do as you like.
        }})
    ]);
});
var sample = new Sample();
sample.data = {};
```

## Documents

* [Sample for ES5](https://github.com/mill6-plat6aux/hardcore/blob/main/Impl-ES5.md)
* [Sample for ES6](https://github.com/mill6-plat6aux/hardcore/blob/main/Impl-ES6.md)
* [API Reference](https://mill6-plat6aux.github.io/hardcore/index.html)
* [Motivation (ja)](https://github.com/mill6-plat6aux/hardcore/blob/main/Motivation.md)

## License

[MIT](https://github.com/mill6-plat6aux/hardcore/blob/main/LICENSE)
