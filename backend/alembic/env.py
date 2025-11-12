from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy import create_engine
from alembic import context
from db.base import Base
from core.config import settings
from models.roles import Roles
from models.user import User
from models.schedule import Schedule
from models.coffeshops import CoffeeShops

target_metadata = Base.metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_sync_url():
    # Alembic работает через синхронный драйвер
    return settings.DATABASE_URL.replace("asyncpg", "psycopg2")

def run_migrations_offline():
    context.configure(url=get_sync_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    DATABASE_URL = "postgresql://postgres:postgres@postgres:5432/simplecoffee"
    
    connectable = create_engine(DATABASE_URL) 

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
