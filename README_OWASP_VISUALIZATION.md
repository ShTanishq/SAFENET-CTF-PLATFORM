# OWASP Top 10 Interactive Visualization

A stunning, interactive knowledge tree visualization of the OWASP Top 10 vulnerabilities built with React, Next.js, and React Flow. Features a modern dark theme with neon cyan and magenta accents, glassmorphism panels, and animated transitions.

## Features

- 🌳 **Interactive Knowledge Tree**: Visual representation of OWASP Top 10 vulnerabilities
- 🎨 **Modern Dark Theme**: Glassmorphism panels with neon accents and glowing effects
- 🔍 **Real-time Search**: Search through vulnerabilities by name, ID, or description
- 📊 **Risk Level Visualization**: Color-coded nodes based on risk severity
- 🎯 **Expandable Nodes**: Click to expand and see detailed information
- 🔄 **Layout Toggle**: Switch between vertical and horizontal layouts
- 📈 **Statistics Panel**: Real-time risk distribution statistics
- 🏆 **Leaderboard**: Top vulnerabilities ranking
- ✨ **Smooth Animations**: Beautiful transitions and hover effects
- ♿ **Accessibility**: Keyboard navigation and screen reader support

## Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Navigate to `http://localhost:3000`

## OWASP Top 10 Vulnerabilities Included

- **A01** – Broken Access Control (Critical)
- **A02** – Cryptographic Failures (Critical)
- **A03** – Injection (Critical)
- **A04** – Insecure Design (High)
- **A05** – Security Misconfiguration (High)
- **A06** – Vulnerable and Outdated Components (High)
- **A07** – Identification and Authentication Failures (High)
- **A08** – Software and Data Integrity Failures (Medium)
- **A09** – Security Logging and Monitoring Failures (Medium)
- **A10** – Server-Side Request Forgery (Medium)

## Technologies Used

- **React 18** - UI framework
- **Next.js 14** - React framework
- **React Flow** - Node-based visualization
- **TypeScript** - Type safety
- **CSS-in-JS** - Styling with styled-jsx

## Customization

### Adding New Vulnerabilities

Edit the `owaspData` array in `components/OWASPTreeVisualization.tsx`:

```typescript
{
  id: 'A11',
  title: 'Your New Vulnerability',
  description: 'Description here',
  riskLevel: 'High', // Critical, High, Medium, Low
  keyPoints: [
    'Key point 1',
    'Key point 2',
  ],
}
```

### Styling

The component uses CSS-in-JS with custom properties. Main styling variables:

- Primary colors: `#00bcd4` (cyan), `#ff0080` (magenta)
- Background: Dark gradient from `#0f172a` to `#334155`
- Glass effect: `backdrop-filter: blur(20px)`

### Layout Options

Toggle between layouts using the control panel:
- **Vertical**: Nodes stacked vertically (default)
- **Horizontal**: Nodes arranged horizontally

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - feel free to use in your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- OWASP Foundation for the Top 10 list
- React Flow team for the excellent visualization library
- Next.js team for the amazing React framework
