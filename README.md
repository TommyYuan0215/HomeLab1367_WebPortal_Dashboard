# 🏠 HomeLab1367 Web Portal Dashboard

A modern, responsive web portal for managing and accessing self-hosted applications, media servers, and university projects on your local network. Built with vanilla HTML, CSS, and JavaScript for maximum performance and simplicity.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?logo=bootstrap&logoColor=white)

---

## ✨ Features

### 🎨 **Modern UI/UX**

- **Glassmorphism Design** with smooth gradients and animations
- **Particle.js Background** for dynamic visual effects
- **TV-Style Interface** with hover glow effects
- **Responsive Design** optimized for desktop, tablet, and mobile

### 🌓 **Theming & Accessibility**

- **Dark/Light Mode** with smooth transitions
- **Comprehensive Accessibility Settings**:
  - Adjustable text size (75% - 150%)
  - Animation speed control
  - High contrast mode
  - Dyslexia-friendly font option
  - Link highlighting
  - Large cursor mode
  - Reduced motion support
- **Persistent Settings** saved in localStorage

### 🔍 **Smart Search**

- **Real-time Search** across all applications and services
- **Mobile-Optimized** search popup for better UX
- **Synchronized Input** between desktop and mobile views

### 📱 **Mobile Experience**

- **Hamburger Menu** with slide-in navigation
- **Touch-Optimized** interactions
- **Dedicated Search Popup** for mobile devices
- **Responsive Cards** that adapt to screen size

### 🏗️ **Dynamic Content**

- **JSON-Driven** content management (`services.json`)
- **Multiple Section Types**: Favorites, Content Cards, News Feed
- **RSS News Integration** with Google News
- **Easy Configuration** - just edit JSON to add/remove services

---

## 🚀 Quick Start

### Prerequisites

- **Web Server**: Apache, Nginx, or any static file server
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/TommyYuan0215/HomeLab1367_WebPortal_Dashboard.git
   cd HomeLab1367_WebPortal_Dashboard
   ```

2. **Deploy to your web server**:

   **For Apache**:

   ```bash
   # Copy files to Apache htdocs
   cp -r * /var/www/html/
   # Or on Windows
   xcopy /E /I * C:\xampp\htdocs\
   ```

   **For Nginx**:

   ```bash
   cp -r * /usr/share/nginx/html/
   ```

3. **Access the dashboard**:
   - Open your browser and navigate to `http://localhost/` or your server's IP address
   - For homelab: `http://apps.homelab1367.local/`

---

## 📁 Project Structure

```
HomeLab1367_WebPortal_Dashboard/
├── index.html                 # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css        # All styles (1,725+ lines)
│   ├── js/
│   │   ├── script.js         # Main application logic
│   │   ├── settings.js       # Accessibility settings
│   │   └── hamburger.js      # Mobile menu functionality
│   ├── data/
│   │   └── services.json     # Service configuration
│   └── img/
│       ├── brand.png         # Logo
│       └── [thumbnails]      # Project thumbnails
└── README.md                 # This file
```

---

## ⚙️ Configuration

### Adding/Editing Services

Edit `assets/data/services.json` to customize your dashboard:

```json
{
  "sections": [
    {
      "id": "unique-section-id",
      "title": "Section Title",
      "icon": "bi-icon-name",
      "type": "favorite", // or "content" or "news"
      "items": [
        {
          "title": "Service Name",
          "url": "http://your-service-url",
          "icon": "bi-icon-name",
          "color": "#HEX-COLOR",
          "description": "Short description"
        }
      ]
    }
  ]
}
```

### Section Types

1. **`favorite`** - Icon-based cards (200x150px)

   - Best for: Quick-access apps, system tools
   - Required fields: `title`, `url`, `icon`, `color`, `description`

2. **`content`** - Image-based cards (320x180px)

   - Best for: Projects, media content
   - Required fields: `title`, `url`, `image`, `subtitle`, `course`, `author`

3. **`news`** - RSS feed integration
   - Best for: News feeds, blog updates
   - Required fields: `title`, `icon`, `rssUrl`

### Available Icons

