import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { WebSocketMessage, CommandResult, SystemResources } from "@shared/schema";
import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Health check endpoint for deployment platforms
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // API routes should be defined before the catch-all route
  app.get('/api/status', (req, res) => {
    res.json({ message: 'WebTermux API Server', status: 'running' });
  });
  
  // Create WebSocket server on /ws path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // System resource monitor
  class ResourceMonitor {
    getSystemResources(): SystemResources {
      const cpuUsage = Math.random() * 100; // Simulated CPU usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      return {
        cpu: parseFloat(cpuUsage.toFixed(1)),
        memory: {
          used: Math.round(usedMem / 1024 / 1024), // MB
          total: Math.round(totalMem / 1024 / 1024), // MB
          percentage: parseFloat(((usedMem / totalMem) * 100).toFixed(1))
        },
        disk: {
          used: 25600, // Simulated 25GB used
          total: 102400, // Simulated 100GB total
          percentage: 25.0
        },
        processes: Math.floor(Math.random() * 200) + 150,
        uptime: os.uptime()
      };
    }
  }

  // Terminal command processor
  class TerminalProcessor {
    private currentDirectory = "/home/user";
    private commandHistory: string[] = [];
    private resourceMonitor = new ResourceMonitor();
    
    async executeCommand(command: string): Promise<CommandResult> {
      const trimmedCommand = command.trim();
      if (!trimmedCommand) {
        return { output: "", currentDirectory: this.currentDirectory, success: true };
      }

      this.commandHistory.push(trimmedCommand);
      const parts = trimmedCommand.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      try {
        switch (cmd) {
          case 'pwd':
            return { output: this.currentDirectory, currentDirectory: this.currentDirectory, success: true };
            
          case 'ls':
            return await this.listDirectory(args);
            
          case 'cd':
            return await this.changeDirectory(args[0] || '/home/user');
            
          case 'mkdir':
            return await this.makeDirectory(args);
            
          case 'touch':
            return await this.createFile(args);
            
          case 'cat':
            return await this.readFile(args[0]);
            
          case 'echo':
            return await this.echo(args);
            
          case 'rm':
            return await this.removeFile(args);
            
          case 'clear':
            return { output: "\x1b[2J\x1b[H", currentDirectory: this.currentDirectory, success: true };
            
          case 'help':
            return this.showHelp();

          // Advanced commands
          case 'curl':
            return await this.executeCurl(args);
            
          case 'wget':
            return await this.executeWget(args);
            
          case 'git':
            return await this.executeGit(args);
            
          case 'python':
          case 'python3':
            return await this.executePython(args);
            
          case 'node':
          case 'nodejs':
            return await this.executeNode(args);
            
          case 'java':
            return await this.executeJava(args);
            
          case 'javac':
            return await this.executeJavac(args);
            
          case 'gcc':
          case 'g++':
            return await this.executeGcc(cmd, args);
            
          case 'make':
            return await this.executeMake(args);
            
          case 'npm':
            return await this.executeNpm(args);
            
          case 'pip':
          case 'pip3':
            return await this.executePip(args);
            
          case 'top':
          case 'htop':
            return this.showSystemResources();
            
          case 'ps':
            return this.showProcesses();
            
          case 'df':
            return this.showDiskUsage();
            
          case 'free':
            return this.showMemoryUsage();
            
          case 'uname':
            return this.showSystemInfo(args);
            
          case 'whoami':
            return { output: "user", currentDirectory: this.currentDirectory, success: true };
            
          case 'nano':
          case 'vim':
          case 'vi':
            return await this.openEditor(cmd, args);
            
          case 'find':
            return await this.findFiles(args);
            
          case 'grep':
            return await this.grepCommand(args);
            
          case 'tar':
            return await this.executeTar(args);
            
          case 'zip':
          case 'unzip':
            return await this.executeZip(cmd, args);
            
          case 'cp':
            return await this.copyFile(args);
            
          case 'mv':
            return await this.moveFile(args);
            
          case 'chmod':
            return await this.changePermissions(args);
            
          case 'ssh':
            return await this.executeSSH(args);
            
          case 'scp':
            return await this.executeSCP(args);
            
          case 'rsync':
            return await this.executeRsync(args);
            
          default:
            return { 
              output: `Command not found: ${cmd}`, 
              error: `${cmd}: command not found`,
              currentDirectory: this.currentDirectory, 
              success: false 
            };
        }
      } catch (error) {
        return { 
          output: `Error executing command: ${error}`, 
          error: error instanceof Error ? error.message : String(error),
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }
    }

    private async listDirectory(args: string[]): Promise<CommandResult> {
      const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
      
      const targetPath = args.find(arg => !arg.startsWith('-')) || this.currentDirectory;
      const fullPath = this.resolvePath(targetPath);
      
      const dirExists = await storage.fileSystemItemExists(fullPath);
      if (!dirExists) {
        return { 
          output: `ls: cannot access '${targetPath}': No such file or directory`, 
          error: "No such file or directory",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const contents = await storage.getDirectoryContents(fullPath);
      
      if (longFormat) {
        let output = "total " + Math.max(contents.length * 4, 12) + "\n";
        
        // Add . and .. entries for long format
        if (showAll) {
          output += "drwxr-xr-x 3 user user 4096 Jan 15 14:30 .\n";
          if (fullPath !== "/") {
            output += "drwxr-xr-x 3 root root 4096 Jan 15 14:20 ..\n";
          }
        }
        
        contents.forEach(item => {
          if (!showAll && item.name.startsWith('.')) return;
          const typeChar = item.type === 'directory' ? 'd' : '-';
          const permissions = item.permissions.substring(1); // Remove first char if it exists
          const size = item.size.padStart(8);
          const date = "Jan 15 14:30";
          output += `${typeChar}${permissions} 1 user user ${size} ${date} ${item.name}\n`;
        });
        
        return { output: output.trim(), currentDirectory: this.currentDirectory, success: true };
      } else {
        const fileNames = contents
          .filter(item => showAll || !item.name.startsWith('.'))
          .map(item => item.name)
          .sort();
        return { output: fileNames.join("  "), currentDirectory: this.currentDirectory, success: true };
      }
    }

    private async changeDirectory(path: string): Promise<CommandResult> {
      const fullPath = this.resolvePath(path);
      const exists = await storage.fileSystemItemExists(fullPath);
      
      if (!exists) {
        return { 
          output: `cd: no such file or directory: ${path}`, 
          error: "No such file or directory",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const item = await storage.getFileSystemItem(fullPath);
      if (item?.type !== 'directory') {
        return { 
          output: `cd: not a directory: ${path}`, 
          error: "Not a directory",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      this.currentDirectory = fullPath;
      return { output: "", currentDirectory: this.currentDirectory, success: true };
    }

    private async makeDirectory(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "mkdir: missing operand", 
          error: "Missing operand",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const results: string[] = [];
      for (const arg of args) {
        const fullPath = this.resolvePath(arg);
        const exists = await storage.fileSystemItemExists(fullPath);
        
        if (exists) {
          results.push(`mkdir: cannot create directory '${arg}': File exists`);
          continue;
        }

        // Create parent directories if needed (simplified)
        const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
        const parentExists = await storage.fileSystemItemExists(parentPath);
        
        if (!parentExists && parentPath !== '/') {
          results.push(`mkdir: cannot create directory '${arg}': No such file or directory`);
          continue;
        }

        await storage.createFileSystemItem({
          path: fullPath,
          name: arg.split('/').pop() || arg,
          type: 'directory',
          content: null,
          permissions: 'drwxr-xr-x',
          size: '4096'
        });
      }

      return { 
        output: results.join('\n'), 
        error: results.length > 0 ? results[0] : undefined,
        currentDirectory: this.currentDirectory, 
        success: results.length === 0 
      };
    }

    private async createFile(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "touch: missing file operand", 
          error: "Missing file operand",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const results: string[] = [];
      for (const arg of args) {
        const fullPath = this.resolvePath(arg);
        const exists = await storage.fileSystemItemExists(fullPath);
        
        if (exists) {
          // Update timestamp (simplified - just continue)
          continue;
        }

        await storage.createFileSystemItem({
          path: fullPath,
          name: arg.split('/').pop() || arg,
          type: 'file',
          content: '',
          permissions: '-rw-r--r--',
          size: '0'
        });
      }

      return { output: "", currentDirectory: this.currentDirectory, success: true };
    }

    private async readFile(path: string): Promise<CommandResult> {
      if (!path) {
        return { 
          output: "cat: missing file operand", 
          error: "Missing file operand",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const fullPath = this.resolvePath(path);
      const item = await storage.getFileSystemItem(fullPath);
      
      if (!item) {
        return { 
          output: `cat: ${path}: No such file or directory`, 
          error: "No such file or directory",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      if (item.type === 'directory') {
        return { 
          output: `cat: ${path}: Is a directory`, 
          error: "Is a directory",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      return { output: item.content || "", currentDirectory: this.currentDirectory, success: true };
    }

    private async echo(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { output: "", currentDirectory: this.currentDirectory, success: true };
      }

      // Handle redirection (simplified)
      const redirectIndex = args.indexOf('>');
      if (redirectIndex !== -1 && redirectIndex < args.length - 1) {
        const content = args.slice(0, redirectIndex).join(' ').replace(/"/g, '');
        const filename = args[redirectIndex + 1];
        const fullPath = this.resolvePath(filename);
        
        await storage.createFileSystemItem({
          path: fullPath,
          name: filename.split('/').pop() || filename,
          type: 'file',
          content,
          permissions: '-rw-r--r--',
          size: content.length.toString()
        });
        
        return { output: "", currentDirectory: this.currentDirectory, success: true };
      }

      const output = args.join(' ').replace(/"/g, '');
      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async removeFile(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "rm: missing operand", 
          error: "Missing operand",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const results: string[] = [];
      for (const arg of args) {
        const fullPath = this.resolvePath(arg);
        const exists = await storage.fileSystemItemExists(fullPath);
        
        if (!exists) {
          results.push(`rm: cannot remove '${arg}': No such file or directory`);
          continue;
        }

        const deleted = await storage.deleteFileSystemItem(fullPath);
        if (!deleted) {
          results.push(`rm: cannot remove '${arg}': Operation failed`);
        }
      }

      return { 
        output: results.join('\n'), 
        error: results.length > 0 ? results[0] : undefined,
        currentDirectory: this.currentDirectory, 
        success: results.length === 0 
      };
    }

    private showHelp(): CommandResult {
      const helpText = `Available Commands:

File System:
ls          - List directory contents
pwd         - Print working directory  
cd          - Change directory
mkdir       - Create directory
touch       - Create file
cat         - Display file contents
echo        - Display text
rm          - Remove files
cp          - Copy files/directories
mv          - Move/rename files
chmod       - Change file permissions
find        - Find files and directories
grep        - Search text in files

Network & Downloads:
curl        - Transfer data from/to servers
wget        - Download files from web
ssh         - Secure shell remote access
scp         - Secure copy over SSH
rsync       - Sync files/directories

Development:
git         - Git version control
python      - Python interpreter
node        - Node.js runtime
java        - Java runtime
javac       - Java compiler
gcc/g++     - C/C++ compiler
make        - Build automation
npm         - Node package manager
pip         - Python package manager

System Monitoring:
top/htop    - System resource monitor
ps          - Show running processes
df          - Show disk usage
free        - Show memory usage
uname       - System information
whoami      - Current user

Text Editors:
nano/vim    - Text editors

Archive Tools:
tar         - Archive files
zip/unzip   - Compress/extract files

Utilities:
clear       - Clear terminal
help        - Show this help

Command options:
ls -l       - Long format listing
ls -a       - Show hidden files
ls -la      - Long format with hidden files
echo "text" > file - Redirect output to file`;

      return { output: helpText, currentDirectory: this.currentDirectory, success: true };
    }

    private resolvePath(path: string): string {
      if (path.startsWith('/')) {
        return path;
      }
      
      if (path === '~') {
        return '/home/user';
      }
      
      if (path.startsWith('~/')) {
        return '/home/user' + path.substring(1);
      }
      
      if (this.currentDirectory === '/') {
        return '/' + path;
      }
      
      return this.currentDirectory + '/' + path;
    }

    // Advanced Command Implementations
    private async executeCurl(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "curl: missing URL", 
          error: "Missing URL",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const url = args[0];
      if (!url.startsWith('http')) {
        return { 
          output: `curl: (1) Protocol "${url.split(':')[0]}" not supported or disabled in libcurl`, 
          error: "Invalid URL protocol",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      try {
        // Simulate a basic HTTP request
        const mockResponse = `HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 85

{
  "message": "Success",
  "url": "${url}",
  "method": "GET",
  "timestamp": "${new Date().toISOString()}"
}`;
        
        return { output: mockResponse, currentDirectory: this.currentDirectory, success: true };
      } catch (error) {
        return { 
          output: `curl: (7) Failed to connect to ${url.split('/')[2]} port 80: Connection refused`, 
          error: "Connection failed",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }
    }

    private async executeWget(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "wget: missing URL", 
          error: "Missing URL",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const url = args[0];
      const filename = url.split('/').pop() || 'index.html';
      
      const output = `--${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}--  ${url}
Resolving ${url.split('/')[2]}... 192.168.1.1
Connecting to ${url.split('/')[2]}|192.168.1.1|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2048 (2.0K) [text/html]
Saving to: '${filename}'

${filename}          100%[===================>]   2.00K  --.-KB/s    in 0s      

${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()} (10.2 MB/s) - '${filename}' saved [2048/2048]`;

      // Create the downloaded file
      await storage.createFileSystemItem({
        path: this.resolvePath(filename),
        name: filename,
        type: 'file',
        content: `<!DOCTYPE html>\n<html>\n<head><title>Downloaded content</title></head>\n<body><h1>Sample content from ${url}</h1></body>\n</html>`,
        permissions: '-rw-r--r--',
        size: '2048'
      });

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeGit(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { output: "usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]\n           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]\n           <command> [<args>]", currentDirectory: this.currentDirectory, success: true };
      }

      const subcommand = args[0];
      const subargs = args.slice(1);

      switch (subcommand) {
        case 'clone':
          if (subargs.length === 0) {
            return { output: "fatal: You must specify a repository to clone.", error: "Missing repository URL", currentDirectory: this.currentDirectory, success: false };
          }
          
          const repoUrl = subargs[0];
          const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repository';
          
          const cloneOutput = `Cloning into '${repoName}'...
remote: Enumerating objects: 156, done.
remote: Counting objects: 100% (156/156), done.
remote: Compressing objects: 100% (98/98), done.
remote: Total 156 (delta 45), reused 132 (delta 34), pack-reused 0
Receiving objects: 100% (156/156), 45.67 KiB | 1.52 MiB/s, done.
Resolving deltas: 100% (45/45), done.`;

          // Create repository directory
          const repoPath = this.resolvePath(repoName);
          await storage.createFileSystemItem({
            path: repoPath,
            name: repoName,
            type: 'directory',
            content: null,
            permissions: 'drwxr-xr-x',
            size: '4096'
          });

          // Create basic git structure
          const gitFiles = [
            { name: 'README.md', content: `# ${repoName}\n\nCloned from ${repoUrl}` },
            { name: '.gitignore', content: 'node_modules/\n*.log\n.env' },
            { name: 'package.json', content: `{\n  "name": "${repoName}",\n  "version": "1.0.0",\n  "description": "Cloned repository"\n}` }
          ];

          for (const file of gitFiles) {
            await storage.createFileSystemItem({
              path: `${repoPath}/${file.name}`,
              name: file.name,
              type: 'file',
              content: file.content,
              permissions: '-rw-r--r--',
              size: file.content.length.toString()
            });
          }

          return { output: cloneOutput, currentDirectory: this.currentDirectory, success: true };

        case 'status':
          return { output: "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean", currentDirectory: this.currentDirectory, success: true };

        case 'init':
          return { output: "Initialized empty Git repository in " + this.currentDirectory + "/.git/", currentDirectory: this.currentDirectory, success: true };

        case 'add':
          return { output: "", currentDirectory: this.currentDirectory, success: true };

        case 'commit':
          return { output: "[main 1a2b3c4] Sample commit\n 1 file changed, 1 insertion(+)", currentDirectory: this.currentDirectory, success: true };

        case 'push':
          return { output: "Everything up-to-date", currentDirectory: this.currentDirectory, success: true };

        case 'pull':
          return { output: "Already up to date.", currentDirectory: this.currentDirectory, success: true };

        default:
          return { output: `git: '${subcommand}' is not a git command. See 'git --help'.`, error: "Unknown git command", currentDirectory: this.currentDirectory, success: false };
      }
    }

    private async executePython(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: `Python 3.11.0 (main, Oct 24 2022, 18:26:48) [GCC 9.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> exit()`, 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const filename = args[0];
      const file = await storage.getFileSystemItem(this.resolvePath(filename));
      
      if (!file) {
        return { 
          output: `python: can't open file '${filename}': [Errno 2] No such file or directory`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      if (file.type !== 'file' || !filename.endsWith('.py')) {
        return { 
          output: `python: can't open file '${filename}': [Errno 21] Is a directory`, 
          error: "Invalid file",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      // Simulate Python execution
      const output = `Running Python script: ${filename}
Hello from Python!
Script execution completed successfully.`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeNode(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: `Welcome to Node.js v18.17.0.
Type ".help" for more information.
> .exit`, 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const filename = args[0];
      const file = await storage.getFileSystemItem(this.resolvePath(filename));
      
      if (!file) {
        return { 
          output: `node: can't open file '${filename}'`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const output = `Running Node.js script: ${filename}
Hello from Node.js!
Script execution completed successfully.`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeJava(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: `Usage: java [options] <mainclass> [args...]
           (to execute a class)
   or  java [options] -jar <jarfile> [args...]
           (to execute a jar file)`, 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const className = args[0];
      const output = `Running Java class: ${className}
Hello from Java!
Program execution completed successfully.`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeJavac(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "Usage: javac <options> <source files>", 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const filename = args[0];
      const file = await storage.getFileSystemItem(this.resolvePath(filename));
      
      if (!file || !filename.endsWith('.java')) {
        return { 
          output: `javac: file not found: ${filename}`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      // Create .class file
      const classFile = filename.replace('.java', '.class');
      await storage.createFileSystemItem({
        path: this.resolvePath(classFile),
        name: classFile,
        type: 'file',
        content: 'Compiled Java bytecode (binary)',
        permissions: '-rw-r--r--',
        size: '1024'
      });

      return { output: `Compiled ${filename} successfully.`, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeGcc(compiler: string, args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: `${compiler}: fatal error: no input files\ncompilation terminated.`, 
          error: "No input files",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const sourceFile = args[0];
      const outputFile = args.includes('-o') ? args[args.indexOf('-o') + 1] : 'a.out';
      
      const file = await storage.getFileSystemItem(this.resolvePath(sourceFile));
      if (!file) {
        return { 
          output: `${compiler}: error: ${sourceFile}: No such file or directory`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      // Create executable
      await storage.createFileSystemItem({
        path: this.resolvePath(outputFile),
        name: outputFile,
        type: 'file',
        content: 'Compiled executable (binary)',
        permissions: '-rwxr-xr-x',
        size: '8192'
      });

      return { output: `Compiled ${sourceFile} to ${outputFile} successfully.`, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeMake(args: string[]): Promise<CommandResult> {
      const output = `make: Entering directory '${this.currentDirectory}'
gcc -o main main.c
make: Leaving directory '${this.currentDirectory}'`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async executeNpm(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: `npm <command>

Usage:

npm install        install all the dependencies
npm install <foo>  add the <foo> dependency
npm test           run this package's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>`, 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const command = args[0];
      switch (command) {
        case 'install':
          return { output: "npm WARN saveError ENOENT: no such file or directory, open 'package.json'\nnpm notice created a lockfile as package-lock.json. You should commit this file.\nnpm WARN enoent ENOENT: no such file or directory, open 'package.json'\nnpm WARN terminal No description\nnpm WARN terminal No repository field.\nnpm WARN terminal No README data\nnpm WARN terminal No license field.\n\naudited 1 package in 0.5s\nfound 0 vulnerabilities", currentDirectory: this.currentDirectory, success: true };
        case 'init':
          return { output: "This utility will walk you through creating a package.json file.\npackage.json created successfully!", currentDirectory: this.currentDirectory, success: true };
        case 'start':
          return { output: "npm ERR! missing script: start", error: "Missing script", currentDirectory: this.currentDirectory, success: false };
        default:
          return { output: `Unknown command: ${command}`, error: "Unknown command", currentDirectory: this.currentDirectory, success: false };
      }
    }

    private async executePip(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: `
Usage:   
  pip <command> [options]

Commands:
  install                     Install packages.
  download                    Download packages.
  uninstall                   Uninstall packages.
  freeze                      Output installed packages in requirements format.
  list                        List installed packages.
  show                        Show information about installed packages.`, 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const command = args[0];
      switch (command) {
        case 'install':
          const package_name = args[1] || 'package';
          return { output: `Collecting ${package_name}\n  Downloading ${package_name}-1.0.0-py3-none-any.whl (50 kB)\nInstalling collected packages: ${package_name}\nSuccessfully installed ${package_name}-1.0.0`, currentDirectory: this.currentDirectory, success: true };
        case 'list':
          return { output: "Package    Version\n---------- -------\npip        23.0.1\nsetuptools 65.5.0\nwheel      0.38.4", currentDirectory: this.currentDirectory, success: true };
        default:
          return { output: `Unknown command: ${command}`, error: "Unknown command", currentDirectory: this.currentDirectory, success: false };
      }
    }

    private showSystemResources(): CommandResult {
      const resources = this.resourceMonitor.getSystemResources();
      const output = `top - ${new Date().toLocaleTimeString()} up ${Math.floor(resources.uptime / 3600)}:${Math.floor((resources.uptime % 3600) / 60)}, 1 user, load average: 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}
Tasks: ${resources.processes} total, 1 running, ${resources.processes - 1} sleeping, 0 stopped, 0 zombie
%Cpu(s): ${resources.cpu}%us, 2.1%sy, 0.0%ni, ${(97.9 - resources.cpu).toFixed(1)}%id, 0.0%wa, 0.0%hi, 0.0%si, 0.0%st
MiB Mem : ${resources.memory.total} total, ${resources.memory.total - resources.memory.used} free, ${resources.memory.used} used, 0 buff/cache
MiB Swap: 2048 total, 2048 free, 0 used. ${resources.memory.total - resources.memory.used} avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 user      20   0  162928  23456   12345 S   ${resources.cpu.toFixed(1)}   2.1   0:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}.${Math.floor(Math.random() * 99).toString().padStart(2, '0')} webtermux
 5678 user      20   0   45678   8901    4567 S   0.7   0.8   0:01.23 systemd
 9012 user      20   0   12345   2345    1234 S   0.3   0.2   0:00.45 bash`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private showProcesses(): CommandResult {
      const processes = Math.floor(Math.random() * 200) + 150;
      const output = `  PID TTY          TIME CMD
 1234 pts/0    00:00:01 bash
 5678 pts/0    00:00:00 webtermux
 9012 pts/0    00:00:00 ps
${Array.from({length: Math.min(processes - 3, 10)}, (_, i) => 
  `${(1000 + i * 111).toString().padStart(5)} pts/0    00:00:00 process${i + 1}`
).join('\n')}`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private showDiskUsage(): CommandResult {
      const resources = this.resourceMonitor.getSystemResources();
      const output = `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/sda1      ${resources.disk.total * 1024} ${resources.disk.used * 1024} ${(resources.disk.total - resources.disk.used) * 1024}  ${resources.disk.percentage}% /
tmpfs               ${Math.floor(Math.random() * 1000000)} ${Math.floor(Math.random() * 100000)} ${Math.floor(Math.random() * 900000)}   5% /dev/shm
/dev/sda2         ${Math.floor(Math.random() * 10000000)} ${Math.floor(Math.random() * 1000000)} ${Math.floor(Math.random() * 9000000)}  10% /home`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private showMemoryUsage(): CommandResult {
      const resources = this.resourceMonitor.getSystemResources();
      const output = `              total        used        free      shared  buff/cache   available
Mem:          ${resources.memory.total}        ${resources.memory.used}        ${resources.memory.total - resources.memory.used}         0           0        ${resources.memory.total - resources.memory.used}
Swap:         2048           0        2048`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private showSystemInfo(args: string[]): CommandResult {
      if (args.includes('-a')) {
        return { output: "Linux webtermux 5.15.0-generic #72-Ubuntu SMP Fri Jan 20 10:24:01 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux", currentDirectory: this.currentDirectory, success: true };
      }
      return { output: "Linux", currentDirectory: this.currentDirectory, success: true };
    }

    private async openEditor(editor: string, args: string[]): Promise<CommandResult> {
      const filename = args[0] || 'newfile.txt';
      const output = `Opening ${filename} with ${editor}...
${editor}: Editor simulation - file opened successfully.
Use Ctrl+X to exit (nano) or :q to quit (vim).`;

      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async findFiles(args: string[]): Promise<CommandResult> {
      const searchPath = args[0] || this.currentDirectory;
      const searchName = args.includes('-name') ? args[args.indexOf('-name') + 1] : '*';
      
      const contents = await storage.getDirectoryContents(searchPath);
      const results = contents.filter(item => 
        searchName === '*' || item.name.includes(searchName.replace('*', ''))
      );

      const output = results.map(item => item.path).join('\n');
      return { output, currentDirectory: this.currentDirectory, success: true };
    }

    private async grepCommand(args: string[]): Promise<CommandResult> {
      if (args.length < 2) {
        return { 
          output: "grep: missing pattern or file", 
          error: "Missing arguments",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const pattern = args[0];
      const filename = args[1];
      const file = await storage.getFileSystemItem(this.resolvePath(filename));

      if (!file) {
        return { 
          output: `grep: ${filename}: No such file or directory`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      if (file.type === 'directory') {
        return { 
          output: `grep: ${filename}: Is a directory`, 
          error: "Is a directory",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const content = file.content || '';
      const lines = content.split('\n');
      const matches = lines.filter(line => line.includes(pattern));
      
      return { output: matches.join('\n'), currentDirectory: this.currentDirectory, success: true };
    }

    private async executeTar(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options", 
          error: "Missing options",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const option = args[0];
      if (option.includes('c')) {
        const archiveName = args[args.indexOf('-f') + 1] || 'archive.tar';
        return { output: `Created archive: ${archiveName}`, currentDirectory: this.currentDirectory, success: true };
      } else if (option.includes('x')) {
        const archiveName = args[args.indexOf('-f') + 1] || 'archive.tar';
        return { output: `Extracted archive: ${archiveName}`, currentDirectory: this.currentDirectory, success: true };
      }

      return { output: "tar: operation completed", currentDirectory: this.currentDirectory, success: true };
    }

    private async executeZip(command: string, args: string[]): Promise<CommandResult> {
      if (command === 'zip') {
        const zipName = args[0] || 'archive.zip';
        return { output: `  adding: files (deflated 50%)\nArchive ${zipName} created successfully.`, currentDirectory: this.currentDirectory, success: true };
      } else {
        const zipName = args[0] || 'archive.zip';
        return { output: `Archive:  ${zipName}\n  inflating: file1.txt\n  inflating: file2.txt\nExtraction completed.`, currentDirectory: this.currentDirectory, success: true };
      }
    }

    private async copyFile(args: string[]): Promise<CommandResult> {
      if (args.length < 2) {
        return { 
          output: "cp: missing destination file operand after source", 
          error: "Missing destination",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const source = this.resolvePath(args[0]);
      const dest = this.resolvePath(args[1]);
      
      const sourceFile = await storage.getFileSystemItem(source);
      if (!sourceFile) {
        return { 
          output: `cp: cannot stat '${args[0]}': No such file or directory`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      await storage.createFileSystemItem({
        path: dest,
        name: args[1].split('/').pop() || args[1],
        type: sourceFile.type,
        content: sourceFile.content,
        permissions: sourceFile.permissions,
        size: sourceFile.size
      });

      return { output: "", currentDirectory: this.currentDirectory, success: true };
    }

    private async moveFile(args: string[]): Promise<CommandResult> {
      if (args.length < 2) {
        return { 
          output: "mv: missing destination file operand after source", 
          error: "Missing destination",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const source = this.resolvePath(args[0]);
      const dest = this.resolvePath(args[1]);
      
      const sourceFile = await storage.getFileSystemItem(source);
      if (!sourceFile) {
        return { 
          output: `mv: cannot stat '${args[0]}': No such file or directory`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      await storage.createFileSystemItem({
        path: dest,
        name: args[1].split('/').pop() || args[1],
        type: sourceFile.type,
        content: sourceFile.content,
        permissions: sourceFile.permissions,
        size: sourceFile.size
      });

      await storage.deleteFileSystemItem(source);
      return { output: "", currentDirectory: this.currentDirectory, success: true };
    }

    private async changePermissions(args: string[]): Promise<CommandResult> {
      if (args.length < 2) {
        return { 
          output: "chmod: missing operand", 
          error: "Missing operand",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const permissions = args[0];
      const filename = args[1];
      const filepath = this.resolvePath(filename);
      
      const file = await storage.getFileSystemItem(filepath);
      if (!file) {
        return { 
          output: `chmod: cannot access '${filename}': No such file or directory`, 
          error: "File not found",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      await storage.updateFileSystemItem(filepath, { permissions: '-' + permissions });
      return { output: "", currentDirectory: this.currentDirectory, success: true };
    }

    private async executeSSH(args: string[]): Promise<CommandResult> {
      if (args.length === 0) {
        return { 
          output: "usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface]\n           [-b bind_address] [-c cipher_spec] [-D [bind_address:]port]", 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const host = args[0];
      return { 
        output: `ssh: connect to host ${host} port 22: Connection refused`, 
        error: "Connection refused",
        currentDirectory: this.currentDirectory, 
        success: false 
      };
    }

    private async executeSCP(args: string[]): Promise<CommandResult> {
      if (args.length < 2) {
        return { 
          output: "usage: scp [-346BCpqrTv] [-c cipher] [-F ssh_config] [-i identity_file]", 
          currentDirectory: this.currentDirectory, 
          success: true 
        };
      }

      const source = args[0];
      const dest = args[1];
      return { 
        output: `scp: connect to host ${dest.split(':')[0]} port 22: Connection refused`, 
        error: "Connection refused",
        currentDirectory: this.currentDirectory, 
        success: false 
      };
    }

    private async executeRsync(args: string[]): Promise<CommandResult> {
      if (args.length < 2) {
        return { 
          output: "rsync: no destination specified", 
          error: "Missing destination",
          currentDirectory: this.currentDirectory, 
          success: false 
        };
      }

      const source = args[0];
      const dest = args[1];
      return { 
        output: `sending incremental file list\n${source}\n\nsent 1,234 bytes  received 56 bytes  258.00 bytes/sec\ntotal size is 1,234  speedup is 0.96`, 
        currentDirectory: this.currentDirectory, 
        success: true 
      };
    }
  }

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('Terminal WebSocket connection established');
    const processor = new TerminalProcessor();

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        if (message.type === 'command' && message.command) {
          const result = await processor.executeCommand(message.command);
          
          const response: WebSocketMessage = {
            type: 'result',
            result
          };
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(response));
          }
        }
      } catch (error) {
        const errorResponse: WebSocketMessage = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(errorResponse));
        }
      }
    });

    ws.on('close', () => {
      console.log('Terminal WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('Terminal WebSocket error:', error);
    });

    // Send initial connection message
    const welcomeMessage: WebSocketMessage = {
      type: 'connect',
      sessionId: 'session-' + Date.now()
    };
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(welcomeMessage));
    }
  });

  return httpServer;
}
