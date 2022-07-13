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
 * @example
 *     // Define subclass of ViewController in ECMAScript 5
 *     var MyViewController = ViewController(function(self) {
 *         self.parent = "body";
 *         self.view = View({dataKey: "key"});
 *     });
 *     var instance = new MyViewController();
 *     instance.data = {key: "value"};
 * @example
 *     // Define subclass of ViewController in ECMAScript 6
 *     class MyViewController extends ViewController {
 *         constructor() {
 *             super();
 *             this.parent = "body";
 *             this.view = View({dataKey: "key"});
 *         }
 *     }
 *     var instance = new MyViewController();
 *     instance.data = {key: "value"};
 */
function ViewController() {
    if(this === undefined) {
        if(arguments.length == 1 && typeof arguments[0] == "function") {
            var initializer = arguments[0];
            var subClass = function() {
                ViewController.apply(this);
                initializer(this);
            };
            subClass.prototype = Object.create(ViewController.prototype);
            return subClass;
        }
        console.error("ViewController is must be create with the new keyword.");
        return;
    }

    /**
     * Whether or not to replace the child elements with the specified View.
     * @type {boolean}
     */
    this.replace = true;

    /**
     * Called when the data loading is complete.
     * @type {function(void): void}
     */
    this.dataLoadedHandler = null;
}

/**
 * Show the view.
 * To change the display method, override it with a subclass. This method must not be called directly.
 * @memberof ViewController
 * @type {function(void): void}
 * @protected
 */
ViewController.prototype.showView = function() {
    this.parent.appendChild(this.view);
};

/**
 * Reload the view.
 * @memberof ViewController
 * @type {function(void): void}
 */
ViewController.prototype.reloadData = function() {
    bindData(this.data, this.view);
}

/**
 * @name ViewController#parent
 * @type {HTMLElement|string}
 */
Object.defineProperty(ViewController.prototype, "parent", {
    get: function() {
        return this._parent;
    },
    set: function(newValue) {
        if(newValue instanceof HTMLElement) {
            this._parent = newValue;
        }else if(typeof newValue == "string") {
            var parentElement = document.querySelector(newValue);
            if(parentElement != null && parentElement instanceof HTMLElement) {
                this._parent = parentElement;
            }else {
                console.error("The parent can not be loaded. selector="+newValue);
                return;
            }
        }else {
            console.error("The parent must be HTMLElement or selector string.");
            return;
        }

        // Add the view to the parent if the view has been set.
        if(this.view != undefined) {
            if(this.replace) {
                this.parent.removeAll();
            }
            this.showView();

            // Bind the data to the view if the data has been set.
            if(this.data != null) {
                this._data = bindData(this.data, this.view);

                if(this.dataLoadedHandler != null) {
                    this.dataLoadedHandler();
                }
            }
        }
    }
});

/**
 * @name ViewController#view
 * @type {HTMLElement} 
 */
Object.defineProperty(ViewController.prototype, "view", {
    get: function() {
        return this._view;
    },
    set: function(newValue) {
        if(!(newValue instanceof HTMLElement)) {
            console.error("The view must be HTMLElement.");
            return;
        }
        this._view = newValue;

        // Add the view to the parent if the parent has been set.
        if(this.parent != undefined) {
            if(this.replace) {
                this.parent.removeAll();
            }
            this.showView();
        }

        // Bind the data to the view if the data has been set.
        if(this.data != null) {
            this._data = bindData(this.data, this.view);

            if(this.dataLoadedHandler != null) {
                this.dataLoadedHandler();
            }
        }
    }
});

/**
 * @name ViewController#data
 * @type {Object|Array}
 */
Object.defineProperty(ViewController.prototype, "data", {
    get: function() {
        return this._data;
    },
    set: function(newValue) {
        if(!(Array.isArray(newValue) || typeof newValue == "object")) {
            console.error("The data must be Object or Array.");
            return;
        }
        this._data = newValue;

        // Bind the data to the view if the view has been set.
        if(this.view != null) {
            this._data = bindData(this.data, this.view);
        }
        
        if(this.dataLoadedHandler != null) {
            this.dataLoadedHandler();
        }
    }
});

/**
 * Popover View Controller
 * @class
 * @extends ViewController
 */
function PopoverViewController() {
    if(this === undefined) {
        if(arguments.length == 1 && typeof arguments[0] == "function") {
            var initializer = arguments[0];
            var subClass = function() {
                PopoverViewController.apply(this);
                initializer(this);
            };
            subClass.prototype = Object.create(PopoverViewController.prototype);
            return subClass;
        }
        console.error("PopoverViewController is must be create with the new keyword.");
        return;
    }

    ViewController.call(this);

    var self = this;

    this.replace = false;

    /**
     * Display layout of Popover.
     * @type {string}
     */
    this.layout = "center";

    /**
     * Whether popover is modal or not.
     * @type {boolean}
     */
    this.modal = false;

    /**
     * Click outside the view to close it.
     * @type {boolean}
     */
    this.dismissOnOutside = true;
    
    /**
     * By changing the style of this view, you can change the way it pops over.
     * @type {HTMLDivElement}
     * @readonly
     */
    this.container = View("._hardcore-popover", {style: {
        "position": "absolute", 
        "border": "1px solid rgba(0,0,0,0.3)", 
        "box-shadow": "3px 3px 16px rgba(0,0,0,0.3)"
    }});

    /**
     * Processing when the view is destroyed.
     * @type {function(void): void}
     */
    this.dismissHandler;

    /**
     * Border color of the popover window
     * @type {string}
     */
    Object.defineProperty(this, "borderColor", {
        configurable: true,
        get: function() {
            return this.container.style.borderColor;
        },
        set: function(newValue) {
            this.container.style.borderColor = newValue;
        }
    });
}
PopoverViewController.prototype = Object.create(ViewController.prototype);

PopoverViewController.prototype.showView = function() {
    if(!this.modal) {
        var maskStyle = {
            "position": "absolute", 
            "width": "100%",
            "height": "100%",
            "top": "0",
            "left": "0"
        }
        var self = this;
        var mask = View({style: maskStyle, tapHandler: function(event) {
            if(self.dismissOnOutside) {
                self.dismiss();
            }
        }});
        this.mask = mask;
        this.parent.appendChild(mask);
    }

    this.container.appendChild(this.view);
    this.parent.appendChild(this.container);

    function lauout(parent, view, layout) {
        var parentWidth = parent.clientWidth;
        var parentHeight = parent.clientHeight;
        var width = view.clientWidth;
        var height = view.clientHeight;
        if(width == undefined) {
            width = view.style.getPropertyValue("width");
            if(typeof width == "string" && width.endsWith("px") && width.length > 2) {
                width = Number(width.substr(0, width.length-2));
            }else {
                width = undefined;
            }
        }
        if(height == undefined) {
            height = view.style.getPropertyValue("height");
            if(typeof height == "string" && height.endsWith("px") && height.length > 2) {
                height = Number(height.substr(0, height.length-2));
            }else {
                height = undefined;
            }
        }
        var x;
        var y;
        if(layout == "center") {
            x = parent.offsetLeft + parentWidth/2 - width/2;
            y = parent.offsetTop + parentHeight/2 - height/2;
        }else if(layout == "topLeft") {
            x = parent.offsetLeft;
            y = parent.offsetTop;
        }else if(layout == "topRight") {
            x = parent.offsetLeft + parentWidth - width;
            y = parent.offsetTop;
        }else if(layout == "bottomLeft") {
            x = parent.offsetLeft;
            y = parent.offsetTop + parentHeight - height;
        }else if(layout == "bottomRight") {
            x = parent.offsetLeft + parentWidth - width;
            y = parent.offsetTop + parentHeight - height;
        }
        if(x != undefined) {
            view.style.setProperty("left", x+"px");
        }
        if(y != undefined) {
            view.style.setProperty("top", y+"px");
        }
    }

    if(ResizeObserver !== undefined) {
        var layout = this.layout;
        if(layout != null) {
            var resizeObserver = new ResizeObserver(function(observations) {
                if(observations.length == 0) return;
                var element = observations[0].target;
                resizeObserver.disconnect();
                lauout(element.parentElement, element, layout);
            });
            resizeObserver.observe(this.container);
        }
    }
    if(this.layout != null) {
        lauout(this.parent, this.container, this.layout);
    }
}

/**
 * Dismiss the view.
 * To change the dismiss method, override it with a subclass. This method must not be called directly.
 * @memberof PopoverViewController
 * @type {function(void): void}
 * @protected
 */
 PopoverViewController.prototype.dismissView = function() {
    if(this.dismissHandler != undefined) {
        this.dismissHandler();
    }
    this.container.remove();
};

/**
 * Dismiss the view.
 * @memberof PopoverViewController
 * @type {function(void): void}
 */
PopoverViewController.prototype.dismiss = function() {
    if(this.mask != undefined) {
        this.mask.remove();
    }
    this.dismissView();
}

/**
 * Slideover View Controller
 * @class
 * @extends ViewController
 */
function SlideoverViewController() {
    if(this === undefined) {
        if(arguments.length == 1 && typeof arguments[0] == "function") {
            var initializer = arguments[0];
            var subClass = function() {
                SlideoverViewController.apply(this);
                initializer(this);
            };
            subClass.prototype = Object.create(SlideoverViewController.prototype);
            return subClass;
        }
        console.error("SlideoverViewController is must be create with the new keyword.");
        return;
    }

    ViewController.call(this);

    var self = this;
    
    self.replace = false;

    /**
     * Whether popover is modal or not.
     * @type {boolean}
     */
    self.modal = false;

    /**
     * Click outside the view to close it.
     * @type {boolean}
     */
     self.dismissOnOutside = true;

    /**
     * Processing when the view is destroyed.
     * @type {function(void): void}
     */
    self.dismissHandler;
    
    /**
     * Text that is displayed in header section.
     * @type {string}
     */
    self.title;

    /**
     * Style of the header section.
     * @type {object}
     */
    self.headerStyle;

    /**
     * By changing the style of this view, you can change the way it pops over.
     * @type {HTMLDivElement}
     * @readonly
     */
    self.container = View("._hardcore-slideover", {style: {
        position: "absolute", 
        border: "1px solid darkgray", 
        "box-shadow": "3px 3px 6px rgba(0,0,0,0.3)",
        height: "100%",
        top: 0
    }}, [
        View(".header", {style: {
            height: 40
        }}, [
            View(".title", {style: {"padding-left":8, "line-height":40}}),
            Canvas(".exitButton", {width:40, height:40, style: {
                position: "absolute",
                top: 0,
                right: 0
            }, drawer: function(context, size) {
                var iconSize = 8;
                context.moveTo(size.width/2-iconSize/2, size.height/2-iconSize/2);
                context.lineTo(size.width/2+iconSize/2, size.height/2+iconSize/2);
                context.moveTo(size.width/2+iconSize/2, size.height/2-iconSize/2);
                context.lineTo(size.width/2-iconSize/2, size.height/2+iconSize/2);
                context.strokeStyle = "white";
                context.lineWidth = 1;
                context.lineCap = "round";
                context.stroke();
            }, tapHandler: function(event) {
                self.dismiss();
            }}),
        ]),
        View(".contents", {style: {
            height: "100%",
            "overflow-y": "auto",
            "-ms-overflow-style": "none",
            "scrollbar-width": "none"
        }})
    ]);

    /**
     * Background color of the sliding window
     * @type {string}
     */
    Object.defineProperty(self, "backgroundColor", {
        get: function() {
            return self.container.querySelector(".contents").style.backgroundColor;
        },
        set: function(newValue) {
            self.container.querySelector(".contents").style.backgroundColor = newValue;
        }
    });
}
SlideoverViewController.prototype = Object.create(ViewController.prototype);

