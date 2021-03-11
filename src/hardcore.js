/*!
 * Hardcore.js
 * Copyright 2017-2021 Takuro Okada.
 * Released under the MIT License.
 */

"use strict";

////////////////////////////////////// View Controller //////////////////////////////////////

/**
 * View Controller
 * @class
 * @param {HTMLElement|string} parent HTMLElement object or selector for parent element
 * @param {HTMLElement} view 
 */
function ViewController(parent, view) {
    if(this === undefined) {
        var _arguments = Array.prototype.slice.call(arguments);
        _arguments.splice(0, 0, null);
        return new (Function.prototype.bind.apply(ViewController, _arguments));
    }
    if(parent !== undefined) {
        if(parent instanceof HTMLElement) {
            this.parent = parent;
        }else if(typeof parent == "string") {
            var _parent = document.querySelector(parent);
            if(_parent != null && _parent instanceof HTMLElement) {
                this.parent = _parent;
            }else {
                console.error("The parent can not be loaded.");
            }
        }else {
            console.error("The parent can not be loaded.");
        }
    }
    Object.defineProperty(this, "view", {
        get: function() {
            return this.contents;
        },
        set: function(newValue) {
            if(this.parent == null) {
                console.error("The parent is not found.");
                return;
            }
            if(newValue instanceof HTMLElement) {
                this.parent.removeAll();
                this.parent.appendChild(newValue);
                this.contents = newValue;
            }else {
                console.error("The view can not be loaded.");
            }
        }
    });
    if(view !== undefined) {
        this.view = view;
    }
}


////////////////////////////////////// HTML Structures //////////////////////////////////////

/**
 * Create HTML element.
 * @param {string} tagName 
 * @param {string} [identifier] element ID (If CSS selector prefix is not included, register it as CSS class.)
 * @param {Object} [attributes] 
 * @param {Array} [children] child elements
 * @returns {HTMLElement}
 */
function HtmlTag() {
    var tagName;
    var elementId;
    var textContent;
    var children;
    var attributes;
    for(var i=0; i<arguments.length; i++) {
        var argument = arguments[i];
        if(typeof argument == "string") {
            if(tagName == undefined) {
                tagName = argument;
            }else if(elementId == undefined) {
                elementId = argument;
            }else if(textContent == undefined) {
                textContent = argument;
            }
        }else if(Array.isArray(argument)) {
            children = argument;
        }else if(typeof argument == "object") {
            attributes = argument;
        }
    }

    var element;
    if(tagName != undefined) {
        element = document.createElement(tagName);
    }
    if(element == undefined) {
        console.error("Invalid definition: ", arguments);
        return null;
    }

    // destyle
    element.style.setProperty("margin", "0");
    if(tagName == "input" || tagName == "textarea" || tagName == "select" || tagName == "button") {
        element.defineStyles({
            "padding": "0",
            "border": "none",
            "outline": "none",
            "-webkit-appearance": "none",
            "appearance": "none",
            "vertical-align": "middle",
            "background": "transparent",
            "font-size": "1em"
        });
    }
    if(tagName == "input" || tagName == "button") {
        element.style.setProperty("overflow", "visible");
    }
    if(tagName == "button" || tagName == "select") {
        element.style.setProperty("text-transform", "none");
    }
    if(tagName == "button") {
        element.style.setProperty("cursor", "pointer");
    }
    if(tagName == "table") {
        element.style.setProperty("border-collapse", "collapse");
        element.style.setProperty("border-spacing", "0");
    }
    if(tagName == "td") {
        element.style.setProperty("vertical-align", "top");
        element.style.setProperty("padding", "0");
    }

    if(elementId != undefined) {
        if(elementId.startsWith("#") && elementId.length > 1) {
            element.setAttribute("id", elementId.substring(1));
        }else if(elementId.startsWith(".") && elementId.length > 1) {
            element.setAttribute("class", elementId.substring(1));
        }else {
            element.setAttribute("class", elementId);
        }
    }

    if(textContent != undefined) {
        element.innerText = textContent;
    }

    var data;
    if(attributes != undefined) {
        var keys = Object.keys(attributes);
        for(i=0; i<keys.length; i++) {
            var key = keys[i];
            var value = attributes[key];
            if(key == "style" && typeof value == "object") {
                element.defineStyles(value);
            }else if(key == "data") {
                data = value;
            }else if(key == "tapHandler" && typeof value == "function") {
                element.addEventListener("click", value);
            }else {
                element.setAttribute(key, value);
            }
        }
    }

    if(children != undefined && element.children.length == 0) {
        for(i=0; i<children.length; i++) {
            var child = children[i];
            if(typeof child == "string") {
                element.insertAdjacentHTML("beforeend", child);
            }else {
                element.append(child);
            }
        }
    }

    // data binding
    var bindData;
    if(data != null) {
        bindData = function(element) {
            if(element.data == null) return;
    
            var i;
    
            var inputElements = element.querySelectorAll("input,textarea,select");
            for(i=0; i<inputElements.length; i++) {
                var inputElement = inputElements[i];
                if(inputElement.dataKey != null) {
                    value = element.data[inputElement.dataKey];
                    value = value !== undefined ? value : null;
                    inputElement.value = value;
                    // autocomplete support
                    inputElement.addEventListener("input", function(event) {
                        var value = event.currentTarget.value;
                        value = value !== undefined ? value : null;
                        element.data[event.currentTarget.dataKey] = value;
                    });
                    // general input completion
                    inputElement.addEventListener("blur", function(event) {
                        var value = event.currentTarget.value;
                        value = value !== undefined ? value : null;
                        element.data[event.currentTarget.dataKey] = value;
                    });
                }
            }
    
            var selectElements = element.querySelectorAll("._hardcore-select");
            for(i=0; i<selectElements.length; i++) {
                var selectElement = selectElements[i];
                if(selectElement.items != null && selectElement.dataKey != null) {
                    var items = selectElement.items;
                    var dataKey = selectElement.dataKey;
                    var valueKey = selectElement.valueKey;
                    if(valueKey == null) {
                        valueKey = dataKey;
                    }
                    value = element.data[dataKey];
                    value = value !== undefined ? value : null;
                    var index = -1;
                    for(var j=0; j<items.length; j++) {
                        var item = items[j];
                        if(item[valueKey] == value) {
                            index = j;
                            break;
                        }
                    }
                    selectElement.selectedIndex = index;
                    selectElement.dataBindHandler = function(selectedIndex, _element) {
                        element.data[_element.dataKey] = _element.items[selectedIndex][_element.valueKey];
                    };
                }
            }
    
            var sliderElements = element.querySelectorAll("._hardcore-slider");
            for(i=0; i<sliderElements.length; i++) {
                var sliderElement = sliderElements[i];
                if(sliderElement.dataKey != null) {
                    value = element.data[sliderElement.dataKey];
                    value = value !== undefined ? value : null;
                    sliderElement.value = value;
                    sliderElement.dataBindHandler = function(value, dataKey) {
                        element.data[dataKey] = value;
                    };
                }
            }
    
            var checkboxElements = element.querySelectorAll("._hardcore-checkbox");
            for(i=0; i<checkboxElements.length; i++) {
                var checkboxElement = checkboxElements[i];
                if(checkboxElement.dataKey != null) {
                    value = element.data[checkboxElement.dataKey];
                    value = value !== undefined ? value : null;
                    checkboxElement.checked = value;
                    checkboxElement.addEventListener("click", function(event) {
                        var value = event.currentTarget.checked;
                        value = value !== undefined ? value : null;
                        element.data[event.currentTarget.dataKey] = value;
                    });
                }
            }
            
            var displayElements = element.querySelectorAll("._hardcore-data-bind");
            for(i=0; i<displayElements.length; i++) {
                var displayElement = displayElements[i];
                if(displayElement.dataKey != null) {
                    value = element.data[displayElement.dataKey];
                    value = value !== undefined ? value : null;
                    displayElement.innerText = value;
                }
            }
        }

        Object.defineProperty(element, "data", {
            configurable: true,
            get: function() {
                return element.bindingData;
            },
            set: function(newValue) {
                element.bindingData = newValue;
                bindData(element);
            }
        });

        element.data = data;
    }

    return element;
}

/**
 * Create DIV element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLDivElement}
 */
function View() {
    var _arguments = Array.prototype.slice.call(arguments);

    var dataKey;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    _arguments.splice(0, 0, "div");
    var element = HtmlTag.apply(this, _arguments);

    if(dataKey != undefined) {
        element.dataKey = dataKey;
        element.classList.add("_hardcore-data-bind");
    }

    return element;
}

/**
 * Create INPUT element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {boolean} [attributes.leaveWithEnter] Element applies the edited contents by ENTER key.
 * @param {string} [attributes.dataKey] 
 * @returns {HTMLInputElement}
 */
function Input() {
    var _arguments = Array.prototype.slice.call(arguments);

    var leaveWithEnter = true;
    var dataKey;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "leaveWithEnter" && typeof argument[key] == "boolean") {
                    leaveWithEnter = argument[key];
                    delete argument[key];
                }else if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    var element;
    if(_arguments.length > 0 && typeof _arguments[0] == "string") {
        var type = _arguments.splice(0, 1, "input")[0];
        element = HtmlTag.apply(this, _arguments);
        element.type = type;
    }else {
        _arguments.splice(0, 0, "input");
        element = HtmlTag.apply(this, _arguments);
    }

    if(leaveWithEnter) {
        element.addEventListener("keypress", function(event) {
            var enterKeyPressed = false;
            if(event.keyCode != undefined) {
                enterKeyPressed = event.keyCode == 13;
            }else if(event.code != undefined) {
                enterKeyPressed = event.keyCode == "Enter";
            }
            if(enterKeyPressed) {
                element.blur();
            }
        });
    }

    if(dataKey != null) {
        element.dataKey = dataKey;
    }

    return element;
}

/**
 * Create INPUT type=text element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] 
 * @returns {HTMLInputElement|HTMLDivElement}
 */
function TextField() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    if(label == null) {
        _arguments.splice(0, 0, "text");
        return Input.apply(this, _arguments);
    }else {
        _arguments.splice(0, 0, "text");
        var element = Input.apply(this, _arguments);
        var inputComposite = InputComposite({label: label}, [element]);
        return inputComposite;
    }
}

/**
 * Create TEXTAREA element.
 * @param {string} [identifier] 要素ID
 * @param {Object} [attributes] 属性
 * @param {string} [attributes.dataKey] データキー
 * @returns {HTMLTextAreaElement}
 */
function TextArea() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "textarea");

    var dataKey;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    var elememt = HtmlTag.apply(this, _arguments);
    
    if(dataKey != undefined) {
        elememt.dataKey = dataKey;
    }

    return elememt;
}

/**
 * Create INPUT type=password element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] 
 * @returns {HTMLInputElement}
 */
function PasswordField() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "password");
    return Input.apply(this, _arguments);
}

/**
 * Create INPUT type=mail element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] 
 * @returns {HTMLInputElement}
 */
function MailField() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "email");
    return Input.apply(this, _arguments);
}

/**
 * Create INPUT type=file element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @returns {HTMLInputElement}
 */
function FileSelector() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "file");
    return Input.apply(this, _arguments);
}

/**
 * @typedef {object} TableColumnDefinition
 * @property {string} label
 * @property {object} style
 * @property {string} dataKey
 * @property {function(HTMLTableDataCellElement, any, any): void} dataHandler
 * @param {HTMLTableDataCellElement} dataHandler.cell
 * @param {*} dataHandler.value
 * @param {*} dataHandler.record
 */

/**
 * Create TABLE element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array.<TableColumnDefinition>} [attributes.columns] 
 * @param {function(any): void} [attributes.tapHandler] Select a row handler
 * @param {Array} [children] 
 * @returns {HTMLTableElement}
 */
function Table() {
    var _arguments = Array.prototype.slice.call(arguments);

    var columns;
    var tapHandler;
    var animate;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "columns" && Array.isArray(argument[key])) {
                    columns = argument[key];
                    delete argument[key];
                }else if(key == "tapHandler" && typeof argument[key] == "function") {
                    tapHandler = argument[key];
                    delete argument[key];
                }else if(key == "animate" && typeof argument[key] == "boolean") {
                    animate = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    _arguments.splice(0, 0, "table");
    var element = HtmlTag.apply(this, _arguments);
    element.style.setProperty("display", "block");

    // header
    if(columns != undefined) {
        var header = TableHeader();
        var row = TableRow();
        for(i=0; i<columns.length; i++) {
            var column = columns[i];
            var cell = TableCell();
            if(column.label != undefined) {
                cell.innerText = column.label;
            }
            if(column.style != undefined) {
                cell.defineStyles(column.style);
            }
            row.appendChild(cell);
        }
        header.append(row);
        element.append(header);
    }

    // data binding
    Object.defineProperty(element, "data", { 
        get: function() {
            return this.bindingData;
        },
        set: function(newValue) {
            this.bindingData = newValue;

            var tableHeader = this.querySelector("thead");
            var tableBody = this.querySelector("tbody");
            if(tableBody != null) {
                tableBody.remove();
            }
            if(this.bindingData != null) {
                var data = this.bindingData;
                tableBody = TableBody();
                tableBody.style.setProperty("height", (this.clientHeight-tableHeader.clientHeight)+"px");
                for(var i=0; i<data.length; i++) {
                    var record = data[i];
                    var row = TableRow();
                    if(columns != undefined) {
                        for(var j=0; j<columns.length; j++) {
                            var column = columns[j];
                            var cell = TableCell();
                            if(column.style != undefined) {
                                cell.defineStyles(column.style);
                            }
                            if(column.dataKey != null) {
                                var value = record[column.dataKey];
                                value = value !== undefined ? value : null;
                                if(column.dataHandler != null) {
                                    column.dataHandler(cell, value, record);
                                }else if(value != null) {
                                    cell.innerText = value;
                                }
                            }
                            row.appendChild(cell);
                        }
                    }
                    if(tapHandler != undefined) {
                        row.addEventListener("click", function(event) {
                            var row = event.currentTarget;
                            var index = tableBody.querySelectorAll("tr").indexOf(row);
                            tapHandler(data[index]);
                        });
                    }
                    if(animate) {
                        row.style.setProperty("opacity", "0");
                        row.style.setProperty("margin-top", "16px");
                    }
                    tableBody.appendChild(row);
                }
                this.appendChild(tableBody);

                var showRow;
                if(animate) {
                    showRow = function(rows, index) {
                        var row = rows[index];
                        new FunctionalAnimation(function(progress) {
                            row.style.setProperty("opacity", progress);
                            row.style.setProperty("margin-top", (16-16*progress)+"px");
                        }, FunctionalAnimation.methods.linear, 100).start(100*index);
                    }
                    var rows = tableBody.querySelectorAll("tr");
                    for(i=0; i<rows.length; i++) {
                        showRow(rows, i);
                    }
                }
            }
        }
    });

    return element;
}

/**
 * Create THEAD element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLTableSectionElement}
 */
function TableHeader() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "thead");
    var element = HtmlTag.apply(this, _arguments);
    element.style.setProperty("display", "block");
    return element;
}

/**
 * Create TBODY element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLTableSectionElement}
 */
function TableBody() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "tbody");
    var element = HtmlTag.apply(this, _arguments);
    element.style.setProperty("display", "block");
    element.style.setProperty("overflow-y", "auto");
    return element;
}

/**
 * Create TR element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLTableRowElement}
 */
function TableRow() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "tr");
    var element = HtmlTag.apply(this, _arguments);
    element.style.setProperty("display", "table");
    element.style.setProperty("width", "100%");
    return element;
}

/**
 * Create TD element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLTableDataCellElement}
 */
