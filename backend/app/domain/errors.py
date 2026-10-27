"""Errores de negocio.

Los servicios lanzan estas excepciones sin saber nada de HTTP. La capa web
(app/errors.py) decide qué código de estado corresponde a cada una.
"""
import datetime as dt


class DomainError(Exception):
    """Base de todos los errores de negocio. `message` se muestra al usuario."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    """El recurso no existe o pertenece a otro usuario (no se distingue a propósito)."""


class BusinessRuleError(DomainError):
    """Los datos son válidos en forma, pero rompen una regla del negocio."""


class OdometerConflictError(BusinessRuleError):
    """El odómetro solo avanza: un registro más reciente no puede tener menos millas."""

    def __init__(self, mileage: int, conflict_date: dt.date, conflict_mileage: int):
        self.mileage = mileage
        self.conflict_date = conflict_date
        self.conflict_mileage = conflict_mileage
        super().__init__(
            f"El millaje {mileage:,} no cuadra con el registro del "
            f"{conflict_date:%d/%m/%Y} ({conflict_mileage:,} mi). Revisa la fecha o las millas."
        )


class AuthenticationError(DomainError):
    """No se pudo comprobar la identidad del usuario."""


class ConfigurationError(DomainError):
    """Falta configuración del servidor (no es culpa del usuario)."""
