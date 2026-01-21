from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.user_connections: dict[int, set[WebSocket]] = {}
        self.coffee_shop_role_connections: dict[int, dict[str, set[WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, coffee_shop_id: int, role: int, user_id: int):
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        role_str = str(role)
        if coffee_shop_id not in self.coffee_shop_role_connections:
            self.coffee_shop_role_connections[coffee_shop_id] = {}
        if role_str not in self.coffee_shop_role_connections[coffee_shop_id]:
            self.coffee_shop_role_connections[coffee_shop_id][role_str] = set()
        self.coffee_shop_role_connections[coffee_shop_id][role_str].add(websocket)

    def disconnect(self, websocket: WebSocket, coffee_shop_id: int, role: int, user_id: int):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        role_str = str(role)
        if (
            coffee_shop_id in self.coffee_shop_role_connections
            and role_str in self.coffee_shop_role_connections[coffee_shop_id]
        ):
            self.coffee_shop_role_connections[coffee_shop_id][role_str].discard(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_role(
        self, message: dict, coffee_shop_id: int, role: int
    ):
        role_str = str(role)
        if (
            coffee_shop_id in self.coffee_shop_role_connections
            and role_str in self.coffee_shop_role_connections[coffee_shop_id]
        ):
            for connection in self.coffee_shop_role_connections[coffee_shop_id][role_str]:
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
        if coffee_shop_id in self.coffee_shop_role_connections:
            for role_connections in self.coffee_shop_role_connections[coffee_shop_id].values():
                for connection in role_connections:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        continue
    
    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.user_connections:
            dead_connections = set()
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_connections.add(ws)

            for ws in dead_connections:
                self.user_connections[user_id].discard(ws)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

manager = ConnectionManager()