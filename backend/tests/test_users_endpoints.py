"""Модульные тесты для API эндпоинтов пользователей.

Этот модуль содержит тесты для эндпоинтов, связанных с пользователями, в FastAPI приложении.
Тесты используют мокированные зависимости для изоляции API слоя от сервисного и репозиторного
слоев, гарантируя тестирование только HTTP интерфейса.

Фикстуры тестов определены в tests/conftest.py и предоставляют:
- mock_user: Мок объект User с правами администратора по умолчанию
- mock_user_service: Мок экземпляр UserService
- client: Экземпляр TestClient с переопределенными зависимостями

Все тесты следуют паттерну Arrange-Act-Assert и проверяют как HTTP ответы,
так и корректные вызовы методов сервиса с правильными аргументами.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from models.roleEnum import RolesEnum


def test_get_current_user_with_mocked_dependencies(mock_user, mock_user_service, client):
    """Простой тест: авторизация мокнутого пользователя"""
    
    user_dict = {
        "id": 1,
        "first_name": "Test",
        "last_name": "User",
        "patronymic": None,
        "email": "test@example.com",
        "telephone": "+79999999999",
        "role_id": RolesEnum.admin,
        "coffee_shop_id": 1,
        "hourly_rate": Decimal("100.00"),
        "assessment_rate": 5,
        "work_experience": 12,
        "data_work_start": datetime(2023, 1, 1).isoformat(),
    }

    mock_user_service.get_user_info.return_value = user_dict

    response = client.get("/api/v1/user/me")

    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == 1
    assert data["email"] == "test@example.com"

    mock_user_service.get_user_info.assert_called_once_with(1)


def test_create_user(mock_user, mock_user_service, client):
    """Тест создания пользователя"""
    
    new_user_data = {
        "first_name": "New",
        "last_name": "User",
        "email": "new@example.com",
        "telephone": "+79998887766",
        "role_id": RolesEnum.manager,
        "coffee_shop_id": 1,
        "hourly_rate": "150.00",
        "hashed_password": "password123",
        "patronymic": None,
        "assessment_rate": 0,
        "work_experience": 0,
        "data_work_start": datetime.now().isoformat(),
    }
    
    created_user_dict = {
        "id": 2,
        "first_name": "New",
        "last_name": "User",
        "patronymic": None,
        "email": "new@example.com",
        "telephone": "+79998887766",
        "role_id": RolesEnum.manager,
        "coffee_shop_id": 1,
        "hourly_rate": Decimal("150.00"),
        "assessment_rate": 0,
        "work_experience": 0,
        "data_work_start": datetime.now().isoformat(),
        "hashed_password": "hashed_password123",
    }

    mock_user_service.create_new_user.return_value = created_user_dict
    mock_user.role_id = RolesEnum.admin

    response = client.post("/api/v1/user/create", json=new_user_data)

    assert response.status_code == 200
    mock_user_service.create_new_user.assert_called_once()


def test_get_all_users(mock_user, mock_user_service, client):
    """Тест получения всех пользователей"""
    
    users_list = [
        {
            "id": 1,
            "first_name": "User1",
            "last_name": "Test",
            "email": "user1@test.com",
            "telephone": "+79991111111",
            "role_id": RolesEnum.barista,
            "coffee_shop_id": 1,
            "hourly_rate": Decimal("100.00"),
        },
        {
            "id": 2,
            "first_name": "User2",
            "last_name": "Test",
            "email": "user2@test.com",
            "telephone": "+79992222222",
            "role_id": RolesEnum.manager,
            "coffee_shop_id": 1,
            "hourly_rate": Decimal("150.00"),
        },
    ]

    mock_user_service.get_all_users.return_value = users_list
    mock_user.role_id = RolesEnum.admin

    response = client.get("/api/v1/user/all_users")

    assert response.status_code == 200
    mock_user_service.get_all_users.assert_called_once_with(mock_user)


def test_delete_user(mock_user, mock_user_service, client):
    """Тест удаления пользователя"""
    
    deleted_user_dict = {
        "id": 2,
        "first_name": "Deleted",
        "last_name": "User",
        "email": "deleted@example.com",
        "telephone": "+79998887766",
        "role_id": RolesEnum.manager,
        "coffee_shop_id": 1,
        "hourly_rate": Decimal("150.00"),
        "hashed_password": "hashed_password",
    }

    mock_user_service.delete_user.return_value = deleted_user_dict
    mock_user.role_id = RolesEnum.admin

    response = client.delete("/api/v1/user/delete_user/2")

    assert response.status_code == 200
    mock_user_service.delete_user.assert_called_once_with(
        id_user_del=2, current_user=mock_user
    )


def test_get_users_for_coffeeshop(mock_user, mock_user_service, client):
    """Тест получения пользователей для кофейни"""
    
    users_list = [
        {
            "id": 1,
            "first_name": "User1",
            "last_name": "Test",
            "email": "user1@test.com",
        },
        {
            "id": 2,
            "first_name": "User2",
            "last_name": "Test",
            "email": "user2@test.com",
        },
    ]

    mock_user_service.get_all_users_for_coffeshop.return_value = users_list
    mock_user.role_id = RolesEnum.admin

    response = client.get("/api/v1/user/get_users_for_coffeshop/1")

    assert response.status_code == 200
    mock_user_service.get_all_users_for_coffeshop.assert_called_once()

    call_args = mock_user_service.get_all_users_for_coffeshop.call_args
    assert call_args[0][0] == 1
    assert call_args[0][1] == mock_user
