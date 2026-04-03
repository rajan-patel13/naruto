import { useState } from 'react';
import { Link, Send, ExternalLink, CheckCircle } from 'lucide-react';

export default function LinkInput() {
  const [linkInput, setLinkInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  const validateUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleLinkChange = (e) => {
    const value = e.target.value;
    setLinkInput(value);
    setIsValidUrl(value ? validateUrl(value) : false);
  };

  const isFormValid = linkInput.trim() && isValidUrl;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Link submitted:', { linkInput });
      setIsSubmitting(false);
      // Reset form
      setLinkInput('');
      setIsValidUrl(false);
    }, 2000);
  };

  const getDomainFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 mt-[-4em] relative overflow-hidden">

      <div className="relative w-full max-w-md">
        {/* Form Container */}
        <div className="bg-white backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-teal-500">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto">
              <img src='./etsy-2.svg' />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-black via-rose-500 to-rose-800 bg-clip-text text-transparent mb-2">
              Submit Etsy Link
            </h1>
            <p className="text-black text-sm">
              Share your Etsy product with us
            </p>
          </div>

          <div className="space-y-6">
            {/* Link Input */}
            <div className="group">
              <label className="flex items-center text-black text-sm font-medium mb-2 transition-colors group-focus-within:text-teal-400">
                <Link className="w-4 h-4 mr-2" />
                Website Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={linkInput}
                  onChange={handleLinkChange}
                  placeholder="https://example.com"
                  className={`w-full bg-white border rounded-xl px-4 py-3 pl-12 pr-12 text-black placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 hover:bg-blue-100 ${
                    linkInput
                      ? isValidUrl
                        ? 'border-teal-500 focus:ring-teal-500/50 focus:border-teal-500'
                        : 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                      : 'border-gray-700 focus:ring-teal-500/50 focus:border-teal-500'
                  }`}
                />
                <Link className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
                  linkInput
                    ? isValidUrl
                      ? 'text-green-400'
                      : 'text-red-400'
                    : 'text-gray-500'
                }`} />
                
                {linkInput && isValidUrl && (
                  <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
              
              {/* URL Preview */}
              {linkInput && isValidUrl && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-green-400 truncate">
                        {getDomainFromUrl(linkInput)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {linkInput}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {linkInput && !isValidUrl && (
                <p className="mt-2 text-sm text-red-400">
                  Please enter a valid URL starting with http:// or https://
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:shadow-lg shadow-green-500/25'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Link</span>
                </>
              )}
            </button>

            {/* Form Status */}
            {!isFormValid && (
              <p className="text-center text-gray-500 text-sm">
                {!linkInput ? 'Enter a website URL to submit' : 'Please enter a valid URL'}
              </p>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -z-10 top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}