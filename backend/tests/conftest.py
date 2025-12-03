"""Фикстуры для модульного тестирования API эндпоинтов пользователей.

Этот модуль содержит фикстуры pytest, используемые для тестирования эндпоинтов,
связанных с пользователями. Фикстуры предоставляют мокированные зависимости
и тестовый клиент с переопределенными зависимостями для изолированного тестирования.

Основные фикстуры:
- event_loop: Создает экземпляр event loop для асинхронных тестов
- mock_user: Создает мокированный объект пользователя с правами администратора
- mock_user_service: Создает мокированный экземпляр UserService
- override_dependencies: Переопределяет зависимости FastAPI на моки
- client: Создает тестовый клиент с переопределенными зависимостями
"""

"""Фикстуры для модульного тестирования API эндпоинтов пользователей.

Этот модуль содержит фикстуры pytest, используемые для тестирования эндпоинтов,
связанных с пользователями. Фикстуры предоставляют мокированные зависимости
и тестовый клиент с переопределенными зависимостями для изолированного тестирования.

Основные фикстуры:
- event_loop: Создает экземпляр event loop для асинхронных тестов
- mock_user: Создает мокированный объект пользователя с правами администратора
- mock_user_service: Создает мокированный экземпляр UserService
- override_dependencies: Переопределяет зависимости FastAPI на моки
- client: Создает тестовый клиент с переопределенными зависимостями
"""

import pytest
import asyncio
from typing import Generator
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, project_root)

from api.v1.dependencies import get_current_user, get_user_service
from services.user_service import UserService
from models.user_model import User
from api.main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.role_id = 1  # admin
    user.first_name = "Test"
    user.last_name = "User"
    user.patronymic = None
    user.telephone = "+79999999999"
    user.coffee_shop_id = 1
    user.hourly_rate = 100.00
    user.assessment_rate = 5
    user.work_experience = 12
    user.data_work_start = "2023-01-01T00:00:00"
    return user


@pytest.fixture
def mock_user_service():
    service = MagicMock(spec=UserService)
    return service


@pytest.fixture
def override_dependencies(mock_user, mock_user_service):

    async def override_get_current_user():
        return mock_user

    async def override_get_user_service() -> MagicMock:
        """Возвращает мокированный сервис для зависимости get_user_service."""
        return mock_user_service

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_user_service] = override_get_user_service

    yield

    app.dependency_overrides.clear()


@pytest.fixture
def client(override_dependencies):
    with TestClient(app) as test_client:
        yield test_client
