import { useState, useRef } from 'react';
import { Upload, Send, X, FileText, Columns, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [reviewColumn, setReviewColumn] = useState('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState({ message: null, type: null });
  const fileInputRef = useRef(null);

  // The form is valid if a file is selected.
  const isFormValid = !!file;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
        setFile(selectedFile);
        setStatus({ message: null, type: null });
    } else {
        setFile(null);
        setStatus({ message: "Invalid file type. Please upload a .csv file.", type: 'error' });
    }
  };

  const resetForm = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid){
      console.log("invalid form");
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: null, type: null });

    const formData = new FormData();
    formData.append('input_csv', file);
    formData.append('review_column', reviewColumn);

    try {
      const response = await fetch('http://localhost:8080/work/csv', {
        method: 'POST',
        body: formData,
      });
      console.log("Sent req ", response);
      
      if (response.ok) {
        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        let filename = `processed_${file.name}`; 

        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setStatus({ message: 'Processing complete! Your file has been downloaded.', type: 'success' });
        resetForm();

      } else {
        // Handle API errors
        const errorText = await response.text();
        setStatus({ message: `Error: ${errorText}`, type: 'error' });
      }
    } catch (error) {
      // Handle network errors
      console.error('Submission error:', error);
      setStatus({ message: 'A network error occurred. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === "text/csv") {
        setFile(droppedFile);
        setStatus({ message: null, type: null });
      } else {
        setFile(null);
        setStatus({ message: "Invalid file type. Please upload a .csv file.", type: 'error' });
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeFile = () => {
    resetForm();
    setStatus({ message: null, type: null });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-sky-50 text-gray-800 font-sans flex items-center justify-center p-4 lg:p-8">
      <div className="relative z-10 w-full max-w-lg">
        {/* Form Container */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mt-[-4em]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              CSV Batch Process
            </h1>
            <p className="text-gray-600">
              Process your CSV file and download the result.
            </p>
            <p className="text-rose-400">
              This will take some time, depending on the size of your file.
            </p>
          </div>

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="flex items-center text-gray-600 text-sm font-medium mb-2">
                <FileText className="w-4 h-4 mr-2" />
                CSV File
              </label>
              <div
                onDrop={handleDrop}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer group ${
                  dragActive
                    ? 'border-teal-400 bg-teal-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-teal-500 hover:bg-sky-100'
                }`}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv"
                />
                {file ? (
                  <div className="text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className={`w-10 h-10 mx-auto mb-3 text-gray-400 transition-transform duration-300 ${
                      dragActive ? 'scale-110 text-teal-600' : 'group-hover:scale-110 group-hover:text-teal-600'
                    }`} />
                    <p className="text-base font-medium text-gray-600 mb-1">
                      {dragActive ? 'Drop your CSV here' : 'Drop a CSV file or click to browse'}
                    </p>
                    <p className="text-xs">
                      Only .csv files are accepted
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Column Input */}
            <div>
                <label htmlFor="review-column" className="flex items-center text-gray-600 text-sm font-medium mb-2">
                    <Columns className="w-4 h-4 mr-2" />
                    Review Column Name
                </label>
                <input
                    id="review-column"
                    type="text"
                    value={reviewColumn}
                    onChange={(e) => setReviewColumn(e.target.value)}
                    placeholder="e.g., review_text"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                />
            </div>

            {/* Status Message */}
            {status.message && (
              <div className={`flex items-center p-4 rounded-xl text-sm border ${
                status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0"/> : <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transform shadow-teal-500/25'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Process & Download</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
