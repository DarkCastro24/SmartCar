import datetime as dt

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.common import TimestampMixin, iso


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True)  # id fijo de Google
    name: Mapped[str | None] = mapped_column(String(120))
    picture: Mapped[str | None] = mapped_column(String(500))
    last_login_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))

    vehicles: Mapped[list["Vehicle"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "picture": self.picture,
            "created_at": iso(self.created_at),
        }
