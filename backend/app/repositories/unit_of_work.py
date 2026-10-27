from contextlib import contextmanager


class UnitOfWork:
    """Controla la transacción de un caso de uso (patrón Unit of Work).

    Los repositorios solo agregan, cambian o borran objetos en la sesión; el
    servicio decide cuándo se confirma todo junto:

        with self.uow.transaction():
            self.repo.add(...)
            self.otro_repo.delete(...)

    Si algo falla dentro del bloque no se guarda nada (rollback).
    """

    def __init__(self, session):
        self.session = session

    @contextmanager
    def transaction(self):
        try:
            yield
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
