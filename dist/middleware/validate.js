"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schema, target = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
            return;
        }
        // Replace request data with parsed/transformed data
        req[target] = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map