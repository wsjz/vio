import { useEffect } from 'react';
import { Desktop } from './components/layout/Desktop';
import { usePluginStore } from './core/plugin-system';
import { openCLIPlugin } from './terminals/opencli';

export default function App() {
  // Register plugins on mount
  useEffect(() => {
    const { registerPlugin } = usePluginStore.getState();
    
    // Register OpenCLI plugin
    registerPlugin(openCLIPlugin);
    
    console.log('[App] Plugins registered');
  }, []);

  return <Desktop />;
}
