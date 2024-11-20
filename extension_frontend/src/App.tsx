import { useState, useEffect } from 'react';
import './App.css';

// Bias data and related article interfaces
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

interface RelatedArticle {
  clean_url: string;
  excerpt: string;
  link: string;
  summary: string;
  title: string;
  media: string;
  mbfc?: BiasData | null;
}

// Utility for bias colors
const biasColors: Record<string, string> = {
  'least biased': '#4caf50',
  left: '#2196f3',
  'left-center': '#2196f3',
  right: '#f44336',
  'right-center': '#f44336',
  'pro-science': '#ff9800',
  questionable: '#9e9e9e',
  'conspiracy-pseudoscience': '#9e9e9e',
  pseudoscience: '#9e9e9e',
  satire: '#9c27b0',
};

const getBiasColor = (bias: string): string => biasColors[bias.toLowerCase()] || '#ffffff';

// Utility for domain mappings
const domainMappings: Record<string, string> = {
  'foxnews.com': 'Fox News',
  'cnn.com': 'CNN',
  'cbsnews.com': 'CBS News',
  'npr.org': 'NPR',
  'nbcnews.com': 'NBC News',
  'washingtonpost.com': 'Washington Post',
  'nypost.com': 'New York Post',
  'nytimes.com': 'The New York Times',
  'bbc.com': 'BBC',
  'bloomberg.com': 'Bloomberg',
  'msnbc.com': 'MSNBC',
  'latimes.com': 'Los Angeles Times',
  'aljazeera.com': 'Al Jazeera',
};

const domainToName = (domain: string): string => domainMappings[domain] || domain;

// Chrome storage utility
const chromeStorage = {
  set: (key: string, value: any): Promise<void> =>
    new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve)),
  get: (key: string): Promise<any> =>
    new Promise((resolve) => chrome.storage.local.get(key, (result) => resolve(result[key]))),
};

function App() {
  const [state, setState] = useState({
    biasData: 'Loading...' as BiasData | string,
    relatedArticles: [] as RelatedArticle[],
    publication: '',
    logo: '',
    activeTab: 'bias' as 'bias' | 'articles',
    existArticles: false,
  });

  const updateState = (updates: Partial<typeof state>) =>
    setState((prev) => ({ ...prev, ...updates }));

  const saveRelatedArticles = async (articles: RelatedArticle[]) => {
    await chromeStorage.set('relatedArticles', articles);
  };

  const loadRelatedArticles = async () => {
    const articles = await chromeStorage.get('relatedArticles');
    if (articles) {
      updateState({ relatedArticles: articles, existArticles: articles.length > 0 });
    }
  };

  useEffect(() => {
    loadRelatedArticles();
    chrome.runtime.sendMessage({ action: 'checkBias' });

    const handleMessage = (message: any) => {
      if (message.action === 'biasResult') {
        if (typeof message.bias === 'string') {
          updateState({ biasData: message.bias, existArticles: false });
        } else {
          updateState({
            biasData: message.bias,
            publication: message.publication,
            logo: message.faviconUrl,
            existArticles: true,
          });
        }
      }

      if (message.action === 'relatedArticles') {
        const articlesArray = message.articles?.data || [];
        updateState({ relatedArticles: articlesArray, existArticles: articlesArray.length > 0 });
        saveRelatedArticles(articlesArray);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  useEffect(() => {
    if (state.activeTab === 'articles') {
      chrome.runtime.sendMessage({ action: 'fetchRelatedArticles' });
    }
  }, [state.activeTab]);

  const newscatcher_string = "</newscatcher>";

  return (
    <>
      <div className="container">
        <h1 className="title">NewsLens</h1>

        {/* Tab Navigation */}
        <div className="tabs">
          <span
            className={`tab ${state.activeTab === 'bias' ? 'active' : ''}`}
            onClick={() => updateState({ activeTab: 'bias' })}
          >
            Bias Details
          </span>
          <span
            className={`tab ${state.activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => updateState({ activeTab: 'articles' })}
          >
            Related Articles
          </span>
        </div>

        {state.activeTab === 'articles' ? (
          <>Powered by <a href="https://www.newscatcherapi.com/" target="_blank" rel="noopener noreferrer">{newscatcher_string}</a></>
        ) : (
          <>Powered by <a href={(state.biasData as BiasData).mbfc_url} target="_blank" rel="noopener noreferrer">Media Bias/ Fact Check</a></>
        )}

        <div className="card">
          {state.activeTab === 'bias' ? (
            typeof state.biasData === 'string' ? (
              <p className="error-message">{state.biasData}</p>
            ) : (
              <div className="content">
                <div className="publication-header">
                  {state.logo && (
                    <img src={state.logo} alt="Favicon" className="favicon" />
                  )}
                </div>
                <ul className="bias-details">
                  <li>
                    <strong>{state.publication}'s Bias: </strong>
                    <span style={{ background: getBiasColor((state.biasData as BiasData).bias) }} className="bias-color">
                      {(state.biasData as BiasData).bias}
                    </span>
                  </li>
                  <li><strong>Factual Reporting:</strong> {(state.biasData as BiasData).factual_reporting}</li>
                  <li><strong>Credibility:</strong> {(state.biasData as BiasData).credibility}</li>
                </ul>
              </div>
            )
          ) : (
            <div className="related-articles content">
              {state.existArticles ? (
                <ul className="related-articles-list">
                  {state.relatedArticles.map((article, index) => (
                    <li key={index}>
                      <p style={{marginRight: '30%', marginLeft: '30%'}}>{domainToName(article.clean_url) || 'N/A'}</p>
                      {article.mbfc && (
                        <>
                          <p style={{ background: getBiasColor(article.mbfc.bias), marginRight: '40%', marginLeft: '40%' }} className="bias-color">{article.mbfc.bias || 'No data available'}</p>
                        </>
                      )}
                      <strong>{article.title || 'N/A'} <img src={article.media} alt="" /></strong>
                      <p>{article.excerpt || 'No excerpt available'}</p>
                      <a href={article.link} target="_blank" rel="noopener noreferrer" className="article-link">
                        Read Article
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <h3>No related articles found</h3>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