SlideoverViewController.prototype.showView = function() {
    var self = this;

    if(self.modal) {
        var maskStyle = {
            "position": "absolute", 
            "width": "100%",
            "height": "100%",
            "top": "0",
            "left": "0"
        }
        var mask = View({style: maskStyle, tapHandler: function(event) {
            if(self.dismissOnOutside) {
                self.dismiss();
            }
        }});
        this.mask = mask;
        this.parent.appendChild(mask);
    }

    if(this.title != null) {
        var titleView = this.container.querySelector(".title");
        titleView.innerText = this.title;
    }
    if(this.headerStyle != null) {
        var headerView = this.container.querySelector(".header");
        headerView.styles = this.headerStyle;
    }

    this.container.style.top = this.parent.offsetTop+"px";

    var contentsView = this.container.querySelector(".contents");
    contentsView.appendChild(this.view);

    this.container.style.height = this.parent.clientHeight+"px";
    if(this.title != null) {
        contentsView.style.height = (this.parent.clientHeight - 40)+"px";
    }
    this.parent.appendChild(this.container);

    if(ResizeObserver !== undefined) {
        var resizeObserver = new ResizeObserver(function(observations) {
            if(observations.length == 0) return;
            var element = observations[0].target;
            resizeObserver.disconnect();

            element.style.right = -element.clientWidth + "px";
            new StyleAnimation(element, "right", {finishValue: 0, method: FunctionalAnimation.methods.easeOut}).start();
        });
        resizeObserver.observe(this.container);
    }else {
        this.container.style.right = -this.container.clientWidth + "px";
    }
}

/**
 * Dismiss the view.
 * @memberof SlideoverViewController
 * @type {function(void): void}
 */
SlideoverViewController.prototype.dismiss = function() {
    if(this.dismissHandler != undefined) {
        this.dismissHandler();
    }
    if(this.mask != undefined) {
        this.mask.remove();
    }
    var self = this;
    new StyleAnimation(this.container, "right", {finishValue: -this.container.clientWidth, method: FunctionalAnimation.methods.easeOut}).start().finish(function() {
        self.container.remove();
    });
}

/**
 * @ignore
 */
function bindData(data, element) {
    if(data == null) return null;

    function getValue(data, dataKey, dataHandler) {
        var value;
        if(dataKey.includes(".")) {
            var target = data;
            var keyList = dataKey.split(".");
            for(var i=0; i<keyList.length; i++) {
                var key = keyList[i];
                if(target != null) {
                    target = target[key];
                }
            }
            value = target;
        }else {
            value = data[dataKey];
        }
        value = value !== undefined ? value : null;
        if(dataHandler != null) {
            value = dataHandler(value);
        }
        return value;
    }
    function setValue(data, dataKey, value, dataHandler) {
        value = value !== undefined ? value : null;
        if(dataHandler != null) {
            value = dataHandler(value);
        }
        if(dataKey.includes(".")) {
            var target = data;
            var keyList = dataKey.split(".");
            for(var i=0; i<keyList.length-1; i++) {
                var key = keyList[i];
                if(target != null) {
                    target = target[key];
                }
            }
            var lastKey = keyList[keyList.length-1];
            target[lastKey] = value;
        }else {
            data[dataKey] = value;
        }
    }

    var i;

    var inputElements = element.querySelectorAll("input,textarea,select");
    for(i=0; i<inputElements.length; i++) {
        var inputElement = inputElements[i];
        if(inputElement.dataKey != null) {
            inputElement.value = getValue(data, inputElement.dataKey, inputElement.dataHandler);
            // autocomplete support
            inputElement.addEventListener("input", function(event) {
                var inputElement = event.currentTarget;
                setValue(data, inputElement.dataKey, inputElement.value, inputElement.dataHandler);
            });
            // general input completion
            inputElement.addEventListener("blur", function(event) {
                var inputElement = event.currentTarget;
                setValue(data, inputElement.dataKey, inputElement.value, inputElement.dataHandler);
            });
        }
    }

    var dateElements = element.querySelectorAll("._hardcore-date");
    for(i=0; i<dateElements.length; i++) {
        var dateElement = dateElements[i];
        if(dateElement.dataKey != null) {
            dateElement.value = getValue(data, dateElement.dataKey, dateElement.dataHandler);
            dateElement.dataBindHandler = function(value, dataKey) {
                setValue(data, dataKey, value);
            };
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
            var selectedValue = getValue(data, dataKey);
            var selectedIndex = -1;
            for(var j=0; j<items.length; j++) {
                var item = items[j];
                if(item[valueKey] == selectedValue) {
                    selectedIndex = j;
                    break;
                }
            }
            selectElement.selectedIndex = selectedIndex;
        }
        if(selectElement.dataKey != null) {
            selectElement.dataBindHandler = function(selectedIndex, _element) {
                if(_element.items != null && selectedIndex < _element.items.length) {
                    var selectedItem = _element.items[selectedIndex];
                    if(selectedItem != null && typeof selectedItem == "object") {
                        setValue(data, _element.dataKey, selectedItem[_element.valueKey]);
                    }
                }
            };
        }
    }

    var sliderElements = element.querySelectorAll("._hardcore-slider");
    for(i=0; i<sliderElements.length; i++) {
        var sliderElement = sliderElements[i];
        if(sliderElement.dataKey != null) {
            sliderElement.value = getValue(data, sliderElement.dataKey);
            sliderElement.dataBindHandler = function(value, dataKey) {
                setValue(data, dataKey, value);
            };
        }
    }

    var checkboxElements = element.querySelectorAll("._hardcore-checkbox");
    for(i=0; i<checkboxElements.length; i++) {
        var checkboxElement = checkboxElements[i];
        if(checkboxElement.dataKey != null) {
            checkboxElement.checked = getValue(data, checkboxElement.dataKey);
            checkboxElement.dataBindHandler = function(value, dataKey) {
                setValue(data, dataKey, value);
            };
        }
    }
    
    var tableElements = element.querySelectorAll("._hardcore-table");
    for(i=0; i<tableElements.length; i++) {
        var tableElement = tableElements[i];
        if(tableElement.dataKey != null) {
            // replace the table biding data with proxy object.
            if(tableElement.dataKey == ".") {
                tableElement.data = data;
                data = tableElement.data;
            }else {
                tableElement.data = getValue(data, tableElement.dataKey);
                setValue(data, tableElement.dataKey, tableElement.data);
            }
        }
    }
    
    var displayElements = element.querySelectorAll("._hardcore-label");
    for(i=0; i<displayElements.length; i++) {
        var displayElement = displayElements[i];
        if(displayElement.dataKey != null) {
            var value = getValue(data, displayElement.dataKey);
            if(displayElement.dataHandler != null) {
                displayElement.dataHandler(displayElement, value);
            }else {
                displayElement.innerText = value;
            }
        }
    }

    return data;
}


////////////////////////////////////// HTML Structures //////////////////////////////////////

/**
 * Create HTML element.
 * @param {string} tagName 
 * @param {string} [identifier] element ID (If CSS selector prefix is not included, register it as CSS class.)
 * @param {Object} [attributes] 
 * @param {Object} [attributes.style] 
 * @param {Object|Array} [attributes.data] 
 * @param {function(UIEvent): void} [attributes.tapHandler] 
 * @param {number} [attributes.width] 
 * @param {number} [attributes.height] 
 * @param {left|center|right} [attributes.contentsAlign] 
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
            "background-color": "transparent",
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
            }else if(key == "width" || key == "height") {
                if(typeof value == "number") {
                    element.style.setProperty(key, value+"px");
                }else if(typeof value == "string") {
                    element.style.setProperty(key, value);
                }
            }else if(key == "margin" || key == "padding") {
                if(typeof value == "number") {
                    element.style.setProperty(key, value+"px");
                }else if(typeof value == "string") {
                    element.style.setProperty(key, value);
                }else if(Array.isArray(value)) {
                    var expression = "";
                    for(var j=0; j<value.length; j++) {
                        if(j > 0) {
                            expression += " ";
                        }
                        if(typeof value == "number") {
                            expression += value+"px";
                        }else if(typeof value == "string") {
                            expression += value;
                        }
                    }
                    element.style.setProperty(key, expression);
                }
            }else if(key == "contentsAlign" && typeof value == "string") {
                element.style.setProperty("text-align", value);
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
    if(data != null) {
        Object.defineProperty(element, "data", {
            configurable: true,
            get: function() {
                return this.bindingData;
            },
            set: function(newValue) {
                this.bindingData = bindData(newValue, this);
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
 * @param {string} [dataKey] The key for object set in the ViewController or parent View. 
 * @param {function(HTMLDivElement, any): void} [dataHandler] Use this callback if you want to set data directly in a element.
 * @param {HTMLDivElement} dataHandler.element
 * @param {*} dataHandler.value
 * @param {Array} [children] 
 * @returns {HTMLDivElement}
 */
function View() {
    var _arguments = Array.prototype.slice.call(arguments);

    var dataKey;
    var dataHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }else if(key == "dataHandler" && typeof argument[key] == "function") {
                    dataHandler = argument[key];
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
        element.classList.add("_hardcore-label");
    }
    if(dataHandler != undefined) {
        element.dataHandler = dataHandler;
    }

    return element;
}

/**
 * Create INPUT element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {boolean} [attributes.leaveWithEnter] Element applies the edited contents by ENTER key.
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @returns {HTMLInputElement}
 */
function Input() {
    var _arguments = Array.prototype.slice.call(arguments);

    var leaveWithEnter = true;
    var dataKey;
    var dataHandler;
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
                }else if(key == "dataHandler" && typeof argument[key] == "function") {
                    dataHandler = argument[key];
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

    if(dataHandler != null) {
        element.dataHandler = dataHandler;
    }

    return element;
}

/**
 * Create INPUT type=text element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @param {string} [attributes.label] Labeling by InputContainer
 * @param {string} [attributes.changeHandler]
 * @param {string} [attributes.inputHandler]
 * @returns {HTMLInputElement|HTMLDivElement}
 */
function TextField() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label;
    var changeHandler;
    var inputHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }else if(key == "changeHandler" && typeof argument[key] == "function") {
                    changeHandler = argument[key];
                    delete argument[key];
                }else if(key == "inputHandler" && typeof argument[key] == "function") {
                    inputHandler = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    var element;
    if(label == null) {
        _arguments.splice(0, 0, "text");
        element = Input.apply(this, _arguments);
        if(changeHandler != undefined) {
            element.addEventListener("change", changeHandler);
        }
        if(inputHandler != undefined) {
            element.addEventListener("input", inputHandler);
        }
        return element;
    }else {
        _arguments.splice(0, 0, "text");
        element = Input.apply(this, _arguments);
        if(changeHandler != undefined) {
            element.addEventListener("change", changeHandler);
        }
        if(inputHandler != undefined) {
            element.addEventListener("input", inputHandler);
        }
        var inputComposite = InputComposite({label: label}, [element]);
        return inputComposite;
    }
}

/**
 * Create TEXTAREA element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @param {string} [attributes.label] Labeling by InputContainer
 * @param {string} [attributes.changeHandler]
 * @param {string} [attributes.inputHandler]
 * @returns {HTMLTextAreaElement}
 */
function TextArea() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label;
    var dataKey;
    var changeHandler;
    var inputHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }else if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }else if(key == "changeHandler" && typeof argument[key] == "function") {
                    changeHandler = argument[key];
                    delete argument[key];
                }else if(key == "inputHandler" && typeof argument[key] == "function") {
                    inputHandler = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    var element;
    if(label == null) {
        _arguments.splice(0, 0, "textarea");
        element = HtmlTag.apply(this, _arguments);
        if(dataKey != undefined) {
            element.dataKey = dataKey;
        }
        if(changeHandler != undefined) {
            element.addEventListener("change", changeHandler);
        }
        if(inputHandler != undefined) {
            element.addEventListener("input", inputHandler);
        }
        return element;
    }else {
        _arguments.splice(0, 0, "textarea");
        element = HtmlTag.apply(this, _arguments);
        if(dataKey != undefined) {
            element.dataKey = dataKey;
        }
        if(changeHandler != undefined) {
            element.addEventListener("change", changeHandler);
        }
        if(inputHandler != undefined) {
            element.addEventListener("input", inputHandler);
        }
        var inputComposite = InputComposite({label: label}, [element]);
        return inputComposite;
    }
}

/**
 * Create INPUT type=password element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @returns {HTMLInputElement}
 */
function PasswordField() {
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
        _arguments.splice(0, 0, "password");
        return Input.apply(this, _arguments);
    }else {
        _arguments.splice(0, 0, "password");
        var element = Input.apply(this, _arguments);
        var inputComposite = InputComposite({label: label}, [element]);
        return inputComposite;
    }
}

/**
 * Create INPUT type=mail element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @returns {HTMLInputElement}
 */
function MailField() {
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
        _arguments.splice(0, 0, "email");
        return Input.apply(this, _arguments);
    }else {
        _arguments.splice(0, 0, "email");
        var element = Input.apply(this, _arguments);
        var inputComposite = InputComposite({label: label}, [element]);
        return inputComposite;
    }
}