function TableCell() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "td");
    return HtmlTag.apply(this, _arguments);
}

/**
 * Create UL element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLUListElement}
 */
function UnorderedList() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "ul");
    return HtmlTag.apply(this, _arguments);
}

/**
 * Create OL element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLOListElement}
 */
function OrderedList() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "ol");
    return HtmlTag.apply(this, _arguments);
}

/**
 * Create LI element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLLIElement}
 */
function ListItem() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "li");
    return HtmlTag.apply(this, _arguments);
}

/**
 * Create IMG element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLImageElement}
 */
function InlineImage() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "img");
    return HtmlTag.apply(this, _arguments);
}

/**
 * Create CANVAS element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLCanvasElement}
 */
function Canvas() {
    var _arguments = Array.prototype.slice.call(arguments);
    _arguments.splice(0, 0, "canvas");
    return HtmlTag.apply(this, _arguments);
}

/**
 * Create BUTTON element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [lattributes.abel] 
 * @param {boolean} [attributes.blocking=true] Whether or not to block subsequent taps after a tap.
 * @param {function(HTMLButtonElement): void} [attributes.tapHandler] When the restore method in the function argument is executed, It makes itself tapable again.
 * @param {Array} [children] 
 * @returns {HTMLButtonElement}
 */
function Button() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label;
    var tapHandler;
    var blocking = false;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(Array.isArray(argument)) {
            label = null;
        }else if(typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }else if(key == "tapHandler" && typeof argument[key] == "function") {
                    tapHandler = argument[key];
                    delete argument[key];
                }else if(key == "blocking" && typeof argument[key] == "boolean") {
                    blocking = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }
    if(label != null) {
        _arguments.push([label]);
    }

    _arguments.splice(0, 0, "button");
    var element = HtmlTag.apply(this, _arguments);

    if(blocking) {
        element.restore = function() {
            this.classList.remove("_disabled");
        };
        element.classList.remove("_disabled");
        element.addEventListener("click", function(event) {
            if(element.classList.contains("_disabled")) {
                event.stopImmediatePropagation();
                return false;
            }
            element.classList.add("_disabled");
            if(tapHandler != undefined) {
                tapHandler(element);
            }
        });
    }else {
        element.addEventListener("click", function(event) {
            if(tapHandler != undefined) {
                tapHandler(element);
            }
        });
    }

    return element;
}

/**
 * Create label and INPUT composite. 
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.label] 
 * @param {Array} [children] define any INPUT elements.
 * @returns {HTMLDivElement}
 */
function InputComposite() {
    var _arguments = Array.prototype.slice.call(arguments);

    var identifierIndex = -1;
    var label;
    var children;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(identifierIndex == -1 && typeof argument == "string") {
            identifierIndex = i;
        }else if(Array.isArray(argument)) {
            children = argument;
        }else if(typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label") {
                    label = argument[key];
                    delete argument[key];
                }
            }
        }
    }
    if(label != null) {
        if(children != undefined) {
            children.splice(0, 0, View("label", label));
        }else {
            _arguments.push([View("label", label)]);
        }
    }

    var element = View.apply(this, _arguments);

    element.defineStyles({
        "min-height": "40px",
        "border": "1px solid darkgray",
        "border-radius": "4px",
        "text-align": "left",
        "padding": "4px",
        "margin": "8px 0",
        "input, select, textarea": {
            "width": "calc(100% - 8px)"
        },
        ".label": {
            "font-size": "10px",
            "color": "darkgray",
            "cursor": "default",
            "user-select": "none"
        },
        ".unit": {
            "font-size": "10px",
            "margin-left": "4px",
            "color": "darkgray"
        }
    });

    return element;
}

/**
 * Create scrollable DIV element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array} [children] 
 * @returns {HTMLDivElement}
 */
function ScrollView() {
    var element = View.apply(this, arguments);
    element.defineStyles({
        "overflow-y": "auto",
        "-ms-overflow-style": "none",
        "-webkit-overflow-scrolling": "touch",
        "scrollbar-width": "none"
    });
    return element;
}

/**
 * Create INPUT element that is avalable input numeric value.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.unit] 
 * @param {boolean} [attributes.currency=false] Whether or not to perform currency formatting.
 * @param {number} [attributes.value] 
 * @param {string} [attributes.dataKey] 
 * @returns {HTMLInputElement} element
 */
function NumericField() {
    var _arguments = Array.prototype.slice.call(arguments);

    var unit;
    var currency = false;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(typeof argument == "object" && !Array.isArray(argument)) {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "unit" && typeof argument[key] == "string") {
                    unit = argument[key];
                    delete argument[key];
                }else if(key == "currency" && typeof argument[key] == "boolean") {
                    currency = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }
    var element = TextField.apply(this, _arguments);

    if(unit != undefined) {
        if(ResizeObserver !== undefined) {
            var resizeObserver = new ResizeObserver(function(observations) {
                if(observations.length == 0) return;
                var element = observations[0].target;
                resizeObserver.disconnect();
                element.style.setProperty("text-align", "right");
                var unitElement = document.createElement("span");
                unitElement.defineStyles({
                    "font-size": "10px",
                    "margin-left": "4px",
                    "color": "darkgray"
                });
                unitElement.innerText = unit;
                element.after(unitElement);
            });
            resizeObserver.observe(element);
        }else {
            console.error("Your browser does not support ResizeObserver. Please try to run Polyfill for this function.");
        }
    }

    if(currency) {
        element.addEventListener("focus", function() {
            var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(element);
            if(value != null) {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, value.replace(/,/g, ""));
            }
        });
        element.addEventListener("blur", function() {
            var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(element);
            if(value != null) {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, StringUtil.currencyString(value));
            }
        });
        var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(element);
        if(value != null) {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, StringUtil.currencyString(value));
        }
    }

    Object.defineProperty(element, "value", { 
        get: function() {
            var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(element);
            if(value == null) {
                return value;
            }
            if(currency) {
                value = value.replace(/,/g, "");
            }
            if(value.length == 0) {
                return null;
            }
            value = Number(value);
            if(Number.isNaN(value)) {
                return null;
            }
            return value;
        },
        set: function(newValue) {
            if(currency) {
                newValue = StringUtil.currencyString(newValue);
            }
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, newValue);
        }
    });

    return element;
}

/**
 * Create check-box element.
 * @param {string} [identifier] 
 * @param {Object} [settings] 
 * @param {string} [settings.label] 
 * @param {boolean} [settings.checked=false] 
 * @param {number|string} [settings.fontSize] 
 * @param {string} [settings.boxColor=black] 
 * @param {string} [settings.checkColor=black] 
 * @param {string} [settings.dataKey] 
 * @returns {HTMLDivElement}
 */
function Checkbox() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label = undefined;
    var checked = false;
    var boxColor = "black";
    var checkColor = "black";
    var fontSize = "16px";
    var dataKey;
    var changeHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(typeof argument == "object" && !Array.isArray(argument)) {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }else if(key == "checked" && typeof argument[key] == "boolean") {
                    checked = argument[key];
                    delete argument[key];
                }else if(key == "fontSize" && (typeof argument[key] == "number" || typeof argument[key] == "string")) {
                    fontSize = argument[key];
                    delete argument[key];
                }else if(key == "boxColor" && typeof argument[key] == "string") {
                    boxColor = argument[key];
                    delete argument[key];
                }else if(key == "checkColor" && typeof argument[key] == "string") {
                    checkColor = argument[key];
                    delete argument[key];
                }else if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }else if(key == "changeHandler" && typeof argument[key] == "function") {
                    changeHandler = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }
    
    _arguments.splice(0, 0, "div");
    var element = HtmlTag.apply(this, _arguments);

    if(dataKey != undefined) {
        element.dataKey = dataKey;
    }

    element.classList.add("_hardcore-checkbox");

    element.style.setProperty("display", "inline-block");
    element.style.setProperty("height", "32px");
    element.style.setProperty("line-height", "32px");
    element.style.setProperty("font-size", fontSize);

    var canvas = document.createElement("canvas");
    canvas.style.setProperty("vertical-align", "bottom");
    var canvasSize = Size(24, 32);
    CanvasUtil.initCanvas(canvas, {width: 24, height: 32});
    element.appendChild(canvas);
    if(label != null) {
        element.appendChild(document.createTextNode(label));
    }
    var context = canvas.getContext('2d');

    var width = canvasSize.width;
    var height = canvasSize.height;
    var boxWidth = 16;
    var boxHeight = 16;

    var beginX = width/2 - boxWidth/2;
    var beginY = height/2 - boxHeight/2;
    var centerX = width/2;
    var centerY = height/2;
    var endX = width/2 + boxWidth/2;
    var endY = height/2 + boxHeight/2;

    function drawBox(context) {
        context.beginPath();
        context.rect(beginX, beginY, boxWidth, boxHeight);

        context.strokeStyle = boxColor;
        context.lineWidth = 1;
        context.stroke();
    }

    function drawCheck(context) {
        context.strokeStyle = checkColor;
        context.lineWidth = 4;
        context.lineCap = "square";

        context.beginPath();
        context.moveTo(beginX, centerY);
        context.lineTo(centerX, endY);
        context.lineTo(endX, beginY);

        context.strokeStyle = checkColor;
        context.lineWidth = 4;
        context.lineCap = "square";

        context.stroke();
    }

    function drawCheckWithAnimation(context) {
        var leftRadius = Math.sqrt(Math.pow(boxWidth/2, 2) + Math.pow(boxWidth/2, 2));
        var rightRadius = Math.sqrt(Math.pow(boxWidth/2, 2) + Math.pow(boxWidth, 2));

        var leftRadian = 45.0*(Math.PI/180.0);
        var rightRadian = 63.0*(Math.PI/180.0);

        context.strokeStyle = checkColor;
        context.lineWidth = 4;
        context.lineCap = "square";

        new FunctionalAnimation(function(progress) {
            var x, y;
            var ratio;
            context.beginPath();
            if(progress < 0.5) {
                ratio = (0.5-progress)/0.5;
                x = centerX - leftRadius * ratio * Math.cos(leftRadian);
                y = endY - leftRadius * ratio * Math.sin(leftRadian);
                if(x > centerX) x = centerX;
                if(y > endY) y = endY;
                context.moveTo(beginX, centerY);
            }else {
                ratio = (progress-0.5)/0.5;
                x = centerX + rightRadius * ratio * Math.cos(rightRadian);
                y = endY - rightRadius * ratio * Math.sin(rightRadian);
                if(x > endX) x = endX;
                if(y < beginY) y = beginY;
                context.moveTo(centerX, endY);
            }
            context.lineTo(x, y);
            context.stroke();
        }, FunctionalAnimation.methods.easeInOut, 300).start();
    }

    Object.defineProperty(element, "checked", { 
        get: function() {
            return this._checked;
        },
        set: function(newValue) {
            var initial = this._checked == undefined;
            this._checked = newValue;
            var canvas = this.querySelector("canvas");
            var context = canvas.getContext('2d');
            if(this._checked) {
                if(initial) {
                    drawCheck(context);
                }else {
                    drawCheckWithAnimation(context);
                }
            }
        }
    });
    element.checked = checked;

    drawBox(context);

    element.addEventListener("click", function(event) {
        var element = event.currentTarget;
        var canvas = element.querySelector("canvas");
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawBox(context);
        element.checked = !element.checked;
        if(changeHandler != undefined) {
            changeHandler();
        }
    });

    return element;
}

/**
 * Create compatible select element. It absorbs differences in expression between operating systems and browsers.
 * @param {string} [identifier] 
 * @param {Object} [settings] 
 * @param {Array} settings.items 
 * @param {number} [settings.selectedIndex] 
 * @param {number} [settings.itemWidth] 
 * @param {number} [settings.itemHeight] 
 * @param {function(item:any):string} [settings.labelHandler] 
 * @param {function(item:any):object} [settings.styleHandler] 
 * @param {function(itemElement:HTMLDivElement, item): void} [settings.itemDrawer] 
 * @param {function(selectedIndex:number): void} [settings.selectHandler] 
 * @param {function(void): void} [settings.closeHandler] 
 * @param {boolean} [settings.selectedDrawing=true] 
 * @param {boolean} [settings.editable=true] 
 * @returns {HTMLDivElement}
 */
function Select() {
    var _arguments = Array.prototype.slice.call(arguments);

    var settingsIndex = -1;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(typeof argument == "object" && !Array.isArray(argument)) {
            settingsIndex = i;
            break;
        }
    }
    var settings;
    if(settingsIndex != -1) {
        settings = _arguments[settingsIndex];
        _arguments.splice(settingsIndex, 1);
    }

    _arguments.splice(0, 0, "div");
    var element = HtmlTag.apply(this, _arguments);

    element.classList.add("_hardcore-select");

    if(settings != undefined) {
        if(settings.styles != undefined) {
            element.defineStyles(settings.styles);
        }
        if(settings.valueKey != undefined) {
            element.valueKey = settings.valueKey;
        }
        if(settings.dataKey != undefined) {
            element.dataKey = settings.dataKey;
            if(element.valueKey == undefined) {
                element.valueKey = settings.dataKey;
            }
        }
    }

    var select = Controls.Select(element, settings);
    Object.defineProperty(element, "selectedIndex", { 
        get: function() {
            return select.selectedIndex;
        },
        set: function(newValue) {
            select.selectedIndex = newValue;
        }
    });
    Object.defineProperty(element, "items", { 
        get: function() {
            return select.items;
        }
    });
    if(element.dataKey != undefined) {
        Object.defineProperty(element, "dataBindHandler", { 
            set: function(newValue) {
                if(settings.selectHandler != undefined) {
                    var originalHandler = settings.selectHandler;
                    select.selectHandler = function(selectedIndex, select) {
                        originalHandler(selectedIndex, select);
                        newValue(selectedIndex, element);
                    };
                }else {
                    select.selectHandler = function(selectedIndex, select) {
                        newValue(selectedIndex, element);
                    }
                }
            }
        });
    }
    element.show = function() {
        select.show();
    };
    element.close = function() {
        select.close();
    };

    return element;
}

/**
 * Create slider element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {number} [attributes.value] 
 * @param {number} [attributes.maxValue=100] 
 * @param {number} [attributes.minValue=0] 
 * @param {number} [attributes.stepValue=1] Unit value when the value is changed.
 * @param {string} [attributes.borderColor] 
 * @param {string} [attributes.indicatorColor] 
 * @param {string} [attributes.unit] Label suffix
 * @param {boolean} [attributes.editable=true] 
 * @param {function(number): void} [attributes.changeHandler] Called when the value is chnanged.
 * @returns {HTMLDivElement}
 */
