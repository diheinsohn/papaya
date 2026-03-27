from sockets.chat_events import register_chat_events


def register_socket_handlers(socketio):
    register_chat_events(socketio)
