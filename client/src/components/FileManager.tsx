import { useState, useEffect } from "react";
import { Folder, File, Download, Upload, Trash2, Edit3, Copy, Move, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { FileManagerItem } from "@shared/schema";

interface FileManagerProps {
  currentDirectory: string;
  onDirectoryChange: (path: string) => void;
  onFileSelect: (file: FileManagerItem) => void;
}

export default function FileManager({ currentDirectory, onDirectoryChange, onFileSelect }: FileManagerProps) {
  const [files, setFiles] = useState<FileManagerItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [newItemName, setNewItemName] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Mock file data - in real implementation this would come from WebSocket
  useEffect(() => {
    const mockFiles: FileManagerItem[] = [
      {
        id: "1",
        name: ".bashrc",
        path: "/home/user/.bashrc",
        type: "file",
        size: 3526,
        modified: new Date(Date.now() - 86400000),
        permissions: "-rw-r--r--",
        owner: "user",
        group: "user"
      },
      {
        id: "2",
        name: "Documents",
        path: "/home/user/Documents",
        type: "directory",
        size: 4096,
        modified: new Date(Date.now() - 172800000),
        permissions: "drwxr-xr-x",
        owner: "user",
        group: "user"
      },
      {
        id: "3",
        name: "Projects",
        path: "/home/user/Projects",
        type: "directory",
        size: 4096,
        modified: new Date(Date.now() - 259200000),
        permissions: "drwxr-xr-x",
        owner: "user",
        group: "user"
      },
      {
        id: "4",
        name: "script.py",
        path: "/home/user/script.py",
        type: "file",
        size: 1024,
        modified: new Date(Date.now() - 3600000),
        permissions: "-rwxr-xr-x",
        owner: "user",
        group: "user"
      }
    ];
    setFiles(mockFiles);
  }, [currentDirectory]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleFileClick = (file: FileManagerItem) => {
    if (file.type === 'directory') {
      onDirectoryChange(file.path);
    } else {
      onFileSelect(file);
    }
  };

  const handleFileSelection = (fileId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedFiles);
    if (isSelected) {
      newSelection.add(fileId);
    } else {
      newSelection.delete(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: FileManagerItem = {
      id: Date.now().toString(),
      name: newItemName,
      path: `${currentDirectory}/${newItemName}`,
      type: createType,
      size: createType === 'directory' ? 4096 : 0,
      modified: new Date(),
      permissions: createType === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--',
      owner: 'user',
      group: 'user'
    };

    setFiles(prev => [...prev, newItem]);
    setNewItemName("");
    setIsCreateDialogOpen(false);
  };

  const handleDelete = (fileIds: string[]) => {
    setFiles(prev => prev.filter(file => !fileIds.includes(file.id)));
    setSelectedFiles(new Set());
  };

  const BreadcrumbNavigation = () => {
    const pathParts = currentDirectory.split('/').filter(Boolean);
    
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDirectoryChange('/')}
          className="text-blue-400 hover:text-blue-300"
        >
          /
        </Button>
        {pathParts.map((part, index) => {
          const fullPath = '/' + pathParts.slice(0, index + 1).join('/');
          return (
            <div key={index} className="flex items-center">
              <span className="mx-1">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDirectoryChange(fullPath)}
                className="text-blue-400 hover:text-blue-300"
              >
                {part}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">File Manager</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? 'Grid' : 'List'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="createType"
                      checked={createType === 'file'}
                      onChange={() => setCreateType('file')}
                    />
                    <File className="w-4 h-4" />
                    <span>File</span>
                  </Label>
                  <Label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="createType"
                      checked={createType === 'directory'}
                      onChange={() => setCreateType('directory')}
                    />
                    <Folder className="w-4 h-4" />
                    <span>Folder</span>
                  </Label>
                </div>
                <div>
                  <Label htmlFor="itemName">Name</Label>
                  <Input
                    id="itemName"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Enter ${createType} name`}
                    className="bg-gray-700 text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-1'}>
          {files.map((file) => (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger asChild>
                <div
                  className={`
                    ${viewMode === 'grid' 
                      ? 'p-4 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer' 
                      : 'flex items-center space-x-3 p-2 rounded hover:bg-gray-800 cursor-pointer'
                    }
                    ${selectedFiles.has(file.id) ? 'bg-blue-900/50 border-blue-600' : ''}
                  `}
                  onClick={() => handleFileClick(file)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleFileSelection(file.id, e.target.checked);
                    }}
                    className="w-4 h-4"
                  />
                  
                  {file.type === 'directory' ? (
                    <Folder className="w-5 h-5 text-blue-400" />
                  ) : (
                    <File className="w-5 h-5 text-gray-400" />
                  )}
                  
                  <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1'}`}>
                    <div className="font-medium truncate">{file.name}</div>
                    {viewMode === 'list' && (
                      <div className="text-xs text-gray-400 flex space-x-4">
                        <span>{formatSize(file.size)}</span>
                        <span>{file.permissions}</span>
                        <span>{formatDate(file.modified)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-gray-800 text-white border-gray-700">
                <ContextMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </ContextMenuItem>
                <ContextMenuItem>
                  <Move className="w-4 h-4 mr-2" />
                  Cut
                </ContextMenuItem>
                <ContextMenuItem className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </ScrollArea>

      {/* Selection Actions */}
      {selectedFiles.size > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg flex items-center justify-between">
          <span className="text-sm">
            {selectedFiles.size} item{selectedFiles.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedFiles))}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}