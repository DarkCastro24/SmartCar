import click

from app.services.demo_data import create_demo_vehicle


def register_commands(app):
    @app.cli.command("dev-token")
    @click.argument("email")
    def dev_token(email):
        """Crea el usuario si no existe y muestra un JWT para probar la API sin frontend.

        Uso: flask dev-token tu_correo@gmail.com
        """
        user = app.auth_service.get_or_create_user(email)
        token = app.auth_service.create_token(user)
        click.echo(f"Usuario: {user.email} (id {user.id})")
        click.echo(f"Authorization: Bearer {token}")

    @app.cli.command("seed-demo")
    @click.argument("email")
    def seed_demo(email):
        """Crea un vehículo con un año de datos de ejemplo para ese usuario.

        Uso: flask seed-demo tu_correo@gmail.com
        """
        user = app.auth_service.get_or_create_user(email)
        vehicle = create_demo_vehicle(user)
        click.echo(
            f"Listo: vehículo {vehicle.id} ({vehicle.make} {vehicle.model}) con "
            f"{len(vehicle.fuel_logs)} cargas y {len(vehicle.maintenance_records)} mantenimientos."
        )
