from typing import Any, ClassVar, Generic, TypeVar

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Operaciones comunes con la base de datos (patrón Repository).

    Los repositorios solo leen y preparan cambios: NO hacen commit. La
    transacción la controla el servicio con UnitOfWork, así un caso de uso
    con varios pasos se guarda completo o no se guarda nada.
    """

    model: ClassVar[type]

    def __init__(self, session):
        self.session = session

    def get(self, obj_id: int) -> T | None:
        return self.session.get(self.model, obj_id)

    def add(self, obj: T) -> T:
        self.session.add(obj)
        self.session.flush()  # asigna el id sin confirmar la transacción
        return obj

    def update(self, obj: T, data: dict[str, Any]) -> T:
        for field, value in data.items():
            setattr(obj, field, value)
        self.session.flush()
        return obj

    def delete(self, obj: T) -> None:
        self.session.delete(obj)
        self.session.flush()
