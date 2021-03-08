/*!
 * Hardcore.js
 * Copyright 2017-2021 Takuro Okada.
 * Released under the MIT License.
 */

/**
 * Provide dynamic module loading.
 * @namespace
 */
var Module = {

    /**
     * Load modules from the remote server.
     * @param {!object} definition 
     * @param {?string} definition.view HTML request path
     * @param {?string} definition.styleSheet CSS request path
     * @param {?string} definition.logic JavaScript request path
     * @param {?string|?HTMLElement} definition.bindingTarget Target element to insert the HTML root element. (CSS selector or HTMLElement)
     * @param {?function(string): void} definition.completed:Return HTML as a string when loading is complete.
     */
    load: function(definition) {
        var self = this;

        if(definition == null || typeof definition != "object") {
            if(definition.completed != undefined) {
                definition.completed();
            }
            return;
        }

        var processes = [];
        if(definition.view != undefined) {
            processes.push(new Promise(function(resolve) {
                self.loadView(definition.view, definition.bindingTarget, function(contents) {
                    resolve(contents);
                });
            }));
        }
        if(definition.styleSheet != undefined) {
            processes.push(new Promise(function(resolve) {
                self.loadStyleSheet(definition.styleSheet, function() {
                    resolve();
                });
            }));
        }
        if(definition.logic != undefined) {
            processes.push(new Promise(function(resolve) {
                self.loadLogic(definition.logic, function() {
                    resolve();
                });
            }));
        }
        Promise.all(processes).then(function(results) {
            var contents = definition.view != undefined && results.length > 0 ? results[0] : null;
            if(definition.completed != undefined) {
                definition.completed(contents);
            }
        });
    },

    /**
     * Load contents of the HTML file from the remote server.
     * @param {!string} filePath HTML request path
     * @param {?string|?HTMLElement} bindingTarget Target element to insert the HTML root element. (CSS selector or HTMLElement)
     * @param {?function(string): void} completionHandler Return HTML as a string when loading is complete.
     */
    loadView: function(filePath, bindingTarget, completionHandler) {
        if(filePath == null || filePath.length == 0) {
            if(completionHandler != undefined) {
                completionHandler(null);
            }
            return;
        }
        fetch(filePath, {
            method: "GET",
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            },
            cache: "no-store",
            mode: "same-origin",
            credentials: "same-origin"
        }).then(function(response) {
            if(response.ok) {
                response.text().then(function(data) {
                    if(bindingTarget != null) {
                        if(bindingTarget instanceof HTMLElement) {
                            bindingTarget.innerHTML = data;
                        }else if(typeof bindingTarget == "string") {
                            var element = document.querySelector(bindingTarget);
                            if(element != null) {
                                element.innerHTML = data;
                            }
                        }
                    }
                    if(completionHandler != undefined) {
                        completionHandler(data);
                    }
                });
            }else {
                if(completionHandler != undefined) {
                    completionHandler(response);
                }
            }
        });
    },

    /**
     * Acquire contents of the HTML file from the remote server and load only the specified element.
     * @param {!string} filePath HTML request path
     * @param {?string} selector selector of the loading element
     * @param {?function(HTMLElement): void} completionHandler 
     */
    loadViewComponent: function(filePath, selector, completionHandler) {
        if(filePath == null || filePath.length == 0) {
            if(completionHandler != undefined) {
                completionHandler();
            }
            return;
        }
        fetch(filePath, {
            method: "GET",
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            },
            cache: "no-store",
            mode: "same-origin",
            credentials: "same-origin"
        }).then(function(response) {
            if(response.ok) {
                response.text().then(function(data) {
                    var wrapper = document.createElement("div");
                    wrapper.insertAdjacentHTML("afterbegin", data);
                    var element;
                    if(selector != null) {
                        element = wrapper.querySelector(selector);
                    }else {
                        element = wrapper.children.item(0);
                    }
                    if(completionHandler != undefined) {
                        completionHandler(element);
                    }
                });
            }else {
                if(completionHandler != undefined) {
                    completionHandler();
                }
            }
        });
    },

    /**
     * Load contents of the Javascript file from the remote server.
     * @param {!string} filePath JavaScript request path
     * @param {?function(): void} completionHandler 
     */
    loadLogic: function(filePath, completionHandler) {
        if(filePath == null || filePath.length == 0) {
            if(completionHandler != undefined) {
                completionHandler();
            }
            return;
        }
        var headElements = document.getElementsByTagName("head");
        var headElement = headElements[0];
        function checkLoaded() {
            for(var i=0; i<headElement.childNodes.length; i++) {
                var node = headElement.childNodes[i];
                if(node.nodeName.toLowerCase() == 'script') {
                    if(node.src == location.origin+"/"+filePath) {
                        return true;
                    }
                }
            }
        }
        if(checkLoaded()) {
            if(completionHandler != undefined) {
                completionHandler();
            }
            return;
        }
        var scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.src = filePath;
        scriptElement.setAttribute("defer", "defer");
        headElement.appendChild(scriptElement);
        scriptElement.onload = function() {
            if(completionHandler != undefined) {
                completionHandler();
            }
        };
    },

    /**
     * Load contents of Javascript files from the remote server.
     * @param {!array.<string>} filePathes JavaScript request pathes
     * @param {?function(): void} completionHandler 
     */
    loadLogics: function(filePathes, completionHandler) {
        var self = this;

        if(filePathes == null || filePathes.length == 0) {
            if(completionHandler != undefined) {
                completionHandler();
            }
            return;
        }
        var processes = [];
        for(var i=0; i<filePathes.length; i++) {
            var filePath = filePathes[i];
            processes.push(new Promise(function(resolve, reject) {
                self.loadLogic(filePath, function() {
                    resolve();
                });
            }));
        }
        Promise.all(processes).then(function() {
            if(completionHandler != undefined) {
                completionHandler();
            }
        });
    },

    /**
     * Load contents of the CSS file from the remote server.
     * @param {!string} filePath CSS request path
     * @param {?function(): void} completionHandler 
     */
    loadStyleSheet: function(filePath, completionHandler) {
        if(filePath == null || filePath.length == 0) {
            if(completionHandler != undefined) {
                completionHandler();
            }
            return;
        }
        var headElements = document.getElementsByTagName("head");
        var headElement = headElements[0];
        for(var i=0; i<headElement.childNodes.length; i++) {
            var node = headElement.childNodes[i];
            if(node.nodeName.toLowerCase() == 'link') {
                if(node.href == location.origin+"/"+filePath) {
                    if(completionHandler != undefined) {
                        completionHandler();
                    }
                    return;
                }
            }
        }
        var linkElement = document.createElement("link");
        linkElement.rel = "stylesheet";
        linkElement.type = "text/css";
        linkElement.href = filePath;
        headElement.appendChild(linkElement);
        linkElement.onload = function() {
            if(completionHandler != undefined) {
                completionHandler();
            }
        };
    }
};
