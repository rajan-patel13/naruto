import { useState } from 'react';
import { Type, Send, CheckCircle, AlertTriangle, Smile, Frown, Meh, Loader2 } from 'lucide-react';

const SINGLE_REVIEW_API_ENDPOINT = 'http://localhost:5000/work/single';

const AspectReviewAnalysis = ({ results, originalText }) => {
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
        <p className="font-medium">No distinct aspects were identified in the text.</p>
        {/* Raw Data Toggle */}
        <details className="text-sm text-gray-600 cursor-pointer mt-4">
            <summary className="font-semibold text-gray-700 hover:text-teal-600 transition-colors">View Raw JSON Data</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-md border border-gray-200 whitespace-pre-wrap text-left">
              {JSON.stringify(results, null, 2)}
            </pre>
        </details>
      </div>
    );
  }

  const totalAspects = results.length;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let totalScore = 0;

  results.forEach(item => {
    totalScore += item.score;
    const sentiment = String(item.sentiment || '').toLowerCase(); // Ensure sentiment is a string
    if (sentiment.includes('positive')) {
      positiveCount++;
    } else if (sentiment.includes('negative')) {
      negativeCount++;
    } else {
      neutralCount++;
    }
  });

  const overallAvgScore = totalAspects > 0 ? (totalScore / totalAspects) * 100 : 0;
  let overallSentiment = 'Neutral';

  // Determine overall sentiment based on the majority of aspects
  if (positiveCount > negativeCount && positiveCount > neutralCount) {
    overallSentiment = 'Positive';
  } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
    overallSentiment = 'Negative';
  } else if (positiveCount > 0 || negativeCount > 0) {
    overallSentiment = 'Mixed';
  }

  // Determine card style based on calculated overall sentiment
  let colorClass, icon;
  const sentimentLower = overallSentiment.toLowerCase();

  if (sentimentLower.includes('positive')) {
    colorClass = 'bg-green-100 text-green-800 border-green-400';
    icon = <Smile className="w-8 h-8 text-green-600" />;
  } else if (sentimentLower.includes('negative')) {
    colorClass = 'bg-red-100 text-red-800 border-red-400';
    icon = <Frown className="w-8 h-8 text-red-600" />;
  } else {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-400';
    icon = <Meh className="w-8 h-8 text-yellow-600" />;
  }
  
  // Helper component for rendering a single aspect item
  const AspectItem = ({ aspect, opinion, score, sentiment, context }) => {
    const sentimentLower = String(sentiment || '').toLowerCase();
    const displayScore = (parseFloat(score) * 100).toFixed(2);
    let itemColor, itemIcon;

    if (sentimentLower.includes('positive')) {
      itemColor = 'text-green-600 bg-green-50 border-green-200';
      itemIcon = <Smile className="w-4 h-4 text-green-600" />;
    } else if (sentimentLower.includes('negative')) {
      itemColor = 'text-red-600 bg-red-50 border-red-200';
      itemIcon = <Frown className="w-4 h-4 text-red-600" />;
    } else {
      itemColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';
      itemIcon = <Meh className="w-4 h-4 text-yellow-600" />;
    }

    return (
      <div className={`p-4 rounded-xl border ${itemColor} transition-shadow hover:shadow-lg`}>
        <div className="flex justify-between items-start mb-2">
          <h5 className="text-lg font-bold text-gray-900 capitalize flex items-center space-x-2">
            <span className="text-teal-600">Aspect:</span> <span>{aspect}</span>
          </h5>
          <div className="text-right">
            <p className={`font-semibold text-sm flex items-center space-x-1 capitalize`}>
                {itemIcon}
                <span className={itemColor.split(' ')[0]}>{sentiment}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Score: {displayScore}%</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mt-2">
            <span className="font-medium text-teal-700">Opinion:</span> "{opinion}"
        </p>
        <p className="text-xs text-gray-500 mt-2 italic">
            <span className="font-medium text-gray-600">Context:</span> {context}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analyzed Text Display */}
      <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 shadow-inner">
        <p className="text-xs font-medium text-gray-500 mb-1 uppercase">Original Review</p>
        <p className="text-gray-700 leading-relaxed text-sm">"{originalText}"</p>
      </div>

      {/* Main Overall Sentiment Card (Derived from aspect analysis) */}
      <div className={`flex items-center justify-between p-5 rounded-2xl shadow-xl transition-all ${colorClass}`}>
        <div className="flex items-center space-x-4">
          {icon}
          <div>
            <p className="text-sm font-semibold opacity-80">Overall Review Sentiment (Derived)</p>
            <h4 className="text-2xl font-extrabold capitalize">{overallSentiment}</h4>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold opacity-80">Avg. Confidence</p>
          <h4 className="text-2xl font-extrabold">{overallAvgScore.toFixed(2)}%</h4>
        </div>
      </div>

      {/* Aspect List */}
      <h3 className="text-lg font-bold text-gray-900 pt-4 border-t border-gray-200">Aspect Breakdown ({totalAspects})</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {results.map((item, index) => (
          <AspectItem key={index} {...item} />
        ))}
      </div>
      
      {/* Raw Data Toggle */}
      <details className="text-sm text-gray-600 cursor-pointer mt-6">
        <summary className="font-semibold text-gray-700 hover:text-teal-600 transition-colors">View Raw JSON Data</summary>
        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-md border border-gray-200 whitespace-pre-wrap text-left">
          {JSON.stringify(results, null, 2)}
        </pre>
      </details>
    </div>
  );
};


