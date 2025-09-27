/**
 * SharePoint IPC Channels
 * Defines the channels for SharePoint operations
 */

export const SHAREPOINT_CHANNELS = {
  ADD_ROMM_ENTRY: "sharepoint:add-romm-entry",
} as const;

export type SharePointChannels = typeof SHAREPOINT_CHANNELS;
