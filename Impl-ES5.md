## Implementation for ECMAScript 5

```html
<!DOCTYPE html>
<html>
    <head>
        <script type="text/javascript" src="hardcore.js"></script>
        <script type="text/javascript">
            document.addEventListener("DOMContentLoaded", function() {
                new Sample();
            });
            function Sample() {
                var self = this;
                ViewController.call(self, "body");
                self.view = View({data: {}}, [
                    TextField({label: "Name", dataKey: "name"}),
                    TextField({label: "Address", dataKey: "address"}),
                    TextField({label: "Phone number", dataKey: "phoneNumber"}),
                    Button({label: "JOIN", tapHandler: function() {
                        var xhr = new XMLHttpRequest();
                        xhr.open("POST", "storeData");
                        xhr.setRequestHeader("Content-Type", "application/json");
                        xhr.send(JSON.stringify(self.view.data));
                    }})
                ]);
                return self;
            }
        </script>
    </head>
    <body>
    </body>
</html>
```
