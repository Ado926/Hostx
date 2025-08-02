import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal as TerminalIcon, FolderOpen, Activity, Settings } from "lucide-react";
import FileManager from "@/components/FileManager";
import ResourceMonitor from "@/components/ResourceMonitor";
import type { WebSocketMessage, CommandResult, SystemResources, FileManagerItem } from "@shared/schema";

interface CommandEntry {
  command: string;
  result?: CommandResult;
  timestamp: Date;
}

export default function Terminal() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState("/home/user");
  const [commandEntries, setCommandEntries] = useState<CommandEntry[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [startTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("terminal");
  const [systemResources, setSystemResources] = useState<SystemResources | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        setConnected(true);
        setWs(socket);
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connect':
              if (message.sessionId) {
                setSessionId(message.sessionId);
              }
              break;
              
            case 'result':
              if (message.result) {
                setCurrentDirectory(message.result.currentDirectory);
                setCommandEntries(prev => {
                  const newEntries = [...prev];
                  const lastEntry = newEntries[newEntries.length - 1];
                  if (lastEntry && !lastEntry.result) {
                    lastEntry.result = message.result;
                  }
                  return newEntries;
                });
              }
              break;
              
            case 'resources':
              if (message.resources) {
                setSystemResources(message.resources);
              }
              break;
              
            case 'error':
              console.error('WebSocket error:', message.error);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        setWs(null);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, []);

  // Auto-scroll to bottom with improved behavior
  useEffect(() => {
    if (outputRef.current) {
      const element = outputRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }
  }, [commandEntries]);

  // Also scroll when new results come in
  useEffect(() => {
    if (outputRef.current) {
      const element = outputRef.current;
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }
  }, [commandEntries.length]);

  // Focus input on mount and clicks
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || !ws || !connected) return;

    const command = currentInput.trim();
    
    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add command entry
    const entry: CommandEntry = {
      command,
      timestamp: new Date()
    };
    setCommandEntries(prev => [...prev, entry]);
    
    // Send command via WebSocket
    const message: WebSocketMessage = {
      type: 'command',
      command
    };
    
    ws.send(JSON.stringify(message));
    setCurrentInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getUptime = () => {
    const diff = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // File manager handlers
  const handleDirectoryChange = (path: string) => {
    setCurrentDirectory(path);
    // Send cd command via terminal
    if (ws && connected) {
      const message: WebSocketMessage = {
        type: 'command',
        command: `cd ${path}`
      };
      ws.send(JSON.stringify(message));
    }
  };

  const handleFileSelect = (file: FileManagerItem) => {
    // Open file in terminal or editor
    if (ws && connected) {
      const message: WebSocketMessage = {
        type: 'command',
        command: `cat ${file.path}`
      };
      ws.send(JSON.stringify(message));
    }
    setActiveTab('terminal'); // Switch to terminal to see output
  };

  const renderPrompt = () => (
    <span className="flex">
      <span className="text-terminal-yellow">user@webtermux</span>
      <span className="text-terminal-gray">:</span>
      <span className="text-terminal-blue">{currentDirectory === "/home/user" ? "~" : currentDirectory}</span>
      <span className="text-terminal-gray">$ </span>
    </span>
  );

  const renderOutput = (output: string, isError = false) => {
    if (output === "\x1b[2J\x1b[H") {
      // Clear command
      setCommandEntries([]);
      return null;
    }
    
    return (
      <div className={`pl-4 ${isError ? 'text-terminal-red' : 'text-terminal-gray'} whitespace-pre-wrap`}>
        {output}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-terminal-bg text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-white font-semibold">WebTermux Advanced Terminal</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span>Session: {sessionId || 'N/A'}</span>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="bg-gray-800 border-b border-gray-600 p-0 h-12 rounded-none justify-start">
            <TabsTrigger 
              value="terminal" 
              className="flex items-center space-x-2 px-4 py-2 data-[state=active]:bg-gray-700 data-[state=active]:text-terminal-green"
            >
              <TerminalIcon className="w-4 h-4" />
              <span>Terminal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="flex items-center space-x-2 px-4 py-2 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400"
            >
              <FolderOpen className="w-4 h-4" />
              <span>File Manager</span>
            </TabsTrigger>
            <TabsTrigger 
              value="monitor" 
              className="flex items-center space-x-2 px-4 py-2 data-[state=active]:bg-gray-700 data-[state=active]:text-green-400"
            >
              <Activity className="w-4 h-4" />
              <span>System Monitor</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center space-x-2 px-4 py-2 data-[state=active]:bg-gray-700 data-[state=active]:text-orange-400"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Terminal Tab */}
          <TabsContent value="terminal" className="flex-1 flex flex-col m-0 overflow-hidden">
            <div className="flex-1 flex flex-col">
              {/* Output Area */}
              <div
                ref={outputRef}
                className="terminal-output terminal-scrollbar flex-1 p-4 space-y-1 font-mono text-sm"
                style={{
                  minHeight: '0',
                  maxHeight: 'calc(100vh - 200px)'
                }}
              >
                {/* Welcome Message */}
                <div className="text-terminal-blue">
                  <pre>{`╭─────────────────────────────────────────────────╮
│                  Welcome to WebTermux              │
│            Advanced Web Terminal Environment       │
│                                                     │
│  🖥️  Full Terminal Emulation                       │
│  📁  Integrated File Manager                       │
│  📊  Real-time System Monitoring                   │
│  🛠️  Multiple Programming Languages                │
│  🌐  Network & Development Tools                   │
│                                                     │
│  Type 'help' for available commands                │
│  Use File Manager tab for visual file operations   │
│  Check System Monitor for resource usage           │
╰─────────────────────────────────────────────────────╯`}</pre>
                </div>

                {/* Command History */}
                {commandEntries.map((entry, index) => (
                  <div key={index} className="mt-2">
                    <div className="flex">
                      {renderPrompt()}
                      <span className="text-terminal-green">{entry.command}</span>
                    </div>
                    {entry.result && (
                      renderOutput(entry.result.output, !entry.result.success)
                    )}
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-600 p-4 bg-gray-900">
                <form onSubmit={handleSubmit} className="flex items-center font-mono">
                  {renderPrompt()}
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-terminal-green outline-none ml-1"
                    placeholder="Enter command..."
                    autoComplete="off"
                    disabled={!connected}
                  />
                  <span className="cursor-blink text-terminal-green ml-1">█</span>
                </form>
              </div>
            </div>
          </TabsContent>

          {/* File Manager Tab */}
          <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
            <FileManager
              currentDirectory={currentDirectory}
              onDirectoryChange={handleDirectoryChange}
              onFileSelect={handleFileSelect}
            />
          </TabsContent>

          {/* System Monitor Tab */}
          <TabsContent value="monitor" className="flex-1 m-0 overflow-hidden">
            <ResourceMonitor ws={ws} connected={connected} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 m-0 overflow-hidden p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-white">Terminal Settings</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Appearance</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>Font Family: Monaco, Consolas, monospace</div>
                    <div>Font Size: 14px</div>
                    <div>Theme: Dark Terminal</div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">System Information</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>OS: Linux WebTermux 5.15.0-generic</div>
                    <div>Architecture: x86_64</div>
                    <div>Shell: /bin/bash</div>
                    <div>Node.js: v18.17.0</div>
                    <div>Python: 3.11.0</div>
                    <div>Java: OpenJDK 11.0.19</div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Supported Languages & Tools</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>✅ Python 3.11</div>
                    <div>✅ Node.js 18.x</div>
                    <div>✅ Java 11</div>
                    <div>✅ C/C++ (GCC)</div>
                    <div>✅ Git</div>
                    <div>✅ curl/wget</div>
                    <div>✅ npm/pip</div>
                    <div>✅ SSH/SCP</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Status Bar */}
      <div className="bg-gray-800 border-t border-gray-600 px-4 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4 text-gray-400">
          <span>Session: Active</span>
          <span>|</span>
          <span>{connected ? 'WebSocket Connected' : 'WebSocket Disconnected'}</span>
          <span>|</span>
          <span>Commands: {commandHistory.length}</span>
          <span>|</span>
          <span>Directory: {currentDirectory}</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-400">
          <span>CPU: {systemResources?.cpu.toFixed(1) || '0.0'}%</span>
          <span>|</span>
          <span>Memory: {systemResources?.memory.percentage.toFixed(1) || '0.0'}%</span>
          <span>|</span>
          <span>Uptime: {getUptime()}</span>
        </div>
      </div>
    </div>
  );
}
