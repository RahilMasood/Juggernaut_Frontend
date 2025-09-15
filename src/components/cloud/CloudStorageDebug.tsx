"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, TestTube } from "lucide-react";

export function CloudStorageDebug() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    success: boolean;
    message: string;
    error?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: "Cloud Availability",
        test: async () => {
          if (!window.cloud) {
            throw new Error('window.cloud is undefined');
          }
          return 'Cloud context is available';
        }
      },
      {
        name: "File Operations - Write",
        test: async () => {
          if (!window.cloud?.writeTempFile) {
            throw new Error('writeTempFile not available');
          }
          const result = await window.cloud.writeTempFile('{"test": "data"}', 'test_write.json');
          if (!result.success) {
            throw new Error(result.error || 'Write failed');
          }
          return `File written successfully: ${result.filePath}`;
        }
      },
      {
        name: "File Operations - Read",
        test: async () => {
          if (!window.cloud?.readTempFile) {
            throw new Error('readTempFile not available');
          }
          // First write a file
          const writeResult = await window.cloud.writeTempFile('{"test": "read_data"}', 'test_read.json');
          if (!writeResult.success) {
            throw new Error('Failed to write test file');
          }
          
          const result = await window.cloud.readTempFile(writeResult.filePath!);
          if (!result.success) {
            throw new Error(result.error || 'Read failed');
          }
          
          // Clean up
          await window.cloud.deleteTempFile(writeResult.filePath!);
          
          return `File read successfully: ${result.content}`;
        }
      },
      {
        name: "File Operations - Delete",
        test: async () => {
          if (!window.cloud?.deleteTempFile) {
            throw new Error('deleteTempFile not available');
          }
          // First write a file
          const writeResult = await window.cloud.writeTempFile('{"test": "delete_data"}', 'test_delete.json');
          if (!writeResult.success) {
            throw new Error('Failed to write test file');
          }
          
          const result = await window.cloud.deleteTempFile(writeResult.filePath!);
          if (!result.success) {
            throw new Error(result.error || 'Delete failed');
          }
          
          return 'File deleted successfully';
        }
      },
      {
        name: "Cloud List",
        test: async () => {
          if (!window.cloud?.list) {
            throw new Error('list not available');
          }
          const result = await window.cloud.list({ container: 'juggernaut' });
          if (!result.success) {
            throw new Error(result.error || 'List failed');
          }
          return `Found ${result.files?.length || 0} files in juggernaut container`;
        }
      },
      {
        name: "Cloud Direct Upload Test",
        test: async () => {
          if (!window.cloud?.directUpload) {
            throw new Error('Direct upload not available');
          }
          
          const testData = {
            InternalControls: {
              Control: {
                ControlSummary: {
                  ControlDetails: {
                    ControlID: "TEST_001",
                    ControlName: "Test Control",
                    WorkspaceLinked: ["Test Workspace"],
                    ControlDescription: "This is a test control"
                  },
                  ControlAttributes: {
                    TypeOfControl: "Direct",
                    Nature: "Manual",
                    Approach: "Preventive",
                    Type: ["Verification"]
                  }
                }
              }
            }
          };
          
          const fileName = `Libraries_InternalControlResponses_TEST_001.json`;
          const fileContent = JSON.stringify(testData, null, 2);
          
          // Direct upload to cloud
          const uploadResult = await window.cloud.directUpload(
            fileContent,
            fileName,
            'juggernaut',
            'Test Control Upload'
          );
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
          }
          
          return `Test control uploaded successfully with code: ${uploadResult.code}`;
        }
      },
      {
        name: "Cloud Upload Test (Fallback)",
        test: async () => {
          if (!window.cloud?.upload || !window.cloud?.writeTempFile || !window.cloud?.deleteTempFile) {
            throw new Error('Cloud operations not available');
          }
          
          const testData = {
            InternalControls: {
              Control: {
                ControlSummary: {
                  ControlDetails: {
                    ControlID: "TEST_002",
                    ControlName: "Test Control 2",
                    WorkspaceLinked: ["Test Workspace"],
                    ControlDescription: "This is a test control 2"
                  },
                  ControlAttributes: {
                    TypeOfControl: "Direct",
                    Nature: "Manual",
                    Approach: "Preventive",
                    Type: ["Verification"]
                  }
                }
              }
            }
          };
          
          const fileName = `Libraries_InternalControlResponses_TEST_002.json`;
          const fileContent = JSON.stringify(testData, null, 2);
          
          // Write temp file
          const writeResult = await window.cloud.writeTempFile(fileContent, `temp_${fileName}`);
          if (!writeResult.success) {
            throw new Error('Failed to write temp file');
          }
          
          // Upload to cloud
          const uploadResult = await window.cloud.upload({
            container: 'juggernaut',
            filePath: writeResult.filePath!,
            reference: 'Test Control Upload 2'
          });
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
          }
          
          // Clean up temp file
          await window.cloud.deleteTempFile(writeResult.filePath!);
          
          return `Test control uploaded successfully with code: ${uploadResult.code}`;
        }
      }
    ];

    for (const test of tests) {
      try {
        const message = await test.test();
        setTestResults(prev => [...prev, {
          test: test.name,
          success: true,
          message
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          test: test.name,
          success: false,
          message: 'Test failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Cloud Storage Debug Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={runAllTests}
              disabled={loading}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Test Results:</h4>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded text-sm ${
                    result.success 
                      ? 'bg-green-400/10 text-green-400' 
                      : 'bg-red-400/10 text-red-400'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <div className="text-xs opacity-80">{result.message}</div>
                    {result.error && (
                      <div className="text-xs opacity-60 mt-1">Error: {result.error}</div>
                    )}
                  </div>
                </div>
              ))}
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
              <div>window.cloud.writeTempFile: {window.cloud?.writeTempFile ? 'function' : 'undefined'}</div>
              <div>window.cloud.readTempFile: {window.cloud?.readTempFile ? 'function' : 'undefined'}</div>
              <div>window.cloud.deleteTempFile: {window.cloud?.deleteTempFile ? 'function' : 'undefined'}</div>
              <div>window.cloud.upload: {window.cloud?.upload ? 'function' : 'undefined'}</div>
              <div>window.cloud.directUpload: {window.cloud?.directUpload ? 'function' : 'undefined'}</div>
              <div>window.cloud.list: {window.cloud?.list ? 'function' : 'undefined'}</div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