function Slider() {
    var _arguments = Array.prototype.slice.call(arguments);

    var value;
    var maxValue = 100;
    var minValue = 0;
    var stepValue = 1;
    var borderColor = "darkgray";
    var indicatorColor = "black";
    var unit = "%";
    var editable = true;
    var dataKey;
    var changeHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(typeof argument == "object" && !Array.isArray(argument)) {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "value" && typeof argument[key] == "number") {
                    value = argument[key];
                    delete argument[key];
                }else if(key == "maxValue" && typeof argument[key] == "number") {
                    maxValue = argument[key];
                    delete argument[key];
                }else if(key == "minValue" && typeof argument[key] == "number") {
                    minValue = argument[key];
                    delete argument[key];
                }else if(key == "stepValue" && typeof argument[key] == "number") {
                    stepValue = argument[key];
                    delete argument[key];
                }else if(key == "borderColor" && typeof argument[key] == "string") {
                    borderColor = argument[key];
                    delete argument[key];
                }else if(key == "indicatorColor" && typeof argument[key] == "string") {
                    indicatorColor = argument[key];
                    delete argument[key];
                }else if(key == "unit" && typeof argument[key] == "string") {
                    unit = argument[key];
                    delete argument[key];
                }else if(key == "editable" && typeof argument[key] == "boolean") {
                    editable = argument[key];
                    delete argument[key];
                }else if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }else if(key == "changeHandler" && typeof argument[key] == "function") {
                    changeHandler = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    _arguments.splice(0, 0, "div");
    var element = HtmlTag.apply(this, _arguments);

    if(changeHandler != undefined) {
        element.changeHandler = changeHandler;
    }
    if(dataKey != undefined) {
        element.dataKey = dataKey;

        Object.defineProperty(element, "dataBindHandler", { 
            set: function(newValue) {
                var element = this;
                if(changeHandler != undefined) {
                    var originalHandler = element.changeHandler;
                    element.changeHandler = function(value) {
                        originalHandler(value);
                        newValue(value, element.dataKey);
                    };
                }else {
                    element.changeHandler = function(value) {
                        newValue(value, element.dataKey);
                    }
                }
            }
        });
    }

    element.classList.add("_hardcore-slider");

    element.style.setProperty("border", "1px solid "+borderColor);
    element.style.setProperty("height", "24px");
    
    var indicator = document.createElement("canvas");
    indicator.style.setProperty("position", "relative");
    indicator.style.setProperty("top", "0");
    indicator.style.setProperty("left", "0");
    element.appendChild(indicator);

    if(element.parentElement != null) {
        CanvasUtil.initCanvas(indicator, {width: element.clientWidth, height: element.clientHeight});
    }else {
        if(ResizeObserver !== undefined) {
            var resizeObserver = new ResizeObserver(function(observations) {
                if(observations.length == 0) return;
                var element = observations[0].target;
                resizeObserver.disconnect();
                CanvasUtil.initCanvas(indicator, {width: element.clientWidth, height: element.clientHeight});
                draw(element.value);
            });
            resizeObserver.observe(element);
        }else {
            console.error("Your browser does not support ResizeObserver. Please try to run Polyfill for this function.");
        }
    }

    function draw(progress) {
        var width = indicator.clientWidth;
        var height = indicator.clientHeight;
        var context = indicator.getContext("2d");

        context.clearRect(0, 0, width, height);

        var label;
        if(progress != undefined) {
            var position = width * (progress/(maxValue-minValue));
            context.fillStyle = indicatorColor;
            context.fillRect(0, 0, position, height);

            label = progress + unit;
            var size = context.measureText(label);
            if(position < size.width+8) {
                DrawUtil.drawText(context, label, {x: position+4, y: 0, width: size.width, height: height}, {size:"12px", color:indicatorColor});
            }else {
                DrawUtil.drawText(context, label, {x: 4, y: 0, width: size.width, height: height}, {size:"12px"}, "destination-out");
            }
        }else {
            if(editable) {
                if(navigator.language != null && navigator.language.includes("ja")) {
                    label = "ドラッグして設定してください";
                }else {
                    label = "Drag to set";
                }
            }else {
                if(navigator.language != null && navigator.language.includes("ja")) {
                    label = "未設定";
                }else {
                    label = "Not set";
                }
            }
            var color = new Color(indicatorColor).colorWithAlpha(0.5);
            color = color.toStringWithAlpha();
            DrawUtil.drawText(context, label, {x: 4, y: 0, width: width, height: height}, {size:"12px", color:color});
        }
    }

    function verifyValue(currentValue) {
        if(currentValue == null) {
            return null;
        }
        if(currentValue%stepValue != 0) {
            currentValue = Math.round(currentValue/stepValue) * stepValue;
        }
        if(currentValue > maxValue) {
            currentValue = maxValue;
        }else if(currentValue < minValue) {
            currentValue = minValue;
        }
        return currentValue;
    }

    Object.defineProperty(element, "value", { 
        get: function() {
            return this._value;
        },
        set: function(newValue) {
            this._value = newValue;
            draw(newValue);
        }
    });

    element.value = verifyValue(value);

    if(editable) {
        element.dragging = false;
        UIEventUtil.handleTouch(element, {
            touchBegan: function(event) {
                var element = event.currentTarget;
                element.dragging = true;
            }, 
            touchMove: function(event) {
                var element = event.currentTarget;
                if(!element.dragging) return false;
                var width = indicator.clientWidth;
                var location = UIEventUtil.getLocation(event);
                var currentValue = (location.x / width) * (maxValue-minValue);
                element.value = verifyValue(currentValue);
                draw(element.value);
            }, 
            touchEnd: function(event) {
                var element = event.currentTarget;
                element.dragging = false;
                if(element.changeHandler != undefined) {
                    element.changeHandler(element.value);
                }
            }
        });
    }

    return element;
}


////////////////////////////////////// Animations //////////////////////////////////////

/**
 * Animation that executes a function every frame.
 * @class
 * @param {function(number): void} animationFunction
 * @param {FunctionalAnimation.methods} method
 * @param {number} duration
 * @returns {FunctionalAnimation}
 */
