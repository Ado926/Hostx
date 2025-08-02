# WebTermux - Advanced Web Terminal Emulator

A comprehensive web-based terminal emulator application similar to Termux that runs entirely in the browser. Features include full terminal command support, integrated file manager, real-time system monitoring, and support for multiple programming languages.

## 🚀 Features

### 💻 Complete Terminal Emulation
- **Basic Commands**: `ls`, `cd`, `pwd`, `mkdir`, `touch`, `cat`, `echo`, `rm`, `clear`, `help`
- **File Operations**: `cp`, `mv`, `chmod`, `find`, `grep`, `head`, `tail`, `wc`
- **System Commands**: `ps`, `top`, `kill`, `df`, `free`, `uptime`, `whoami`, `uname`
- **Network Tools**: `curl`, `wget`, `ping`, `ssh`, `scp`
- **Development Tools**: `git clone`, `npm`, `pip`, `javac`, `gcc`, `python3`, `node`

### 📁 Integrated File Manager
- Visual directory navigation
- File and folder operations
- Real-time synchronization with terminal
- Drag and drop support
- File content preview

### 📊 Real-time System Monitor
- CPU usage tracking
- Memory consumption
- Disk space monitoring
- Network activity
- Process management

### 🛠️ Programming Language Support
- **Python 3.11**: Full interpreter with pip package management
- **Node.js 18.x**: Runtime with npm package management
- **Java 11**: OpenJDK compiler and runtime
- **C/C++**: GCC compiler toolchain
- **Git**: Version control system
- **Package Managers**: npm, pip, apt (simulated)

### 🌐 Network & Development Tools
- **curl/wget**: HTTP requests and file downloads
- **git**: Complete Git workflow simulation
- **SSH/SCP**: Secure shell and file transfer
- **Package Installation**: Language-specific package managers

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **WebSocket** for real-time communication
- **TanStack Query** for state management

### Backend
- **Node.js** with Express
- **TypeScript** throughout
- **WebSocket Server** for terminal communication
- **In-memory storage** with PostgreSQL compatibility
- **Session management** and persistence

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd webtermux
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5000`
   - The application will start with the terminal tab active

### Deploy to Vercel

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure build settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables** (if using database)
   ```
   DATABASE_URL=your_postgresql_url
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy" and Vercel will handle the rest

### Deploy to Render

1. **Create a new Web Service**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository

2. **Configure service settings**
   - Name: `webtermux`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Environment Variables** (if using database)
   ```
   DATABASE_URL=your_postgresql_url
   NODE_ENV=production
   PORT=10000
   ```

4. **Deploy**
   - Click "Create Web Service"

## 📖 Usage Guide

### Getting Started

1. **Open the Terminal Tab**
   - The application starts with the terminal active
   - You'll see a welcome message with available features

2. **Basic Navigation**
   ```bash
   pwd           # Show current directory
   ls            # List files and directories
   cd /home/user # Change directory
   mkdir test    # Create directory
   touch file.txt # Create file
   ```

3. **File Operations**
   ```bash
   cat file.txt     # View file contents
   echo "Hello" > file.txt  # Write to file
   cp file.txt backup.txt   # Copy file
   mv file.txt newname.txt  # Move/rename file
   rm file.txt      # Delete file
   ```

### File Manager Tab

1. **Visual Navigation**
   - Click on folders to navigate
   - Use breadcrumb navigation at the top
   - Double-click files to view contents

2. **File Operations**
   - Right-click for context menu
   - Create new files and folders
   - Delete, rename, and move items

### System Monitor Tab

1. **Real-time Metrics**
   - CPU usage percentage
   - Memory consumption
   - Disk space utilization
   - Network activity

2. **Process Management**
   - View running processes
   - Monitor resource usage
   - System uptime tracking

### Programming Languages

1. **Python Development**
   ```bash
   python3 --version    # Check Python version
   pip install requests # Install packages
   python3 script.py    # Run Python scripts
   ```

2. **Node.js Development**
   ```bash
   node --version      # Check Node version
   npm install express # Install packages
   node app.js         # Run Node scripts
   ```

3. **Java Development**
   ```bash
   javac --version     # Check Java compiler
   javac Hello.java    # Compile Java files
   java Hello          # Run Java programs
   ```

4. **C/C++ Development**
   ```bash
   gcc --version       # Check GCC version
   gcc -o program main.c  # Compile C programs
   ./program           # Run compiled programs
   ```

### Network Tools

1. **HTTP Requests**
   ```bash
   curl https://api.github.com/users/octocat
   wget https://example.com/file.zip
   ```

2. **Git Operations**
   ```bash
   git clone https://github.com/user/repo.git
   git status
   git add .
   git commit -m "message"
   ```

### Advanced Features

1. **Command History**
   - Use ↑/↓ arrow keys to navigate command history
   - All commands are saved for the session

2. **Tab Completion**
   - Press Tab to auto-complete commands and paths
   - Works with all supported commands

3. **Multi-tab Interface**
   - Switch between Terminal, File Manager, System Monitor, and Settings
   - Each tab maintains its own state

## 🔧 Configuration

### Settings Tab

1. **Appearance Settings**
   - Font family and size
   - Color themes
   - Terminal preferences

2. **System Information**
   - View system specifications
   - Check installed languages
   - Monitor system status

### Customization

1. **Environment Variables**
   - Set custom environment variables
   - Configure development tools
   - Manage API keys and secrets

2. **Aliases and Shortcuts**
   - Create command aliases
   - Set up custom shortcuts
   - Configure development workflows

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check your internet connection
   - Ensure the server is running
   - Try refreshing the page

2. **Commands Not Working**
   - Verify you're in the correct directory
   - Check command syntax
   - Use `help` command for available options

3. **File Operations Failing**
   - Ensure you have proper permissions
   - Check file paths are correct
   - Verify files exist before operations

### Getting Help

1. **Built-in Help**
   ```bash
   help              # Show all available commands
   help ls           # Get help for specific command
   man command       # View manual pages
   ```

2. **System Information**
   ```bash
   uname -a          # System information
   whoami            # Current user
   env               # Environment variables
   ```

## 🔒 Security

- All operations run in a sandboxed environment
- No actual system access outside the application
- File operations are simulated for safety
- Network requests are limited to safe operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by Termux mobile terminal
- Uses industry-standard development practices
- Optimized for cloud deployment platforms

---

**WebTermux** - Bringing the power of terminal computing to the web! 🚀