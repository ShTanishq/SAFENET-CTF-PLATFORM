# OWASP Tree Visualization - Installation Guide

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
owasp-visualization/
├── components/
│   └── OWASPTreeVisualization.tsx  # Main React component
├── pages/
│   ├── index.tsx                   # Home page
│   └── demo.tsx                    # Demo page with instructions
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── next.config.js                  # Next.js config
└── README_OWASP_VISUALIZATION.md   # Detailed documentation
```

---

## 🎯 Features Overview

### Interactive Elements
- **Search Bar**: Real-time filtering of vulnerabilities
- **Layout Toggle**: Switch between vertical/horizontal arrangements
- **Expandable Nodes**: Click + button to see detailed information
- **Risk Panels**: Toggle statistics and leaderboard panels

### Visual Design
- **Dark Theme**: Modern glassmorphism with neon accents
- **Animated Transitions**: Smooth hover effects and node interactions
- **Color Coding**: Risk levels (Critical=Red, High=Pink, Medium=Orange, Low=Green)
- **Glowing Effects**: Neon borders and button highlights

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Clear visual hierarchy
- **Responsive**: Works on all screen sizes

---

## 🛠️ Customization

### Adding New Vulnerabilities
Edit the `owaspData` array in `components/OWASPTreeVisualization.tsx`:

```typescript
{
  id: 'A11',
  title: 'New Vulnerability',
  description: 'Description here',
  riskLevel: 'High', // Critical, High, Medium, Low
  keyPoints: ['Point 1', 'Point 2'],
}
```

### Changing Colors
Modify the color scheme in the component:

```typescript
// Risk level colors
const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Critical': return '#ff0080'; // Magenta
    case 'High': return '#ff4081';     // Pink
    case 'Medium': return '#ff9800';   // Orange
    case 'Low': return '#4caf50';      // Green
    default: return '#00bcd4';         // Cyan
  }
};
```

### Layout Options
- **Vertical**: `layout === 'vertical'` (default)
- **Horizontal**: `layout === 'horizontal'`

---

## 🎨 Styling Guide

### Main Colors
- **Primary Cyan**: `#00bcd4`
- **Primary Magenta**: `#ff0080`
- **Background**: `linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)`
- **Glass Effect**: `backdrop-filter: blur(20px)`

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Effects
- **Glow**: `box-shadow: 0 0 20px rgba(0, 188, 212, 0.4)`
- **Glass**: `background: rgba(15, 23, 42, 0.8)`
- **Transitions**: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or use different port
   npm run dev -- -p 3001
   ```

2. **Dependencies Not Installing**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript Errors**
   ```bash
   # Check TypeScript config
   npx tsc --noEmit
   ```

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📚 Usage Examples

### Basic Implementation
```tsx
import OWASPTreeVisualization from './components/OWASPTreeVisualization';

function App() {
  return <OWASPTreeVisualization />;
}
```

### With Custom Styling
```tsx
<div style={{ height: '100vh', background: '#000' }}>
  <OWASPTreeVisualization />
</div>
```

---

## 🎓 Educational Use

This component is perfect for:
- **Cybersecurity Education**: Interactive learning tool
- **Security Training**: Visual vulnerability awareness
- **Classroom Projects**: Modern, engaging presentation
- **Documentation**: Visual security guides
- **Presentations**: Professional security demos

---

## 📄 License

MIT License - Free to use in personal and commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the README documentation
3. Open an issue on GitHub
4. Contact the maintainer

---

**Happy Learning! 🚀🔒**
