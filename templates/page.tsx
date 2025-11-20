export default function ExampleTemplate() {
  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Example Template</h1>
      <p>
        This is a simple example template demonstrating the Mirra template system.
      </p>
      
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h2>Features</h2>
        <ul>
          <li>Built with Next.js</li>
          <li>Automatically deployed to CDN</li>
          <li>Version controlled via GitHub</li>
          <li>One-click installation</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Getting Started</h2>
        <p>
          Customize this template by editing the files in the template directory.
          Push your changes to GitHub and the template will automatically rebuild.
        </p>
      </div>
    </div>
  );
}

