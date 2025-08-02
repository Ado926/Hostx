import { useState, useEffect } from "react";
import { Activity, Cpu, HardDrive, MemoryStick, Zap, Server, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemResources } from "@shared/schema";

interface ResourceMonitorProps {
  ws: WebSocket | null;
  connected: boolean;
}

export default function ResourceMonitor({ ws, connected }: ResourceMonitorProps) {
  const [resources, setResources] = useState<SystemResources>({
    cpu: 0,
    memory: { used: 0, total: 8192, percentage: 0 },
    disk: { used: 0, total: 102400, percentage: 0 },
    processes: 0,
    uptime: 0
  });

  const [history, setHistory] = useState<{
    cpu: number[];
    memory: number[];
    timestamps: string[];
  }>({
    cpu: [],
    memory: [],
    timestamps: []
  });

  // Simulate resource updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newResources: SystemResources = {
        cpu: Math.random() * 100,
        memory: {
          used: Math.floor(Math.random() * 6000) + 1000,
          total: 8192,
          percentage: 0
        },
        disk: {
          used: Math.floor(Math.random() * 50000) + 25000,
          total: 102400,
          percentage: 0
        },
        processes: Math.floor(Math.random() * 50) + 150,
        uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400)
      };

      newResources.memory.percentage = (newResources.memory.used / newResources.memory.total) * 100;
      newResources.disk.percentage = (newResources.disk.used / newResources.disk.total) * 100;

      setResources(newResources);

      // Update history for mini charts
      setHistory(prev => {
        const maxPoints = 20;
        const newTimestamp = new Date().toLocaleTimeString();
        
        return {
          cpu: [...prev.cpu.slice(-maxPoints + 1), newResources.cpu],
          memory: [...prev.memory.slice(-maxPoints + 1), newResources.memory.percentage],
          timestamps: [...prev.timestamps.slice(-maxPoints + 1), newTimestamp]
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getColorForPercentage = (percentage: number) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const MiniChart = ({ data, label, color }: { data: number[], label: string, color: string }) => (
    <div className="flex items-end space-x-1 h-8">
      {data.map((value, index) => (
        <div
          key={index}
          className={`w-1 bg-${color} rounded-t`}
          style={{ height: `${Math.max(2, (value / 100) * 32)}px` }}
        />
      ))}
    </div>
  );

  return (
    <div className="p-4 space-y-4 bg-gray-900 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          System Monitor
        </h2>
        <div className={`flex items-center space-x-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-blue-400" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getColorForPercentage(resources.cpu)}`}>
                  {resources.cpu.toFixed(1)}%
                </span>
                <MiniChart data={history.cpu} label="CPU" color="blue-400" />
              </div>
              <Progress value={resources.cpu} className="h-2" />
              <div className="text-xs text-gray-400">
                {resources.cpu < 25 ? 'Low' : resources.cpu < 75 ? 'Normal' : 'High'} usage
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <MemoryStick className="w-4 h-4 mr-2 text-green-400" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getColorForPercentage(resources.memory.percentage)}`}>
                  {resources.memory.percentage.toFixed(1)}%
                </span>
                <MiniChart data={history.memory} label="Memory" color="green-400" />
              </div>
              <Progress value={resources.memory.percentage} className="h-2" />
              <div className="text-xs text-gray-400">
                {formatBytes(resources.memory.used * 1024 * 1024)} / {formatBytes(resources.memory.total * 1024 * 1024)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getColorForPercentage(resources.disk.percentage)}`}>
                  {resources.disk.percentage.toFixed(1)}%
                </span>
                <HardDrive className="w-6 h-6 text-purple-400" />
              </div>
              <Progress value={resources.disk.percentage} className="h-2" />
              <div className="text-xs text-gray-400">
                {formatBytes(resources.disk.used * 1024 * 1024)} / {formatBytes(resources.disk.total * 1024 * 1024)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Server className="w-4 h-4 mr-2 text-orange-400" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Processes:</span>
                <span className="text-sm font-medium">{resources.processes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Uptime:</span>
                <span className="text-sm font-medium">{formatUptime(resources.uptime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Load Avg:</span>
                <span className="text-sm font-medium">
                  {(Math.random() * 2).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network & Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-400" />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">RX:</span>
                <span>{formatBytes(Math.random() * 1000000000)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">TX:</span>
                <span>{formatBytes(Math.random() * 500000000)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Speed:</span>
                <span>{(Math.random() * 100).toFixed(1)} Mbps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2 text-cyan-400" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Boot Time:</span>
                <span>{(Math.random() * 30 + 10).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Response:</span>
                <span>{(Math.random() * 50 + 5).toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">I/O Wait:</span>
                <span>{(Math.random() * 5).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              {[
                { name: 'webtermux', cpu: resources.cpu.toFixed(1) },
                { name: 'systemd', cpu: (Math.random() * 5).toFixed(1) },
                { name: 'node', cpu: (Math.random() * 10).toFixed(1) }
              ].map((process, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-400 truncate">{process.name}</span>
                  <span>{process.cpu}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}