'use strict';

const config = require('@/utils/config.js');
const store = require('@/utils/store.js');
const DEFAULT_SETTINGS = config.settings;


/**
 * Get the value for the specified Settings property
 * @param  {string}     property    Property path
 * @param  {Function}   callback    Callback function(value)
 */
function getValue(property, callback) {
    get(function(settings) {
        let parts = property.split('.');
        let value = settings;
        for ( let i = 0; i < parts.length; i++ ) {
            value = value[parts[i]];
        }
        return callback(value)
    });
}


/**
 * Set the value of the specified Settings property
 * @param {string}      property    Property path
 * @param {}            value       Property value to save
 * @param {Function}    [callback]  Callback function()
 */
function setValue(property, value, callback) {
    get(function(settings) {
        settings = _set(settings, property, value);
        store.put("settings", settings, callback);
    });
}


/**
 * Get all of the current Settings
 * @param  {Function}   callback    Callback function(settings)
 */
function get(callback) {
    store.get("settings", function(err, settings) {
        if ( err || !settings ) {
            return callback(DEFAULT_SETTINGS);
        }
        settings = mergeDeep(DEFAULT_SETTINGS, settings);
        return callback(settings);
    });
}



// ==== HELPER FUNCTIONS ==== //

/**
 * Source: lodash.set
 */
function _set(obj, path, value) {
    if (Object(obj) !== obj) return obj; // When obj is not an object
    // If not yet an array, get the keys from the string-path
    if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []; 
    path.slice(0,-1).reduce((a, c, i) => // Iterate all of them except the last one
         Object(a[c]) === a[c] // Does the key exist and is its value an object?
             // Yes: then follow that path
             ? a[c] 
             // No: create the key. Is the next key a potential array-index?
             : a[c] = Math.abs(path[i+1])>>0 === +path[i+1] 
                   ? [] // Yes: assign a new array object
                   : {}, // No: assign a new plain object
         obj)[path[path.length-1]] = value; // Finally assign the value to the last key
    return obj; // Return the top-level object to allow chaining
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}



module.exports = {
    get: get,
    getValue: getValue,
    setValue: setValue
}