function FunctionalAnimation() {
    if(this == undefined) {
        var _arguments = Array.prototype.slice.call(arguments);
        _arguments.splice(0, 0, null);
        return new (Function.prototype.bind.apply(FunctionalAnimation, _arguments));
    }

    var animationFunction;
    var method;
    var duration;
    for(var i=0; i<arguments.length; i++) {
        var argument = arguments[i];
        if(typeof argument == "function") {
            if(animationFunction == null) {
                animationFunction = argument;
            }
        }else if(typeof argument == "number") {
            if(method == null) {
                method = argument;
            }else if(duration == null) {
                duration = argument;
            }
        }
    }

    if(animationFunction == undefined) {
        console.error("No animation function is specified.");
        return;
    }else {
        this.animationFunction = animationFunction;
    }

    if(requestAnimationFrame === undefined) {
        console.error("The browser does not support the requestAnimationFrame function. Please try to run Polyfill for this function.");
        animationFunction(1);
        return;
    }

    if(method == undefined) {
        method = FunctionalAnimation.methods.linear;
    }else {
        this.method = method;
    }
    if(duration == undefined) {
        this.duration = 500;
    }else {
        this.duration = duration;
    }
}
FunctionalAnimation.methods = {
    linear: 0,
    easeInOut: 1,
    easeIn: 2,
    easeOut: 3
};
FunctionalAnimation.prototype = {

    // https://gist.github.com/gre/1650294
    easeInOut: function(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
    easeIn: function(t) { return t*t },
    easeOut: function(t) { return t*(2-t) },

    /**
     * Start an animation.
     * @param {number} delay milliseconds
     * @returns {FunctionalAnimation}
     */
    start: function(delay) {
        var self = this;

        if(self.animationFunction == undefined) {
            return;
        }
        if(delay != undefined && typeof delay == "number") {
            setTimeout(function() {
                self.start();
            }, delay);
            return;
        }

        self.beginTime = performance.now();
        self.progress = 0;

        function frameFunction() {
            var progress = (performance.now() - self.beginTime) / self.duration;

            if(progress >= 1) {
                self.progress = 1;
                self.animationFunction(self.progress);
                if(self.finishHandler != undefined) {
                    self.finishHandler();
                }
            }else {
                self.progress = progress;
                if(self.method != null) {
                    if(self.method == FunctionalAnimation.methods.easeInOut) {
                        self.animationFunction(self.easeInOut(progress));
                    }else if(self.method == FunctionalAnimation.methods.easeIn) {
                        self.animationFunction(self.easeIn(progress));
                    }else if(self.method == FunctionalAnimation.methods.easeOut) {
                        self.animationFunction(self.easeOut(progress));
                    }else {
                        self.animationFunction(progress);
                    }
                }else {
                    self.animationFunction(progress);
                }
                requestAnimationFrame(frameFunction);
            }
        }
        requestAnimationFrame(frameFunction);

        return self;
    },

    /**
     * Set finish handler.
     * @param {function(void): void} finishHandler 
     * @returns {FunctionalAnimation}
     */
    finish: function(finishHandler) {
        this.finishHandler = finishHandler;
        return this;
    }
}

/**
 * An animation that changes the specified style for each frame.
 * @class
 * @extends FunctionalAnimation
 * @param {HTMLElement} target
 * @param {string} key
 * @param {Object} settings
 * @param {number} [settings.beginValue]
 * @param {number} settings.finishValue
 * @param {string} [settings.suffix]
 * @param {FunctionalAnimation.methods} [settings.method]
 * @param {number} [settings.duration]
 */
function StyleAnimation() {
    if(this == undefined) {
        var _arguments = Array.prototype.slice.call(arguments);
        _arguments.splice(0, 0, null);
        return new (Function.prototype.bind.apply(StyleAnimation, _arguments));
    }

    var target;
    var key;
    var method = FunctionalAnimation.methods.linear;
    var beginValue;
    var finishValue;
    var suffix;
    var duration;
    for(var i=0; i<arguments.length; i++) {
        var argument = arguments[i];
        if(argument instanceof HTMLElement) {
            if(target == undefined) {
                target = argument;
            }
        }else if(typeof argument == "string") {
            if(key == undefined) {
                key = argument;
            }
        }else if(typeof argument == "object") {
            if(beginValue == undefined && argument.beginValue != null) {
                if(typeof argument.beginValue == "string") {
                    if(argument.beginValue.endsWith("px")) {
                        beginValue = Number(argument.beginValue.substring(0, argument.beginValue.length-2));
                        suffix = "px";
                    }else {
                        beginValue = Number(argument.beginValue);
                    }
                }else if(typeof argument.beginValue == "number") {
                    beginValue = argument.beginValue;
                }
            }
            if(finishValue == undefined && argument.finishValue != null) {
                if(typeof argument.finishValue == "string") {
                    if(argument.finishValue.endsWith("px")) {
                        finishValue = Number(argument.finishValue.substring(0, argument.finishValue.length-2));
                        suffix = "px";
                    }else {
                        finishValue = Number(argument.finishValue);
                    }
                }else if(typeof argument.finishValue == "number") {
                    finishValue = argument.finishValue;
                }
            }
            if(suffix == undefined && argument.suffix != null) {
                suffix = argument.suffix;
            }
            if(method == undefined && argument.method != null) {
                method = argument.method;
            }
            if(duration == undefined && argument.duration != null) {
                duration = argument.duration;
            }
        }
    }

    if(target == undefined) {
        console.error("The element to be animated has not been specified.");
        return;
    }else {
        this.target = target;
    }
    if(key == undefined) {
        console.error("The animation target style is not specified.");
        return;
    }else {
        this.key = key;
    }
    if(beginValue == undefined) {
        var currentValue = target.style.getPropertyValue(key);
        if(typeof currentValue == "string") {
            if(currentValue.endsWith("px")) {
                currentValue = Number(currentValue.substring(0, currentValue.length-2));
            }else {
                currentValue = Number(currentValue);
            }
        }
        this.beginValue = currentValue;
    }else {
        this.beginValue = beginValue;
    }
    if(finishValue == undefined) {
        this.finishValue = 1;
    }else {
        this.finishValue = finishValue;
    }
    if(suffix == undefined) {
        if(key == "width" || key == "height" || key == "left" || key == "top" || key == "right" || key == "bottom") {
            suffix = "px";
        }
    }
    this.suffix = suffix;

    var self = this;

    var diffValue = self.finishValue - self.beginValue;

    // スーパークラス呼び出し
    FunctionalAnimation.call(this, function(progress) {
        var value = self.beginValue + diffValue * progress;
        if(suffix != undefined) {
            value += suffix;
        }
        self.target.style.setProperty(self.key, value);
    }, method, duration);
}
StyleAnimation.prototype = Object.create(FunctionalAnimation.prototype);


////////////////////////////////////// Utilities //////////////////////////////////////

var DateUnit = {
    year: "year",
    month: "month",
    date: "date",
    hour: "hour",
    minute: "minute",
    second: "second"
};

/**
 * Date utility
 * @namespace
 */
var DateUtil = {

    /**
     * Format Date object.
     * @param {Date} date
     * @param {string} [format]
     * @returns {string}
     * @see http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_Patterns
     */
    format: function(date, format) {
        if(date == null || !(date instanceof Date)) {
            return null;
        }
        if(format == null) {
            format = "yyyy-MM-dd";
        }
        var result = format;
        if(result.includes("y")) {
            var year = date.getFullYear();
            result = result.replace(/yyyy/, year);
        }
        if(result.includes("M")) {
            var month = date.getMonth()+1;
            result = result.replace(/MM/, StringUtil.padding(month, "0", 2));
            result = result.replace(/M/, month);
        }
        if(result.includes("d")) {
            var _date = date.getDate();
            result = result.replace(/dd/, StringUtil.padding(_date, "0", 2));
            result = result.replace(/d/, _date);
        }
        if(result.includes("E")) {
            var day = date.getDay();
            var dayExp;
            switch(day) {
                case 0: dayExp = "Sunday"; break;
                case 1: dayExp = "Monday"; break;
                case 2: dayExp = "Tuesday"; break;
                case 3: dayExp = "Wednesday"; break;
                case 4: dayExp = "Thursday"; break;
                case 5: dayExp = "Friday"; break;
                case 6: dayExp = "Saturday"; break;
            }
            var shortDayExp;
            switch(day) {
                case 0: shortDayExp = "Sun"; break;
                case 1: shortDayExp = "Mon"; break;
                case 2: shortDayExp = "Tues"; break;
                case 3: shortDayExp = "Wed"; break;
                case 4: shortDayExp = "Thur"; break;
                case 5: shortDayExp = "Fri"; break;
                case 6: shortDayExp = "Sat"; break;
            }
            if(typeof dayExp == "string") {
                result = result.replace(/EEEE/, dayExp);
            }
            if(typeof shortDayExp == "string") {
                result = result.replace(/EEE/, shortDayExp);
            }
        }
        if(result.includes("e")) {
            var localDayExp = date.getDay();
            if(navigator.language != null && navigator.language.includes("ja")) {
                switch(localDayExp) {
                    case 0: localDayExp = "日曜日"; break;
                    case 1: localDayExp = "月曜日"; break;
                    case 2: localDayExp = "火曜日"; break;
                    case 3: localDayExp = "水曜日"; break;
                    case 4: localDayExp = "木曜日"; break;
                    case 5: localDayExp = "金曜日"; break;
                    case 6: localDayExp = "土曜日"; break;
                }
            }
            if(typeof localDayExp == "string") {
                result = result.replace(/eeee/, localDayExp);
                result = result.replace(/eee/, localDayExp.substr(0, 1));
            }
        }
        if(result.includes("H")) {
            var hour = date.getHours();
            result = result.replace(/HH/, StringUtil.padding(hour, "0", 2));
            result = result.replace(/H/, hour);
        }
        if(result.includes("h")) {
            var halfHour = date.getHours();
            if(halfHour <= 11) {
                halfHour++;
            }else {
                halfHour = halfHour%12+1;
            }
            result = result.replace(/hh/, StringUtil.padding(halfHour, "0", 2));
            result = result.replace(/h/, halfHour);
        }
        if(result.includes("m")) {
            var minutes = date.getMinutes();
            result = result.replace(/mm/, StringUtil.padding(minutes, "0", 2));
            result = result.replace(/m/, minutes);
        }
        if(result.includes("s")) {
            var seconds = date.getSeconds();
            result = result.replace(/ss/, StringUtil.padding(seconds, "0", 2));
            result = result.replace(/s/, seconds);
        }
        return result;
    },

    /**
     * Get the date plus the specified date.
     * @param {Date} date
     * @param {number} addingValue 
     * @param {string} [dateUnit=DateUnit.date] 
     * @returns {Date}
     */
    getDateByAdding: function(date, addingValue, dateUnit) {
        if(date == null || !(date instanceof Date)) {
            return null;
        }
        if(addingValue == null || typeof addingValue != "number") {
            return null;
        }
        if(dateUnit == undefined) {
            dateUnit = DateUnit.date;
        }
        if(dateUnit == DateUnit.second) {
            return new Date(date.getTime() + addingValue*1000);
        }else if(dateUnit == DateUnit.minute) {
            return new Date(date.getTime() + addingValue*60*1000);
        }else if(dateUnit == DateUnit.hour) {
            return new Date(date.getTime() + addingValue*60*60*1000);
        }else if(dateUnit == DateUnit.date) {
            return new Date(date.getTime() + addingValue*24*60*60*1000);
        }else if(dateUnit == DateUnit.month) {
            return new Date(date.getFullYear(), date.getMonth()+addingValue, date.getDate(), 
                date.getHours(), date.getMinutes(), date.getSeconds());
        }else if(dateUnit == DateUnit.year) {
            return new Date(date.getFullYear()+addingValue, date.getMonth(), date.getDate(), 
                date.getHours(), date.getMinutes(), date.getSeconds());
        }
    },

    /**
     * Get the date with all the date times set to zero.
     * @param {Date} date 
     * @returns {Date}
     */
    getDateBySlicingTime: function(date) {
        if(date == null || !(date instanceof Date)) {
            return null;
        }
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
};

/**
 * String utility
 * @namespace
 */
var StringUtil = {
    /**
     * For values that allow null, if null is set, replace with the specified string. 
     * If not specified, replace with a character from.
     * @param {*} target
     * @param {string} replaced
     * @returns {string}
     */
    getNullable: function(target, replaced) {
        if(replaced === undefined) replaced = "";
        return target != null ? String(target) : replaced;
    },

    /**
     * Fill a string with the specified characters until it reaches the specified length.
     * @param {string} source The string to be edited.
     * @param {string} char The string to be filled.
     * @param {number} [length] Max string length.
     * @returns {string}
     */
    padding: function(source, char, length) {
        if(source == null) return null;
        if(typeof source != "string") {
            source = String(source);
        }
        if(char == null || char.length == 0) return source;
        if(typeof char != "string") {
            char = String(char);
        }
        if(length == null || typeof length != "number" || length <= 0) return source;
        var result = "";
        while(result.length+source.length < length) {
            result += char;
        }
        result += source;
        return result;
    },

    /**
     * Get a three-digit delimited currency notation string.
     * @param {number} [source]
     * @returns {string}
     */
    currencyString: function(source) {
        if(source == null) return "";
        if(typeof source != "number") {
            if(typeof source == "string" && source.length == 0) {
                return "";
            }
            source = Number(source);
        }
        if(typeof source == "number") {
            if(Number.isNaN(source)) {
                return "";
            }
            source = String(source);
        }
        if(source.length == 0) return source;
        var result = [];
        var index = 0;
        for(var i=source.length-1; i>=0; i--) {
            if(index != 0 && index % 3 == 0) {
                result.push(",");
            }
            result.push(source.charAt(i));
            index++;
        }
        return result.reverse().join("");
    }
};

/**
 * @constructor
 * @classdesc Point
 * @param {Number} x 
 * @param {Number} y 
 */
function Point(x, y) {
    if(this == undefined) {
        return new Point(x, y);
    }

    this.x = 0;
    this.y = 0;

    if(x != undefined) {
        if(typeof x != "number") {
            x = Number(x);
        }
        this.x = x;
    }
    if(y != undefined) {
        if(typeof y != "number") {
            y = Number(y);
        }
        this.y = y;
    }
}

/**
 * @constructor
 * @classdesc Size
 * @param {Number} width
 * @param {Number} height
 */
function Size(width, height) {
    if(this == undefined) {
        return new Size(width, height);
    }

    this.width = 0;
    this.height = 0;

    if(width != undefined) {
        if(typeof width != "number") {
            width = Number(width);
        }
        this.width = width;
    }
    if(height != undefined) {
        if(typeof height != "number") {
            height = Number(height);
        }
        this.height = height;
    }
}

/**
 * @constructor
 * @classdesc Rectangle
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} width 
 * @param {Number} height 
 */
function Rect(x, y, width, height) {
    if(this == undefined) {
        return new Rect(x, y, width, height);
    }

    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;

    if(x != undefined) {
        if(typeof x != "number") {
            x = Number(x);
        }
        this.x = x;
    }
    if(y != undefined) {
        if(typeof y != "number") {
            y = Number(y);
        }
        this.y = y;
    }
    if(width != undefined) {
        if(typeof width != "number") {
            width = Number(width);
        }
        this.width = width;
    }
    if(height != undefined) {
        if(typeof height != "number") {
            height = Number(height);
        }
        this.height = height;
    }
}
Rect.prototype = {
    /**
     * Whether the specified position is included in this rectangle.
     * @type {function(Point): boolean}
     * @param {Point}  
     * @returns {boolean}
     */
    contains: function(target) {
        if(target == null) return false
        if(target.x != undefined && target.y != undefined && typeof target.x == "number" && typeof target.y == "number") {
            return this.x < target.x && this.x + this.width > target.x && this.y < target.y && this.y + this.height > target.y;
        }
        return false;
    },

    /**
     * Whether the specified rectangle intersects with this rectangle.
     * @type {function(Rect): boolean}
     * @param {Rect}  
     * @returns {boolean}
     */
    intersect: function(target) {
        if(target == null) return false
        if(target.x != undefined && target.y != undefined && typeof target.x == "number" && typeof target.y == "number" && 
            target.width != undefined && target.height != undefined && typeof target.width == "number" && typeof target.height == "number") {
            return (this.x < target.x && this.x + this.width > target.x &&
                this.y < target.y && this.y + this.height > target.y) ||
                (this.x < target.x + target.width && this.x + this.width > target.x + target.width &&
                    this.y < target.y && this.y + this.height > target.y) ||
                (this.x < target.x + target.width && this.x + this.width > target.x + target.width &&
                    this.y < target.y + target.height && this.y + this.height > target.y + target.height) ||
                (this.x < target.x && this.x + this.width > target.x &&
                    this.y < target.y + target.height && this.y + this.height > target.y + target.height);
        }
        return false;
    },

    midX: function() {
        return this.x + this.width/2;
    },
    midY: function() {
        return this.y + this.height/2;
    },
    maxX: function() {
        return this.x + this.width;
    },
    maxY: function() {
        return this.y + this.height;
    }
};

/**
 * @constructor
 * @classdesc Polygon
 * @param {...Point}
 */
function Polygon() {
    if(this == undefined) {
        var _arguments = Array.prototype.slice.call(arguments);
        _arguments.splice(0, 0, null);
        return new (Function.prototype.bind.apply(Polygon, _arguments));
    }

    this.locations = [];

    for(var i=0; i<arguments.length; i++) {
        var argument = arguments[i];
        if(argument.x != undefined && argument.y != undefined && 
            typeof argument.x == "number" && typeof argument.y == "number") {
            this.locations.push({x: argument.x, y: argument.y});
        }
    }
}
Polygon.prototype = {
    /**
     * Whether the specified position is included in this polygon.
     * @type {function(Point): boolean}
     * @param {Point}  
     * @returns {boolean}
     */
    contains: function(target) {
        if(target == null) return false;
        // https://github.com/substack/point-in-polygon
        var x = target.x, y = target.y;
        if(typeof x != "number" || typeof y != "number") return false;
        var inside = false;
        for(var i = 0, j = this.locations.length - 1; i < this.locations.length; j = i++) {
            var xi = this.locations[i].x, yi = this.locations[i].y;
            var xj = this.locations[j].x, yj = this.locations[j].y;
            if(((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
};

/**
 * @constructor
 * @classdesc Color
 * @param {...number|string} components RGBA values or hex expression 
 */
function Color() {
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this.alpha = 1;

    if(arguments.length == 1) {
        var parameter = arguments[0];
        if(typeof parameter == "string") {
            if(/#[0-9a-fA-F]+/.test(parameter)) {
                this.red = parseInt(parameter.substring(1,3), 16);
                this.green = parseInt(parameter.substring(3,5), 16);
                this.blue = parseInt(parameter.substring(5,7), 16);
            }else {
                if(parameter == "white") {
                    this.red = 255; this.green = 255; this.blue = 255;
                }else if(parameter == "lightgray") {
                    this.red = 211; this.green = 211; this.blue = 211;
                }else if(parameter == "gray") {
                    this.red = 128; this.green = 128; this.blue = 128;
                }else if(parameter == "darkgray") {
                    this.red = 169; this.green = 169; this.blue = 169;
                }
            }
        }
    }else if(arguments.length == 3) {
        if(typeof arguments[0] == "number" && typeof arguments[1] == "number" && typeof arguments[2] == "number") {
            this.red = arguments[0];
            this.green = arguments[1];
            this.blue = arguments[2];
        }
    }else if(arguments.length == 4) {
        if(typeof arguments[0] == "number" && typeof arguments[1] == "number" && typeof arguments[2] == "number" && typeof arguments[3] == "number") {
            this.red = arguments[0];
            this.green = arguments[1];
            this.blue = arguments[2];
            this.alpha = arguments[3];
        }
    }
}
Color.prototype = {
    /**
     * Get the color of this color with modified alpha.
     * @param {number} alpha 
     * @returns {Color}
     */
    colorWithAlpha: function(alpha) {
        this.alpha = alpha;
        return this;
    },

    /**
     * Get a hexadecimal string that can be applied to CSS
     * @returns {string}
     */
    toString: function() {
        return "#" + this.red.toString(16) + this.green.toString(16) + this.blue.toString(16);
    },

    /**
     * Get an RGBA string that can be applied to CSS
     * @returns {string}
     */
    toStringWithAlpha: function() {
        return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha + ")";
    }
};

/**
 * Canvas utility
 * @namespace
 */
var CanvasUtil = {
    /**
     * Initialize the canvas
     * @type {function(HTMLCanvasElement, Size): void}
     * @param {HTMLCanvasElement} 
     * @param {Size} size 
     */
    initCanvas: function(canvas, size) {
        if(!(canvas instanceof HTMLCanvasElement)) { 
            console.error("Element is not HTMLCanvasElement.", (canvas != null && canvas.toString != undefined ? canvas.toString() : "null"));
            return;
        }
        var scale = window.devicePixelRatio;
        canvas.width = size.width*scale;
        canvas.height = size.height*scale;
        canvas.style.width = size.width+"px";
        canvas.style.height = size.height+"px";
        var context = canvas.getContext("2d");
        context.scale(scale, scale);
    }
};

/**
 * Initialize CANVAS with specified size
 * @memberof HTMLCanvasElement
 * @param {Size} size
 */
HTMLCanvasElement.prototype.initWithSize = function(size) {
    CanvasUtil.initCanvas(this, size);
    return this;
}

/**
 * @constructor
 * @classdesc Rendering parameter for text.
 * @property {string} font
 * @property {string|number} size
 * @property {string} color
 * @property {left|right|center|start|end} align
 * @property {string|number} weight
 * @property {string|number} lineHeight
 * @property {string} fontExpression 
 */
function TextDrawingAttributes() {
    if(this == undefined) {
        var _arguments = Array.prototype.slice.call(arguments);
        _arguments.splice(0, 0, null);
        return new (Function.prototype.bind.apply(TextDrawingAttributes, _arguments));
    }
    
    for(var i=0; i<arguments.length; i++) {
        var argument = arguments[i];
        if(typeof argument == "string") {
            if(argument.endsWith("px")) {
                if(this.size == undefined) {
                    this.size = argument;
                }else if(this.weight == undefined) {
                    this.weight = argument;
                }else if(this.lineHeight == undefined) {
                    this.lineHeight = argument;
                }
            }else if(argument.startsWith("#")) {
                this.color = argument;
            }else if(argument == "center" || argument == "right" || argument == "left") {
                this.align = argument;
            }else if(argument == "bold" || argument == "bolder" || argument == "lighter" || argument == "normal") {
                this.weight = argument;
            }else {
                if(this.font == undefined) {
                    this.font = argument;
                }else if(this.color == undefined) {
                    this.color = argument;
                }
            }
        }else if(typeof argument == "number") {
            if(this.size == undefined) {
                this.size = argument;
            }else if(this.weight == undefined && argument != 0 && argument % 100 == 0) {
                this.weight = argument;
            }else if(this.lineHeight == undefined) {
                this.lineHeight = argument;
            }
        }
    }
}
TextDrawingAttributes.prototype = {
    get fontExpression() {
        var expression = "";
        if(this.weight != undefined) {
            expression += this.weight;
        }
        if(this.size != undefined) {
            if(expression.length > 0) { expression += " "; }
            if(typeof this.size == "number") {
                expression += this.size + "px";
            }else {
                expression += this.size;
            }
        }
        if(this.lineHeight != undefined) {
            if(expression.length > 0) { expression += " "; }
            if(typeof this.lineHeight == "number") {
                expression += this.lineHeight + "px";
            }else {
                expression += this.lineHeight;
            }
        }
        if(this.font != undefined) {
            if(expression.length > 0) { expression += " "; }
            expression += this.font;
        }
        return expression;
    }
}

/**
 * Drawing utility
 * @namespace
 */
var DrawUtil = {

    /**
     * @type {string}
     */
    defaultFont: "'YuGothic', 'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP'",

    /**
     * @type {string}
     */
    defaultFontSize: "16px",

    /**
     * @type {string}
     */
    defaultFontColor: "black",

    /**
     * @type {number}
     */
    defaultLineHeight: 16,

    /**
     * Draw line.
     * @param {CanvasRenderingContext2D} context 
     * @param {Point} point1 
     * @param {Point} point2
     * @param {string} color
     * @param {boolean} dash
     */
    drawLine: function(context, point1, point2, color, dash) {
        context.save();
        context.beginPath();
        if(dash != undefined && dash) {
            context.setLineDash([2, 2]);
        }
        context.moveTo(point1.x, point1.y);
        context.lineTo(point2.x, point2.y);
        context.strokeStyle = color;
        context.stroke();
        context.restore();
    },

    /**
     * Draw roud rectangle.
     * @param {CanvasRenderingContext2D} context 
     * @param {Rect} rect 
     * @param {string} color 
     * @param {number} radius 
     */
    drawRoundRect: function(context, rect, color, radius, stroke) {
        if(radius == undefined) {
            radius = 4;
        }
        if(stroke == undefined) {
            stroke = false;
        }
        context.save();
        context.beginPath();
        context.moveTo(rect.x + radius, rect.y);
        context.lineTo(rect.x + rect.width - radius, rect.y);
        context.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + radius);
        context.lineTo(rect.x + rect.width, rect.y + rect.height - radius);
        context.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - radius, rect.y + rect.height);
        context.lineTo(rect.x + radius, rect.y + rect.height);
        context.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - radius);
        context.lineTo(rect.x, rect.y + radius);
        context.quadraticCurveTo(rect.x, rect.y, rect.x + radius, rect.y);
        context.closePath();
        if(stroke) {
            context.lineWidth = 1;
            context.strokeStyle = color;
            context.stroke();
        }else {
            context.fillStyle = color;
            context.fill();
        }
        context.restore();
    },

    /**
     * Draw text.
     * @param {CanvasRenderingContext2D} context 
     * @param {string} text 
     * @param {Rect} rect 
     * @param {TextDrawingAttributes} textDrawingAttributes
     */
    drawText: function(context, text, rect, textDrawingAttributes, blending) {
        context.save();
        if(blending != undefined) {
            context.globalCompositeOperation = blending;
        }
        var color = this.defaultFontColor;
        if(textDrawingAttributes != undefined) {
            if(textDrawingAttributes.color != undefined) {
                color = textDrawingAttributes.color;
            }
        }
        context.fillStyle = color;
        if(textDrawingAttributes.fontExpression != undefined) {
            context.font = textDrawingAttributes.fontExpression();
        }else {
            var font = this.defaultFont;
            var fontSize = this.defaultFontSize;
            if(textDrawingAttributes != undefined) {
                if(textDrawingAttributes.font != undefined) {
                    font = textDrawingAttributes.font;
                }
                if(textDrawingAttributes.size != undefined) {
                    fontSize = textDrawingAttributes.size;
                }
                if(textDrawingAttributes.color != undefined) {
                    color = textDrawingAttributes.color;
                }
            }
            if(typeof fontSize == "number") {
                fontSize = fontSize + "px"
            }
            context.font = fontSize+" "+font;
        }
        context.textBaseline = "middle";
        var x = rect.x;
        var y = rect.y + rect.height/2;
        if(textDrawingAttributes != undefined && textDrawingAttributes.align != undefined) {
            if(textDrawingAttributes.align == "center") {
                x = rect.x + rect.width/2;
            }else if(textDrawingAttributes.align == "right") {
                x = rect.x + rect.width;
            }
            context.textAlign = textDrawingAttributes.align;
        }
        context.fillText(text, x, y);
        context.restore();
    },

    /**
     * Acquire size of the text.
     * @param {CanvasRenderingContext2D} context 
     * @param {string} text 
     * @param {TextDrawingAttributes} textDrawingAttributes 
     * @returns {TextMetrics}
     */
    sizeOfText: function(context, text, textDrawingAttributes) {
        context.save();
        if(textDrawingAttributes.fontExpression != undefined) {
            context.font = textDrawingAttributes.fontExpression();
        }else {
            var font = this.defaultFont;
            var fontSize = this.defaultFontSize;
            if(textDrawingAttributes != undefined) {
                if(textDrawingAttributes.font != undefined) {
                    font = textDrawingAttributes.font;
                }
                if(textDrawingAttributes.size != undefined) {
                    fontSize = textDrawingAttributes.size;
                }
            }
            if(typeof fontSize == "number") {
                fontSize = fontSize + "px"
            }
            context.font = fontSize+" "+font;
        }
        var size = context.measureText(text);
        context.restore();
        return size;
    },

    /**
     * Draw with the ends marked as abbreviations, if a string exceeds the specified width.
     * @param {CanvasRenderingContext2D} context
     * @param {string} text 
     * @param {Rect} rect 
     * @param {TextDrawingAttributes} textDrawingAttributes
     */
    drawTextByTruncatingTail: function(context, text, rect, textDrawingAttributes) {
        if(text == null) return;
        
        var maxWidth = rect.width;

        context.save();
        var color = this.defaultFontColor;
        if(textDrawingAttributes != undefined) {
            if(textDrawingAttributes.color != undefined) {
                color = textDrawingAttributes.color;
            }
        }
        context.fillStyle = color;
        if(textDrawingAttributes.fontExpression != undefined) {
            context.font = textDrawingAttributes.fontExpression();
        }else {
            var font = this.defaultFont;
            var fontSize = this.defaultFontSize;
            if(textDrawingAttributes != undefined) {
                if(textDrawingAttributes.font != undefined) {
                    font = textDrawingAttributes.font;
                }
                if(textDrawingAttributes.size != undefined) {
                    fontSize = textDrawingAttributes.size;
                }
                if(textDrawingAttributes.color != undefined) {
                    color = textDrawingAttributes.color;
                }
            }
            if(typeof fontSize == "number") {
                fontSize = fontSize + "px"
            }
            context.font = fontSize+" "+font;
        }
        context.textBaseline = "middle";

        var width = context.measureText(text).width;
        if(width > maxWidth) {
            for(var i=0; i<text.length; i++) {
                var _text = text.substr(0, text.length-(i+1)) + "...";
                width = context.measureText(_text).width;
                if(width <= maxWidth) {
                    text = _text;
                    break;
                }
            }
        }
        var x = rect.x;
        var y = rect.y+rect.height/2;
        if(textDrawingAttributes != undefined && textDrawingAttributes.align != undefined) {
            if(textDrawingAttributes.align == "center") {
                x = rect.x + rect.width/2;
            }else if(textDrawingAttributes.align == "right") {
                x = rect.x + rect.width;
            }
            context.textAlign = textDrawingAttributes.align;
        }

        context.fillText(text, x, y);
        context.restore();
    },

    /**
     * Draws a string to fit within a specified rectangle.
     * @param {CanvasRenderingContext2D} context 
     * @param {string} text 
     * @param {Rect} rect 
     * @param {TextDrawingAttributes} textDrawingAttributes 
     */
    drawTextByCharacterWrap: function(context, text, rect, textDrawingAttributes) {
        if(text == null || text.length == 0) return;

        var color = this.defaultFontColor;
        var lineHeight = this.defaultLineHeight;
        if(textDrawingAttributes != undefined) {
            if(textDrawingAttributes.color != undefined) {
                color = textDrawingAttributes.color;
            }
            if(textDrawingAttributes.lineHeight != undefined) {
                lineHeight = textDrawingAttributes.lineHeight;
            }
        }

        context.save();
        context.fillStyle = color;
        if(textDrawingAttributes.fontExpression != undefined) {
            context.font = textDrawingAttributes.fontExpression();
        }else {
            var font = this.defaultFont;
            var fontSize = this.defaultFontSize;
            if(textDrawingAttributes != undefined) {
                if(textDrawingAttributes.font != undefined) {
                    font = textDrawingAttributes.font;
                }
                if(textDrawingAttributes.size != undefined) {
                    fontSize = textDrawingAttributes.size;
                }
                if(textDrawingAttributes.color != undefined) {
                    color = textDrawingAttributes.color;
                }
            }
            if(typeof fontSize == "number") {
                fontSize = fontSize + "px"
            }
            context.font = fontSize+" "+font;
        }
        context.textBaseline = "middle";

        var x = rect.x;
        if(textDrawingAttributes != undefined && textDrawingAttributes.align != undefined) {
            if(textDrawingAttributes.align == "center") {
                x = rect.x + rect.width/2;
            }else if(textDrawingAttributes.align == "right") {
                x = rect.x + rect.width;
            }
            context.textAlign = textDrawingAttributes.align;
        }

        var lines = this.splitTextToLinesByCharacterWrap(context, text, {width:rect.width, height:rect.height}, lineHeight);
        var y = rect.y + (rect.height - (lines.length * lineHeight))/2;
        var halfLineHeight = lineHeight/2;
        for(var i=0; i<lines.length; i++) {
            context.fillText(lines[i], x, y+(lineHeight*i)+halfLineHeight);
        }
        context.restore();
    },

    /**
     * Get the size of a multi-line text enclosed.
     * @param {CanvasRenderingContext2D} context 
     * @param {string} text 
     * @param {Size} maxSize 
     * @param {TextDrawingAttributes} textDrawingAttributes
     * @returns {Size}
     */
    getBoundingRectOfTextByCharacterWrap: function(context, text, maxSize, textDrawingAttributes) {
        if(text == null) return null;

        var lineHeight = this.defaultLineHeight;
        if(textDrawingAttributes != undefined) {
            if(textDrawingAttributes.lineHeight != undefined) {
                lineHeight = textDrawingAttributes.lineHeight;
            }
        }

        context.save();

        if(textDrawingAttributes != undefined && textDrawingAttributes.fontExpression != undefined) {
            context.font = textDrawingAttributes.fontExpression();
        }else {
            var font = this.defaultFont;
            var fontSize = this.defaultFontSize;
            if(textDrawingAttributes != undefined) {
                if(textDrawingAttributes.font != undefined) {
                    font = textDrawingAttributes.font;
                }
                if(textDrawingAttributes.size != undefined) {
                    fontSize = textDrawingAttributes.size;
                }
            }
            if(typeof fontSize == "number") {
                fontSize = fontSize + "px"
            }
            context.font = fontSize+" "+font;
        }

        var lines = this.splitTextToLinesByCharacterWrap(context, text, maxSize, lineHeight);
        var size;
        if(lines.length == 1) {
            size = {width:context.measureText(text).width, height:lineHeight};
        }else {
            var maxWidth = 0;
            for(var i=0; i<lines.length; i++) {
                var width = context.measureText(lines[i]).width;
                if(maxWidth < width) {
                    maxWidth = width;
                }
            }
            size = {width:maxWidth, height:(lineHeight*lines.length)};
        }

        context.restore();
        return size;
    },

    splitTextToLinesByCharacterWrap: function(context, text, size, lineHeight) {
        if(text == null) return null;
        var lines = [];

        var specialCharacters = text.match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g);
        var specialCharacterLengthes = [];
        var specialCharacterIndexes = [];
        var _text = text;
        if(specialCharacters != null) {
            for(var i=0; i<specialCharacters.length; i++) {
                var specialCharacter = specialCharacters[i];
                var length = specialCharacter.length;
                var index = _text.indexOf(specialCharacter);
                specialCharacterLengthes.push(length);
                specialCharacterIndexes.push(index);
                if(index+length+1 < _text.length) {
                    _text = _text.substr(index+length+1);
                }
            }
        }

        function divideToLine() {
            for(var i=0; i<text.length; i++) {
                var charLength = 1;

                var offset = 0;
                for(var j=0; j<lines.length; j++) {
                    offset += lines[j].length;
                }
                var specialCharacterIndex = specialCharacterIndexes.indexOf(offset+i);
                if(specialCharacterIndex != -1) {
                    charLength = specialCharacterLengthes[specialCharacterIndex];
                }

                var _text = text.substr(0, (i+charLength));
                var width = context.measureText(_text).width;
                if(width > size.width) {
                    if(lineHeight*(lines.length+1) <= size.height) {
                        lines.push(text.substr(0, i));
                        if(i < text.length) {
                            text = text.substr(i, text.length-i);
                            divideToLine();
                        }
                    }
                    break;
                }
                if(i+charLength == text.length) {
                    lines.push(text.substr(0, text.length));
                }
                if(charLength>1) {
                    i += charLength-1;
                }
            }
        }
        divideToLine();
        return lines;
    },

    /**
     * Drawing a rounded rectangle callout.
     * @type {function(CanvasRenderingContext2D, Rect, object): void}
     * @param {CanvasRenderingContext2D} context
     * @param {Rect} rect
     * @param {Object} settings
     * @param {top|bottom|left|right} settings.direction 
     * @param {Size} settings.tipSize 
     * @param {number} settings.tipOffset Position of the balloon's tail (if not specified, middle).
     * @param {string} settings.fillColor
     * @param {boolean} settings.shadow
     */
    drawRoundRectBalloon: function(context, rect, settings) {
        var direction = "top";
        var tipSize = 8;
        var tipOffset = undefined;
        var fillColor = "white";
        var shadow = false
        if(settings != undefined) {
            if(settings.direction != undefined) {
                direction = settings.direction;
            }
            if(settings.tipSize != undefined) {
                tipSize = settings.tipSize;
            }
            if(settings.tipOffset != undefined) {
                tipOffset = settings.tipOffset;
            }
            if(settings.fillColor != undefined) {
                fillColor = settings.fillColor;
            }
            if(settings.shadow != undefined) {
                shadow = settings.shadow;
            }
        }
        var cornerSize = 4;
        var point = {x: rect.x + cornerSize, y: rect.y};
        context.save();
        context.beginPath();
        if(direction == "top") {
            point.y = rect.y + tipSize;
        }else if(direction == "left") {
            point.x += tipSize;
        }
        context.moveTo(point.x, point.y);
        if(direction == "top") {
            if(tipOffset === undefined || tipOffset === null) {
                point.x = rect.x + rect.width/2 - tipSize/2;
            }else {
                point.x = rect.x + tipOffset - tipSize/2;
            }
            context.lineTo(point.x, point.y);
            point.x += tipSize/2; point.y -= tipSize;
            context.lineTo(point.x, point.y);
            point.x += tipSize/2; point.y += tipSize;
            context.lineTo(point.x, point.y);
        }
        point.x = rect.x + rect.width - cornerSize;
        if(direction == "right") {
            point.x-= tipSize;
        }
        context.lineTo(point.x, point.y);
        point.x += cornerSize;
        context.quadraticCurveTo(point.x, point.y, point.x, point.y+cornerSize);
        if(direction == "right") {
            if(tipOffset === undefined || tipOffset === null) {
                point.y = rect.y + rect.height/2 - tipSize/2;
            }else {
                point.y = rect.y + tipOffset - tipSize/2;
            }
            context.lineTo(point.x, point.y);
            point.x += tipSize; point.y += tipSize/2;
            context.lineTo(point.x, point.y);
            point.x -= tipSize; point.y += tipSize/2;
            context.lineTo(point.x, point.y);
        }
        point.y = rect.y + rect.height - cornerSize;
        if(direction == "bottom") {
            point.y -= tipSize;
        }
        context.lineTo(point.x, point.y);
        point.y += cornerSize;
        context.quadraticCurveTo(point.x, point.y, point.x-cornerSize, point.y);
        if(direction == "bottom") {
            if(tipOffset === undefined || tipOffset === null) {
                point.x = rect.x + rect.width/2 + tipSize/2;
            }else {
                point.x = rect.x + tipOffset + tipSize/2;
            }
            context.lineTo(point.x, point.y);
            point.x -= tipSize/2; point.y += tipSize;
            context.lineTo(point.x, point.y);
            point.x -= tipSize/2; point.y -= tipSize;
            context.lineTo(point.x, point.y);
        }
        point.x = rect.x + cornerSize;
        if(direction == "left") {
            point.x += tipSize;
        }
        context.lineTo(point.x, point.y);
        point.x -= cornerSize;
        context.quadraticCurveTo(point.x, point.y, point.x, point.y-cornerSize);
        if(direction == "left") {
            if(tipOffset === undefined || tipOffset === null) {
                point.y = rect.y + rect.height/2 + tipSize/2;
            }else {
                point.y = rect.y + tipOffset + tipSize/2;
            }
            context.lineTo(point.x, point.y);
            point.x -= tipSize; point.y -= tipSize/2;
            context.lineTo(point.x, point.y);
            point.x += tipSize; point.y -= tipSize/2;
            context.lineTo(point.x, point.y);
        }
        point.y = rect.y + cornerSize;
        if(direction == "top") {
            point.y += tipSize;
        }
        context.lineTo(point.x, point.y);
        point.y -= cornerSize;
        context.quadraticCurveTo(point.x, point.y, point.x+cornerSize, point.y);
        context.closePath();
        context.fillStyle = fillColor;
        if(shadow) {
            context.shadowBlur = 14;
            context.shadowOffsetX = 3;
            context.shadowOffsetY = 3;
            context.shadowColor = "rgba(0,0,0,0.5)";
        }
        context.fill();
        context.restore();
    }
};

/**
 * Image utility
 * @namespace
 */
var ImageUtil = {

    /**
     * Load image.
     * @param {string} filePathe 
     * @returns {Promise} can be used to get an Image objects by Promise#then. 
     */
    loadImage: function(filePath) {
        return new Promise(function(resolve, reject) {
            function loadHandler(event) {
                var image = event.currentTarget;
                resolve(image);
                image.removeEventListener("load", loadHandler);
            }
            function errorHandler(event) {
                reject();
            }
            var image = new Image();
            image.addEventListener("load", loadHandler);
            image.addEventListener("error", errorHandler);
            image.src = filePath;
            if(image.complete) {
                image.removeEventListener("load", loadHandler);
                image.removeEventListener("error", errorHandler);
                resolve(image);
            }
        });
    },

    /**
     * Load several images.
     * @param {Array.<string>} filePathes 
     * @returns {Promise} can be used to get an array of Image objects by Promise#then. 
     */
    loadImages: function(filePathes) {
        if(filePathes == null || !Array.isArray(filePathes)) {
            return;
        }
        var processes = [];
        for(var i=0; i<filePathes.length; i++) {
            processes.push(this.loadImage(filePathes[i]));
        }
        return Promise.all(processes);
    },

    /**
     * Load CANVAS element from the image data. 
     * @param {File} file
     * @param {Size} size 
     * @param {function(HTMLCanvasElement): void} completeHandler 
     */
    loadImageData: function(file, size, completeHandler) {
        if(FileReader == undefined) {
            console.error("This browser is not supported FileReader.");
            return;
        }
        var fileReader = new FileReader();
        fileReader.onload = function () {
            var image = new Image();
            image.src = fileReader.result;
            image.onload = function() {
                var canvas = document.createElement("canvas");
                canvas.style.display = "none";
                ImageUtil.drawImage(image, canvas, size);
                completeHandler(canvas);
            };
        };
        fileReader.readAsDataURL(file);
    },

    /**
     * Draws an image on the canvas based on the specified information.
     * @param {Image} image 
     * @param {HTMLCanvasElement} canvas 
     * @param {Size} size 
     * @param {2|3|4|5|6|7|8} orientation Image rotation
     *   2: Flip horizontal, 
     *   3: Rotate 180 degrees counterclockwise, 
     *   4: Flip vertical, 
     *   5: Flip vertical + rotate 90 degrees clockwise,
     *   6: 90 degree clockwise rotation, 
     *   7: Horizontal Flip + 90° Clockwise Rotation, 
     *   8: 90° Clockwise Rotation
     */
    drawImage: function(image, canvas, size, orientation) {
        var context = canvas.getContext("2d");
        context.save();

        var sourceRect = {x:0, y:0, width:image.width, height:image.height};

        canvas.width = sourceRect.width;
        canvas.height = sourceRect.height;

        if(size !== undefined) {
            if(sourceRect.height > sourceRect.width) {
                var height = sourceRect.width * (size.height/size.width);
                sourceRect.y = sourceRect.height/2 - height/2;
                sourceRect.height = height;
            }else {
                var width = sourceRect.height * (size.width/size.height);
                sourceRect.x = sourceRect.width/2 - width/2;
                sourceRect.width = width;
            }

            canvas.width = size.width;
            canvas.height = size.height;
        }

        if(orientation !== undefined) {
            if(orientation > 4) {
                var canvasWidth = canvas.width;
                canvas.width = canvas.height;
                canvas.height = canvasWidth;
            }

            switch(orientation) {
                case 2:
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                    break;
                case 3:
                    context.translate(canvas.width, canvas.height);
                    context.rotate(Math.PI);
                    break;
                case 4:
                    context.translate(0, canvas.height);
                    context.scale(1, -1);
                    break;
                case 5:
                    context.rotate(0.5 * Math.PI);
                    context.scale(1, -1);
                    break;
                case 6:
                    context.rotate(0.5 * Math.PI);
                    context.translate(0, -canvas.height);
                    break;
                case 7:
                    context.rotate(0.5 * Math.PI);
                    context.translate(canvas.width, -canvas.height);
                    context.scale(-1, 1);
                    break;
                case 8:
                    context.rotate(-0.5 * Math.PI);
                    context.translate(canvas.width, 0);
                    break;
            }
        }

        context.drawImage(image, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, 0, 0, canvas.width, canvas.height);

        context.restore();
    },

    /**
     * Convert CANVAS display data to binary. Return value can be set to FormData object.
     * @param {HTMLCanvasElement} canvas 
     * @param {string} format MIME types (image/jpeg、image/png...)
     * @return {Blob} binary data
     */
    convertCanvasToBinary: function(canvas, format) {
        var dataUrl = canvas.toDataURL(format);
        var data = dataUrl.split(',');
        var header = data[0];
        var body = data[1];

        var byteString;
        if(header.indexOf('base64') >= 0) {
            byteString = atob(body);
        }else {
            byteString = unescape(body);
        }
        var buffer = new Uint8Array(byteString.length);
        for(var i = 0; i < byteString.length; i++) {
            buffer[i] = byteString.charCodeAt(i);
        }
        
        var mimeType = header.split(':')[1].split(';')[0];

        return new Blob([buffer], {type:mimeType});
    },

    /**
     * Convert Image data to Base64 representation.
     * @param {Image} image
     * @returns {string}
     */
    convertImageToBase64String: function(image) {
        var canvas = document.createElement("canvas");
        canvas.style.display = "none";
        ImageUtil.drawImage(image, canvas);
        return canvas.toDataURL();
    }
};

/**
 * UI event utility
 * @namespace
 */
var UIEventUtil = {

    /**
     * Obtaining the position of mouse or touch occurrence from UI events
     * @param {UIEvent} event
     * @return {Point} Pointer position in case of mouse event, array of this object in case of touch event
     */
    getLocation: function(event) {
        var clientRect, x, y;
        if(event.type == "click" || event.type == "dblclick" || event.type.indexOf("mouse") == 0) {
            clientRect = event.currentTarget.getBoundingClientRect();
            x = event.clientX - clientRect.left;
            y = event.clientY - clientRect.top;
            return {x:x, y:y};
        }
        else if(event.type.indexOf("touch") == 0) {
            clientRect = event.currentTarget.getBoundingClientRect();
            if(event.touches.length > 0) {
                x = event.touches[0].clientX - clientRect.left;
                y = event.touches[0].clientY - clientRect.top;
                return {x:x, y:y};
            }else {
                if(event.changedTouches.length > 0) {
                    x = event.changedTouches[0].clientX - clientRect.left;
                    y = event.changedTouches[0].clientY - clientRect.top;
                    return {x:x, y:y};
                }else {
                    return {x:-1, y:-1};
                }
            }
        }
    },

    /**
     * Set a tap handler for a specified HTML element (PC/tablet compatible)
     * @param {HTMLElement} element
     * @param {Object} settings
     * @param {function(UIEvent, ?Object)} [settings.touchBegan] The second argument is Object that can be set arbitrarily.
     * @param {function(UIEvent, ?Object)} [settings.touchMove] The second argument is Object that can be set arbitrarily.
     * @param {function(UIEvent, ?Object, boolean)} [settings.touchEnd] The second argument is Object that can be set arbitrarily. The third argument is whether or not the touch event has completed.
     * @param {boolean} [settings.touchBeganCancellable] Whether or not the touch began event can be cancell by UIEvent#preventDefault.
     * @param {boolean} [settings.touchMoveCancellable] Whether or not the touch began event can be cancell by UIEvent#preventDefault.
     * @param {boolean} [settings.touchEndCancellable] Whether or not the touch began event can be cancell by UIEvent#preventDefault.
     */
    handleTouch: function(element, settings) {
        var context;
        if("ontouchstart" in document.documentElement) {
            if(settings.touchBegan != undefined) {
                element.addEventListener("touchstart", function(event) {
                    context = {};
                    settings.touchBegan(event, context);
                }, {passive: (settings.touchBeganCancellable != undefined ? settings.touchBeganCancellable : true)});
            }
            if(settings.touchMove != undefined) {
                element.addEventListener("touchmove", function(event) {
                    settings.touchMove(event, context);
                }, {passive: (settings.touchMoveCancellable != undefined ? settings.touchMoveCancellable : true)});
            }
            if(settings.touchEnd != undefined) {
                element.addEventListener("touchend", function(event) {
                    settings.touchEnd(event, context, true);
                    context = undefined;
                }, {passive: (settings.touchEndCancellable != undefined ? settings.touchEndCancellable : true)});
                element.addEventListener("touchcancel", function(event) {
                    settings.touchEnd(event, context, false);
                    context = undefined;
                }), {passive: (settings.touchEndCancellable != undefined ? settings.touchEndCancellable : true)};
            }
        }else {
            if(settings.touchBegan != undefined) {
                element.addEventListener("mousedown", function(event) {
                    context = {}; 
                    settings.touchBegan(event, context);
                });
            }
            if(settings.touchMove != undefined) {
                element.addEventListener("mousemove", function(event) {
                    settings.touchMove(event, context);
                });
            }
            if(settings.touchEnd != undefined) {
                element.addEventListener("mouseup", function(event) {
                    settings.touchEnd(event, context, true);
                    context = undefined;
                });
                element.addEventListener("mouseleave", function (event) {
                    settings.touchEnd(event, context, false);
                    context = undefined;
                });
            }
        }
    },

    /**
     * Configure the ENTER key to move between input UIs.
     * @param {HTMLElement} element 
     */
    setEnterKeyChain: function(element) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return;
        }
        var selector = "input, select, button";
        var inputList = element.querySelectorAll(selector);
        for(var i=0; i<inputList.length; i++) {
            var inputElement = inputList[i];
            inputElement.addEventListener("keypress", function(event) {
                var enterKeyPressed = false;
                if(event.keyCode != undefined) {
                    enterKeyPressed = event.keyCode == 13;
                }else if(event.code != undefined) {
                    enterKeyPressed = event.keyCode == "Enter";
                }
                if(enterKeyPressed) {
                    var index = -1;
                    for(var i=0; i<inputList.length; i++) {
                        if(inputList[i] === event.currentTarget) {
                            index = i;
                            break;
                        }
                    }
                    if(index+1 == inputList.length) {
                        index = 0;
                    }else {
                        index = index+1;
                    }
                    var nextInput = inputList[index];
                    if(nextInput.tagName.toLowerCase() == "button") {
                        nextInput.dispatchEvent(new MouseEvent("click"));
                    }else {
                        nextInput.focus();
                    }
                    event.preventDefault();
                }
            });
        }
    }
};

/**
 * Input validation utility
 * @namespace
 */
var ValidationUtil = {

    /**
     * Validates the input UI contained in the specified HTML element, and displays a browser-standard error if there is a validation error. The validation content follows the various attributes of the input tag.
     * @param {HTMLInputElement|HTMLTextAreaElement} element
     * @returns {boolean}
     */
    validate: function(element) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return;
        }
        var result = true;
        function resetReport(event) {
            var inputElement = event.currentTarget;
            inputElement.setCustomValidity("");
            inputElement.removeEventListener("input", resetReport);
        }
        var inputElements = element.querySelectorAll("input, select, textarea");
        for(var i=0; i<inputElements.length; i++) {
            var inputElement = inputElements[i];
            if(result && !inputElement.checkValidity()) {
                if(inputElement.reportValidity != undefined) {
                    var message = inputElement.getAttribute("title");
                    if(message != null) {
                        inputElement.setCustomValidity(message);
                    }
                    inputElement.reportValidity();
                    inputElement.addEventListener("input", resetReport);
                }
                result = false;
            }
        }
        return result;
    }
};

