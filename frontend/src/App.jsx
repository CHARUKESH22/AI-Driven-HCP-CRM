import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import Dashboard from './features/hcp/Dashboard';
import HCPSearch from './features/hcp/HCPSearch';
import LogInteraction from './features/hcp/LogInteraction';
import InteractionReview from './features/hcp/InteractionReview';
import InteractionHistory from './features/hcp/InteractionHistory';
import AddHCP from './features/hcp/AddHCP';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<HCPSearch />} />
            <Route path="/add-hcp" element={<AddHCP />} />
            <Route path="/log" element={<LogInteraction />} />
            <Route path="/review" element={<InteractionReview />} />
            <Route path="/history" element={<InteractionHistory />} />
          </Routes>
        </Layout>
      </Router>
    </Provider>
  );
}

export default App;
