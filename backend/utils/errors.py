class AppError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code


class AuthenticationError(AppError):
    def __init__(self, message='Authentication required'):
        super().__init__(message, 401)


class AuthorizationError(AppError):
    def __init__(self, message='Permission denied'):
        super().__init__(message, 403)


class ValidationError(AppError):
    def __init__(self, message='Validation error', errors=None):
        super().__init__(message, 400)
        self.errors = errors


class NotFoundError(AppError):
    def __init__(self, message='Resource not found'):
        super().__init__(message, 404)


class ConflictError(AppError):
    def __init__(self, message='Resource already exists'):
        super().__init__(message, 409)