/**
 * HTML element utility
 * @namespace
 */
var HtmlElementUtil = {

    offset: function(element, parentElement) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return null;
        }

        if(parentElement == undefined) {
            parentElement = document.querySelector("body");
        }else {
            if(!(parentElement instanceof HTMLElement)) {
                console.error("Element is not HTMLElement.", (parentElement != null && parentElement.toString != undefined ? parentElement.toString() : "null"));
                return null;
            }
        }

        function acquireOffset(offset, parent) {
            if(parent == null || parent === parentElement) {
                return offset;
            }
            offset.left += parent.offsetLeft;
            offset.top += parent.offsetTop;
            return acquireOffset(offset, parent.offsetParent);
        }
        return acquireOffset({left: element.offsetLeft, top: element.offsetTop}, element.offsetParent);
    },

    size: function(element) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return null;
        }

        var size = {width: 0, height: 0};
        var paddingLeft = element.style.getPropertyValue("padding-left");
        if(paddingLeft != null) {
            if(typeof paddingLeft == "string" && paddingLeft.endsWith("px")) {
                paddingLeft = Number(paddingLeft.substring(0, paddingLeft.length-2));
            }
        }else {
            paddingLeft = 0;
        }
        var paddingRight = element.style.getPropertyValue("padding-right");
        if(paddingRight != null) {
            if(typeof paddingRight == "string" && paddingRight.endsWith("px")) {
                paddingRight = Number(paddingRight.substring(0, paddingRight.length-2));
            }
        }else {
            paddingRight = 0;
        }
        var paddingTop = element.style.getPropertyValue("padding-top");
        if(paddingTop != null) {
            if(typeof paddingTop == "string" && paddingTop.endsWith("px")) {
                paddingTop = Number(paddingTop.substring(0, paddingTop.length-2));
            }
        }else {
            paddingTop = 0;
        }
        var paddingBottom = element.style.getPropertyValue("padding-bottom");
        if(paddingBottom != null) {
            if(typeof paddingBottom == "string" && paddingBottom.endsWith("px")) {
                paddingBottom = Number(paddingBottom.substring(0, paddingBottom.length-2));
            }
        }else {
            paddingBottom = 0;
        }
        size.width = element.clientWidth - (paddingLeft + paddingRight);
        size.height = element.clientHeight - (paddingTop + paddingBottom);
        return size;
    },

    scrollOffset: function(element) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return;
        }
        function retrieve(element, context) {
            var result = Point(context.x+element.scrollLeft, context.y+element.scrollTop);
            if(element.parentElement == null || element.tagName == "BODY") {
                return result;
            }else {
                return retrieve(element.parentElement, result);
            }
        }
        return retrieve(element, Point());
    },

    defineStyles: function(element, styles) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return;
        }
        if(typeof styles != "object") {
            console.error("The definition is not JSON.", (styles != null && styles.toString != undefined ? styles.toString() : "null"));
            return;
        }
        function setProperties(element, styles) {
            var keys = Object.keys(styles);
            for(var i=0; i<keys.length; i++) {
                var key = keys[i];
                var value = styles[key];
                if(typeof value == "string" || typeof value == "number") {
                    element.style.setProperty(key, value);
                    if(key == "user-select") {
                        element.style.setProperty("-webkit-user-select", value);
                        element.style.setProperty("-moz-user-select", value);
                        element.style.setProperty("-ms-user-select", value);
                    }
                }else if(typeof value == "object") {
                    var innerElements = element.querySelectorAll(key);
                    if(innerElements != null) {
                        for(var j=0; j<innerElements.length; j++) {
                            var innerElement = innerElements[j];
                            setProperties(innerElement, value);
                        }
                    }
                }
            }
        }
        setProperties(element, styles);
    },

    replaceChildren: function(element, childNode) {
        if(!(element instanceof HTMLElement)) {
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return;
        }
        for(var i=0; i<element.children.length; i++) {
            element.children[i].remove();
        }
        element.appendChild(childNode);
    }
};

