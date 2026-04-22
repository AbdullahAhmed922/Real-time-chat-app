import { useEffect, useState, useMemo } from "react";
import { socket } from "../lib/socket";
import api from "../lib/api";

export type RoomItem = {
  _id?: string;
  name: string;
  description?: string;
  createdBy?: string;
  members?: string[];
  type: "room";
};

export type ConversationItem = {
  _id?: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string | null;
  type: "dm";
  otherUser: string;
};

export type SidebarItem = RoomItem | ConversationItem;

export function useSidebar(username: string | null) {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch rooms and conversations
  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        const [roomsRes, convsRes] = await Promise.all([
          api.get("/rooms/my"),
          api.get("/conversations"),
        ]);

        setRooms(
          roomsRes.data.map((r: any) => ({
            ...r,
            type: "room" as const,
          }))
        );

        const convItems: ConversationItem[] = convsRes.data.map((c: any) => ({
            ...c,
            type: "dm" as const,
            otherUser: c.participants.find((p: string) => p !== username) || "",
          }));

        // Deduplicate by otherUser (keep first = most recent due to sort)
        const seen = new Set<string>();
        const uniqueConvs = convItems.filter((c) => {
          if (seen.has(c.otherUser)) return false;
          seen.add(c.otherUser);
          return true;
        });

        setConversations(uniqueConvs);
      } catch (err) {
        console.error("Failed to fetch sidebar data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  // Listen for real-time conversation updates
  useEffect(() => {
    if (!username) return;

    const handleConversationUpdated = (data: {
      participant: string;
      lastMessage: string;
      lastMessageAt: string;
    }) => {
      setConversations((prev) => {
        const existing = prev.find((c) => c.otherUser === data.participant);
        if (existing) {
          return prev
            .map((c) =>
              c.otherUser === data.participant
                ? {
                    ...c,
                    lastMessage: data.lastMessage,
                    lastMessageAt: data.lastMessageAt,
                  }
                : c
            )
            .sort(
              (a, b) =>
                new Date(b.lastMessageAt || 0).getTime() -
                new Date(a.lastMessageAt || 0).getTime()
            );
        } else {
          return [
            {
              _id: undefined,
              participants: [username, data.participant].sort(),
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
              type: "dm" as const,
              otherUser: data.participant,
            },
            ...prev,
          ];
        }
      });
    };

    // Room deleted
    const handleRoomDeleted = (data: { roomName: string }) => {
      setRooms((prev) => prev.filter((r) => r.name !== data.roomName));
    };

    // Room renamed
    const handleRoomRenamed = (data: { oldName: string; newName: string }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.name === data.oldName ? { ...r, name: data.newName } : r
        )
      );
    };

    // Conversation deleted
    const handleConversationDeleted = (data: { otherUser: string }) => {
      setConversations((prev) =>
        prev.filter((c) => c.otherUser !== data.otherUser)
      );
    };

    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("room_deleted", handleRoomDeleted);
    socket.on("room_renamed", handleRoomRenamed);
    socket.on("conversation_deleted", handleConversationDeleted);

    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("room_deleted", handleRoomDeleted);
      socket.off("room_renamed", handleRoomRenamed);
      socket.off("conversation_deleted", handleConversationDeleted);
    };
  }, [username]);

  // Listen for room-left events from ChatWindow
  useEffect(() => {
    const handleRoomLeft = (e: Event) => {
      const { roomName } = (e as CustomEvent).detail;
      setRooms((prev) => prev.filter((r) => r.name !== roomName));
    };
    window.addEventListener("room-left", handleRoomLeft);
    return () => window.removeEventListener("room-left", handleRoomLeft);
  }, []);

  // Filtered and combined sidebar items
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [rooms, searchQuery]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.otherUser.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const addRoom = (room: RoomItem) => {
    setRooms((prev) => [...prev, room]);
  };

  const addConversation = (otherUser: string) => {
    const exists = conversations.find((c) => c.otherUser === otherUser);
    if (!exists) {
      setConversations((prev) => [
        {
          _id: undefined,
          participants: [username!, otherUser].sort(),
          lastMessage: "",
          lastMessageAt: new Date().toISOString(),
          type: "dm" as const,
          otherUser,
        },
        ...prev,
      ]);
    }
  };

  const removeRoom = (roomName: string) => {
    setRooms((prev) => prev.filter((r) => r.name !== roomName));
  };

  const renameRoomLocal = (oldName: string, newName: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.name === oldName ? { ...r, name: newName } : r))
    );
  };

  const removeConversation = (otherUser: string) => {
    setConversations((prev) => prev.filter((c) => c.otherUser !== otherUser));
  };

  return {
    rooms: filteredRooms,
    allRooms: rooms,
    conversations: filteredConversations,
    loading,
    searchQuery,
    setSearchQuery,
    addRoom,
    addConversation,
    removeRoom,
    renameRoomLocal,
    removeConversation,
  };
}
