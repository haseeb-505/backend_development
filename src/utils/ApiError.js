class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = "",
    ){
        // overwrite part
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.data = null;
        this.success = false; //that is the core reason we are writing it for error
        this.errors = errors;

        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }