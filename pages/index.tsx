import React from 'react';
import Head from 'next/head';
import OWASPTreeVisualization from '../components/OWASPTreeVisualization';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>OWASP Top 10 Interactive Visualization</title>
        <meta name="description" content="Interactive OWASP Top 10 knowledge tree visualization with React Flow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
        <OWASPTreeVisualization />
      </main>
    </>
  );
};

export default Home;
