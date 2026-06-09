import React from 'react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="logo-icon">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div className="logo-text">
            <strong>SHERLOCK</strong>
            <span>reasoning AI</span>
          </div>
        </div>
        <div className="navbar-links">
          <a href="#" className="active">Incidents</a>
          <a href="#">Reports</a>
          <a href="#">Alerts</a>
          <a href="#">Settings</a>
        </div>
      </div>
      <div className="navbar-right">
        <div className="search-bar">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="4"/><path d="M16 16l-4-4"/>
          </svg>
          <input type="text" placeholder="Search" />
        </div>
        <button className="icon-btn">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 2a4 4 0 00-4 4v4l-2 2v2h12v-2l-2-2V6a4 4 0 00-4-4zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
          </svg>
        </button>
        <div className="user-profile">
          <div className="avatar">DR</div>
          <span>David R.</span>
        </div>
      </div>
    </nav>
  );
}
