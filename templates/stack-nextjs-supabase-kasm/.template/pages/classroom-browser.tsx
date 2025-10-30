export default function ClassroomBrowser() {
  return (
    <main style={{padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5}}>
      <h1>Classroom Browser Sidecar</h1>
      <p>
        A full graphical Chrome is available via the{" "}
        <strong>Kasm Chrome</strong> sidecar. In Codespaces the
        <em> Kasm Chrome (HTTPS)</em> port will be auto-forwarded.
      </p>
      <ol>
        <li>Open the forwarded port labeled <strong>Kasm Chrome (HTTPS)</strong>.</li>
        <li>Login (defaults: <code>student</code> – change this!).</li>
        <li>Use Chrome + DevTools as normal. This is a real browser running in the sidecar.</li>
      </ol>
      <p>Tip: Keep ports <strong>Private</strong> unless you mean to share.</p>
    </main>
  );
}
