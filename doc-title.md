<div style="height:16px"></div>

![Hardcore.js](https://raw.github.com/mill6-plat6aux/hardcore/main/hardcore.png)

Front-end components for Pure JavaScript lovers❤️

```js
var Sample = (function(self) {
    ViewController.call(self, "body");
    self.view = View({data: {}}, [
        TextField({label: "Name", dataKey: "name"}),
        TextField({label: "Address", dataKey: "address"}),
        TextField({label: "Phone number", dataKey: "phoneNumber"}),
        Button({label: "JOIN", tapHandler: function() {
            var data = self.view.data;
            // Do as you like.
        }})
    ]);
    return self;
}({}));
```

## Source

[GitHub](https://github.com/mill6-plat6aux/hardcore)

## License

[MIT](LICENSE)