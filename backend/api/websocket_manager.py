from fastapi import WebSocket
from typing import Dict, List, Set


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Dict[str, Set[WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, coffee_shop_id: int, role: int):
        role_str = str(role)
        if coffee_shop_id not in self.active_connections:
            self.active_connections[coffee_shop_id] = {}
        if role_str not in self.active_connections[coffee_shop_id]:
            self.active_connections[coffee_shop_id][role_str] = set()
        self.active_connections[coffee_shop_id][role_str].add(websocket)

    def disconnect(self, websocket: WebSocket, coffee_shop_id: int, role: int):
        role_str = str(role)
        if (
            coffee_shop_id in self.active_connections
            and role_str in self.active_connections[coffee_shop_id]
        ):
            self.active_connections[coffee_shop_id][role_str].discard(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_role(
        self, message: dict, coffee_shop_id: int, role: int
    ):
        role_str = str(role)
        if (
            coffee_shop_id in self.active_connections
            and role_str in self.active_connections[coffee_shop_id]
        ):
            for connection in self.active_connections[coffee_shop_id][role_str]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, coffee_shop_id, role_str)

    async def broadcast_to_managers_and_admins(self, message: dict, coffee_shop_id: int):
        await self.broadcast_to_role(message, coffee_shop_id, 2)
        await self.broadcast_to_role(message, coffee_shop_id, 1)

    async def broadcast_to_baristas(self, message: dict, coffee_shop_id: int):
        await self.broadcast_to_role(message, coffee_shop_id, 3)

    async def broadcast_to_coffee_shop(self, message: dict, coffee_shop_id: int):
        if coffee_shop_id in self.active_connections:
            for role_connections in self.active_connections[coffee_shop_id].values():
                for connection in role_connections:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        continue


manager = ConnectionManager()