/**
 * Create input field for a date/time value element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @param {date|time|datetime} [attributes.type] 
 * @param {string} [attributes.format] 
 * @param {string} [attributes.color] 
 * @param {string} [attributes.weekendColor] 
 * @param {string} [attributes.indicatorColor] 
 * @param {boolean} [settings.removable=true] 
 * @param {boolean} [settings.editable=true] 
 * @param {function(Date): void} [settings.editingEndHandler]
 * @param {string} [attributes.placeholder] 
 * @param {number} [attributes.zIndex] 
 * @returns {HTMLInputElement}
 */
function DateField() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label;
    var type = "date";
    var format = "yyyy/M/d";
    var dataKey;
    var dataHandler;
    var editingEndHandler;
    var color = "black";
    var weekendColor;
    var indicatorColor = "darkgray";
    var removable = true;
    var editable = true;
    var placeholder;
    var style;
    var placeholderStyle;
    var zIndex = 0;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }else if(key == "type" && typeof argument[key] == "string") {
                    type = argument[key];
                    delete argument[key];
                }else if(key == "format" && typeof argument[key] == "string") {
                    format = argument[key];
                    delete argument[key];
                }else if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }else if(key == "dataHandler" && typeof argument[key] == "function") {
                    dataHandler = argument[key];
                    delete argument[key];
                }else if(key == "editingEndHandler" && typeof argument[key] == "function") {
                    editingEndHandler = argument[key];
                    delete argument[key];
                }else if(key == "color" && typeof argument[key] == "string") {
                    color = argument[key];
                    delete argument[key];
                }else if(key == "weekendColor" && typeof argument[key] == "string") {
                    weekendColor = argument[key];
                    delete argument[key];
                }else if(key == "indicatorColor" && typeof argument[key] == "string") {
                    indicatorColor = argument[key];
                    delete argument[key];
                }else if(key == "removable" && typeof argument[key] == "boolean") {
                    removable = argument[key];
                    delete argument[key];
                }else if(key == "editable" && typeof argument[key] == "boolean") {
                    editable = argument[key];
                    delete argument[key];
                }else if(key == "style" && typeof argument[key] == "object") {
                    style = argument[key];
                    delete argument[key];
                }else if(key == "placeholderStyle" && typeof argument[key] == "object") {
                    placeholderStyle = argument[key];
                    delete argument[key];
                }else if(key == "placeholder" && typeof argument[key] == "string") {
                    placeholder = argument[key];
                    delete argument[key];
                }else if(key == "zIndex" && typeof argument[key] == "number") {
                    zIndex = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    var element = View.apply(this, _arguments);
    
    element.styles = {
        height:32, 
        "line-height":32,
        cursor: "default",
        display: "inline-block"
    }
    if(style != null) {
        element.styles = style;
    }
    if(placeholderStyle != null) {
        element.styles = placeholderStyle;
    }
    if(placeholder != null) {
        element.innerText = placeholder;
    }

    if(dataKey != null) {
        element.dataKey = dataKey;
        element.classList.add("_hardcore-date");
    }
    if(dataHandler != null) {
        element.dataHandler = function(value) {
            if(value == null) {
                if(placeholderStyle != null) {
                    element.styles = placeholderStyle;
                }
            }else {
                if(style != null) {
                    element.styles = style;
                }
            }
            element.innerText = formatDate(value);
            return dataHandler(value);
        };
    }else {
        element.dataHandler = function(value) {
            if(value == null) {
                if(placeholderStyle != null) {
                    element.styles = placeholderStyle;
                }
            }else {
                if(style != null) {
                    element.styles = style;
                }
            }
            element.innerText = formatDate(value);
            return value;
        };
    }
    
    element.editable = editable;

    Object.defineProperty(element, "value", { 
        get: function() {
            return this._value !== undefined ? this._value : null;
        },
        set: function(newValue) {
            var value;
            if(typeof newValue == "number") {
                value = new Date(newValue);
            }else if(typeof newValue == "string") {
                value = DateUtil.parse(newValue, format);
            }else if(newValue instanceof Date) {
                value = newValue;
            }
            this._value = value;
        }
    });

    function formatDate(value) {
        var expression = "";
        if(value == null) {
            if(placeholder != null) {
                expression = placeholder;
            }
        }else if(typeof value == "number") {
            expression = DateUtil.format(new Date(value), format);
        }else if(value instanceof Date) {
            expression = DateUtil.format(value, format);
        }
        return expression;
    }

    var width = 240;
    var height = 144;

    var daySize = Size(Math.floor(width/7), Math.floor(height/6));
        
    function loadMonth(element, container, year, monthIndex, selectable, now, selectedDate) {
        var header = container.querySelector(".header > .title");
        header.innerText = year + "年" + (monthIndex+1) + "月";
        var days = container.querySelectorAll(".day");
        for(var i=0; i<days.length; i++) {
            days[i].remove();
        }
        var day = new Date(year, monthIndex, 1);
        var weekView;
        while(day.getMonth() == monthIndex) {
            var dayOfWeek = day.getDay();
            if(weekView == null) {
                weekView = View();
                for(var j=0; j<dayOfWeek; j++) {
                    var _dayView = View(".day", {style:{
                        display: "inline-block",
                        "vertical-align": "top",
                        width: daySize.width,
                        height: daySize.height
                    }});
                    weekView.appendChild(_dayView);
                }
                container.appendChild(weekView);
            }else if(dayOfWeek == 0) {
                weekView = View();
                container.appendChild(weekView);
            }
            var contents = [];
            if(now != null && day.getTime() == now.getTime()) {
                var nowView = Canvas({width: daySize.width, height: daySize.height});
                var context = nowView.getContext("2d");
                var center = Point(daySize.width/2, daySize.height/2);
                context.arc(center.x, center.y, Math.min(center.x, center.y), 0, 2*Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.fillStyle = "white";
                context.textBaseline = "middle";
                context.textAlign = "center";
                context.fillText(day.getDate(), center.x, center.y);
                contents.push(nowView);
            }else {
                contents.push(day.getDate());
            }
            if(selectedDate != null && day.getTime() == selectedDate.getTime()) {
                var indicatorView = createCalendarIndicator();
                contents.push(indicatorView);
            }
            var dayView = View(".day", {style:{
                position: "relative",
                "text-align": "center",
                display: "inline-block",
                "line-height": daySize.height,
                "vertical-align": "top",
                "user-select": "none",
                width: daySize.width,
                height: daySize.height,
                color: ((weekendColor != null && (dayOfWeek == 0 || dayOfWeek == 6)) ? weekendColor : color)
            }}, contents);
            if(selectable) {
                dayView.addEventListener("click", function(event) {
                    var dayElement = event.currentTarget;
                    var date = dayElement.value;
                    if(date != null) {
                        element.value = date;
                        element.innerText = formatDate(date);
                        if(dataKey != null) {
                            element.dataBindHandler(date, dataKey);
                        }

                        var nodeList = container.querySelectorAll(".indicator");
                        nodeList.forEach(function(node) {
                            node.remove();
                        });
                        var indicatorView = createCalendarIndicator();
                        dayElement.appendChild(indicatorView);
                    }
                });
                dayView.value = day;
            }
            weekView.appendChild(dayView);
            day = DateUtil.getDateByAdding(day, 1);
        }
    }

    function createCalendarIndicator() {
        var indicatorView = Canvas(".indicator", {width: daySize.width, height: daySize.height, drawer: function(context, size) {
            var center = Point(size.width/2, size.height/2);
            context.arc(center.x, center.y, Math.min(center.x, center.y), 0, 2*Math.PI, false);
            context.strokeStyle = indicatorColor;
            context.lineWidth = 1;
            context.stroke();
        }});
        indicatorView.styles = {
            position: "absolute",
            "left": "0px",
            "top": "0px",
            "pointer-events": "none"
        };
        return indicatorView;
    }

    function createCalendar(element) {
        var container = View({style:{
            width: width, 
            "overflow-x": "hidden", 
            "cursor": "default", 
            "overscroll-behavior-x": "none"
        }});

        var calendarContainer = View({style:{width: width, "white-space":"nowrap"}});
        container.appendChild(calendarContainer);

        var now = DateUtil.getDateBySlicingTime(new Date());
        var nowYear = now.getFullYear();
        var nowMonthIndex = now.getMonth();

        var selectedDate = element.value;
        if(selectedDate == null) {
            selectedDate = DateUtil.getDateBySlicingTime(new Date());
        }
        var year = selectedDate.getFullYear();
        var monthIndex = selectedDate.getMonth();

        var _year = year;
        var _monthIndex = monthIndex;
        if(_monthIndex > 0) {
            _monthIndex -= 1;
        }else {
            _year -= 1;
            _monthIndex = 11;
        }
        for(var i=0; i<3; i++) {
            var calendar = View(".month", {style: {
                width: width, 
                "display": "inline-block", 
                "vertical-align": "top"
            }}, [
                View(".header", {style:{"text-align": "center"}}, [
                    Canvas({width:32, height:32, style: {"vertical-align": "middle"}, drawer: function(context, size) {
                        var iconSize = Size(4,8);
                        context.beginPath();
                        context.moveTo(size.width/2 + iconSize.width/2, size.height/2 - iconSize.height/2);
                        context.lineTo(size.width/2 - iconSize.width/2, size.height/2);
                        context.lineTo(size.width/2 + iconSize.width/2, size.height/2 + iconSize.height/2);
                        context.strokeStyle = color;
                        context.lineCap = "round";
                        context.lineWidth = 1;
                        context.stroke();
                    }, tapHandler: function() {
                        backwardMonth();
                    }}),
                    View(".title", {width:"calc(100% - 64px)", height:32, style: {
                        display: "inline-block", 
                        "vertical-align": "middle",
                        "line-height": 32,
                        color: color
                    }}),
                    Canvas({width:32, height:32, style: {"vertical-align": "middle"}, drawer: function(context, size) {
                        var iconSize = Size(4,8);
                        context.beginPath();
                        context.moveTo(size.width/2 - iconSize.width/2, size.height/2 - iconSize.height/2);
                        context.lineTo(size.width/2 + iconSize.width/2, size.height/2);
                        context.lineTo(size.width/2 - iconSize.width/2, size.height/2 + iconSize.height/2);
                        context.strokeStyle = color;
                        context.lineCap = "round";
                        context.lineWidth = 1;
                        context.stroke();
                    }, tapHandler: function() {
                        forwardMonth();
                    }})
                ])
            ]);
            calendarContainer.appendChild(calendar);
            
            loadMonth(element, calendar, _year, _monthIndex, i==1, (nowYear == _year && nowMonthIndex == _monthIndex ? now : null), selectedDate);

            if(_monthIndex < 11) {
                _monthIndex += 1;
            }else {
                _year += 1;
                _monthIndex = 0;
            }
        }

        function reloadCalendars(element) {
            var _year = year;
            var _monthIndex = monthIndex;
            if(_monthIndex > 0) {
                _monthIndex -= 1;
            }else {
                _year -= 1;
                _monthIndex = 11;
            }
            
            var selectedDate = element.value;

            var nodeList = calendarContainer.querySelectorAll(".indicator");
            nodeList.forEach(function(node) {
                node.remove();
            });

            var calendars = calendarContainer.querySelectorAll(".month");
            for(var i=0; i<3; i++) {
                loadMonth(element, calendars[i], _year, _monthIndex, i==1, (nowYear == _year && nowMonthIndex == _monthIndex ? now : null), selectedDate);

                if(_monthIndex < 11) {
                    _monthIndex += 1;
                }else {
                    _year += 1;
                    _monthIndex = 0;
                }
            }
        }

        function backwardMonth() {
            container.scrolling = true;
            new FunctionalAnimation(function(progress) {
                container.scrollLeft = (1-progress)*width;
            }, FunctionalAnimation.methods.easeOut, 500).start().finish(function() {
                if(monthIndex > 0) {
                    monthIndex -= 1;
                }else {
                    year -= 1;
                    monthIndex = 11;
                }
                reloadCalendars(element);
                container.scrollLeft = width;

                container.scrolling = false;
            });
        }

        function forwardMonth() {
            container.scrolling = true;
            new FunctionalAnimation(function(progress) {
                container.scrollLeft = width+progress*width;
            }, FunctionalAnimation.methods.easeOut, 500).start().finish(function() {
                if(monthIndex < 11) {
                    monthIndex += 1;
                }else {
                    year += 1;
                    monthIndex = 0;
                }
                reloadCalendars(element);
                container.scrollLeft = width;

                container.scrolling = false;
            });
        }

        UIEventUtil.handleTouch(container, {
            touchBegan: function(event, context) {
                context.beginLocation = UIEventUtil.getLocation(event);
            }, 
            touchMove: function(event, context) {
                if(context == null || context.beginLocation == null || container.scrolling) {
                    return;
                }
                var currentLocation = UIEventUtil.getLocation(event);
                if(currentLocation.x - context.beginLocation.x > 40) {
                    backwardMonth();
                    return false;
                }else if(currentLocation.x - context.beginLocation.x < -40) {
                    forwardMonth();
                    return false;
                }
            }
        });
        
        return container;
    }

    function createTimePicker(element) {
        var container = View({style: {"overflow": "hidden"}});

        var indicator = Canvas({width: daySize.width*2, height: daySize.height, style:{
            position: "absolute",
            "pointer-events": "none"
        }});
        var context = indicator.getContext("2d");
        DrawUtil.drawRoundRect(context, Rect(5,1,daySize.width*2-6,daySize.height-2), indicatorColor, 4, true);
        container.appendChild(indicator);

        var hourView = View({style: {
            "display": "inline-block", 
            "overflow": "hidden",
            width: daySize.width,
            height: height,
            "vertical-align": "top"
        }});
        var minutesView = View({style: {
            "display": "inline-block", 
            "overflow": "hidden",
            width: daySize.width,
            height: height,
            "vertical-align": "top"
        }});
        for(var hour=0; hour<24; hour++) {
            hourView.appendChild(View({style: {
                "text-align": "right",
                "line-height": daySize.height,
                "user-select": "none",
                color: color,
                padding: [0,4]
            }}, [hour]));
        }
        for(hour=0; hour<5; hour++) {
            hourView.appendChild(View({style: {
                height: daySize.height
            }}));
        }
        for(var minute=0; minute<59; minute++) {
            minutesView.appendChild(View({style: {
                "text-align": "right",
                "line-height": daySize.height,
                "user-select": "none",
                color: color,
                padding: [0,4]
            }}, [minute]));
        }
        for(minute=0; minute<5; minute++) {
            minutesView.appendChild(View({style: {
                height: daySize.height
            }}));
        }
        container.appendChild(hourView);
        container.appendChild(minutesView);

        setupTouch(hourView, function(updatedValue) {
            setValue(element, updatedValue);
        });
        setupTouch(minutesView, function(updatedValue) {
            setValue(element, null, updatedValue);
        });

        var selectedDate = element.value;
        if(element.value == null) {
            selectedDate = new Date();
        }
        var hours = selectedDate.getHours();
        if(ResizeObserver !== undefined) {
            var resizeObserver = new ResizeObserver(function(observations) {
                if(observations.length == 0) return;
                var hourView = observations[0].target;
                resizeObserver.disconnect();
                hourView.scrollTop = daySize.height * hours;
            });
            resizeObserver.observe(hourView);
        }else {
            setTimeout(function() {
                hourView.scrollTop = daySize.height * hours;
            },0);
        }

        function setupTouch(container, updateHandler) {
            UIEventUtil.handleTouch(container, {
                touchBegan: function(event, context) {
                    context.beginLocation = UIEventUtil.getLocation(event);
                    context.beginOffsetTop = container.scrollTop;
                }, 
                touchMove: function(event, context) {
                    if(context == null || context.beginLocation == null || context.beginOffsetTop == null || container.scrolling) {
                        return;
                    }
                    var currentLocation = UIEventUtil.getLocation(event);
                    var distance = context.beginLocation.y - currentLocation.y;
                    container.scrollTop = context.beginOffsetTop + distance;
                },
                touchEnd: function(event, context) {
                    if(context == null || context.beginLocation == null || context.beginOffsetTop == null || container.scrolling) {
                        return;
                    }
                    var y = container.scrollTop;
                    var distance = y % daySize.height;
                    if(distance > 0) {
                        container.scrolling = true;
                        new FunctionalAnimation(function(progress) {
                            container.scrollTop = y-distance*progress;
                        }, FunctionalAnimation.methods.easeOut, 500).start().finish(function() {
                            updateHandler(container.scrollTop / daySize.height);
                            container.scrolling = false;
                        });
                    }else {
                        updateHandler(container.scrollTop / daySize.height);
                    }
                }
            });
        }

        function setValue(element, hours, minutes) {
            var date = element.value;
            if(date != null) {
                if(hours != null) {
                    date.setHours(hours);
                }
                if(minutes != null) {
                    date.setMinutes(minutes);
                }
                element.value = date;
                element.innerText = formatDate(date);
                if(dataKey != null) {
                    element.dataBindHandler(date, dataKey);
                }
            }
        }

        return container;
    }

    element.addEventListener("click", function(event) {
        var element = event.currentTarget;
        if(!element.editable) return;
        var content;
        if(type == "date") {
            content = createCalendar(element);
        }else if(type == "time") {
            content = createTimePicker(element);
        }else {
            content = View({style: {"white-space":"nowrap"}});
            var calendar = createCalendar(element);
            calendar.style.setProperty("display", "inline-block");
            calendar.style.setProperty("vertical-align", "top");
            content.appendChild(calendar);
            var timePicker = createTimePicker(element);
            timePicker.style.setProperty("display", "inline-block");
            timePicker.style.setProperty("vertical-align", "top");
            timePicker.style.setProperty("width", (daySize.width*2)+"px");
            timePicker.style.setProperty("height", height+"px");
            timePicker.style.setProperty("border-left", "1px solid darkgray");
            content.appendChild(timePicker);
        }
        var offset = element.offset();
        var scrollOffset = HtmlElementUtil.scrollOffset(element);
        Controls.Balloon(content, {
            location: Point(offset.left, offset.top+element.clientHeight-scrollOffset.y), 
            direction: "top", 
            shadow: true, 
            zIndex: zIndex,
            loadHandler: function(balloon, settings) {
                var location = Point(offset.left+element.clientWidth/2-balloon.offsetWidth/2, offset.top+element.clientHeight-scrollOffset.y);
                var tipOffset = balloon.offsetWidth/2;
                if(location.x < 0) {
                    tipOffset = -location.x;
                    location.x = 0;
                }
                if(location.y+balloon.offsetHeight > window.innerHeight) {
                    settings.direction = "bottom";
                    location.y = offset.top-balloon.offsetHeight-scrollOffset.y;
                }
                settings.tipOffset = tipOffset;
                settings.location = location;
                if(type == "date") {
                    content.scrollLeft = width;
                }else if(type == "datetime") {
                    calendar.scrollLeft = width;
                }
                return settings;
            },
            dismissHandler: function() {
                if(editingEndHandler != null) {
                    editingEndHandler(element.value);
                }
            }
        });
    });

    element.addEventListener("keydown", function(event) {
        if(event.code == "Space") {
            this.dispatchEvent(new MouseEvent("click"));
            event.preventDefault();
        }
    });

    if(label == null) {
        return element;
    }else {
        var inputComposite = InputComposite({label: label}, [element]);

        if(removable) {
            element.style.width = "calc(100% - 32px)";
            element.style.verticalAlign = "middle";
            var removeButton = Canvas({width:32, height:32, drawer: function(context, size) {
                var iconSize = 8;
                context.beginPath();
                context.moveTo(size.width/2 - iconSize/2, size.height/2 - iconSize/2);
                context.lineTo(size.width/2 + iconSize/2, size.height/2 + iconSize/2);
                context.moveTo(size.width/2 + iconSize/2, size.height/2 - iconSize/2);
                context.lineTo(size.width/2 - iconSize/2, size.height/2 + iconSize/2);
                context.lineWidth = 1;
                context.lineCap = "round";
                context.strokeStyle = "darkgray";
                context.stroke();
            }});
            removeButton.styles = {
                position: "relative",
                "vertical-align": "middle"
            };
            removeButton.addEventListener("click", function() {
                element.value = null;
                element.innerText = "";
                if(dataKey != null) {
                    element.dataBindHandler(null, dataKey);
                }
            });
            inputComposite.appendChild(removeButton);
        }

        return inputComposite;
    }
}

/**
 * Create INPUT type=time element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [attributes.dataKey] The key for object set in the ViewController or parent View. 
 * @returns {HTMLInputElement}
 */
function TimeField() {
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
        _arguments.splice(0, 0, "time");
        return Input.apply(this, _arguments);
    }else {
        _arguments.splice(0, 0, "time");
        var element = Input.apply(this, _arguments);
        var inputComposite = InputComposite({label: label}, [element]);
        return inputComposite;
    }
}

