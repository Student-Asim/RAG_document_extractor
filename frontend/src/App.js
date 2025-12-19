import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Chat from './Chat';
import ChatHistory from './ChatHistory';
import PdfUpload from './PdfUpload';
import './App.css';

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedPDFs, setUploadedPDFs] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/uploaded_pdfs")
      .then(res => res.json())
      .then(data => setUploadedPDFs(data.pdfs))
      .catch(err => console.error(err));
  }, []);

  const handleUploadSuccess = (filename) => {
    setUploadedPDFs(prev => [...prev, filename]);
  };

  return (
    <Router>
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        chatHistory={chatHistory}
        uploadedPDFs={uploadedPDFs}
        setSelectedPDF={setSelectedPDF}
      />

      <div className={`main-container ${isSidebarOpen ? 'shifted' : ''}`}>
        <PdfUpload onUploadSuccess={handleUploadSuccess} />
        <Routes>
          <Route
            path="/"
            element={<Chat chatHistory={chatHistory} setChatHistory={setChatHistory} selectedPDF={selectedPDF} />}
          />
          <Route
            path="/chat_history"
            element={<ChatHistory chatHistory={chatHistory} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
