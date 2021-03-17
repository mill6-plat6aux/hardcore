## Install Hardcore.js

```sh
npm install hardcore-client
```

## Implementation for ECMAScript 6

```js
import {ViewController, PopoverViewController, View, Button, Table, TextField} from "./hardcore.es6.js";

export class Sample extends ViewController {
    constructor() {
        super();
        this.parent = "body";
        this.data = [];
        this.view = View([
            View({contentsAlign: "right"}, [
                Button({label: "ADD USER", tapHandler: () => {
                    let newId = this.data.reduce((result, record) => {
                        return result <= record.id ? record.id+1 : result;
                    }, 1);
                    var recordEditor = new RecordEditor();
                    recordEditor.data = {id: newId};
                    recordEditor.registerHandler = (addedRecord) => {
                        this.data.push(addedRecord);
                    };
                }})
            ]),
            Table({
                dataKey: ".",
                columns: [
                    {label: "Name", style: {"width": "160px"}, dataKey: "name"},
                    {label: "Address", dataKey: "address"},
                    {label: "Phone number", style: {"width": "160px"}, dataKey: "phoneNumber"}
                ],
                height: 500,
                rowHeight: 40, 
                tapHandler: (record) => {
                    let updatedRecord = {
                        id: record.id,
                        name: record.name,
                        address: record.address,
                        phoneNumber: record.phoneNumber
                    };
                    var recordEditor = new RecordEditor();
                    recordEditor.data = updatedRecord;
                    recordEditor.registerHandler = (addedRecord) => {
                        let index = this.data.findIndex(record => record.id == updatedRecord.id);
                        if(index >= 0) {
                            this.data.splice(index, 1, updatedRecord);
                        }
                    };
                    recordEditor.removeHandler = (removedRecord) => {
                        let index = this.data.findIndex(record => record.id == removedRecord.id);
                        if(index >= 0) {
                            this.data.splice(index, 1);
                        }
                    };
                }
            })
        ]);
    }
}

class RecordEditor extends PopoverViewController {
    constructor() {
        super();
        this.parent = "body";
        this.view = View({width: 240, style: {"padding": "8px", "background-color": "white"}}, [
            TextField({label: "Name", dataKey: "name", required: true}),
            TextField({label: "Address", dataKey: "address"}),
            TextField({label: "Phone number", dataKey: "phoneNumber", pattern: "[0-9+-]+"}),
            View(".controls", {contentsAlign: "center"}, [
                Button({label: "APPLY", tapHandler: () => {
                    if(!this.view.validate()) return;
                    if(this.registerHandler != undefined) {
                        this.registerHandler(this.data);
                    }
                    this.dismiss();
                }})
            ])
        ]);
    }
    registerHandler;
    set removeHandler(newValue) {
        let removeHandler = newValue;
        this.view.querySelector(".controls").appendChild(Button({label: "DELETE", tapHandler: () => {
            removeHandler(this.data);
            this.dismiss();
        }}));
    }
}
```

```html
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        <script type="module">
            import {Sample} from "./test-es6.js";
            new Sample();
        </script>
    </body>
</html>
```