<div style="height:16px"></div>

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

## Source

[GitHub](https://github.com/mill6-plat6aux/hardcore)

## License

[MIT](LICENSE)