/**
 * Apply multiple styles to an HTMLElement.
 * @memberof HTMLElement
 * @param {Object} styles 
 * @returns {HTMLElement}
 */
HTMLElement.prototype.defineStyles = function(styles) {
    HtmlElementUtil.defineStyles(this, styles);
    return this;
};

/**
 * Delete all HTMLElement child elements and replace them with the specified child elements.
 * @memberof HTMLElement
 * @param {HTMLElement} childNode 
 * @returns {HTMLElement}
 */
HTMLElement.prototype.replaceChildren = function(childNode) {
    HtmlElementUtil.replaceChildren(this, childNode);
    return this;
};

/**
 * Delete all child nodes
 * @memberof Node
 * @returns {Node}
 */
Node.prototype.removeAll = function() {
    while(this.firstChild) {
        this.removeChild(this.firstChild);
    }
    return this;
};


/**
 * Get the index of a Node in a NodeList
 * @memberof NodeList
 * @param {Node} childNode 
 * @returns {number}
 */
NodeList.prototype.indexOf = function(childNode) {
    return Array.prototype.slice.call(this).indexOf(childNode);
};

/**
 * @ignore 
 */
NodeList.prototype.forEach = function(iteration) {
    // Chrome bug fix
    var nodeList = Array.prototype.slice.call(this);
    if(nodeList != null && nodeList.length > 0) {
        for(var i=0; i<nodeList.length; i++) {
            iteration(nodeList[i], i, nodeList);
        }
    }
    return this;
};

