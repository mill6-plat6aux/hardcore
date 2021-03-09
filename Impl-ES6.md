## Install Hardcore.js

```sh
npm install hardcore-client
```

## Implementation for ECMAScript 6

```js
import {ViewController, View, TextField, Button} from "hardcore-client";

document.addEventListener("DOMContentLoaded", () => {
    new Sample();
});

class Sample extends ViewController {
    constructor() {
        super("body");
        this.view = View({data: {}}, [
            TextField({label: "Name", dataKey: "name"}),
            TextField({label: "Address", dataKey: "address"}),
            TextField({label: "Phone number", dataKey: "phoneNumber"}),
            Button({label: "JOIN", tapHandler: () => {
                fetch("storeData", {
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(this.view.data)
                });
            }})
        ]);
    }
}
```