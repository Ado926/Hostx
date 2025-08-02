# Deployment Guide - WebTermux

This guide covers deploying WebTermux to Vercel and Render platforms.

## 🚀 Vercel Deployment

### Prerequisites
- GitHub account with the repository
- Vercel account

### Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Build Settings**
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables** (Optional)
   ```
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Vercel Configuration
The `vercel.json` file is already configured with:
- Node.js runtime for the backend
- Static build for the frontend
- Proper routing configuration
- WebSocket support

## 🔧 Render Deployment

### Prerequisites
- GitHub account with the repository
- Render account

### Steps

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `webtermux`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Branch**: `main`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   ```

4. **Advanced Settings**
   - **Instance Type**: Free (or paid for better performance)
   - **Auto-Deploy**: Yes
   - **Health Check Path**: `/`

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically

### Render Configuration
The `render.yaml` file provides infrastructure as code:
- Automated deployment configuration
- Environment variable setup
- Health check configuration
- Free tier optimization

## 🐳 Docker Deployment (Alternative)

For custom hosting or container platforms:

```bash
# Build the Docker image
docker build -t webtermux .

# Run the container
docker run -p 5000:5000 -e NODE_ENV=production webtermux
```

## 🌐 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Render
1. Go to Service Settings → Custom Domains
2. Add your domain
3. Update DNS with provided CNAME

## 🔧 Environment Variables

### Required for Production
```
NODE_ENV=production
PORT=5000 (or assigned by platform)
```

### Optional Database Configuration
```
DATABASE_URL=postgresql://user:password@host:port/database
```

## 📊 Performance Optimization

### Build Optimization
- The application uses esbuild for fast builds
- Vite optimizes frontend assets
- Tree shaking eliminates unused code

### Runtime Optimization
- WebSocket connections for real-time features
- In-memory storage for fast operations
- Efficient bundling and compression

## 🔍 Monitoring

### Vercel Analytics
- Built-in performance monitoring
- Real-time error tracking
- Usage statistics

### Render Monitoring
- Built-in metrics dashboard
- Resource usage tracking
- Uptime monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed
   - Review build logs for specific errors

2. **WebSocket Issues**
   - Ensure WebSocket support is enabled
   - Check for proxy configuration issues
   - Verify the correct protocol (ws/wss)

3. **Port Binding Issues**
   - Use `process.env.PORT` for dynamic port assignment
   - Bind to `0.0.0.0` instead of `localhost`

### Getting Help

1. **Check Logs**
   - Vercel: Function logs in dashboard
   - Render: Service logs in dashboard

2. **Debug Mode**
   ```bash
   NODE_ENV=development npm start
   ```

3. **Health Checks**
   - Both platforms provide health check endpoints
   - Monitor application status in dashboards

## 🚀 Post-Deployment

### Testing
1. **Basic Functionality**
   - Open the deployed URL
   - Test terminal commands
   - Verify WebSocket connection

2. **Performance Testing**
   - Check load times
   - Test concurrent users
   - Monitor resource usage

### Maintenance
1. **Auto-deployments** are configured for both platforms
2. **Monitoring** dashboards show real-time metrics
3. **Scaling** is automatic based on traffic

---

Your WebTermux application is now ready for production deployment on both Vercel and Render! 🎉