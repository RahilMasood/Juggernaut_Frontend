import React from 'react';
import { CloudStorageManager } from '../components/cloud/CloudStorageManager';

export function CloudStoragePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cloud Storage</h1>
        <p className="text-muted-foreground mt-2">
          Manage your files in Azure Blob Storage containers
        </p>
      </div>
      
      <CloudStorageManager />
    </div>
  );
}


