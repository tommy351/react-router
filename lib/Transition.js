/* jshint -W058 */

'use strict';

var Cancellation = require('./Cancellation');
var Redirect = require('./Redirect');

/**
 * Encapsulates a transition to a given path.
 *
 * The willTransitionTo and willTransitionFrom handlers receive
 * an instance of this class as their first argument.
 */
function Transition(path, retry) {
  this.path = path;
  this.abortReason = null;
  // TODO: Change this to router.retryTransition(transition)
  this.retry = retry.bind(this);
}

Transition.prototype.abort = function (reason) {
  if (this.abortReason == null) this.abortReason = reason || 'ABORT';
};

Transition.prototype.redirect = function (to, params, query) {
  this.abort(new Redirect(to, params, query));
};

Transition.prototype.cancel = function () {
  this.abort(new Cancellation());
};

Transition.from = function (transition, routes, components, callback) {
  var promise = Promise.resolve();

  routes.forEach(function (route, index) {
    if (typeof route.onLeave !== 'function') return;

    promise = promise.then(function () {
      if (route.onLeave.length < 3) {
        return route.onLeave(transition, components[index]);
      }

      return new Promise(function (resolve, reject) {
        route.onLeave(transition, components[index], function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });
  });

  return promise.then(function (result) {
    callback(null, result);
  }, callback);
};

Transition.to = function (transition, routes, params, query, callback) {
  var promise = Promise.resolve();
  var reversedRoutes = routes.slice().reverse();

  reversedRoutes.forEach(function (route) {
    if (typeof route.onEnter !== 'function') return;

    promise = promise.then(function () {
      if (route.onEnter.length < 4) {
        return route.onEnter(transition, params, query);
      }

      return new Promise(function (resolve, reject) {
        route.onEnter(transition, params, query, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });
  });

  return promise.then(function (result) {
    callback(null, result);
  }, callback);
};

module.exports = Transition;