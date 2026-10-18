import click


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
