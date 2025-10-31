export default function ClassroomBrowser() {
  return (
    <main style={{padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5}}>
      <h1>Classroom Browser Sidecars</h1>
      <p>From the sidecar browser(s), open <code>http://devcontainer:3000</code> to test your app.</p>
      <ul>
        <li><strong>Neko Chrome (Web UI)</strong>: forwarded port labeled accordingly</li>
        <li><strong>Neko Firefox (Web UI)</strong>: forwarded port labeled accordingly</li>
        <li><strong>Kasm Chrome (HTTPS)</strong>: forwarded port labeled accordingly</li>
      </ul>
      <p>Ensure your dev server binds to <code>0.0.0.0</code>. Keep forwarded ports <strong>Private</strong> by default.</p>
    </main>
  );
}
