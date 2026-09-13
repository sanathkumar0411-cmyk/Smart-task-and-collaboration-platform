const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode;

    if (statusCode === 200) {
        statusCode = 500;
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
    }

    // Duplicate MongoDB field
    if (err.code === 11000) {
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV !== "production" && {
            stack: err.stack,
        }),
    });
};

module.exports = {
    notFound,
    errorHandler,
};
