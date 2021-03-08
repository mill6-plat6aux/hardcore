![Hardcore.js](https://github.com/mill6-plat6aux/hardcore/blob/main/hardcore.png)

Front-end components for Pure JavaScript lovers❤️

```js
var Sample = (function(self) {
    ViewController.call(self, "body");
    self.view = View({data: {}}, [
        TextField({label: "Name", dataKey: "name"}),
        TextField({label: "Address", dataKey: "address"}),
        TextField({label: "Phone number", dataKey: "phoneNumber"}),
        Button({label: "JOIN", tapHandler: function() {
            fetch("storeData", {
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(self.view.data)
            });
        }})
    ]);
    return self;
}({}));
```

## Documents

* [API Reference](https://github.com/mill6-plat6aux/hardcore/blob/main/doc/index.html)
* [Motivation (ja)](https://github.com/mill6-plat6aux/hardcore/blob/main/Motivation.md)

## License

[MIT](https://github.com/mill6-plat6aux/hardcore/blob/main/LICENSE)
