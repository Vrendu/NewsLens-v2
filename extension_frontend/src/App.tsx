import { useState, useEffect } from 'react';
import './App.css';

// Define the structure of the bias data
interface BiasData {
  name: string;
  mbfc_url: string;
  domain: string;
  bias: string;
  factual_reporting: string;
  country: string;
  credibility: string;
  faviconUrl: string;
}

// Define the structure of related articles
interface RelatedArticle {
  clean_url: string;
  excerpt: string;
  link: string;
  summary: string;
  title: string;
}

const getBiasColor = (bias: string) => {
  switch (bias.toLowerCase()) {
    case 'least biased':
      return '#4caf50'; // Green
    case 'left':
    case 'left-center':
      return '#2196f3'; // Blue
    case 'right':
    case 'right-center':
      return '#f44336'; // Red
    case 'pro-science':
      return '#ff9800'; // Orange
    case 'questionable':
    case 'conspiracy-pseudoscience':
    case 'pseudoscience':
      return '#9e9e9e'; // Gray
    case 'satire':
      return '#9c27b0'; // Purple
    default:
      return '#ffffff'; // White as fallback
  }
};

function App() {
  const [biasData, setBiasData] = useState<BiasData | string>('Loading...');
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [publication, setPublication] = useState('');
  const [logo, setLogo] = useState('');
  const [activeTab, setActiveTab] = useState<'bias' | 'articles'>('bias');

  // Function to save related articles to chrome.storage
  const saveRelatedArticles = (articles: RelatedArticle[]) => {
    chrome.storage.local.set({ relatedArticles: articles }, () => {
      console.log('Related articles saved to storage.');
    });
  };

  // Function to load related articles from chrome.storage
  const loadRelatedArticles = () => {
    chrome.storage.local.get('relatedArticles', (result) => {
      if (result.relatedArticles) {
        setRelatedArticles(result.relatedArticles);
        console.log('Related articles loaded from storage: ', result.relatedArticles);
      }
    });
  };

  useEffect(() => {
    loadRelatedArticles(); // Load related articles from storage when the component mounts
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        if (typeof message.bias === 'string') {
          setBiasData(message.bias);  // If there's an error or no bias data
        } else {
          setLogo(message.faviconUrl);
          setBiasData(message.bias);
          setPublication(message.publication);
        }
      }

      if (message.action === 'relatedArticles') {
        const articlesArray = message.articles?.data || [];
        setRelatedArticles(articlesArray);
        saveRelatedArticles(articlesArray); // Save related articles to chrome.storage
        console.log('Related articles: ', articlesArray);
      }
    });
  }, []);

  // Listen for active tab change and trigger fetchRelatedArticles
  useEffect(() => {
    // trigger if chrome storage doesn't have related articles
    if (activeTab === 'articles') {
      chrome.runtime.sendMessage({ action: 'fetchRelatedArticles' });
    }
  }, [activeTab]);

  return (
    <>
      <div className="container">
        <h1 className="title">NewsLens</h1>

        {/* Tab Navigation */}
        <div className="tabs">
          <span
            className={`tab ${activeTab === 'bias' ? 'active' : ''}`}
            onClick={() => setActiveTab('bias')}
          >
            Bias Details
          </span>
          <span
            className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            Related Articles
          </span>
        </div>

        <div className="card">
          {/* Show content based on the active tab */}
          {activeTab === 'bias' ? (
            // Bias Details View
            typeof biasData === 'string' ? (
              <p className="error-message">{biasData}</p>
            ) : (
              <div className="content">
                <div className="publication-header">
                  {logo && (
                    <img src={logo} alt="Favicon" className="favicon" />
                  )}
                </div>
                <ul className="bias-details">
                  <li>
                    <strong>{publication}'s Bias: </strong>
                    <span style={{ background: getBiasColor((biasData as BiasData).bias) }} className="bias-color">
                      {(biasData as BiasData).bias}
                    </span>
                  </li>
                  <li><strong>Factual Reporting:</strong> {(biasData as BiasData).factual_reporting}</li>
                  <li><strong>Credibility:</strong> {(biasData as BiasData).credibility}</li>
                  <a href={(biasData as BiasData).mbfc_url} target="_blank" rel="noopener noreferrer" className="source-link">Media Bias Fact Check Analysis</a>
                </ul>
              </div>
            )
          ) : (
            <div className="related-articles content">
              <h2>Related Articles</h2>
              {relatedArticles && (
                <ul className="related-articles-list">
                  {relatedArticles.map((article, index) => (
                    <li key={index}>
                      <strong>Source: {article.clean_url || 'Unknown Source'}</strong>
                      <p>Title: {article.title || 'No title available'}</p>
                      <p>Excerpt: {article.excerpt || 'No excerpt available'}</p>
                      <a href={article.link} target="_blank" rel="noopener noreferrer" className="article-link">
                        Read Article
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