export default function TextInput() {
  const [textInput, setTextInput] = useState('');
  const [analyzedText, setAnalyzedText] = useState(''); // Stores the text that was sent for analysis
  const [isSubmitting, setIsSubmitting] = useState(false);
  // analysisResult is now an array of aspects
  const [analysisResult, setAnalysisResult] = useState(null); 
  // State for handling API responses and errors
  const [status, setStatus] = useState({ message: null, type: null });

  const isFormValid = textInput.trim() !== '';

  // Function to implement exponential backoff
  const fetchWithRetries = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status !== 429) { // 429 is Too Many Requests, which we want to retry
                return response;
            }
            // If 429, pause and retry
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        } catch (error) {
            // For network errors, pause and retry
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Request failed after multiple retries.');
  };


  const handleSubmit = async () => {
    const currentText = textInput.trim();
    if (!isFormValid) return;

    setIsSubmitting(true);
    // Reset status and previous results on new submission
    setStatus({ message: null, type: null });
    setAnalysisResult(null);
    setAnalyzedText(currentText); // Save the text being analyzed

    const formData = new FormData();
    formData.append('review', currentText);

    try {
      const response = await fetchWithRetries(SINGLE_REVIEW_API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Result is expected to be an array of aspect objects
        setAnalysisResult(result);
        setStatus({ message: 'Aspect-Based Analysis successful! Check the breakdown below.', type: 'success' });
        setTextInput(''); 
      } else {
        const errorText = await response.text();
        setStatus({ message: `Error: ${response.status} - ${errorText}`, type: 'error' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus({ message: 'A network error occurred. The server might not be running or the request failed after multiple retries.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 text-gray-800 font-sans p-4 lg:p-8">
      {/* Tailwind utility classes for animations */}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out;
        }
      `}</style>
      
      {/* Main Dashboard Container */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Aspect-Based Sentiment Analyzer (ABSA)</h1>
          <p className="text-gray-600">Enter a review to see the sentiment for specific **aspects** (e.g., 'battery', 'syrup', 'service') within the text.</p>
        </header>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Panel: Input and Controls */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-teal-200 h-full">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <Type className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Review Input</h2>
                    <p className="text-sm text-gray-500">Provide the text you want analyzed.</p>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="review-content" className="flex items-center text-gray-600 text-sm font-medium mb-2 transition-colors group-focus-within:text-teal-600">
                    Review Content
                  </label>
                  <textarea
                    id="review-content"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Example: 'The new update is fast and the interface is intuitive, but I wish the battery life was longer.'"
                    rows={8}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 resize-none"
                  />
                  <div className="mt-2 text-right text-xs text-gray-500">
                    {textInput.length} characters
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg ${
                    isFormValid && !isSubmitting
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transform hover:scale-[1.01] active:scale-[0.99] shadow-teal-500/40'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Analyze Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Results and Status */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Message Widget */}
            {status.message && (
                <div className={`bg-white rounded-2xl p-4 border flex items-center text-sm shadow-md ${
                    status.type === 'success' 
                        ? 'text-green-800 border-green-200 bg-green-50' 
                        : 'text-red-800 border-red-200 bg-red-50'
                }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0"/> : <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />}
                    <span>{status.message}</span>
                </div>
            )}

            {/* Analysis Result Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-teal-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Aspect Sentiment Report</h3>
              {analysisResult ? (
                <div className="animate-fade-in">
                  <AspectReviewAnalysis 
                    results={analysisResult} 
                    originalText={analyzedText} 
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Input text and click 'Analyze Text' to see the detailed report here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
