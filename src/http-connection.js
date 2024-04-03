/*!
 * Hardcore.js
 * Copyright 2017-2021 Takuro Okada.
 * Released under the MIT License.
 */

/**
 * Provide HTTP connection method for standard web applications.
 * @namespace
 */
var HttpConnection = {

    /**
     * @type {string}
     */
    defaultCharacterSet: "utf-8",

    /**
     * @type {string}
     */
    defaultContentType: "application/json",

    /**
     * @type {string}
     */
    defaultMethod: "POST",

    /**
     * Default cache policy
     * @type {default|no-store|reload|no-cache|force-cache|only-if-cached}
     */
    defaultCachePolicy: "no-cache",

    /**
     * Default acccess policy
     * @type {same-origin|no-cors|cors|navigate}
     */
    defaultAccessPolicy: "same-origin",

    /**
     * Authorization type
     * @type {"Basic"|"Bearer"|"Digest"}
     */
    authorizationType: "Bearer",

    /**
     * Authorization credentials
     * @type {string}
     */
    authorization: undefined,

    /**
     * @type {object}
     */
    additionalHeaders: {},

    /**
     * @overload
     * @param {!string} path 
     * @param {object|FromData} [request] body data
     * @param {string} [contentType] 
     * @returns {!Promise} Receive the response data by Promise#then, and Promise#catch is called when a response other than HTTP status code 200 is received.
     */
    /**
     * Send a request to the specified URL.
     * @overload
     * @param {!string} path 
     * @param {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"} [method] HTTP method
     * @param {object|FromData} [requestBody] body data
     * @param {string} [contentType] 
     * @returns {!Promise} Receive the response data by Promise#then, and Promise#catch is called when a response other than HTTP status code 200 is received.
     */
    request: function(path, method, requestBody, contentType) {
        var self = this;

        if(method != undefined) {
            if(typeof method == "object") {
                requestBody = method;
                method = self.defaultMethod;
            }
        }else {
            method = self.defaultMethod;
        }

        if(path == undefined || typeof path != "string") {
            console.error("The request path is not set.");
            return;
        }
        if(contentType == undefined && !(requestBody instanceof FormData) && method != "GET") {
            contentType = self.defaultContentType;
        }

        if(requestBody instanceof Array && !Array.isArray(requestBody)) {
            requestBody = Array.from(requestBody);
        }

        function urlencode(requestBody) {
            var requestString = "";
            var requestKeys = Object.keys(requestBody);
            for(var i=0; i<requestKeys.length; i++) {
                if(i > 0) {
                    requestString += "&";
                }
                requestString += requestKeys[i]+"="+requestBody[requestKeys[i]];
            }
            return encodeURI(requestString);
        }

        var _request = {
            method: method,
            cache: self.defaultCachePolicy,
            mode: self.defaultAccessPolicy,
            headers: {}
        };
        if(requestBody !== undefined) {
            if(contentType !== undefined) {
                if(contentType == "application/json" && typeof requestBody == "object") {
                    _request.body = JSON.stringify(requestBody);
                }else if(contentType == "application/x-www-form-urlencoded" && typeof requestBody == "object") {
                    _request.body = urlencode(requestBody);
                }else {
                    _request.body = requestBody;
                }
            }else {
                if(method == "GET") {
                    path += "?"+urlencode(requestBody);
                }else {
                    _request.body = requestBody;
                }
            }
        }
        if(contentType !== undefined) {
            _request.headers["Content-Type"] = contentType+"; charset="+self.defaultCharacterSet;
        }
        if(self.authorization !== undefined && self.authorizationType !== undefined) {
            _request.headers["Authorization"] = self.authorizationType+" "+self.authorization;
        }
        var additionalHeaderKeys = Object.keys(self.additionalHeaders);
        for(var i=0; i<additionalHeaderKeys.length; i++) {
            var key = additionalHeaderKeys[i];
            _request.headers[key] = self.additionalHeaders[key];
        }
        return fetch(path, _request).then(function(response) {
            if(response.redirected) {
                if(response.url != null) {
                    location.href = response.url;
                }
                return;
            }
            if(response.ok) {
                var contentType = response.headers.get("Content-Type");
                if(contentType != null) {
                    if(contentType == "application/json") {
                        return response.json();
                    }else if(contentType.startsWith("text")) {
                        return response.text();
                    }else {
                        return response.blob();
                    }
                }
            }else {
                return response.text().then(function(message) {
                    var responseBody = {
                        status: response.status,
                        responseText: message
                    };
                    self.handleServerError(responseBody);
                    return Promise.reject(responseBody);
                });
            }
        }, function(error) {
            var response = {};
            if(navigator.language != null && navigator.language.includes("ja")) {
                response.responseText = "サーバに接続できません。ネットワークをご確認ください。";
            }else {
                response.responseText = "Unable to connect to the server. Please check your network.";
            }
            self.globalServerErrorHandler(response);
            return Promise.reject(response);
        });
    },

    /**
     * Common handling process for server errors. Displays a dialog by default.
     * @param {?object} response
     * @param {?number} response.statusCode
     * @param {?number} response.responseText
     */
    globalServerErrorHandler: function(response) {
        Controls.Message(response.responseText, "warning", function() {});
    },

    /**
     * @access private
     */
    handleServerError: function(response) {
        var message;
        // Bad Request
        if(response.status == 400) {
            this.globalServerErrorHandler(response);
        }
        // Unauthorized
        else if(response.status == 401) {
            this.globalServerErrorHandler(response);
        }
        // Forbidden
        else if(response.status == 403) {
            location.href = "";
        }
        // Payload Too Large
        else if(response.status == 413) {
            if(navigator.language != null && navigator.language.includes("ja")) {
                message = "ファイルのサイズが大きすぎます。お手数ですがファイルを編集の上再度アクセスをお願いします。";
            }else {
                message = "The file is too large. Please edit the file and access it again.";
            }
            this.globalServerErrorHandler({statusCode: 413, responseText: message});
        }
        // Internal Server Error
        else if(response.status == 500) {
            if(navigator.language != null && navigator.language.includes("ja")) {
                message = "サーバでエラーが発生しました。お手数ですが管理者にお問合せください。";
            }else {
                message = "An error has occurred on the server. Please contact the administrator for assistance.";
            }
            this.globalServerErrorHandler({statusCode: 500, responseText: message});
        }
        // Service Unavailable
        else if(response.status == 503) {
            if(navigator.language != null && navigator.language.includes("ja")) {
                message =  "ただいまシステムが混み合っています。しばらく待ってから再度アクセスをお願いいたします。";
            }else {
                message = "The system is currently busy. Please wait for a while and access again.";
            }
            this.globalServerErrorHandler({statusCode: 503, responseText: message});
        }
    }
};
