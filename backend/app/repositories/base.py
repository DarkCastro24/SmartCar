class BaseRepository:
    """Operaciones comunes con la base de datos. Cada repositorio define su `model`.

    Los repositorios solo leen y guardan datos; las reglas de negocio van en los servicios.
    """

    model = None

    def __init__(self, session):
        self.session = session

    def get(self, obj_id):
        return self.session.get(self.model, obj_id)

    def add(self, obj):
        self.session.add(obj)
        self.session.commit()
        return obj

    def update(self, obj, data: dict):
        for field, value in data.items():
            setattr(obj, field, value)
        self.session.commit()
        return obj

    def delete(self, obj):
        self.session.delete(obj)
        self.session.commit()
