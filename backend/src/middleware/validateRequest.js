const validateRequest = (requiredFields = []) => {
    return (req, res, next) => {
        const missingFields = [];

        requiredFields.forEach((field) => {
            if (
                req.body[field] === undefined ||
                req.body[field] === null ||
                req.body[field] === ""
            ) {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
                fields: missingFields,
            });
        }

        next();
    };
};

module.exports = validateRequest;
