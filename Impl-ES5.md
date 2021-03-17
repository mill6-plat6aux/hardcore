## Implementation for ECMAScript 5

```html
<!DOCTYPE html>
<html>
    <head>
        <script type="text/javascript" src="./hardcore.js"></script>
        <script>
            "use strict";

            var Sample = ViewController(function(self) {
                self.parent = "body";
                self.data = [];
                self.view = View([
                    View({contentsAlign: "right"}, [
                        Button({label: "ADD USER", tapHandler: function() {
                            var newId = self.data.reduce(function(result, record) {
                                return result <= record.id ? record.id+1 : result;
                            }, 1);
                            var recordEditor = new RecordEditor();
                            recordEditor.data = {id: newId};
                            recordEditor.registerHandler = function(addedRecord) {
                                self.data.push(addedRecord);
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
                        tapHandler: function(record) {
                            var updatedRecord = {
                                id: record.id,
                                name: record.name,
                                address: record.address,
                                phoneNumber: record.phoneNumber
                            };
                            var recordEditor = new RecordEditor();
                            recordEditor.data = updatedRecord;
                            recordEditor.registerHandler = function(updatedRecord) {
                                var index = self.data.findIndex(function(record) {
                                    return record.id == updatedRecord.id;
                                });
                                if(index >= 0) {
                                    self.data.splice(index, 1, updatedRecord);
                                }
                            };
                            recordEditor.removeHandler = function(removedRecord) {
                                var index = self.data.findIndex(function(record) {
                                    return record.id == removedRecord.id;
                                });
                                if(index >= 0) {
                                    self.data.splice(index, 1);
                                }
                            };
                        }
                    })
                ]);
            });
            
            var RecordEditor = PopoverViewController(function(self) {
                self.parent = "body";
                self.view = View({width: 240, style: {"padding": "8px", "background-color": "white"}}, [
                    TextField({label: "Name", dataKey: "name", required: true}),
                    TextField({label: "Address", dataKey: "address"}),
                    TextField({label: "Phone number", dataKey: "phoneNumber", pattern: "[0-9+-]+"}),
                    View(".controls", {contentsAlign: "center"}, [
                        Button({label: "APPLY", tapHandler: function() {
                            if(!self.view.validate()) return;
                            if(self.registerHandler != undefined) {
                                self.registerHandler(self.data);
                            }
                            self.dismiss();
                        }})
                    ])
                ]);
                self.registerHandler = undefined;
                Object.defineProperty(self, "removeHandler", {
                    set: function(newValue) {
                        var removeHandler = newValue;
                        self.view.querySelector(".controls").appendChild(Button({label: "DELETE", tapHandler: function() {
                            removeHandler(self.data);
                            self.dismiss();
                        }}));
                    }
                });
            });
        </script>
    </head>
    <body>
        <script>new Sample();</script>
    </body>
</html>
```
