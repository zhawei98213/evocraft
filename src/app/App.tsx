export function App() {
  return (
    <div className="app-shell" data-testid="app-shell">
      <aside className="app-rail" aria-label="EvoCraft 应用集合">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            E
          </div>
          <div>
            <strong>EvoCraft</strong>
            <span>AI 学习助手应用集合</span>
          </div>
        </div>

        <nav className="rail-nav" aria-label="主导航">
          <button className="rail-link is-active" type="button">
            应用集合
          </button>
          <button className="rail-link" type="button">
            错题收集
          </button>
          <button className="rail-link" type="button">
            错题本
          </button>
        </nav>
      </aside>

      <main className="main-workspace" id="main-content">
        <section className="screen hub-screen" aria-labelledby="hub-title">
          <header className="workspace-header">
            <div>
              <h1 id="hub-title">应用集合</h1>
              <p>选择应用，开始高效学习</p>
            </div>
          </header>
        </section>
      </main>
    </div>
  );
}
