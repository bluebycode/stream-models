(function (container) {
    'use strict';

    container.Cluster = {
        host: 'localhost',
        port: 7777
    };

    container.Client = {
        retryIfFails: true, // retry policy!
        retryTimeBetween: 3000 //3 seconds
    };

})(exports);
