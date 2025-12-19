import React, { useState } from "react";
import './PdfUpload.css'; // add this CSS file

const PdfUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload_pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.filename) {
        alert(data.message);
        onUploadSuccess(data.filename); // update parent sidebar
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pdf-upload-container">
      <label className="upload-dropzone">
        {file ? file.name : "Drag & drop a PDF here or click to select"}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>
      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading..." : "Upload PDF"}
      </button>
    </div>
  );
};

export default PdfUpload;
