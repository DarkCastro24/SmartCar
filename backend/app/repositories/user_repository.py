from sqlalchemy import select

from app.models import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    model = User

    def get_by_email(self, email):
        return self.session.scalars(select(User).where(User.email == email)).first()
