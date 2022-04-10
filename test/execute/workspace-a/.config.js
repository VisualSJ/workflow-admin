exports.param = function(params) {
    if (params && params.test) {
        return 'success';
    }
    return 'error';
};

exports.cache = function(params) {
    return [];
};