/**
 * UIs
 * @namespace
 */
var Controls = {

    /**
     * Create compatible select element. It absorbs differences in expression between operating systems and browsers.
     * @type {function(HTMLElement, object): object}
     * 
     * @param {HTMLElement} element
     * 
     * @param {Object} settings 
     * @param {Array} settings.items 
     * @param {number} settings.selectedIndex 
     * @param {number} settings.itemWidth 
     * @param {number} settings.itemHeight 
     * @param {function(any):string} [settings.labelHandler] The argument is a element of settings.items.
     * @param {function(any):object} [settings.styleHandler] The argument is a element of settings.items.
     * @param {function(HTMLDivElement, any): void} [settings.itemDrawer] The second argument is a element of settings.items.
     * @param {function(number): void} [settings.selectHandler] The argument is selected index of settings.items.
     * @param {function():void} [settings.closeHandler] 
     * @param {boolean} [settings.selectedDrawing=true] 
     * @param {boolean} [settings.editable=true] 
     * 
     * @returns {Object} interface
     * @returns {number} interface.selectedIndex 
     * @returns {function(): void} interface.show 
     * @returns {function(): void} interface.close 
     */
    Select: function(element, settings) {
        if(!(element instanceof HTMLElement)) { 
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return; 
        }

        var reference = {
            items: undefined,
            selectedIndex: -1,
            selectHandler: undefined
        }

        var parent;
        var itemWidth = 120;
        var itemHeight = 32;

        var itemDrawer;
        var labelHandler;
        var styleHandler;
        var hoverStyleHandler;

        var closeHandler;

        var selectedDrawing = true;
        var animate = true;
        var hilighting = false;
        var editable = true;

        if(settings != undefined) {
            if(settings.items != undefined) {
                reference.items = settings.items;
            }
            if(settings.parent != undefined && settings.parent instanceof HTMLElement) {
                parent = settings.parent;
            }
            if(settings.itemWidth != undefined) {
                itemWidth = settings.itemWidth;
            }
            if(settings.itemHeight != undefined) {
                itemHeight = settings.itemHeight;
            }
            if(settings.itemDrawer != undefined) {
                itemDrawer = settings.itemDrawer;
            }
            if(settings.labelHandler != undefined) {
                labelHandler = settings.labelHandler;
            }
            if(settings.styleHandler != undefined) {
                styleHandler = settings.styleHandler;
            }
            if(settings.hoverStyleHandler != undefined) {
                hoverStyleHandler = settings.hoverStyleHandler;
            }
            if(settings.selectHandler != undefined) {
                reference.selectHandler = settings.selectHandler;
            }
            if(settings.closeHandler != undefined) {
                closeHandler = settings.closeHandler;
            }
            if(settings.selectedDrawing != undefined) {
                selectedDrawing = settings.selectedDrawing;
            }
            if(settings.animate != undefined) {
                animate = settings.animate;
            }
            if(settings.hilighting != undefined) {
                hilighting = settings.hilighting;
            }
            if(settings.editable != undefined) {
                editable = settings.editable;
            }
        }
        if(parent == undefined) {
            parent = document.querySelector("body");
        }
        if(hilighting && hoverStyleHandler == undefined) {
            hoverStyleHandler = function() {
                return {
                    "background-color": "whitesmoke"
                };
            }
        }

        element.style.setProperty("cursor", "pointer");

        var parentOffset = HtmlElementUtil.offset(parent);

        var selection = document.createElement("div");
        selection.classList.add("selection");
        selection.style.setProperty("visibility", "hidden");
        selection.style.setProperty("position", "absolute");
        selection.style.setProperty("overflow", "auto");
        selection.style.setProperty("-ms-overflow-style", "none");
        selection.style.setProperty("-webkit-overflow-scrolling", "touch");
        selection.style.setProperty("scrollbar-width", "none");
        selection.style.setProperty("background-color", "white");
        selection.style.setProperty("box-shadow", "3px 3px 6px rgba(0,0,0,0.3)");
        selection.style.setProperty("border", "1px solid rgba(0,0,0,0.3)");
        selection.style.setProperty("cursor", "pointer");
        selection.style.setProperty("user-select", "none");
        if(itemDrawer != null) {
            selection.style.setProperty("width", itemWidth+"px");
            selection.style.setProperty("line-height", "0px");
        }

        var mask = document.createElement("div");
        mask.style.setProperty("position", "absolute");
        mask.style.setProperty("left", parentOffset.left+"px");
        mask.style.setProperty("top", parentOffset.top+"px");
        mask.style.setProperty("width", "100%");
        mask.style.setProperty("height", "100%");
        mask.style.setProperty("background-color", "transparent");

        function createItem(item, current) {
            var itemElement;
            if(labelHandler != undefined) {
                var label = labelHandler(item);
                itemElement = document.createElement("div");
                itemElement.classList.add("item");
                itemElement.innerText = label;
                itemElement.style.setProperty("position", "relative");
                itemElement.style.setProperty("height", itemHeight+"px");
                itemElement.style.setProperty("line-height", itemHeight+"px");
                itemElement.style.setProperty("white-space", "nowrap");
                itemElement.style.setProperty("font-size", "16px");
                itemElement.style.setProperty("cursor", "pointer");

                if(styleHandler != undefined) {
                    var styles = styleHandler(item, current);
                    if(styles != null && typeof styles == "object") {
                        var keys = Object.keys(styles);
                        for(var i=0; i<keys.length; i++) {
                            var key = keys[i];
                            itemElement.style.setProperty(key, styles[key]);
                        }
                    }
                }

                if(hoverStyleHandler != undefined && !current) {
                    var hoverStyles = hoverStyleHandler();
                    var originalStyles = {};
                    var hoverStyleKeys = Object.keys(hoverStyles);
                    for(i=0; i<hoverStyleKeys.length; i++) {
                        key = hoverStyleKeys[i];
                        originalStyles[key] = itemElement.style.getPropertyValue(key);
                    }
                    itemElement.addEventListener("mouseover", function() {
                        var hoverStyleKeys = Object.keys(hoverStyles);
                        for(var i=0; i<hoverStyleKeys.length; i++) {
                            var key = hoverStyleKeys[i];
                            itemElement.style.setProperty(key, hoverStyles[key]);
                        }
                    });
                    itemElement.addEventListener("mouseout", function() {
                        var originalStyleKeys = Object.keys(originalStyles);
                        for(var i=0; i<originalStyleKeys.length; i++) {
                            var key = originalStyleKeys[i];
                            itemElement.style.setProperty(key, originalStyles[key]);
                        }
                    });
                }
            }
            else if(itemDrawer != undefined) {
                itemElement = document.createElement("canvas");
                CanvasUtil.initCanvas(itemElement, {width: itemWidth, height: itemHeight});
                itemDrawer(itemElement, item);
            }
            return itemElement;
        }

        function drawSelectedItem() {
            if(!selectedDrawing) return;
            if(reference.selectedIndex < 0 || reference.selectedIndex >= reference.items.length) {
                return;
            }
            var item = reference.items[reference.selectedIndex];
            if(item == null) return;
            if(labelHandler != undefined) {
                var label = labelHandler(item);
                var contentElement = element.querySelector("div.item");
                if(contentElement == null) {
                    contentElement = createItem(item, true);
                    element.appendChild(contentElement);
                }
                contentElement.innerText = label != null ? label : "";
                if(styleHandler != undefined) {
                    var styles = styleHandler(item, true);
                    if(styles != null && typeof styles == "object") {
                        var keys = Object.keys(styles);
                        for(var i=0; i<keys.length; i++) {
                            var key = keys[i];
                            contentElement.style.setProperty(key, styles[key]);
                        }
                    }
                }
            }else if(itemDrawer != undefined) {
                itemDrawer(element.querySelector("canvas"), item);
            }
        }

        function loadItems() {
            selection.childNodes.forEach(function(itemElement, index) {
                itemElement.remove();
            });
            for(var i=0; i<reference.items.length; i++) {
                var item = reference.items[i];
                selection.appendChild(createItem(item));
            }
            if(editable) {
                if(labelHandler != undefined) {
                    selection.querySelectorAll("div").forEach(function(itemElement) {
                        itemElement.addEventListener("click", function(event) {
                            var itemElement = event.currentTarget;

                            var index = -1;
                            var itemElementList = selection.querySelectorAll("div");
                            for(var i=0; i<itemElementList.length; i++) {
                                if(itemElementList[i] === itemElement) {
                                    index = i;
                                    break;
                                }
                            }
                            if(index == -1 || index >= reference.length) {
                                return false;
                            }
                            reference.selectedIndex = index;

                            drawSelectedItem();

                            if(reference.selectHandler != undefined) {
                                reference.selectHandler(reference.selectedIndex, reference);
                            }

                            reference.close();
                        });
                    });
                }
                else if(itemDrawer != undefined) {
                    selection.querySelectorAll("canvas").forEach(function(itemElement, index) {
                        itemElement.addEventListener("click", function() {
                            reference.selectedIndex = index;
                            drawSelectedItem();
                            if(reference.selectHandler != undefined) {
                                reference.selectHandler(reference.selectedIndex, reference);
                            }
                            reference.close();
                        });
                    });
                }
            }
        }

        function showSelection() {
            if(reference.items == null || reference.items.length == 0) {
                return;
            }
            loadItems();

            parent.appendChild(mask);
            parent.appendChild(selection);

            var offset = HtmlElementUtil.offset(element, parent);
            var scrollOffset = HtmlElementUtil.scrollOffset(element);
            var x = offset.left;
            if(x + selection.clientWidth > parent.clientWidth) {
                x = parentOffset.left + parent.clientWidth - selection.clientWidth;
            }
            var y = offset.top + element.clientHeight - scrollOffset.y;
            var maxHeight = parentOffset.top + parent.clientHeight - y - 16;
            if(maxHeight < 120) {
                y = offset.top - selection.clientHeight - scrollOffset.y;
                maxHeight = offset.top - parentOffset.top - 16;
            }
            selection.style.setProperty("left", x+"px");
            selection.style.setProperty("top", y+"px");
            selection.style.setProperty("max-height", maxHeight+"px");

            if(animate) {
                selection.childNodes.forEach(function(selectionItem) {
                    selectionItem.style.setProperty("opacity", 0);
                    selectionItem.style.setProperty("top", "32px");
                });
                var height = selection.offsetHeight;
                selection.style.setProperty("height", 0);
                selection.style.setProperty("visibility", "visible");
                new StyleAnimation(selection, "height", {finishValue: height, duration: 200}).start().finish(function() {
                    var timing = 0;
                    selection.childNodes.forEach(function(selectionItem) {
                        setTimeout(function() {
                            new FunctionalAnimation(function(progress) {
                                selectionItem.style.setProperty("opacity", progress);
                                selectionItem.style.setProperty("top", (16*(1-progress))+"px");
                            }, FunctionalAnimation.methods.linear, 100).start();
                        }, timing);
                        timing += 100;
                    });
                });
            }else {
                selection.style.setProperty("visibility", "visible");
            }
        }
    
        Object.defineProperty(reference, "selectedIndex", { 
            get: function() {
                return this._selectedIndex;
            },
            set: function(newValue) {
                this._selectedIndex = newValue;
                drawSelectedItem();
            }
        });

        if(settings != undefined && 
            settings.items != undefined && 
            settings.selectedIndex != undefined && 
            settings.selectedIndex >= 0 && 
            settings.selectedIndex < settings.items.length) {
            reference.selectedIndex = settings.selectedIndex;
        }
        
        if(selectedDrawing) {
            drawSelectedItem();
        }

        if(editable) {
            element.addEventListener("click", function() {
                showSelection();
            });
        }

        reference.show = function() {
            showSelection();
        };
        reference.close = function() {
            mask.remove();
            new StyleAnimation(selection, "height", {finishValue: 0, duration: 200}).start().finish(function() {
                selection.remove();
                selection.style.setProperty("visibility", "hidden");
                selection.style.removeProperty("height");
            });
        };

        mask.addEventListener("click", function() {
            reference.close();
            if(closeHandler != undefined) {
                closeHandler(reference);
            }
        });

        return reference;
    },

    /**
     * Show popup dialog.
     * @param {HTMLElement} element
     * @returns {Object} interface
     * @returns {function(void): void} interface.close
     */
    Popup: function(element, settings) {
        if(!(element instanceof HTMLElement)) { 
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return; 
        }

        var duration = 200;
        if(settings != undefined) {
            if(settings.duration != undefined) {
                duration = settings.duration;
            }
        }
        
        var parent = document.querySelector("body");

        element.style.setProperty("position", "absolute");
        element.style.setProperty("box-shadow", "3px 3px 12px rgba(0,0,0,0.3)");
        element.style.setProperty("border", "1px solid rgba(0,0,0,0.3)");
        parent.appendChild(element);

        element.style.setProperty("left", (parent.clientWidth/2 - element.offsetWidth/2)+"px");
        element.style.setProperty("top", parent.clientHeight+"px");
        var offset = HtmlElementUtil.offset(element, parent);
        new StyleAnimation(element, "top", {beginValue: offset.top, finishValue: parent.clientHeight/2 - element.offsetHeight/2, duration: duration}).start();
        return {
            close: function() {
                var offset = HtmlElementUtil.offset(element, parent);
                new StyleAnimation(element, "top", {beginValue: offset.top, finishValue: parent.clientHeight, duration: duration}).start().finish(function() {
                    element.remove();
                });
            }
        }
    },

    /**
     * Show message dialog
     * @param {string} message
     * @param {info|warning|confirm} type
     * @param {function(): void} applyHandler
     * @param {function(): void} cancelHandler
     */
    Message: function(text, type, applyHandler, cancelHandler) {
        var element = document.createElement("div");
        element.classList.add("message");
        var contentsElement = document.createElement("div");
        contentsElement.classList.add("contents");
        contentsElement.innerText = text;
        element.appendChild(contentsElement);
        var controlsElement = document.createElement("div");
        controlsElement.classList.add("controls");
        element.appendChild(controlsElement);

        element.style.setProperty("background-color", "white");
        element.style.setProperty("color", "black");
        element.style.setProperty("padding", "16px");
        element.style.setProperty("user-select", "none");

        element.querySelector(".contents").style.setProperty("min-height", "32px");

        if(applyHandler == undefined && cancelHandler == undefined) {
            element.querySelector(".controls").style.setProperty("display", "none");
        }else {
            element.querySelector(".controls").style.setProperty("margin-top", "16px");
            element.querySelector(".controls").style.setProperty("text-align", "center");
        }

        if(type != undefined) {
            var icon = document.createElement("canvas");
            var iconSize = Size(32, 32);
            CanvasUtil.initCanvas(icon, iconSize);
            var context = icon.getContext("2d");
            var labelSize = 16;
            var point = Point(0,0);
            if(type == "warning") {
                var cornerSize = 4;
                point.x = iconSize.width/2;
                context.beginPath();
                context.arc(point.x, point.y+cornerSize, cornerSize, 1.2*Math.PI, 1.8*Math.PI, false);
                point.x = iconSize.width;
                point.y = iconSize.height;
                context.arc(point.x-cornerSize, point.y-cornerSize, cornerSize, -0.2*Math.PI, 0.5*Math.PI, false);
                point.x = 0;
                context.arc(point.x+cornerSize, point.y-cornerSize, cornerSize, 0.5*Math.PI, 1.2*Math.PI, false);
                context.closePath();
                context.fillStyle = "black";
                context.fill();

                context.beginPath();
                point.x = iconSize.width/2 - 2;
                point.y = iconSize.height/2 - labelSize/2+2;
                context.moveTo(point.x, point.y);
                point.x += 4;
                context.lineTo(point.x, point.y);
                point.x = iconSize.width/2 + 1.5;
                point.y += 12;
                context.lineTo(point.x, point.y);
                point.x -= 3;
                context.lineTo(point.x, point.y);
                context.closePath();
                point.x = iconSize.width/2;
                point.y += 2+2;
                context.arc(point.x, point.y, 2, 0, 2*Math.PI, false);
                context.globalCompositeOperation = "destination-out";
                context.fill();
            }else if(type == "confirm") {
                context.beginPath();
                context.arc(iconSize.width/2, iconSize.height/2, iconSize.width/2, 0, 2*Math.PI, false);
                context.fillStyle = "black";
                context.fill();

                context.beginPath();
                point.x = iconSize.width/2;
                point.y = iconSize.height/2-4;
                context.arc(point.x, point.y, 5, 1*Math.PI, 2.5*Math.PI, false);
                context.arc(point.x, point.y, 2, 2.5*Math.PI, 1*Math.PI, true);
                context.closePath();
                context.globalCompositeOperation = "destination-out";
                context.fill();
                point.x = iconSize.width/2-1.5;
                point.y = iconSize.height/2-2;
                context.fillRect(point.x, point.y, 3, 4);

                point.x = iconSize.width/2;
                point.y += 4+2+2;
                context.arc(point.x, point.y, 2, 0, 2*Math.PI, false);
                context.fill();
            }else {
                context.beginPath();
                context.arc(iconSize.width/2, iconSize.height/2, iconSize.width/2, 0, 2*Math.PI, false);
                context.fillStyle = "black";
                context.fill();

                context.beginPath();
                point.x = iconSize.width/2;
                point.y = iconSize.height/2-labelSize/2+2;
                context.arc(point.x, point.y, 2, 0, 2*Math.PI, false);
                context.globalCompositeOperation = "destination-out";
                context.fill();

                point.x = iconSize.width/2-1.5;
                point.y += 2+2;
                context.fillRect(point.x, point.y, 3, 10);
            }
            icon.style.setProperty("vertical-align", "middle");
            icon.style.setProperty("margin-right", "8px");
            element.querySelector(".contents").prepend(icon);
        }
        var popup;
        if(applyHandler != undefined) {
            var applyButton = document.createElement("div");
            applyButton.innerText = "OK";
            applyButton.style.setProperty("display", "inline-block");
            applyButton.style.setProperty("margin", "0px 8px 8px 8px");
            applyButton.style.setProperty("font-weight", "600");
            applyButton.style.setProperty("cursor", "pointer");
            applyButton.addEventListener("click", function() {
                applyHandler();
                if(popup != undefined) {
                    popup.close();
                }
            });
            element.querySelector(".controls").appendChild(applyButton);
        }
        if(cancelHandler != undefined) {
            var cancelButton = document.createElement("div");
            cancelButton.innerText = "Cancel";
            cancelButton.style.setProperty("display", "inline-block");
            cancelButton.style.setProperty("margin", "0px 8px 8px 8px");
            cancelButton.style.setProperty("font-weight", "600");
            cancelButton.style.setProperty("cursor", "pointer");
            cancelButton.addEventListener("click", function() {
                cancelHandler();
                if(popup != undefined) {
                    popup.close();
                }
            });
            element.querySelector(".controls").appendChild(cancelButton);
        }
        popup = this.Popup(element);
        if(applyHandler == undefined && cancelHandler == undefined) {
            setTimeout(function() {
                popup.close();
            }, 1000);
        }
    },

    /**
     * Show HTML element inclued by the balloon.
     * @param {HTMLElement} element
     * @param {Object} settings 
     * @param {Point} [settings.location]
     * @param {HTMLElement} [settings.parent]
     * @param {function(HTMLElement): object} [settings.loadHandler]
     * @param {number} [settings.padding]
     * @param {top|bottom|left|right} [settings.direction]
     * @param {number} [settings.tipSize]
     * @param {number} [settings.tipOffset]
     * @param {string} [settings.fillColor]
     * @param {boolean} [settings.shadow]
     * @param {boolean} [settings.modal]
     * @param {boolean} [settings.visible]
     * @returns {Object} interface
     * @returns {Point} interface.location
     * @returns {Size} interface.size
     * @returns {function(): void} interface.show
     * @returns {function(): void} interface.close
     */
    Balloon: function(element, settings) {
        if(!(element instanceof HTMLElement)) { 
            console.error("Element is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return; 
        }

        var context = {};

        var location = Point(0, 0);
        var parent;
        var loadHandler;
        var padding = 8;
        var margin = 8;
        var direction = "top";
        var tipSize = 8;
        var tipOffset = undefined;
        var fillColor = "white";
        var shadow = false;
        var modal = true;
        var visible = true;
        if(settings != undefined) {
            if(settings.location != undefined) {
                location = settings.location;
            }
            if(settings.parent != undefined) {
                if(!(settings.parent instanceof HTMLElement)) { 
                    console.error("親要素がHTMLElementではありません。", settings.parent.toString());
                    return; 
                }
                parent = settings.parent;
            }
            if(settings.loadHandler != undefined) {
                loadHandler = settings.loadHandler;
            }
            if(settings.padding != undefined) {
                padding = settings.padding;
            }
            if(settings.direction != undefined) {
                direction = settings.direction;
            }
            if(settings.tipSize != undefined) {
                tipSize = settings.tipSize;
            }
            if(settings.tipOffset != undefined) {
                tipOffset = settings.tipOffset;
            }
            if(settings.fillColor != undefined) {
                fillColor = settings.fillColor;
            }
            if(settings.shadow != undefined) {
                shadow = settings.shadow;
            }
            if(settings.modal != undefined) {
                modal = settings.modal;
            }
            if(settings.visible != undefined) {
                visible = settings.visible;
            }
        }
        if(parent == undefined) {
            parent = document.querySelector("body");
        }

        var container = document.createElement("div");
        container.classList.add("balloon");
        container.style.setProperty("position", "absolute");
        container.style.setProperty("left", location.x+"px");
        container.style.setProperty("top", location.y+"px");

        var mask = document.createElement("div");
        mask.style.setProperty("position", "absolute");
        mask.style.setProperty("left", "0");
        mask.style.setProperty("top", "0");
        mask.style.setProperty("width", "100%");
        mask.style.setProperty("height", "100%");
        mask.style.setProperty("background-color", "transparent");

        var canvasElement = document.createElement("canvas");
        container.appendChild(canvasElement);

        element.style.setProperty("position", "absolute");
        element.style.setProperty("left", (margin+padding+(direction == "left" ? tipSize : 0))+"px");
        element.style.setProperty("top", (margin+padding+(direction == "top" ? tipSize : 0))+"px");
        container.appendChild(element);

        if(modal) {
            parent.appendChild(mask);
        }
        parent.appendChild(container);

        function drawBaloon() {
            var canvasSize = Size(element.offsetWidth+padding*2+margin*2, element.offsetHeight+padding*2+margin*2);
            if(direction == "top" || direction == "bottom") {
                canvasSize.height += tipSize;
            }else {
                canvasSize.width += tipSize;
            }

            CanvasUtil.initCanvas(canvasElement, canvasSize);

            var offset = HtmlElementUtil.offset(container, parent);
            
            if(offset.left + container.offsetWidth > parent.clientWidth) {
                container.style.setProperty("left", (parent.clientWidth-container.offsetWidth)+"px");
            }

            if(loadHandler != undefined) {
                var _settings = loadHandler(container, settings);
                if(_settings != undefined) {
                    if(_settings.location != undefined) {
                        container.style.setProperty("left", _settings.location.x+"px");
                        container.style.setProperty("top", _settings.location.y+"px");
                    }
                    if(_settings.tipOffset != undefined) {
                        tipOffset = _settings.tipOffset;
                    }
                    if(_settings.direction != undefined) {
                        direction = _settings.direction;
                    }
                }
            }
            
            var context = canvasElement.getContext("2d");
            context.clearRect(0, 0, canvasSize.width, canvasSize.height);
            DrawUtil.drawRoundRectBalloon(context, Rect(margin, margin, canvasElement.clientWidth-margin*2, canvasElement.clientHeight-margin*2), {
                direction: direction,
                tipSize: tipSize,
                tipOffset: tipOffset,
                fillColor: fillColor,
                margin: margin,
                shadow: shadow
            });
        }

        var observer;
        if(MutationObserver !== undefined) {
            observer = new MutationObserver(function(mutations) {
                drawBaloon();
                if(!visible) {
                    container.style.setProperty("visibility", "hidden");
                }
            });
            observer.observe(element, {childList: true, subtree: true, attributes: true});
        }else {
            console.error("Your browser does not support MutationObserver. Please try to run Polyfill for this feature.");
        }

        Object.defineProperty(context, "location", { 
            set: function(location) {
                container.style.setProperty("left", location.x+"px");
                container.style.setProperty("top", location.y+"px");
            }
        });
        Object.defineProperty(context, "size", { 
            get: function() {
                return Size(container.offsetWidth, container.offsetHeight);
            }
        });

        context.show = function() {
            visible = true;
            container.style.setProperty("visibility", "visible");
        };
        context.close = function() {
            if(observer != null) {
                observer.disconnect();
            }
            if(modal) {
                mask.remove();
            }
            container.remove();
        };

        if(element.clientWidth != 0 && element.clientHeight != 0) {
            drawBaloon();

            if(!visible) {
                container.style.setProperty("visibility", "hidden");
            }
        }

        // Prevent close from being called in the event of Balloon call in Mobile Safari
        setTimeout(function() {
            mask.addEventListener("click", function() {
                context.close();
            });
        }, 0);

        return context;
    },

    /**
     * Show context menu.
     * @param {HTMLElement|Point} source
     * @param {Object} settings 
     * @param {Array.<string>} settings.items
     * @param {string} settings.labelColor
     * @param {string} settings.backgroundColor
     * @param {function(number): void} settings.selectHandler
     */
    ContextMenu: function(source, settings) {
        if(!(typeof source == "object" && source.x != undefined && source.y != undefined) && !(source instanceof HTMLElement)) { 
            console.error("First argument is not a Point or HTMLElement.", (source != null && source.toString != undefined ? source.toString() : "null"));
            return;
        }
        
        var items;
        var labelColor = "white";
        var backgroundColor = "black";
        var selectHandler;
        if(settings != undefined) {
            if(settings.items != undefined) {
                items = settings.items;
            }
            if(settings.labelColor != undefined) {
                labelColor = settings.labelColor;
            }
            if(settings.backgroundColor != undefined) {
                backgroundColor = settings.backgroundColor;
            }
            if(settings.selectHandler != undefined) {
                selectHandler = settings.selectHandler;
            }
        }
        if(items == undefined) {
            items = [];
        }

        var menu = document.createElement("div");
        menu.classList.add("contextMenu");
        menu.style.setProperty("line-height", "0px");
        for(var i=0; i<items.length; i++) {
            var item = items[i];
            var menuItem = document.createElement("div");
            menuItem.innerText = item;
            menu.appendChild(menuItem);
        }
        menu.querySelectorAll("div").forEach(function(menuItem) {
            menuItem.style.setProperty("display", "inline-block");
            menuItem.style.setProperty("color", labelColor);
            menuItem.style.setProperty("font-size", "12px");
            menuItem.style.setProperty("line-height", "12px");
            menuItem.style.setProperty("cursor", "pointer");
            menuItem.style.setProperty("user-select", "none");
            menuItem.style.setProperty("white-space", "nowrap");
        });
        var location;
        function detectScroll(parentElement) {
            location.x -= parentElement.scrollLeft;
            location.y -= parentElement.scrollTop;
            if(parentElement.parentElement != null) {
                detectScroll(parentElement.parentElement);
            }
        }
        if(source instanceof HTMLElement) {
            var offset = HtmlElementUtil.offset(source);
            location = Point(offset.left + source.clientWidth/2, offset.top);
            detectScroll(source.parentElement);
        }else if(typeof source == "object" && source.x != undefined && source.y != undefined) {
            location = Point(source.x, source.y);
        }else {
            location = Point();
        }
        var balloon = Controls.Balloon(menu, {
            location: location, 
            fillColor: backgroundColor, 
            direction: "bottom",
            loadHandler: function(balloon) {
                if(source instanceof HTMLElement) {
                    balloon.style.setProperty("left", (location.x - balloon.clientWidth/2)+"px");
                    balloon.style.setProperty("top", (location.y - balloon.clientHeight+16)+"px");
                }else if(typeof source == "object" && source.x != undefined && source.y != undefined) {
                    balloon.style.setProperty("left", (location.x - balloon.clientWidth/2)+"px");
                    balloon.style.setProperty("top", (location.y - balloon.clientHeight)+"px");
                }
            }
        });
        
        menu.querySelector("div").addEventListener("click", function(event) {
            var index = -1;
            var menuItemList = menu.querySelectorAll("div");
            for(var i=0; i<menuItemList.length; i++) {
                if(menuItemList[i] == event.currentTarget) {
                    index = i;
                }
            }
            selectHandler(index);
            balloon.close();
        });
    },

    /**
     * Make the specified HTML element draggable
     * @param {HTMLElement} element
     * @param {function(Point): void} callback
     */
    Draggable: function(element, callback) {
        if(!(element instanceof HTMLElement)) { 
            console.error("First argument is not HTMLElement.", (element != null && element.toString != undefined ? element.toString() : "null"));
            return; 
        }

        var context = {
            pressing: false,
            beginLocation: {x: 0, y: 0},
            beginScrollOffset: {x: -1, y: -1}
        };
        element.addEventListener("mousedown", function(event) {
            var target = event.currentTarget;
            context.pressing = true;
            context.beginLocation.x = event.clientX - target.offsetLeft;
            context.beginLocation.y = event.clientY - target.offsetTop;
            context.beginScrollOffset.x = target.scrollLeft;
            context.beginScrollOffset.y = target.scrollTop;
        });
        element.addEventListener("mousemove", function(event) {
            if(!context.pressing) { return; }
            var target = event.currentTarget;
            var currentX = event.clientX - target.offsetLeft;
            var currentY = event.clientY - target.offsetTop;
            var currentScrollOffsetX = context.beginScrollOffset.x - (currentX - context.beginLocation.x);
            var currentScrollOffsetY = context.beginScrollOffset.y - (currentY - context.beginLocation.y);
            target.scrollLeft = currentScrollOffsetX
            target.scrollTop = currentScrollOffsetY;
            if(callback != undefined) {
                callback(Point(target.scrollLeft, target.scrollTop));
            }
        });
        element.addEventListener("mouseup", function(event) {
            if(context.pressing) {
                event.stopPropagation();
            }
            context.pressing = false;
            context.beginLocation = {x: 0, y: 0};
            context.beginScrollOffset = {x: -1, y: -1};
        });
        element.addEventListener("mouseleave", function(event) {
            context.pressing = false;
            context.beginLocation = {x: 0, y: 0};
            context.beginScrollOffset = {x: -1, y: -1};
        });
    }
};
