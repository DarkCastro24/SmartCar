import pytest

from app.extensions import db
from app.models import Vehicle
from app.repositories import UnitOfWork, VehicleRepository


def test_si_algo_falla_no_se_guarda_nada(app, make_user):
    user, _ = make_user()
    uow = UnitOfWork(db.session)
    vehicles = VehicleRepository(db.session)

    with pytest.raises(RuntimeError):
        with uow.transaction():
            vehicles.add(Vehicle(user_id=user.id, make="Toyota", model="Corolla"))
            raise RuntimeError("falla a mitad del caso de uso")

    assert db.session.query(Vehicle).count() == 0


def test_la_transaccion_confirma_todos_los_pasos(app, make_user):
    user, _ = make_user()
    uow = UnitOfWork(db.session)
    vehicles = VehicleRepository(db.session)

    with uow.transaction():
        vehicles.add(Vehicle(user_id=user.id, make="Toyota", model="Corolla"))
        vehicles.add(Vehicle(user_id=user.id, make="Honda", model="Civic"))

    db.session.expire_all()
    assert db.session.query(Vehicle).count() == 2
