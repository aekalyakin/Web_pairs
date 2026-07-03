import React from 'react';
import { useApp } from './hooks/useApp';
import { C, FONT } from './theme/tokens';

import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import Home from './screens/Home';
import CreatePoll from './screens/CreatePoll';
import JoinPoll from './screens/JoinPoll';
import Voting from './screens/Voting';
import MatchOverlay from './screens/MatchOverlay';
import Results from './screens/Results';
import Profile from './screens/Profile';
import Pricing from './screens/Pricing';

const LoadingScreen = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgGradient }}>
    <div style={{ fontSize: 40, animation: 'pulse 1s infinite ease-in-out' }}>🤝</div>
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
  </div>
);

export default function App() {
  const app = useApp();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      maxWidth: 480, margin: '0 auto', width: '100%',
      minHeight: '100dvh', position: 'relative',
      background: C.bgBase, fontFamily: FONT.family,
      paddingTop: 'env(safe-area-inset-top,0px)',
      overflow: 'hidden',
    }}>
      {app.screen === 'loading'     && <LoadingScreen />}
      {app.screen === 'onboarding'  && <Onboarding {...app} />}
      {app.screen === 'auth'        && <Auth {...app} />}
      {app.screen === 'home'        && <Home {...app} />}
      {app.screen === 'create'      && <CreatePoll {...app} />}
      {app.screen === 'join'        && <JoinPoll {...app} />}
      {app.screen === 'voting'      && <Voting {...app} />}
      {app.screen === 'match'       && <>
        <Voting {...app} />
        <MatchOverlay {...app} />
      </>}
      {app.screen === 'results'     && <Results {...app} />}
      {app.screen === 'profile'     && <Profile {...app} />}
      {app.screen === 'pricing'     && <Pricing {...app} />}

      {app.toast && (
        <div style={{
          position: 'fixed', bottom: 'calc(84px + env(safe-area-inset-bottom,0px))',
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(26,26,46,.95)', border: `1px solid ${C.cardBorder}`,
          backdropFilter: 'blur(12px)', color: '#fff', padding: '10px 20px',
          borderRadius: 999, fontSize: 13, fontWeight: 500, zIndex: 999, whiteSpace: 'nowrap',
        }}>{app.toast}</div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { background: ${C.bgBase}; overflow: hidden; height: 100%; }
        ::-webkit-scrollbar { display: none; }
        input, textarea { font-size: 16px !important; }
      `}</style>
    </div>
  );
}
