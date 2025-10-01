/**
 * SharePoint IPC Channels
 * Defines the channels for SharePoint operations
 */

export const SHAREPOINT_CHANNELS = {
  ADD_ROMM_ENTRY: "sharepoint:add-romm-entry",
  UPDATE_ROMM_ENTRY: "sharepoint:update-romm-entry",
  READ_ROMM_LIBRARY: "sharepoint:read-romm-library",
  READ_ROMM_LIBRARY_BY_WORKSPACE: "sharepoint:read-romm-library-by-workspace",
  UPLOAD_FILE: "sharepoint:upload-file",
  LOAD_CLOUD_FILES: "sharepoint:load-cloud-files",
  LOAD_LEDGER_DATA: "sharepoint:load-ledger-data",
} as const;

export type SharePointChannels = typeof SHAREPOINT_CHANNELS;