/**
 * Create INPUT type=file element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @returns {HTMLInputElement}
 */
function FileSelector() {
    var _arguments = Array.prototype.slice.call(arguments);

    var changeHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "changeHandler" && typeof argument[key] == "function") {
                    changeHandler = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    _arguments.splice(0, 0, "file");
    var element = Input.apply(this, _arguments);

    if(changeHandler != null) {
        element.addEventListener("change", changeHandler);
    }

    return element;
}

/**
 * @typedef {Object} TableColumnDefinition
 * @property {string} [label] Label of table header
 * @property {number} [width] Column width
 * @property {Object} [style] Column styles
 * @property {Object} [class] Column CSS class
 * @property {string} [dataKey] The key for each record of the Array object set in the Table.
 * @property {function(HTMLTableCellElement, any, any): void} [dataHandler] Use this callback if you want to set data directly in a cell.
 * @param {HTMLTableCellElement} dataHandler.cell
 * @param {*} dataHandler.value
 * @param {*} dataHandler.record
 */

/**
 * Create TABLE element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {Array.<TableColumnDefinition>} [attributes.data] 
 * @param {Array.<TableColumnDefinition>} [attributes.dataKey] The key for object set in the ViewController or parent View. "." points to the root of the data set in the ViewController or parent View.
 * @param {Array.<TableColumnDefinition>} [attributes.columns] 
 * @param {function(any, number, HTMLTableRowElement): void} [attributes.tapHandler] Select a row handler. The first argument is the selected row data.
 * @param {number} [attributes.rowHeight]
 * @param {boolean} [attributes.animate=false]
 * @param {Object} [attributes.sort]
 * @param {Object} [attributes.sort.defaultHeaderCellStyle]
 * @param {Object} [attributes.sort.upperSortHeaderCellStyle]
 * @param {Object} [attributes.sort.lowerSortHeaderCellStyle]
 * @param {string} [attributes.sort.defaultSortDataKey]
 * @param {Object} [attributes.headerStyle]
 * @param {boolean} [attributes.rowBorder=true]
 * @param {string} [attributes.rowBorderStyle]
 * @param {boolean} [attributes.rowHighlight=true]
 * @param {string} [attributes.rowHighlightStyle]
 * @param {function(HTMLTableRowElement, any)} [attributes.rowHandler]
 * @param {Array} [children] 
 * @returns {HTMLTableElement}
 */
