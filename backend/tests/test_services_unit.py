"""Pruebas de los servicios SIN base de datos ni Flask.

Gracias a la inyección de dependencias, cada servicio se arma con repositorios
falsos en memoria: así se prueba la regla de negocio de forma aislada y rápida.
"""
import datetime as dt
from contextlib import contextmanager
from types import SimpleNamespace

import pytest

from app.domain.errors import (
    AuthenticationError,
    ConfigurationError,
    NotFoundError,
    OdometerConflictError,
)
from app.errors import status_for
from app.services.auth_service import AuthService
from app.services.record_service import VehicleRecordService


class FakeUnitOfWork:
    def __init__(self):
        self.commits = 0

    @contextmanager
    def transaction(self):
        yield
        self.commits += 1


class FakeRecord:
    def __init__(self, **fields):
        self.id = fields.pop("id", None)
        self.__dict__.update(fields)


class FakeRecordRepository:
    model = FakeRecord

    def __init__(self, records=()):
        self.records = list(records)

    def add(self, record):
        record.id = len(self.records) + 1
        self.records.append(record)
        return record

    def get_for_user(self, record_id, user_id):
        return None

    def find_odometer_conflict(self, vehicle_id, record_date, mileage, exclude_id=None):
        for r in self.records:
            if r.id == exclude_id:
                continue
            if (r.date < record_date and r.mileage > mileage) or (r.date > record_date and r.mileage < mileage):
                return r
        return None


class FakeVehicleService:
    def get(self, user_id, vehicle_id):
        if vehicle_id != 1:
            raise NotFoundError("Vehículo no encontrado")
        return SimpleNamespace(id=1)


def make_service(existing=()):
    repo = FakeRecordRepository(existing)
    uow = FakeUnitOfWork()
    return VehicleRecordService(repo, FakeVehicleService(), [repo], uow), repo, uow


def test_registrar_guarda_en_una_transaccion():
    service, repo, uow = make_service()
    record = service.create(user_id=7, vehicle_id=1, data={"date": dt.date(2026, 1, 10), "mileage": 45000})

    assert record.id == 1 and record.vehicle_id == 1
    assert uow.commits == 1


def test_el_odometro_no_retrocede_y_no_se_guarda_nada():
    previous = FakeRecord(id=1, date=dt.date(2026, 1, 10), mileage=45000)
    service, repo, uow = make_service([previous])

    with pytest.raises(OdometerConflictError) as error:
        service.create(user_id=7, vehicle_id=1, data={"date": dt.date(2026, 2, 1), "mileage": 44000})

    assert error.value.conflict_mileage == 45000
    assert "45,000" in error.value.message
    assert uow.commits == 0
    assert len(repo.records) == 1


def test_vehiculo_ajeno_o_inexistente():
    service, _, _ = make_service()
    with pytest.raises(NotFoundError):
        service.create(user_id=7, vehicle_id=99, data={"date": dt.date(2026, 1, 1), "mileage": 1})


def test_registro_inexistente():
    service, _, _ = make_service()
    with pytest.raises(NotFoundError, match="Registro no encontrado"):
        service.get(user_id=7, record_id=123)


def auth_service(verifier, client_id="cliente.apps.googleusercontent.com"):
    return AuthService(users=None, uow=FakeUnitOfWork(), google_client_id=client_id, verify_google_token=verifier)


def test_login_rechaza_token_invalido_y_correo_sin_verificar():
    def invalid(credential, client_id):
        raise ValueError("firma inválida")

    with pytest.raises(AuthenticationError, match="inválido"):
        auth_service(invalid).login_with_google("x")

    unverified = auth_service(lambda c, i: {"email": "a@b.com", "email_verified": False, "sub": "1"})
    with pytest.raises(AuthenticationError, match="verificado"):
        unverified.login_with_google("x")


def test_login_sin_client_id_es_error_de_configuracion():
    with pytest.raises(ConfigurationError):
        auth_service(lambda c, i: {}, client_id=None).login_with_google("x")


@pytest.mark.parametrize(
    ("error", "status"),
    [
        (NotFoundError("x"), 404),
        (OdometerConflictError(1, dt.date(2026, 1, 1), 2), 400),
        (AuthenticationError("x"), 401),
        (ConfigurationError("x"), 500),
    ],
)
def test_cada_error_de_negocio_tiene_su_codigo_http(error, status):
    assert status_for(error) == status
