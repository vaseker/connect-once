'use strict';

function Connection() {
    var args = Array.prototype.slice.apply(arguments);

    this.options = (args.length > 1 && typeof args[0] === 'object') ? args.shift() : {};

    if (typeof args[0] !== 'function') { throw new Error('Provided callback is not a function'); }
    this.connect = args.shift();
    this.arguments = args;
    this.connect.apply(
        this.connect,
        [].concat(args || []).concat(this.retry.bind(this))
    );
}

Connection.prototype = Object.create(require('events').EventEmitter.prototype);

Connection.prototype.retry = function retry() {
    var args = Array.prototype.slice.call(arguments);
    var error = args[0];
    if (!error) {
        this.result = args;
        return this.emit.apply(this,
            ['available']
            .concat(this.result)
        );
    }

    this.retries --;
    if (this.retries === 0) { return this.emit('error', error); }

    this.emit('reconnect', error);
    return setTimeout(function () {
        this.connect.apply(this.connect,
            [].concat(this.arguments || [])
            .concat([this.retry.bind(this)])
        );
    }.bind(this), this.options.reconnectWait);
};

Connection.prototype.when = function when() {
    var args = Array.prototype.slice.call(arguments);
    if (this.result &&
        args.length === 2 && // if it when('available', funciton)
        args[0] === 'available' &&
        typeof args[1] === 'function') { // then apply cached results
        return args[1].apply(null, this.result);
    }
    this.once.apply(this, args);
};

module.exports = Connection;
