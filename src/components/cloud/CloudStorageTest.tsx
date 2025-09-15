"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export function CloudStorageTest() {
  const [cloudStatus, setCloudStatus] = useState<{
    available: boolean;
    error?: string;
  }>({ available: false });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCloudAvailability();
  }, []);

  const checkCloudAvailability = () => {
    console.log('Checking cloud availability...');
    console.log('window.cloud:', window.cloud);
    console.log('typeof window.cloud:', typeof window.cloud);
    
    if (window.cloud && typeof window.cloud.list === 'function') {
      setCloudStatus({ available: true });
      console.log('Cloud storage is available!');
    } else {
      setCloudStatus({ 
        available: false, 
        error: 'Cloud storage not available. window.cloud is not properly initialized.' 
      });
      console.error('Cloud storage not available:', window.cloud);
    }
  };

  const testCloudConnection = async () => {
    if (!window.cloud) {
      setTestResult({
        success: false,
        message: 'Cloud storage not available',
        error: 'window.cloud is undefined'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Testing cloud connection...');
      
      // Test file operations first
      console.log('Testing file operations...');
      const testContent = '{"test": "data"}';
      const testFilename = `test_${Date.now()}.json`;
      
      // Test writeTempFile
      const writeResult = await window.cloud.writeTempFile(testContent, testFilename);
      if (!writeResult.success) {
        throw new Error(`Write temp file failed: ${writeResult.error}`);
      }
      
      // Test readTempFile
      const readResult = await window.cloud.readTempFile(writeResult.filePath!);
      if (!readResult.success) {
        throw new Error(`Read temp file failed: ${readResult.error}`);
      }
      
      // Test deleteTempFile
      const deleteResult = await window.cloud.deleteTempFile(writeResult.filePath!);
      if (!deleteResult.success) {
        console.warn(`Delete temp file failed: ${deleteResult.error}`);
      }
      
      console.log('File operations test passed');
      
      // Test listing files from juggernaut container
      const result = await window.cloud.list({ container: 'juggernaut' });
      console.log('Cloud list result:', result);
      
      if (result.success) {
        setTestResult({
          success: true,
          message: `Cloud connection successful! Found ${result.files?.length || 0} files in juggernaut container. File operations also working.`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Cloud connection failed',
          error: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Cloud test error:', error);
      setTestResult({
        success: false,
        message: 'Cloud connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Cloud Storage Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cloud Availability Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Cloud Storage Available:</span>
            <div className="flex items-center gap-2">
              {cloudStatus.available ? (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-400 border-red-400">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Available
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={checkCloudAvailability}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {cloudStatus.error && (
            <div className="text-sm text-red-400 bg-red-400/10 p-2 rounded">
              {cloudStatus.error}
            </div>
          )}

          {/* Test Connection Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={testCloudConnection}
              disabled={!cloudStatus.available || loading}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Cloud Connection'
              )}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`text-sm p-3 rounded ${
              testResult.success 
                ? 'text-green-400 bg-green-400/10' 
                : 'text-red-400 bg-red-400/10'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
              {testResult.error && (
                <div className="text-xs mt-1 opacity-80">
                  Error: {testResult.error}
                </div>
              )}
            </div>
          )}

          {/* Debug Information */}
          <details className="text-xs text-white/60">
            <summary className="cursor-pointer hover:text-white/80">
              Debug Information
            </summary>
            <div className="mt-2 space-y-1">
              <div>window.cloud: {window.cloud ? 'defined' : 'undefined'}</div>
              <div>typeof window.cloud: {typeof window.cloud}</div>
              <div>window.cloud.list: {window.cloud?.list ? 'function' : 'undefined'}</div>
              <div>window.cloud.upload: {window.cloud?.upload ? 'function' : 'undefined'}</div>
              <div>window.cloud.writeTempFile: {window.cloud?.writeTempFile ? 'function' : 'undefined'}</div>
              <div>window.cloud.readTempFile: {window.cloud?.readTempFile ? 'function' : 'undefined'}</div>
              <div>window.cloud.deleteTempFile: {window.cloud?.deleteTempFile ? 'function' : 'undefined'}</div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
