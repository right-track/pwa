const api = require("@/utils/api.js");
const store = require("@/utils/store.js");
const db = require("@/utils/db.js");

/**
 * Update Check Interval (seconds)
 * @type {Number}
 */
const CHECK_INTERVAL = 3600;


/**
 * Check for an agency database update
 * @param  {string}   agency   Agency ID Code
 * @param  {boolean}  [force]  Set to true to force an update check
 * @param  {Function} callback Callback function(err, updateInfo)
 */
function check(agency, force, callback) {

    // Parse arguments
    if ( !callback && typeof force === 'function' ) {
        callback = force;
        force = false;
    }

    // Get last checked timestamp
    _getDBUpdateLastChecked(agency, function(lastChecked) {
        let now = new Date().getTime();
        let delta = (now - lastChecked)/1000;

        // Update interval exceeded (or forced)
        if ( delta > CHECK_INTERVAL || force ) {

            // Get version from API server
            api.get("/updates/database/" + agency, function(err, resp) {
                if ( err ) {
                    if ( force ) return callback(err);
                }

                // Save the db check timestamp
                _saveDBUpdateLastChecked(agency);

                // Save the latest db version
                let latestVersion = resp.version;
                _saveDBVersionLatest(agency, latestVersion);

                // Get the stored DB version
                db.getDBVersion(agency, function(storedVersion) {

                    // Return Update Info
                    if ( latestVersion > storedVersion ) {
                        return callback(null, {
                            isAvailable: true,
                            version: latestVersion
                        });
                    }
                    else {
                        return callback(null, undefined);
                    }

                });

            });

        }

        // Return saved info
        else {
            isUpdateAvailable(agency, function(updateInfo) {
                return callback(null, updateInfo);
            });
        }


    });
}



/**
 * Check if there is an agency database update available
 * @param  {string}   agency   Agency ID Code
 * @param  {Function} callback Callback function(updateInfo)
 */
function isUpdateAvailable(agency, callback) {
    db.getDBVersion(agency, function(stored) {
        _getDBVersionLatest(agency, function(latest) {
            if ( !stored || !latest || latest > stored ) {
                return callback({
                    isAvailable: true,
                    version: latest
                });
            }
            return callback(undefined);
        });
    });
}


/**
 * Clear the latest db version info for the specified agency
 * @param  {string}   agency   Agency ID Code
 * @param  {Function} callback Callback function()
 */
function clearDBVersionLatest(agency, callback) {
    store.del("db-version-latest-" + agency, function() {
        store.del("db-version-latest-checked-" + agency, function() {
            return callback();
        });
    });
}


/**
 * Get the timestamp of the time the agency database version 
 * was last checked
 * @param  {string}   agency   Agency ID Code
 * @param  {Function} callback Callback function(timestamp)
 */
function _getDBUpdateLastChecked(agency, callback) {
    store.get("db-version-latest-checked-" + agency, function(err, value) {
        if ( err || !value ) {
            return callback(0);
        }
        return callback(value);
    });
}

/**
 * Save the timestamp of the time the agency database version 
 * was last checked
 * @param  {string}   agency     Agency ID Code
 * @param  {Function} [callback] Callback function(err)
 */
function _saveDBUpdateLastChecked(agency, callback) {
    store.put("db-version-latest-checked-" + agency, new Date().getTime(), callback);
}


/**
 * Get the (stored) version of the latest agency database
 * @param  {string}   agency   Agency ID Code
 * @param  {Function} callback Callback function(err, version)
 */
function _getDBVersionLatest(agency, callback) {
    store.get("db-version-latest-" + agency, function(err, value) {
        if ( err || !value ) {
            return callback(undefined);
        }
        return callback(value);
    });
}

/**
 * Save the version of the latest agency database
 * @param  {string}   agency     Agency ID Code
 * @param  {int}      version    Agency DB Version
 * @param  {Function} [callback] Callback function(err)
 */
function _saveDBVersionLatest(agency, version, callback) {
    store.put("db-version-latest-" + agency, version, callback);
}


module.exports = {
    check: check,
    isUpdateAvailable: isUpdateAvailable,
    clearDBVersionLatest: clearDBVersionLatest
}