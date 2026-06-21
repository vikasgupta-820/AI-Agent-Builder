import { useState, useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { SettingsModal } from './components/settings/SettingsModal';
import { BuilderPage } from './pages/BuilderPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

type Page = 'builder' | 'workflows';

function getPageFromHash(): Page {
  const hash = window.location.hash;
  if (hash.includes('/workflows')) return 'workflows';
  return 'builder';
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash());

  useEffect(() => {
    const handler = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <TopBar />
        {page === 'builder' ? <BuilderPage /> : <WorkflowsPage />}
        <SettingsModal />
      </div>
    </ErrorBoundary>
  );
}

export default App;
