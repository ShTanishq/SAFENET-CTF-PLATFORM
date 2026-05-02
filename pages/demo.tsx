import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import OWASPTreeVisualization from '../components/OWASPTreeVisualization';

const Demo: React.FC = () => {
  return (
    <>
      <Head>
        <title>OWASP Top 10 - Interactive Demo</title>
        <meta name="description" content="Interactive demonstration of OWASP Top 10 vulnerabilities" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '20px', 
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 188, 212, 0.3)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        maxWidth: '300px'
      }}>
        <h2 style={{ 
          margin: '0 0 12px 0', 
          color: '#00bcd4',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          OWASP Top 10 Interactive Demo
        </h2>
        <p style={{ 
          margin: '0 0 16px 0', 
          color: '#94a3b8',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Explore the OWASP Top 10 vulnerabilities in an interactive knowledge tree. 
          Click nodes to expand, use search to filter, and toggle layouts.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: 'linear-gradient(135deg, #00bcd4, #ff0080)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>

      <main style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
        <OWASPTreeVisualization />
      </main>
    </>
  );
};

export default Demo;
