import { ipcMain } from "electron";

export function testCloudHandlers() {
  console.log('Testing cloud handlers registration...');
  
  // Check if handlers are registered
  const handlers = ipcMain.listenerCount('cloud:write-temp-file');
  console.log('cloud:write-temp-file handlers:', handlers);
  
  const readHandlers = ipcMain.listenerCount('cloud:read-temp-file');
  console.log('cloud:read-temp-file handlers:', readHandlers);
  
  const deleteHandlers = ipcMain.listenerCount('cloud:delete-temp-file');
  console.log('cloud:delete-temp-file handlers:', deleteHandlers);
  
  // List all registered handlers
  const allHandlers = ipcMain.eventNames();
  console.log('All registered IPC handlers:', allHandlers);
  
  const cloudHandlers = allHandlers.filter(name => 
    typeof name === 'string' && name.startsWith('cloud:')
  );
  console.log('Cloud-related handlers:', cloudHandlers);
}
