/*!
 * Hardcore.js
 * Copyright 2017-2021 Takuro Okada.
 * Released under the MIT License.
 */

/**
 * Storage utility
 * @namespace
 */
var StorageUtil = {
    /**
     * Restore JSON data from the local storge
     * @param {!string} strageName
     * @returns {?object} 
     */
    restoreJson: function(storageName) {
        var source = localStorage.getItem(storageName);
        var json = null;
        if(source != null) {
            json = JSON.parse(source);
        }
        return json;
    },

    /**
     * Store JSON data to the local storge
     * @param {!string} strageName 
     * @param {?object} json stored data (remove storage when this argument is set null)
     */
    storeJson: function(storageName, json) {
        if(json == null) {
            localStorage.removeItem(storageName);
            return;
        }
        localStorage.setItem(storageName, JSON.stringify(json));
    }
};
