import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle2, CloudUpload, FileText } from 'lucide-react';

export function CloudStructureTest() {
  const [testResults, setTestResults] = useState<{
    upload: boolean | null;
    list: boolean | null;
    download: boolean | null;
    delete: boolean | null;
  }>({
    upload: null,
    list: null,
    delete: null,
    download: null,
  });
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const runTests = async () => {
    setLoading(true);
    setTestResults({ upload: null, list: null, delete: null, download: null });

    try {
      // Test 1: Upload a test file
      console.log('Testing upload...');
      const testContent = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'This is a test file for the new cloud structure'
      }, null, 2);

      const uploadResult = await window.cloud.directUpload(
        testContent,
        'test_cloud_structure.json',
        'juggernaut',
        'Test file for new cloud structure'
      );

      setTestResults(prev => ({ ...prev, upload: uploadResult.success }));

      if (!uploadResult.success) {
        console.error('Upload failed:', uploadResult.error);
        return;
      }

      // Test 2: List files
      console.log('Testing list...');
      const listResult = await window.cloud.list({ container: 'juggernaut' });
      setTestResults(prev => ({ ...prev, list: listResult.success }));
      setMetadata(listResult.files);

      if (!listResult.success) {
        console.error('List failed:', listResult.error);
        return;
      }

      // Test 3: Download the test file
      console.log('Testing download...');
      const downloadResult = await window.cloud.download({
        container: 'juggernaut',
        filename: 'test_cloud_structure.json',
        downloadPath: 'temp_download_test.json'
      });
      setTestResults(prev => ({ ...prev, download: downloadResult.success }));

      if (!downloadResult.success) {
        console.error('Download failed:', downloadResult.error);
        return;
      }

      // Test 4: Delete the test file
      console.log('Testing delete...');
      const deleteResult = await window.cloud.delete({
        container: 'juggernaut',
        filename: 'test_cloud_structure.json'
      });
      setTestResults(prev => ({ ...prev, delete: deleteResult.success }));

      if (!deleteResult.success) {
        console.error('Delete failed:', deleteResult.error);
        return;
      }

    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    if (status) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Not tested';
    if (status) return 'Success';
    return 'Failed';
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5" />
          Cloud Structure Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Running Tests...' : 'Run Cloud Structure Tests'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.upload)}
            <span className="text-sm">Upload Test</span>
            <Badge variant="outline" className="text-xs">
              {getStatusText(testResults.upload)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.list)}
            <span className="text-sm">List Test</span>
            <Badge variant="outline" className="text-xs">
              {getStatusText(testResults.list)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.download)}
            <span className="text-sm">Download Test</span>
            <Badge variant="outline" className="text-xs">
              {getStatusText(testResults.download)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(testResults.delete)}
            <span className="text-sm">Delete Test</span>
            <Badge variant="outline" className="text-xs">
              {getStatusText(testResults.delete)}
            </Badge>
          </div>
        </div>

        {metadata && (
          <div className="mt-4 p-3 border rounded-lg bg-white/5">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cloud Metadata (Juggernaut Container)
            </h4>
            <div className="text-xs text-white/70 max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(metadata, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