function Table() {
    var _arguments = Array.prototype.slice.call(arguments);

    var data;
    var dataKey;
    var columns;
    var rowHeight;
    var tapHandler;
    var animate = false;
    var sort;
    var headerStyle = {
        "color": "gray",
        "font-size": "small",
        "height": "20px",
        "line-height": "20px",
        "user-select": "none"
    };
    var rowBorderStyle = "1px solid darkgray";
    var rowHighlightStyle = "whitesmoke";
    var rowHandler;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "data" && Array.isArray(argument[key])) {
                    data = argument[key];
                    delete argument[key];
                }else if(key == "dataKey" && typeof argument[key] == "string") {
                    dataKey = argument[key];
                    delete argument[key];
                }else if(key == "columns" && Array.isArray(argument[key])) {
                    columns = argument[key];
                    delete argument[key];
                }else if(key == "rowHeight" && typeof argument[key] == "number") {
                    rowHeight = argument[key];
                    delete argument[key];
                }else if(key == "tapHandler" && typeof argument[key] == "function") {
                    tapHandler = argument[key];
                    delete argument[key];
                }else if(key == "animate" && typeof argument[key] == "boolean") {
                    animate = argument[key];
                    delete argument[key];
                }else if(key == "sort" && typeof argument[key] == "object") {
                    sort = argument[key];
                    delete argument[key];
                }else if(key == "headerStyle" && typeof argument[key] == "object") {
                    headerStyle = argument[key];
                    delete argument[key];
                }else if(key == "rowBorder" && typeof argument[key] == "boolean") {
                    if(!argument[key]) {
                        rowBorderStyle = undefined;
                    }
                    delete argument[key];
                }else if(key == "rowBorderStyle" && typeof argument[key] == "string") {
                    rowBorderStyle = argument[key];
                    delete argument[key];
                }else if(key == "rowHighlight" && typeof argument[key] == "boolean") {
                    if(!argument[key]) {
                        rowHighlightStyle = undefined;
                    }
                    delete argument[key];
                }else if(key == "rowHighlightStyle" && typeof argument[key] == "string") {
                    rowHighlightStyle = argument[key];
                    delete argument[key];
                }else if(key == "rowHandler" && typeof argument[key] == "function") {
                    rowHandler = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    _arguments.splice(0, 0, "table");
    var element = HtmlTag.apply(this, _arguments);
    element.style.setProperty("display", "block");

    if(dataKey != null) {
        element.dataKey = dataKey;
        element.classList.add("_hardcore-table");
    }

    element.animate = animate;

    // header
    if(columns != undefined) {
        var header = TableHeader();
        var row = TableRow();
        row.style.setProperty("cursor", "default");
        if(headerStyle != undefined) {
            row.defineStyles(headerStyle);
        }
        if(rowBorderStyle != undefined) {
            row.style.setProperty("border-bottom", rowBorderStyle);
        }
        for(i=0; i<columns.length; i++) {
            var column = columns[i];
            var cell = TableCell();
            if(column.label != undefined) {
                cell.innerText = column.label;
            }
            if(column.width != undefined) {
                if(column.style != undefined) {
                    column.style["width"] = column.width+"px";
                }
            }
            if(column.style != undefined) {
                cell.defineStyles(column.style);
            }
            if(sort != null) {
                setupSorting(cell, sort);
            }
            row.appendChild(cell);
        }
        header.append(row);
        element.append(header);
    }

    function setupSorting(cell, sort) {
        if(sort.defaultHeaderCellStyle != null) {
            cell.styles = sort.defaultHeaderCellStyle;
        }
        cell.addEventListener("click", function(event) {
            var cell = event.currentTarget;
            if(cell.classList.contains("_sort_u")) {
                cell.classList.remove("_sort_u");
            }else if(cell.classList.contains("_sort_l")) {
                cell.classList.remove("_sort_l");
                cell.classList.add("_sort_u");
            }else {
                cell.classList.add("_sort_l");
            }
            var cells = row.querySelectorAll("td");
            var cellIndex = cells.indexOf(cell);
            for(var i=0; i<cells.length; i++) {
                var _cell = cells[i];
                if(i == cellIndex) continue;
                _cell.classList.remove("_sort_u");
                _cell.classList.remove("_sort_l");
            }
            var dataKey = columns[cellIndex]["dataKey"];
            var upperSort = false;
            if(cell.classList.contains("_sort_u")) {
                upperSort = true;
                if(sort.upperSortHeaderCellStyle != null) {
                    cell.styles = sort.upperSortHeaderCellStyle;
                }
            }else if(cell.classList.contains("_sort_l")) {
                upperSort = false;
                if(sort.lowerSortHeaderCellStyle != null) {
                    cell.styles = sort.lowerSortHeaderCellStyle;
                }
            }else {
                dataKey = sort.defaultSortDataKey;
                upperSort = false;
                if(sort.defaultHeaderCellStyle != null) {
                    cell.styles = sort.defaultHeaderCellStyle;
                }
            }
            if(dataKey == null) return;
            var data = element.data;
            if(data == null) return;
            data.sort(function(record1, record2) {
                var value1 = record1[dataKey];
                var value2 = record2[dataKey];
                if(value1 != null) {
                    if(value2 != null) {
                        if(upperSort) {
                            return value1 < value2 ? -1 : (value1 > value2 ? 1 : 0);
                        }else {
                            return value1 < value2 ? 1 : (value1 > value2 ? -1 : 0);
                        }
                    }else {
                        if(upperSort) {
                            return 1;
                        }else {
                            return -1;
                        }
                    }
                }else {
                    if(value2 != null) {
                        if(upperSort) {
                            return -1;
                        }else {
                            return 1;
                        }
                    }else {
                        return 0;
                    }
                }
            });
            element.data = data;
        });
    }

    // data binding
    Object.defineProperty(element, "data", { 
        get: function() {
            return this.bindingData;
        },
        set: function(newValue) {
            var element = this;
            function createRow(record, columns, tapHandler, animate) {
                var row = TableRow();
                row.style.setProperty("cursor", "pointer");
                if(rowHeight != undefined) {
                    row.style.setProperty("height", rowHeight+"px");
                    row.style.setProperty("line-height", rowHeight+"px");
                }
                if(rowBorderStyle != undefined) {
                    row.style.setProperty("border-bottom", rowBorderStyle);
                }
                if(rowHighlightStyle != undefined) {
                    row.addEventListener("mouseenter", function(event) {
                        var row = event.currentTarget;
                        row.originalBackgroundColor = row.style.getPropertyValue("background-color");
                        row.style.setProperty("background-color", rowHighlightStyle);
                    });
                    row.addEventListener("mouseleave", function(event) {
                        var row = event.currentTarget;
                        if(row.originalBackgroundColor != null) {
                            row.style.setProperty("background-color", row.originalBackgroundColor);
                            delete row.originalBackgroundColor;
                        }else {
                            row.style.setProperty("background-color", "inherit");
                        }
                    });
                }
                if(rowHandler != null) {
                    rowHandler(row, record);
                }
                function setValue(value, cell) {
                    if(value == null) {
                        // Safari bug fix
                        cell.innerHTML = "&nbsp;";
                    }else if(typeof value == "string") {
                        if(value.length == 0) {
                            // Safari bug fix
                            cell.innerHTML = "&nbsp;";
                        }else {
                            cell.innerText = value;
                        }
                    }else {
                        cell.innerText = value.toString();
                    }
                }
                if(columns != undefined) {
                    for(var i=0; i<columns.length; i++) {
                        var column = columns[i];
                        var cell = TableCell();
                        if(column.class != undefined) {
                            cell.setAttribute("class", column.class);
                        }
                        if(column.style != undefined) {
                            cell.defineStyles(column.style);
                        }
                        if(column.dataKey != null) {
                            var value = record[column.dataKey];
                            value = value !== undefined ? value : null;
                            if(column.dataHandler != null) {
                                column.dataHandler(cell, value, record);
                            }else {
                                setValue(value, cell);
                            }
                        }
                        row.appendChild(cell);
                    }
                }
                if(tapHandler != undefined) {
                    row.addEventListener("click", function(event) {
                        var row = event.currentTarget;
                        var tableBody = element.querySelector("tbody");
                        var index = tableBody.querySelectorAll("tr").indexOf(row);
                        tapHandler(data[index], index, row);
                    });
                }
                if(animate) {
                    row.style.setProperty("opacity", "0");
                    row.style.setProperty("margin-top", "16px");
                }
                return row;
            }

            var i;

            var observedArray;
            if(Array.isArray(newValue)) {
                observedArray = new ObservedArray(element, createRow, columns, tapHandler);
                for(i=0; i<newValue.length; i++) {
                    observedArray.push(newValue[i]);
                }
            }else if(newValue instanceof ObservedArray) {
                observedArray = newValue;
            }

            element.bindingData = observedArray;

            var tableHeader = element.querySelector("thead");
            var tableBody = element.querySelector("tbody");
            if(tableBody != null) {
                tableBody.remove();
            }
            if(element.bindingData != null) {
                var data = element.bindingData;
                tableBody = TableBody();
                if(ResizeObserver !== undefined) {
                    var resizeObserver = new ResizeObserver(function(observations) {
                        if(observations.length == 0) return;
                        var element = observations[0].target;
                        resizeObserver.disconnect();
                        tableBody.style.setProperty("height", (element.clientHeight-tableHeader.clientHeight)+"px");
                    });
                    resizeObserver.observe(element);
                }
                tableBody.style.setProperty("height", (this.clientHeight-tableHeader.clientHeight)+"px");
                for(i=0; i<data.length; i++) {
                    var record = data[i];
                    tableBody.appendChild(createRow(record, columns, tapHandler, element.animate));
                }
                element.appendChild(tableBody);

                var showRow;
                if(element.animate) {
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
    if(data != null) {
        element.data = data;
    }

    return element;
}

function ObservedArray(element, createRow, columns, tapHandler) {
    this.element = element;
    this.createRow = createRow;
    this.columns = columns;
    this.tapHandler = tapHandler;
}
ObservedArray.prototype = Object.create(Array.prototype);
ObservedArray.prototype.push = function(record) {
    Array.prototype.push.call(this, record);
    var container = this.element.querySelector("tbody");
    if(container == null) return;
    container.appendChild(this.createRow(record, this.columns, this.tapHandler, false));
};
ObservedArray.prototype.splice = function() {
    Array.prototype.splice.apply(this, arguments);
    var container = this.element.querySelector("tbody");
    if(container == null) return;
    var startIndex;
    var endIndex;
    var deleteCount;
    var records = [];
    var i;
    for(i=0; i<arguments.length; i++) {
        if(i == 0) {
            startIndex = arguments[i];
        }else if(i == 1) {
            deleteCount = arguments[i];
        }else {
            records.push(arguments[i]);
        }
    }
    if(startIndex == undefined) {
        return;
    }
    var rows = this.element.querySelectorAll("tbody > tr");
    if(deleteCount == undefined) {
        deleteCount = rows.length;
    }
    if(deleteCount > 0) {
        endIndex = startIndex+deleteCount;
        if(endIndex <= rows.length) {
            for(i=endIndex-1; i>=startIndex; i--) {
                rows[i].remove();
            }
        }
    }
    rows = this.element.querySelectorAll("tbody > tr");
    if(records != undefined && records.length > 0 && deleteCount == records.length) {
        endIndex = startIndex+deleteCount;
        var recordIndex = 0;
        for(i=startIndex; i<endIndex; i++) {
            var row = this.createRow(records[recordIndex++], this.columns, this.tapHandler, false);
            if(i < rows.length) {
                rows[i].insertAdjacentElement("beforebegin", row);
            }else {
                container.appendChild(row);
            }
        }
    }
};

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
 * If width and height have been set, Canvas size will be initialized to match the screen resolution.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {number} [attributes.width] 
 * @param {number} [attributes.height] 
 * @param {function(CanvasRenderingContext2D, Size)} [attributes.drawer] 
 * @param {Array} [children] 
 * @returns {HTMLCanvasElement}
 */
function Canvas() {
    var _arguments = Array.prototype.slice.call(arguments);

    var width;
    var height;
    var drawer;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "width" && typeof argument[key] == "number") {
                    width = argument[key];
                    delete argument[key];
                }else if(key == "height" && typeof argument[key] == "number") {
                    height = argument[key];
                    delete argument[key];
                }else if(key == "drawer" && typeof argument[key] == "function") {
                    drawer = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    _arguments.splice(0, 0, "canvas");
    var element = HtmlTag.apply(this, _arguments);

    if(width != undefined && height != undefined) {
        CanvasUtil.initCanvas(element, Size(width, height));
    }

    if(drawer != null) {
        if(ResizeObserver !== undefined) {
            var resizeObserver = new ResizeObserver(function(observations) {
                drawer(element.getContext("2d"), Size(element.clientWidth, element.clientHeight));
            });
            resizeObserver.observe(element);
        }
    }

    return element;
}

/**
 * Create BUTTON element.
 * @param {string} [identifier] 
 * @param {Object} [attributes] 
 * @param {string} [lattributes.label] 
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
    var style;
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
                }else if(key == "style" && typeof argument[key] == "object") {
                    style = argument[key];
                }
            }
            break;
        }
    }
    if(label != null) {
        _arguments.push([label]);
    }
    if(style == undefined) {
        _arguments.push({style:{"margin": "8px"}});
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
    var style;
    var children;
    var borderColor = "darkgray";
    var labelColor = "darkgray";
    var labelFontSize = "10px";
    var unitColor = "darkgray";
    var unitFontSize = "10px";
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
                if(key == "label" && typeof argument[key] == "string") {
                    label = argument[key];
                    delete argument[key];
                }else if(key == "style") {
                    style = argument[key];
                    delete argument[key];
                }else if(key == "borderColor") {
                    borderColor = argument[key];
                    delete argument[key];
                }else if(key == "labelColor") {
                    labelColor = argument[key];
                    delete argument[key];
                }else if(key == "labelFontSize") {
                    labelFontSize = argument[key];
                    if(typeof labelFontSize == "number") {
                        labelFontSize = labelFontSize + "px";
                    }
                    delete argument[key];
                }else if(key == "unitColor") {
                    unitColor = argument[key];
                    delete argument[key];
                }else if(key == "unitFontSize") {
                    unitFontSize = argument[key];
                    if(typeof unitFontSize == "number") {
                        unitFontSize = unitFontSize + "px";
                    }
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

    function setProperty(element, key, value, selector) {
        if(selector != null) {
            var children = element.querySelectorAll(selector);
            for(var i=0; i<children.length; i++) {
                setProperty(children[i], key, value);
            }
            return;
        }
        var _value = element.style.getPropertyValue(key);
        if(_value == null || _value.length == 0) {
            element.style.setProperty(key, value);
        }
    }

    element.defineStyles({
        "min-height": "40px",
        "border": "1px solid "+borderColor,
        "border-radius": "4px",
        "text-align": "left",
        "padding": "4px",
        "margin": "8px 0",
        ".label": {
            "font-size": labelFontSize,
            color: labelColor,
            cursor: "default",
            "user-select": "none"
        },
        ".unit": {
            "font-size": unitFontSize,
            "margin-left": "4px",
            color: unitColor
        }
    });
    setProperty(element, "width", "calc(100% - 8px)", "input, select, textarea");

    if(style != undefined) {
        element.defineStyles(style);
    }

    element.addEventListener("click", function(event) {
        var targetElement = event.target;
        if(targetElement instanceof HTMLDivElement) {
            var innerElement = event.currentTarget.querySelector("input,textarea,selector");
            if(innerElement != null) {
                innerElement.focus();
            }
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
 * @param {number} [attributes.multiplier=1] 
 * @param {number} [attributes.value] 
 * @param {number} [attributes.maxValue] 
 * @param {number} [attributes.minValue] 
 * @param {string} [attributes.dataKey] 
 * @returns {HTMLInputElement} element
 */
function NumericField() {
    var _arguments = Array.prototype.slice.call(arguments);

    var unit;
    var currency = false;
    var multiplier = 1;
    var maxValue;
    var minValue;
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
                }else if(key == "multiplier" && typeof argument[key] == "number") {
                    multiplier = argument[key];
                    delete argument[key];
                }else if(key == "maxValue" && typeof argument[key] == "number") {
                    maxValue = argument[key];
                    delete argument[key];
                }else if(key == "minValue" && typeof argument[key] == "number") {
                    minValue = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }
    var element = TextField.apply(this, _arguments);
    var inputElement = element;
    if(inputElement.tagName.toLowerCase() != "input") {
        inputElement = inputElement.querySelector("input");
    }
    inputElement.style.setProperty("text-align", "right");

    if(unit != undefined) {
        if(ResizeObserver !== undefined) {
            var resizeObserver = new ResizeObserver(function(observations) {
                if(observations.length == 0) return;
                var element = observations[0].target;
                resizeObserver.disconnect();
                showUnit(element, unit);
            });
            resizeObserver.observe(inputElement);
        }else {
            console.error("Your browser does not support ResizeObserver. Please try to run Polyfill for this function.");
        }
    }

    function showUnit(element, unit) {
        var unitElement = element.querySelector(".unit");
        if(unitElement != null) {
            unitElement.remove();
        }
        unitElement = document.createElement("span");
        unitElement.classList.add("unit");
        unitElement.defineStyles({
            "font-size": "10px",
            "margin-left": "4px",
            "color": "darkgray"
        });
        unitElement.innerText = unit;
        element.after(unitElement);
    }

    if(currency) {
        inputElement.addEventListener("focus", function() {
            var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(inputElement);
            if(value != null) {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(inputElement, value.replace(/,/g, ""));
            }
        });
        inputElement.addEventListener("blur", function() {
            var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(inputElement);
            if(value != null) {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(inputElement, StringUtil.currencyString(value));
            }
        });
        var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(inputElement);
        if(value != null) {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(inputElement, StringUtil.currencyString(value));
        }
    }

    inputElement.multiplier = multiplier;

    function mutiplyInSafety(number, mutiplier) {
        if(number == null || isNaN(number) || mutiplier == null || isNaN(mutiplier)) return number;
        var string = number.toString();
        var pointIndex = string.indexOf(".");
        if(pointIndex == -1) return number * mutiplier;
        var decimalScale = string.length - pointIndex - 1;
        var integer = number * Math.pow(10, decimalScale);
        integer = Math.floor(integer);
        var result = integer * mutiplier;
        return result / Math.pow(10, decimalScale);
    }

    Object.defineProperty(inputElement, "value", { 
        get: function() {
            var value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").get.call(inputElement);
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

            value = value / inputElement.multiplier;

            if(maxValue != null && value > maxValue) {
                value = maxValue;
                inputElement.value = value;
            }else if(minValue != null && value < minValue) {
                value = minValue;
                inputElement.value = value;
            }
            
            return value;
        },
        set: function(newValue) {
            var value = null;
            if(newValue != null) {
                value = newValue;

                value = mutiplyInSafety(value, inputElement.multiplier);

                if(currency) {
                    value = StringUtil.currencyString(value);
                }
            }
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(inputElement, value);
        }
    });

    Object.defineProperty(inputElement, "unit", { 
        set: function(newValue) {
            showUnit(inputElement, newValue);
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
 * @param {string} [settings.dataKey] The key for object set in the ViewController or parent View. 
 * @param {function(boolean): void} [changeHandler]
 * @returns {HTMLDivElement}
 */
function Checkbox() {
    var _arguments = Array.prototype.slice.call(arguments);

    var label = undefined;
    var checked = false;
    var boxColor = "black";
    var checkColor = "black";
    var fontSize = "1em";
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
    element.style.setProperty("cursor", "pointer");

    var canvas = document.createElement("canvas");
    canvas.style.setProperty("vertical-align", "bottom");
    var canvasSize = Size(24, 32);
    CanvasUtil.initCanvas(canvas, {width: 24, height: 32});
    element.appendChild(canvas);
    if(label != null) {
        var labelElement = document.createElement("span");
        labelElement.defineStyles({
            "user-select": "none"
        })
        labelElement.innerText = label;
        element.appendChild(labelElement);
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
            if(newValue == null) {
                newValue = false;
            }
            var initial = this._checked == undefined;
            this._checked = newValue;
            var canvas = this.querySelector("canvas");
            var context = canvas.getContext('2d');
            context.clearRect(0,0,canvas.width,canvas.height);
            drawBox(context);
            if(element.checked) {
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
        if(dataKey != null) {
            element.dataBindHandler(element.checked, dataKey);
        }
        if(changeHandler != undefined) {
            changeHandler(element.checked, element);
        }
        event.stopPropagation();
    });

    element.addEventListener("keydown", function(event) {
        if(event.code == "Space") {
            this.dispatchEvent(new MouseEvent("click"));
            event.preventDefault();
        }
    });

    return element;
}

/**
 * Create toggle button element.
 * @param {string} [identifier] 
 * @param {Object} [settings] 
 * @param {Array<string>} [settings.items] labels
 * @param {number} [settings.selectedIndex] 
 * @param {string} [settings.borderColor=black] 
 * @param {string} [settings.fillColor=black] 
 * @param {string} [settings.labelColor=black] 
 * @param {string} [settings.selectedLabelColor=black] 
 * @param {boolean} [settings.removable=true] 
 * @param {boolean} [settings.editable=true] 
 * @param {function(number): void} [selectHandler]
 * @returns {HTMLDivElement}
 */
function ToggleButton() {
    var _arguments = Array.prototype.slice.call(arguments);

    var items = [];
    var selectedIndex = -1;
    var borderColor = "black";
    var fillColor = "black";
    var labelColor = "black";
    var selectedLabelColor = "white";
    var removable = false;
    var editable = true;
    var selectHandler;
    var style;
    for(var i=0; i<_arguments.length; i++) {
        var argument = _arguments[i];
        if(!Array.isArray(argument) && typeof argument == "object") {
            var keys = Object.keys(argument);
            for(var j=0; j<keys.length; j++) {
                var key = keys[j];
                if(key == "items" && typeof argument[key] == "object") {
                    items = argument[key];
                    delete argument[key];
                }else if(key == "selectedIndex" && typeof argument[key] == "number") {
                    selectedIndex = argument[key];
                    delete argument[key];
                }else if(key == "borderColor" && typeof argument[key] == "string") {
                    borderColor = argument[key];
                    delete argument[key];
                }else if(key == "fillColor" && typeof argument[key] == "string") {
                    fillColor = argument[key];
                    delete argument[key];
                }else if(key == "labelColor" && typeof argument[key] == "string") {
                    labelColor = argument[key];
                    delete argument[key];
                }else if(key == "selectedLabelColor" && typeof argument[key] == "string") {
                    selectedLabelColor = argument[key];
                    delete argument[key];
                }else if(key == "removable" && typeof argument[key] == "boolean") {
                    removable = argument[key];
                    delete argument[key];
                }else if(key == "editable" && typeof argument[key] == "boolean") {
                    editable = argument[key];
                    delete argument[key];
                }else if(key == "selectHandler" && typeof argument[key] == "function") {
                    selectHandler = argument[key];
                    delete argument[key];
                }else if(key == "style" && typeof argument[key] == "object") {
                    style = argument[key];
                    delete argument[key];
                }
            }
            break;
        }
    }

    var element = View.apply(this, _arguments);

    element.editable = editable;

    if(style == undefined) {
        style = {};
    }
    if(style.display == undefined) {
        style.display = "inline-block";
    }
    if(style["white-space"] == undefined) {
        style["white-space"] = "nowrap";
    }
    if(style.cursor == undefined) {
        style.cursor = "default";
    }
    if(style["user-select"] == undefined) {
        style["user-select"] = "none";
    }
    if(style.height == undefined) {
        style.height = 32;
    }
    element.styles = style;

    if(items != null && items.length > 0) {
        if(selectedIndex != -1 && selectedIndex < items.length) {
            element.selectedIndex = selectedIndex;
        }else {
            element.selectedIndex = -1;
        }
        var itemWidth = (1/items.length * 100) + "%";
        for(i=0; i<items.length; i++) {
            var item = items[i];
            var itemElement = View(".item", {style: {
                display: "inline-block",
                width: itemWidth, 
                height: "100%", 
                color: labelColor,
                "font-size": style["font-size"] != null ? style["font-size"] : "small",
                "text-align": "center",
                "border-radius": (i==0 ? [4,0,0,4] : (i == items.length-1 ? [0,4,4,0] : 0)),
                "border": "1px solid "+borderColor,
                "line-height": style.height
            }}, [item]);
            if(i>0) {
                itemElement.style.borderLeft = "1px solid "+borderColor;
            }
            itemElement.addEventListener("click", function(event) {
                if(!element.editable) return false;
                var itemElement = event.currentTarget;
                var itemElements = element.querySelectorAll(".item");
                var index = itemElements.indexOf(itemElement);
                if(element.selectedIndex == index) {
                    if(removable) {
                        index = -1;
                        element.selectedIndex = -1;
                    }
                }else {
                    element.selectedIndex = index;
                }
                updateView();
                if(selectHandler != null) {
                    selectHandler(index);
                }
            });
            element.appendChild(itemElement);
        }
        updateView();
    }

    function updateView() {
        var itemElements = element.querySelectorAll(".item");
        for(var i=0; i<itemElements.length; i++) {
            var _itemElement = itemElements[i];
            if(i == element.selectedIndex) {
                _itemElement.style.backgroundColor = fillColor;
                _itemElement.style.color = selectedLabelColor;
            }else {
                _itemElement.style.backgroundColor = "transparent";
                _itemElement.style.color = labelColor;
            }
        }
    }

    Object.defineProperty(element, "selectedIndex", { 
        get: function() {
            return this._selectedIndex;
        },
        set: function(newValue) {
            this._selectedIndex = newValue;
            updateView();
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
 * @param {string} [settings.dataKey] The key for object set in the ViewController or parent View. 
 * @param {string} [settings.valueKey] When the element of the items is Object, the key for the value to be data-bounding.
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
        if(settings.style != undefined) {
            element.defineStyles(settings.style);
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
        if(settings.itemDrawer == undefined && settings.labelHandler == undefined) {
            settings.labelHandler = function(item) {
                return item["label"];
            }
        }
        if(settings.itemDrawer == undefined && settings.styleHandler == undefined) {
            settings.styleHandler = function(item, current) {
                return {
                    padding: [0,8]
                };
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
        },
        set: function(newValue) {
            select.items = newValue;
        }
    });
    Object.defineProperty(element, "editable", { 
        get: function() {
            return select.editable;
        },
        set: function(newValue) {
            select.editable = newValue;
        }
    });
    if(element.dataKey != undefined) {
        Object.defineProperty(element, "dataBindHandler", { 
            set: function(newValue) {
                if(settings.selectHandler != undefined) {
                    var originalHandler = settings.selectHandler;
                    select.selectHandler = function(selectedIndex, select) {
                        newValue(selectedIndex, element);
                        originalHandler(selectedIndex, select);
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
 * @param {string} [settings.dataKey] The key for object set in the ViewController or parent View. 
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


////////////////////////////////////// Web API extensions //////////////////////////////////////

/**
 * @ignore
 */
var _hadcore_styleSheet;

/**
 * @interface Document
 */

/**
 * Multiple and nested global styles of an Document.
 * @name Document#globalStyles
 * @property {Object|Array.<string>|string} globalStyles
 */
Object.defineProperty(Document.prototype, "globalStyles", {
    set: function(newValue) {
        if(_hadcore_styleSheet == undefined) {
            var head = document.getElementsByTagName("head")[0];
            var style = document.createElement("style");
            head.appendChild(style);
            var styleSheets = document.styleSheets;
            if(styleSheets == null && styleSheets.length > 0) {
                console.error("Could not access styleSheet of document.");
                return;
            }
            _hadcore_styleSheet = styleSheets[document.styleSheets.length-1];
        }
        function indexOfRule(key) {
            if(_hadcore_styleSheet.cssRules == undefined) return -1;
            for(var i=0; i<_hadcore_styleSheet.cssRules.length; i++) {
                var rule = _hadcore_styleSheet.cssRules[i];
                if(rule.cssText.startsWith(key)) {
                    return i;
                }
            }
            return -1;
        }
        var i;
        if(typeof newValue == "string") {
            _hadcore_styleSheet.insertRule(newValue);
        }else if(Array.isArray(newValue)) {
            for(i=0; i<newValue.length; i++) {
                _hadcore_styleSheet.insertRule(newValue[i]);
            }
        }else if(typeof newValue == "object") {
            var keys = Object.keys(newValue);
            if(keys.length == 0) {
                return;
            }
            for(i=0; i<keys.length; i++) {
                var selector = keys[i];
                var styles = newValue[selector];
                if(typeof styles != "object") {
                    continue;
                }
                var currentStylesIndex = indexOfRule(selector);
                if(currentStylesIndex != -1) {
                    _hadcore_styleSheet.deleteRule(currentStylesIndex);
                }
                var expression = "";
                expression += selector;
                expression += "{";
                var styleKeys = Object.keys(styles);
                for(var j=0; j<styleKeys.length; j++) {
                    var styleKey = styleKeys[j];
                    var styleValue = styles[styleKey];
                    if(typeof styleValue == "number") {
                        styleValue = styleValue + "px";
                    }else if(Array.isArray(styleValue)) {
                        var valueExp = "";
                        for(var k=0; k<styleValue.length; k++) {
                            if(k>0) {
                                valueExp += " ";
                            }
                            if(typeof styleValue[k] == "number") {
                                valueExp += styleValue[k]+"px";
                            }else {
                                valueExp += styleValue[k];
                            }
                        }
                        styleValue = valueExp;
                    }
                    if(styleKey == "background-image" && styleValue != "none" && !styleValue.endsWith(")")) {
                        styleValue = "url('"+styleValue+"')"
                    }
                    expression += styleKey + ":" + styleValue + ";";
                }
                expression += "}";
                _hadcore_styleSheet.insertRule(expression);
            }
        }else {
            return;
        }
    }
});

/**
 * @interface HTMLElement
 */

/**
 * Multiple and nested styles of an HTMLElement.
 * @name HTMLElement#styles
 * @property {Object} styles
 */
Object.defineProperty(HTMLElement.prototype, "styles", {
    set: function(newValue) {
        HtmlElementUtil.defineStyles(this, newValue);
    }
});

/**
 * @ignore 
 */
HTMLElement.prototype.defineStyles = function(styles) {
    HtmlElementUtil.defineStyles(this, styles);
    return this;
};

/**
 * @ignore 
 */
HTMLElement.prototype.replaceChildren = function(childNode) {
    HtmlElementUtil.replaceChildren(this, childNode);
    return this;
};

/**
 * @typedef {Object} Offset
 * @property {number} left
 * @property {number} top
 */

/**
 * Get the offset from the root element or parent element.
 * @param {HTMLElement} parentElement 
 * @returns {Offset}
 */
HTMLElement.prototype.offset = function(parentElement) {
    return HtmlElementUtil.offset(this, parentElement);
};

/**
 * Validates the input UI contained in the specified HTML element, and displays a browser-standard error if there is a validation error. The validation content follows the various attributes of the input tag.
 * @memberof HTMLElement
 * @type {function(void): boolean}
 * @returns {boolean}
 */
HTMLElement.prototype.validate = function() {
    return ValidationUtil.validate(this);
}

/**
 * @interface Node
 */

/**
 * Delete all child nodes
 * @memberof Node
 * @type {function(void): Node}
 * @returns {Node}
 */
Node.prototype.removeAll = function() {
    while(this.firstChild) {
        this.removeChild(this.firstChild);
    }
    return this;
};

/**
 * @interface NodeList
 */

/**
 * Get the index of a Node in a NodeList
 * @memberof NodeList
 * @type {function(Node): number}
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
 * Draw on the Canvas.
 * @param {function(CanvasRenderingContext2D, Size): void} drawer 
 * @param {boolean} refresh Clear the previous drawing contents before drawing.
 * @returns HTMLCanvasElement
 */
HTMLCanvasElement.prototype.draw = function(drawer, refresh) {
    var size = Size();
    if(this.clientWidth == 0 && this.clientHeight == 0) {
        var width = this.style.getPropertyValue("width");
        var height = this.style.getPropertyValue("height");
        if(typeof width == "string" && width.endsWith("px")) {
            size.width = Number(width.substr(0, width.length-2));
        }
        if(typeof height == "string" && height.endsWith("px")) {
            size.height = Number(height.substr(0, height.length-2));
        }
    }else {
        size.width = this.clientWidth;
        size.height = this.clientHeight;
    }
    var context = this.getContext("2d");
    if(refresh != undefined && refresh) {
        context.clearRect(0, 0, size.width, size.height);
    }
    drawer(context, size);
    return this;
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
            }else if(currentValue.endsWith("%")) {
                currentValue = Number(currentValue.substring(0, currentValue.length-1));
                if(key == "width") {
                    currentValue = target.offsetWidth * (currentValue/100);
                }else if(key == "height") {
                    currentValue = target.offsetHeight * (currentValue/100);
                }
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
     * @param {string} [format=yyyy-MM-dd]
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
     * Parse Date formatted string.
     * @param {string} dateString
     * @param {string} [format=yyyy-MM-dd]
     * @returns {Date}
     * @see http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_Patterns
     */
    parse: function(dateString, format) {
        if(dateString == null || typeof dateString != "string" || dateString.length == 0) {
            return null;
        }
        if(format == null) {
            format = "yyyy-MM-dd";
        }
        var result = null;

        function retrieveValue(souce, format, regex) {
            var result = regex.exec(format);
            if(result != null) {
                return Number(souce.substring(result.index, regex.lastIndex));
            }
            return null;
        }

        var value;
        if(format.includes("y")) {
            value = retrieveValue(dateString, format, /y+/g);
            if(result == null) {
                result = new Date();
            }
            result.setFullYear(value);
        }else {
            result.setFullYear(0);
        }
        if(format.includes("M")) {
            value = retrieveValue(dateString, format, /M+/g);
            if(result == null) {
                result = new Date();
            }
            result.setMonth(value-1);
        }else {
            result.setMonth(0);
        }
        if(format.includes("d")) {
            value = retrieveValue(dateString, format, /d+/g);
            if(result == null) {
                result = new Date();
            }
            result.setDate(value);
        }else {
            result.setDate(0);
        }
        if(format.includes("H")) {
            value = retrieveValue(dateString, format, /H+/g);
            if(result == null) {
                result = new Date();
            }
            result.setHours(value);
        }else {
            result.setHours(0);
        }
        if(format.includes("m")) {
            value = retrieveValue(dateString, format, /m+/g);
            if(result == null) {
                result = new Date();
            }
            result.setMinutes(value);
        }else {
            result.setMinutes(0);
        }
        if(format.includes("s")) {
            value = retrieveValue(dateString, format, /s+/g);
            if(result == null) {
                result = new Date();
            }
            result.setSeconds(value);
        }else {
            result.setSeconds(0);
        }
        result.setMilliseconds(0);

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
     * @param {number} [decimalPlaces]
     * @param {"round"|"floor"|"ceil"} [roundingMode]
     * @returns {string}
     */
    currencyString: function(source, decimalPlaces, roundingMode) {
        if(source == null) return "";
        if(typeof source != "number") {
            if(typeof source == "string" && source.length == 0) {
                return "";
            }
            
            // multi-byte string
            source = source.replace(/０/g, "0");
            source = source.replace(/１/g, "1");
            source = source.replace(/２/g, "2");
            source = source.replace(/３/g, "3");
            source = source.replace(/４/g, "4");
            source = source.replace(/５/g, "5");
            source = source.replace(/６/g, "6");
            source = source.replace(/７/g, "7");
            source = source.replace(/８/g, "8");
            source = source.replace(/９/g, "9");

            // comma separated number
            source = source.replace(/,/g, "");

            source = Number(source);
        }
        if(typeof source == "number") {
            if(Number.isNaN(source)) {
                return "";
            }
            var string = String(source);
            if(string.includes(".") && typeof decimalPlaces == "number") {
                var multiplier = Math.pow(10, decimalPlaces);
                if(roundingMode == null || roundingMode == "round") {
                    source = Math.round(source * multiplier) / multiplier;
                }else if(roundingMode == "floor") {
                    source = Math.floor(source * multiplier) / multiplier;
                }else if(roundingMode == "ceil") {
                    source = Math.ceil(source * multiplier) / multiplier;
                }
                source = String(source);
            }else {
                source = string;
            }
        }
        if(source.length == 0) return source;
        var result = [];
        var index = 0;
        var i;
        var negative = false;
        if(source.startsWith("-")) {
            negative = true;
            source = source.substring(1);
        }
        if(source.includes(".")) {
            for(i=source.length-1; i>=0; i--) {
                var char = source.charAt(i);
                result.push(char);
                if(char == ".") {
                    source = source.substring(0, i);
                    break;
                }
            }
        }
        index = 0;
        for(i=source.length-1; i>=0; i--) {
            if(index != 0 && index % 3 == 0) {
                result.push(",");
            }
            result.push(source.charAt(i));
            index++;
        }
        return (negative ? "-" : "") + result.reverse().join("");
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
    defaultFontSize: "1em",

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
     * @param {boolean} stroke 
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
            context.shadowBlur = 16;
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
            element.addEventListener("touchstart", function(event) {
                context = {};
                if(settings.touchBegan != undefined) {
                    settings.touchBegan(event, context);
                }
            }, {passive: (settings.touchBeganCancellable != undefined ? settings.touchBeganCancellable : true)});
            if(settings.touchMove != undefined) {
                element.addEventListener("touchmove", function(event) {
                    settings.touchMove(event, context);
                }, {passive: (settings.touchMoveCancellable != undefined ? settings.touchMoveCancellable : true)});
            }
            element.addEventListener("touchend", function(event) {
                if(settings.touchEnd != undefined) {
                    settings.touchEnd(event, context, true);
                }
                context = undefined;
            }, {passive: (settings.touchEndCancellable != undefined ? settings.touchEndCancellable : true)});
            element.addEventListener("touchcancel", function(event) {
                if(settings.touchEnd != undefined) {
                    settings.touchEnd(event, context, false);
                }
                context = undefined;
            }), {passive: (settings.touchEndCancellable != undefined ? settings.touchEndCancellable : true)};
        }else {
            element.addEventListener("mousedown", function(event) {
                context = {}; 
                if(settings.touchBegan != undefined) {
                    settings.touchBegan(event, context);
                }
            }); 
            if(settings.touchMove != undefined) {
                element.addEventListener("mousemove", function(event) {
                    settings.touchMove(event, context);
                });
            }
            element.addEventListener("mouseup", function(event) {
                if(settings.touchEnd != undefined) {
                    settings.touchEnd(event, context, true);
                }
                context = undefined;
            });
            element.addEventListener("mouseleave", function (event) {
                if(settings.touchEnd != undefined) {
                    settings.touchEnd(event, context, false);
                }
                context = undefined;
            });
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
                var priority = undefined;
                if(Array.isArray(value)) {
                    var expression = "";
                    for(var j=0; j<value.length; j++) {
                        if(j>0) {
                            expression += " ";
                        }
                        if(typeof value[j] == "number") {
                            expression += value[j]+"px";
                        }else {
                            expression += value[j];
                        }
                    }
                    element.style.setProperty(key, expression);
                }else if(typeof value != "object") {
                    if(typeof value == "number") {
                        value = value+"px";
                    }else if(typeof value == "string") {
                        if(value.endsWith("!important")) {
                            priority = "important";
                            value = value.substr(0, value.length-10);
                        }
                    }
                    if(key == "background-image" && typeof value == "string" && value != "none" && !value.endsWith(")")) {
                        value = "url('"+value+"')"
                    }
                    element.style.setProperty(key, value, priority);
                    if(key == "user-select") {
                        element.style.setProperty("-webkit-"+key, value, priority);
                        element.style.setProperty("-moz-"+key, value, priority);
                        element.style.setProperty("-ms-"+key, value, priority);
                    }
                }else {
                    var innerElements = element.querySelectorAll(key);
                    if(innerElements != null) {
                        for(var k=0; k<innerElements.length; k++) {
                            var innerElement = innerElements[k];
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
     * @param {number} [settings.zIndex] 
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
            selectHandler: undefined,
            editable: true
        };

        var parent;
        var itemWidth = 120;
        var itemHeight = 32;
        var backgroundColor = "white";
        var borderColor = "rgba(0,0,0,0.3)";
        var zIndex;

        var itemDrawer;
        var labelHandler;
        var styleHandler;
        var hoverStyleHandler;

        var closeHandler;

        var selectedDrawing = true;
        var animate = true;
        var hilighting = false;

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
            if(settings.backgroundColor != undefined) {
                backgroundColor = settings.backgroundColor;
            }
            if(settings.borderColor != undefined) {
                borderColor = settings.borderColor;
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
                reference.editable = settings.editable;
            }
            if(settings.zIndex != undefined) {
                zIndex = settings.zIndex;
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
        selection.style.setProperty("background-color", backgroundColor);
        selection.style.setProperty("box-shadow", "3px 3px 16px rgba(0,0,0,0.3)");
        selection.style.setProperty("border", "1px solid " + borderColor);
        selection.style.setProperty("cursor", "pointer");
        selection.style.setProperty("user-select", "none");
        if(itemDrawer != null) {
            selection.style.setProperty("width", itemWidth+"px");
            selection.style.setProperty("line-height", "0px");
        }
        if(zIndex != null) {
            selection.style.setProperty("z-index", zIndex);
        }

        var mask = document.createElement("div");
        mask.style.setProperty("position", "absolute");
        mask.style.setProperty("left", parentOffset.left+"px");
        mask.style.setProperty("top", parentOffset.top+"px");
        mask.style.setProperty("width", "100%");
        mask.style.setProperty("height", "100%");
        mask.style.setProperty("background-color", "transparent");
        if(zIndex != null) {
            mask.style.setProperty("z-index", zIndex);
        }

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
                itemElement.style.setProperty("font-size", "1em");
                itemElement.style.setProperty("cursor", "pointer");

                if(styleHandler != undefined) {
                    var styles = styleHandler(item, current);
                    if(styles != null && typeof styles == "object") {
                        itemElement.styles = styles;
                    }
                }

                if(hoverStyleHandler != undefined && !current) {
                    var hoverStyles = hoverStyleHandler();
                    var originalStyles = {};
                    var hoverStyleKeys = Object.keys(hoverStyles);
                    for(var i=0; i<hoverStyleKeys.length; i++) {
                        var key = hoverStyleKeys[i];
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
            if(reference.items == null || reference.items.length == 0) {
                return;
            }
            if(reference.selectedIndex < 0 || reference.selectedIndex >= reference.items.length) {
                var _contentElement = element.querySelector("div.item");
                if(_contentElement != null) {
                    _contentElement.remove();
                }
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
                        contentElement.styles = styles;
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
                var itemElement = createItem(item);
                itemElement.setAttribute("tabIndex", i);
                selection.appendChild(itemElement);
            }
            if(reference.editable) {
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
                var height = selection.offsetHeight;
                var visibleItemSize = Math.ceil(selection.clientHeight / itemHeight);

                selection.childNodes.forEach(function(selectionItem, index) {
                    selectionItem.style.setProperty("opacity", 0);
                    if(index < visibleItemSize) {
                        selectionItem.style.setProperty("top", "32px");
                    }else {
                        selectionItem.style.setProperty("top", "0px");
                    }
                });
                selection.style.setProperty("height", 0);
                selection.style.setProperty("visibility", "visible");
                selection.style.setProperty("overflow", "hidden");

                var fadeinDelay = 200;
                var slideinDelay = 50;

                new StyleAnimation(selection, "height", {finishValue: height, duration: fadeinDelay}).start().finish(function() {
                    var timing = 0;
                    var lastItemIndex = selection.childNodes.length-1;
                    selection.childNodes.forEach(function(selectionItem, index) {
                        var lastItem = index == lastItemIndex;
                        if(index < visibleItemSize) {
                            setTimeout(function() {
                                new FunctionalAnimation(function(progress) {
                                    selectionItem.style.setProperty("opacity", progress);
                                    selectionItem.style.setProperty("top", (16*(1-progress))+"px");
                                }, FunctionalAnimation.methods.linear, slideinDelay).start().finish(function() {
                                    if(lastItem) {
                                        selection.style.setProperty("overflow", "auto");
                                    }
                                });
                            }, timing);
                            timing += slideinDelay;
                        }else {
                            selectionItem.style.setProperty("opacity", 1);
                            if(lastItem) {
                                selection.style.setProperty("overflow", "auto");
                            }
                        }
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

        element.addEventListener("click", function() {
            if(!reference.editable) return;
            showSelection();
        });

        element.addEventListener("keydown", function(event) {
            if(event.code == "Space" || event.code == "ArrowDown" || event.code == "ArrowUp") {
                if(selection.style.visibility == "hidden") {
                    event.currentTarget.dispatchEvent(new MouseEvent("click"));
                    event.preventDefault();
                }else {
                    var items = selection.querySelectorAll(".item");
                    if(items.length > 0) {
                        items[0].focus();
                    }
                }
            }
        });

        selection.addEventListener("keydown", function(event) {
            var selection = event.currentTarget;
            var items = selection.querySelectorAll(".item");
            var i;
            if(event.code == "Enter" || event.code == "Space") {
                if(items.length > 0) {
                    if(document.activeElement != null) {
                        for(i=0; i<items.length; i++) {
                            if(items[i] == document.activeElement) {
                                items[i].dispatchEvent(new MouseEvent("click"));
                                event.preventDefault();
                                element.focus();
                                break;
                            }
                        }
                    }
                }
            }else if(event.code == "ArrowDown" || event.code == "ArrowUp") {
                if(items.length > 0) {
                    if(document.activeElement == null) {
                        items[0].focus();
                    }else {
                        for(i=0; i<items.length; i++) {
                            if(items[i] == document.activeElement) {
                                if(event.code == "ArrowDown") {
                                    if(i < items.length-1) {
                                        items[i+1].focus();
                                    }else {
                                        items[0].focus();
                                    }
                                }else {
                                    if(i > 0) {
                                        items[i-1].focus();
                                    }else {
                                        items[items.length-1].focus();
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
        });

        reference.show = function() {
            showSelection();
        };
        reference.close = function() {
            mask.remove();
            selection.style.setProperty("overflow", "hidden");
            new StyleAnimation(selection, "height", {finishValue: 0, duration: 200}).start().finish(function() {
                selection.remove();
                selection.style.setProperty("visibility", "hidden");
                selection.style.removeProperty("height");
                selection.style.setProperty("overflow", "auto");
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
     * @param {"info"|"warning"|"confirm"} type
     * @param {string} applyLabel
     * @param {function(): void} applyHandler
     * @param {string} cancelLabel
     * @param {function(): void} cancelHandler
     */
    Message: function(text, type, applyLabel, applyHandler, cancelLabel, cancelHandler) {
        // irregular arguments
        if(typeof applyLabel == "function") {
            // applyHandler, cancelHandler
            if(typeof applyHandler == "function") {
                cancelHandler = applyHandler;
                cancelLabel = "Cancel";
            }
            applyHandler = applyLabel;
            applyLabel = "OK";
        }

        var element = document.createElement("div");
        element.classList.add("message");
        var contentsElement = document.createElement("div");
        contentsElement.classList.add("contents");
        var textElement = document.createElement("div");
        textElement.style.setProperty("display", "inline-block");
        if(text != null && typeof text == "string") {
            if(!text.includes("\n")) {
                textElement.style.setProperty("line-height", "32px");
            }
            textElement.innerText = text;
        }
        contentsElement.appendChild(textElement);
        element.appendChild(contentsElement);
        var controlsElement = document.createElement("div");
        controlsElement.classList.add("controls");
        element.appendChild(controlsElement);

        element.style.setProperty("z-index", 999999);
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
            icon.style.setProperty("vertical-align", "top");
            icon.style.setProperty("margin-right", "8px");
            element.querySelector(".contents").prepend(icon);
        }
        var popup;
        if(applyHandler != undefined) {
            var applyButton = document.createElement("div");
            applyButton.innerText = applyLabel != null ? applyLabel : "OK";
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
            cancelButton.innerText = cancelLabel != null ? cancelLabel : "Cancel";
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
     * @param {function(void): void} [settings.dismissHandler]
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
        var dismissHandler;
        var padding = 8;
        var margin = 8;
        var direction = "top";
        var tipSize = 8;
        var tipOffset = undefined;
        var fillColor = "white";
        var shadow = false;
        var modal = true;
        var visible = true;
        var zIndex;
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
            if(settings.dismissHandler != undefined) {
                dismissHandler = settings.dismissHandler;
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
            if(settings.zIndex != undefined) {
                zIndex = settings.zIndex;
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
        if(zIndex != null) {
            container.style.setProperty("z-index", zIndex);
        }

        var mask = document.createElement("div");
        mask.style.setProperty("position", "absolute");
        mask.style.setProperty("left", "0");
        mask.style.setProperty("top", "0");
        mask.style.setProperty("width", "100%");
        mask.style.setProperty("height", "100%");
        mask.style.setProperty("background-color", "transparent");
        if(zIndex != null) {
            mask.style.setProperty("z-index", zIndex);
        }

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
                
                if(tipOffset == undefined) {
                    if(direction == "top" || direction == "bottom") {
                        tipOffset = container.offsetWidth - margin*2 - (parent.clientWidth - location.x - margin);
                    }
                }
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
                if(dismissHandler != undefined) {
                    dismissHandler();
                }
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
        var direction = "bottom";
        function detectScroll(parentElement) {
            if(parentElement == null) return;
            location.x -= parentElement.scrollLeft;
            location.y -= parentElement.scrollTop;
            if(parentElement.parentElement != null) {
                detectScroll(parentElement.parentElement);
            }
        }
        if(source instanceof HTMLElement) {
            var offset = HtmlElementUtil.offset(source);
            location = Point(offset.left + source.clientWidth/2, offset.top);
            if(location.y < 0) {
                location.y = offset.top + source.offsetHeight;
                direction = "top";
            }
            detectScroll(source.parentElement);
        }else if(typeof source == "object" && source.x != undefined && source.y != undefined) {
            location = Point(source.x, source.y);
        }else {
            location = Point();
        }
        var balloon = Controls.Balloon(menu, {
            location: location, 
            fillColor: backgroundColor, 
            direction: direction,
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
            target.scrollLeft = currentScrollOffsetX;
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
