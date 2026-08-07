from enum import StrEnum

from sqlalchemy import Enum


def enum_column(enum_cls: type[StrEnum], name: str) -> Enum:
    """A VARCHAR column with a CHECK constraint, not a native Postgres enum.

    `values_callable` stores the member *values* ("pitch_deck"), not the member
    names ("PITCH_DECK"), so the database is readable without the Python code.
    """
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        values_callable=lambda e: [member.value for member in e],
    )
