function notFoundHandler(req, res) {
    return res.status(404).json({
        error: 'The requested resource was not found',
        code: 'NOT_FOUND',
        details: {}
    });
}

module.exports = {
    notFoundHandler
};