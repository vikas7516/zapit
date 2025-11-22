# Zapit - Free Online Tools

A collection of free, fast, and privacy-focused online tools. All tools run entirely in your browser with no server-side processing.

## 🚀 Features

- **100% Client-Side** - Your data never leaves your browser
- **No Registration** - Start using tools immediately  
- **Fast & Responsive** - Optimized for all devices
- **Dark/Light Themes** - Built-in theme switcher
- **84+ Tools** - Across 11 categories

## 📂 Tool Categories

- 📝 Text & Content Tools
- 🖼️ Image & Design Tools
- 📄 PDF & Document Tools
- 🔢 Math Calculators
- 📏 Unit Converters
- 👨‍💻 Developer & Web Tools
- 🔒 Security & Network Tools
- 🎵 Audio & Video Tools
- 🍎 Health & Fitness Calculators
- 💰 Financial Calculators
- 🎲 Utility & Fun Tools

## 🛠️ New Tools (Recently Added)

- **Favicon Generator** - Create favicons in all sizes
- **Meme Generator** - Create custom memes with text
- **EXIF Viewer** - View hidden photo metadata
- **API Request Builder** - Test and debug APIs
- **IP Address Lookup** - Geolocation with map

## 💻 Technology Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **UI**: Custom CSS with CSS variables for theming
- **Libraries**: JSZip, exif-js, Leaflet.js, PDF-lib (loaded on-demand)
- **No Backend** - Fully static site

## 🚀 Local Development

1. Clone the repository
```bash
git clone https://github.com/vikas7516/zapit.git
cd zapit
```

2. Open in browser
```bash
# Simply open index.html in your browser
# Or use a local server:
python -m http.server 8000
# Or
npx serve
```

3. Navigate to http://localhost:8000

## 📁 Project Structure

```
zapit/
├── index.html              # Homepage
├── assets/
│   ├── css/
│   │   ├── style.css       # Light theme
│   │   └── darkstyle.css   # Dark theme
│   ├── js/
│   │   ├── script.js       # Homepage logic
│   │   └── header.js       # Header/breadcrumb
│   └── data/
│       ├── tools.json      # Tool registry
│       └── categories.json # Category config
└── [category-name]/        # 11 category folders
    ├── index.html          # Category page
    └── [tool-name]/        # Individual tools
        ├── index.html
        ├── app.js
        └── light.css
```

## 🎨 Theme System

The site supports light and dark themes via CSS variable switching:
- `style.css` - Light theme (default)
- `darkstyle.css` - Dark theme
- Theme toggle in header (powered by `theme-toggle.js`)

## 🔒 Privacy First

All tools are designed to work entirely offline after initial load. No analytics, no tracking, no data collection. Your files and data are processed locally in your browser's memory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 👤 Author

**Vikas Lavaniya**
- GitHub: [@vikas7516](https://github.com/vikas7516)
- Email: vikaslavaniya6666@gmail.com

## 🙏 Acknowledgments

- Icons: Emoji
- Libraries: JSZip, exif-js, Leaflet.js, PDF-lib
- APIs: ipapi.co for IP geolocation

---

**Live Site**: [zapit.me](https://zapit.me) *(if deployed)*

Made with ❤️ for developers and creators
