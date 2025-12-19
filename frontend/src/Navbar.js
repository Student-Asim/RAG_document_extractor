import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = ({ isSidebarOpen, setIsSidebarOpen, uploadedPDFs, selectedPDF, setSelectedPDF }) => {
  const [recentMessages, setRecentMessages] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <nav className="navbar">
        <div className="menu-dot" onClick={toggleSidebar}>&#8942;</div>
        <div className="logo">My Chat App</div>
      </nav>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-section top-section">
          <h4>Recent Messages</h4>
          <ul>
            {recentMessages.length > 0
              ? recentMessages.map((msg, i) => <li key={i} className="slide-item">{msg}</li>)
              : <li className="slide-item">No recent queries</li>}
          </ul>
        </div>

        <div className="sidebar-section bottom-section">
          <h4>Uploaded PDFs</h4>
          <ul>
            {uploadedPDFs.length > 0
              ? uploadedPDFs.map((pdf, i) => (
                  <li
                    key={i}
                    className={`slide-item ${selectedPDF === pdf ? 'selected' : ''}`}
                    onClick={() => setSelectedPDF(pdf)}
                  >
                    {pdf}
                  </li>
                ))
              : <li className="slide-item">No PDFs uploaded yet</li>}
          </ul>
        </div>
      </aside>

      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Navbar;