This project uses [Bootstrap Icons](https://icons.getbootstrap.com/). Browse the full list and use the class name (e.g., `bi-house-fill`, `bi-gear-fill`).

---

## 🎨 Customization

### Changing Theme Colors

Edit CSS variables in `assets/css/styles.css`:

```css
:root {
  --accent: #8a39ff; /* Primary accent color */
  --accent-600: #6b2ee6; /* Darker accent */
  --accent-400: #a86bff; /* Lighter accent */
  --bg-dark: #0f0f12; /* Dark background */
  --card-dark: #222228; /* Card background */
  /* ... more variables */
}
```

### Modifying Particle Effects

Edit particle configuration in `assets/js/script.js`:

```javascript
function initParticles(color) {
  particlesJS("particles-js", {
    particles: {
      number: { value: 80 },
      color: { value: color },
      // ... customize here
    },
  });
}
```

---

## 🖥️ Browser Compatibility

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 88+             |
| Safari  | 14+             |
| Edge    | 90+             |

**Features Used**:

- CSS Grid & Flexbox
- CSS Custom Properties (Variables)
- ES6+ JavaScript (Arrow functions, Template literals, etc.)
- LocalStorage API
- Fetch API

---

## 📱 Responsive Breakpoints

- **Desktop**: 992px and above
- **Tablet**: 768px - 991px
- **Mobile**: Below 768px

The layout automatically adapts:

- Desktop: Full navbar with search bar
- Mobile: Hamburger menu + dedicated search popup

---

## 🔧 Development

### Local Development

1. **Using Python**:

   ```bash
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

2. **Using Node.js**:

   ```bash
   npx http-server -p 8000
   # Visit http://localhost:8000
   ```

3. **Using PHP**:
   ```bash
   php -S localhost:8000
   # Visit http://localhost:8000
   ```

### Making Changes

1. Edit files directly - no build process needed
2. Refresh browser to see changes
3. Check browser console for any JavaScript errors
4. Test on multiple screen sizes using browser DevTools

---

## 🌐 Deployment

### Apache Configuration

Optional `.htaccess` for better performance:

```apache
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Enable caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name apps.homelab1367.local;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🛠️ Troubleshooting

### Services Not Loading

- Check `assets/data/services.json` for syntax errors
- Open browser console (F12) and look for errors
- Verify JSON is valid using [JSONLint](https://jsonlint.com/)

### Particles Not Showing

- Ensure `particles.js` CDN is accessible
- Check browser console for loading errors
- Verify internet connection (CDN dependency)

### Theme Not Persisting

- Check if localStorage is enabled in browser
- Clear browser cache and try again
- Check browser privacy settings (some block localStorage)

### Mobile Menu Not Working

- Verify `assets/js/hamburger.js` is loaded
- Check for JavaScript errors in console
- Ensure viewport meta tag is present in HTML

---

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **Load Time**: < 1s on local network
- **Bundle Size**: ~50KB (HTML + CSS + JS combined)
- **No Build Required**: Instant development workflow

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- Use 2 spaces for indentation
- Follow existing code style
- Comment complex logic
- Test on multiple browsers

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Tan Jun Lin**

- GitHub: [@TommyYuan0215](https://github.com/TommyYuan0215)
- Project: [HomeLab1367 Web Portal Dashboard](https://github.com/TommyYuan0215/HomeLab1367_WebPortal_Dashboard)

---

## 🙏 Acknowledgments

- [Bootstrap 5](https://getbootstrap.com/) - UI Framework
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon Library
- [Particles.js](https://vincentgarreau.com/particles.js/) - Background Effects
- [Google Fonts](https://fonts.google.com/) - Roboto Font
- [Picsum Photos](https://picsum.photos/) - Placeholder Images

---

## 📸 Screenshots

### Desktop View

![Desktop View](https://via.placeholder.com/800x450/0f0f12/8a39ff?text=Desktop+View)

### Mobile View

![Mobile View](https://via.placeholder.com/375x667/0f0f12/8a39ff?text=Mobile+View)

### Settings Panel

![Settings](https://via.placeholder.com/600x400/0f0f12/8a39ff?text=Accessibility+Settings)

---

## 🔮 Future Enhancements

- [ ] Widget system for customizable dashboard
- [ ] Multi-language support
- [ ] Service health monitoring
- [ ] Custom themes builder
- [ ] Drag-and-drop service organization
- [ ] PWA support for offline access
- [ ] Integration with home automation systems

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/TommyYuan0215/HomeLab1367_WebPortal_Dashboard/issues)
3. Create a new issue with detailed information

---

<div align="center">

**Made with ❤️ for HomeLab enthusiasts**

⭐ Star this repo if you find it useful!

</div>
