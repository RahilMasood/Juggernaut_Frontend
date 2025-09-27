/**
 * SharePoint IPC Channels
 * Defines the channels for SharePoint operations
 */

export const SHAREPOINT_CHANNELS = {
  ADD_ROMM_ENTRY: "sharepoint:add-romm-entry",
  READ_ROMM_LIBRARY: "sharepoint:read-romm-library",
} as const;

export type SharePointChannels = typeof SHAREPOINT_CHANNELS;
