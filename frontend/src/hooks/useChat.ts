import { useEffect, useState, useCallback, useRef } from "react";
import { socket } from "../lib/socket";

export type Message = {
  _id?: string;
  username: string;
  room: string;
  content: string;
  chatType?: string;
  recipientUsername?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
};

export type SystemEvent = {
  type: "joined" | "left";
  username: string;
  message: string;
};

export type ChatEntry =
  | { kind: "message"; data: Message }
  | { kind: "system"; data: SystemEvent };

type UseChatOptions = {
  mode: "group" | "dm";
  room?: string;
  username: string;
  recipient?: string;
};

export function useChat({ mode, room, username, recipient }: UseChatOptions) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [connected, setConnected] = useState(socket.connected);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const currentRoom = useRef<string | null>(null);

  // Compute the actual room name
  const actualRoom =
    mode === "dm" && recipient
      ? `dm:${[username, recipient].sort().join(":")}`
      : room || "";

  useEffect(() => {
    if (!username) return;
    if (mode === "group" && !room) return;
    if (mode === "dm" && !recipient) return;

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    if (socket.connected) {
      setConnected(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Join room / DM
    if (mode === "group" && room) {
      socket.emit("join_room", { room, username });
      currentRoom.current = room;
    } else if (mode === "dm" && recipient) {
      socket.emit("join_private", { sender: username, recipient });
      currentRoom.current = actualRoom;
    }

    // History handlers
    const handleChatHistory = (history: Message[]) => {
      setEntries(history.map((msg) => ({ kind: "message", data: msg })));
    };
    const handlePrivateHistory = (history: Message[]) => {
      setEntries(history.map((msg) => ({ kind: "message", data: msg })));
    };

    // New message handlers
    const handleNewMessage = (msg: Message) => {
      setEntries((prev) => [...prev, { kind: "message", data: msg }]);
    };
    const handlePrivateMessage = (msg: Message) => {
      // Only add if it's for our current DM room
      if (msg.room === actualRoom) {
        setEntries((prev) => [...prev, { kind: "message", data: msg }]);
      }
    };

    // System events
    const handleUserJoined = (data: { username: string; message: string }) => {
      setEntries((prev) => [
        ...prev,
        { kind: "system", data: { type: "joined", ...data } },
      ]);
    };
    const handleUserLeft = (data: { username: string; message: string }) => {
      setEntries((prev) => [
        ...prev,
        { kind: "system", data: { type: "left", ...data } },
      ]);
    };

    // Edit/delete handlers
    const handleMessageEdited = (data: {
      messageId: string;
      newContent: string;
      isEdited: boolean;
    }) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (
            entry.kind === "message" &&
            entry.data._id === data.messageId
          ) {
            return {
              ...entry,
              data: {
                ...entry.data,
                content: data.newContent,
                isEdited: data.isEdited,
              },
            };
          }
          return entry;
        })
      );
    };

    const handleMessageDeleted = (data: {
      messageId: string;
      deleteFor: "me" | "everyone";
    }) => {
      if (data.deleteFor === "everyone") {
        setEntries((prev) =>
          prev.map((entry) => {
            if (
              entry.kind === "message" &&
              entry.data._id === data.messageId
            ) {
              return {
                ...entry,
                data: {
                  ...entry.data,
                  content: "This message was deleted",
                  isDeleted: true,
                },
              };
            }
            return entry;
          })
        );
      } else {
        // Delete for me — just remove from view
        setEntries((prev) =>
          prev.filter(
            (entry) =>
              !(
                entry.kind === "message" &&
                entry.data._id === data.messageId
              )
          )
        );
      }
    };

    // Online presence
    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users);
    const handleUserOnline = (data: { username: string }) => {
      setOnlineUsers((prev) =>
        prev.includes(data.username) ? prev : [...prev, data.username]
      );
    };
    const handleUserOffline = (data: { username: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u !== data.username));
    };

    socket.on("chat_history", handleChatHistory);
    socket.on("private_history", handlePrivateHistory);
    socket.on("new_message", handleNewMessage);
    socket.on("private_message", handlePrivateMessage);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      if (mode === "group" && room) {
        socket.emit("leave_room", { room, username });
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat_history", handleChatHistory);
      socket.off("private_history", handlePrivateHistory);
      socket.off("new_message", handleNewMessage);
      socket.off("private_message", handlePrivateMessage);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      currentRoom.current = null;
    };
  }, [mode, room, username, recipient, actualRoom]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      if (mode === "group" && room) {
        socket.emit("send_message", { room, username, content: content.trim() });
      } else if (mode === "dm" && recipient) {
        socket.emit("send_private_message", {
          sender: username,
          recipient,
          content: content.trim(),
        });
      }
    },
    [mode, room, username, recipient]
  );

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      socket.emit("edit_message", {
        messageId,
        username,
        newContent,
        room: actualRoom,
      });
    },
    [username, actualRoom]
  );

  const deleteMessage = useCallback(
    (messageId: string, deleteFor: "me" | "everyone") => {
      socket.emit("delete_message", {
        messageId,
        username,
        room: actualRoom,
        deleteFor,
      });
    },
    [username, actualRoom]
  );

  return {
    entries,
    connected,
    onlineUsers,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}
