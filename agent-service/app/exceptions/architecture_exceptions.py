class ArchitectureError(Exception):
    """Base architecture exception"""

class InvalidInputError(ArchitectureError):
    pass

class AIServiceError(ArchitectureError):
    pass
