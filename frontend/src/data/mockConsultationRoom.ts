// This file is kept for backward compatibility
// The actual constants have been moved to consultationConstants.ts

import type { Room, RoomStatus } from "@/types/consultation-states";
import { DEFAULT_ROOMS, ROOM_STATUS_STYLES } from "./consultationConstants";

export const rooms: Room[] = DEFAULT_ROOMS;

export const badgeClass: Record<RoomStatus, string> = ROOM_STATUS_STYLES;

