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

// Utility for factual reporting colors
const factualReportingColors: Record<string, string> = {
  'very high': '#2e7d32', // Dark Green
  high: '#558b2f',        // Olive Green
  mixed: '#f9a825',       // Golden Yellow
  low: '#ef6c00',         // Dark Orange
  'very low': '#b71c1c',  // Dark Red
  'mostly factual': '#1565c0', // Royal Blue
  'n/a': '#424242',       // Dark Gray
};


const getFactualReportingColor = (factualReporting: string): string =>
  factualReportingColors[factualReporting.toLowerCase()] || '#ffffff';


const credibilityColors: Record<string, string> = {
  high: '#1b5e20',        // Dark Forest Green
  medium: '#f57f17',      // Amber
  low: '#b71c1c',         // Crimson Red
  'n/a': '#616161',       // Cool Gray
};

const getCredibilityColor = (credibility: string): string =>
  credibilityColors[credibility.toLowerCase()] || '#ffffff';


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

        <div className="tabs">
          <span
            className={`tab ${state.activeTab === 'bias' ? 'active' : ''}`}
            onClick={() => updateState({ activeTab: 'bias' })}
          >
            Bias Info
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
                  {state.biasData && (<h2>{domainToName((state.biasData as BiasData).domain)}</h2>)}
                <ul className="bias-details">
                  <li>
                    <span
                      style={{
                        background: getBiasColor((state.biasData as BiasData).bias),
                        padding: '5px 10px',
                        borderRadius: '5px',
                        color: '#fff',
                      }}
                    >
                      {(state.biasData as BiasData).bias}
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        background: getFactualReportingColor(
                          (state.biasData as BiasData).factual_reporting
                        ),
                        padding: '5px 10px',
                        borderRadius: '5px',
                        color: '#fff',
                      }}
                    >
                      {((state.biasData as BiasData).factual_reporting.includes("Factual")
                        ? (state.biasData as BiasData).factual_reporting
                        : `${(state.biasData as BiasData).factual_reporting} Factuality`) || 'N/A'}
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        background: getCredibilityColor((state.biasData as BiasData).credibility),
                        padding: '5px 10px',
                        borderRadius: '5px',
                        color: '#fff',
                      }}
                    >
                      {(state.biasData as BiasData).credibility.includes("N/A") ? 'N/A' : (state.biasData as BiasData).credibility + ' Credibility'}
                    </span>
                  </li>
                </ul>
              </div>
            )
          ) : (
            < div className="related-articles content">
              {state.existArticles ? (
                <ul className="related-articles-list">
                  {state.relatedArticles.map((article, index) => (
                    <li key={index} className="related-article-item">
                      <div className="related-article-header">
                        <p className="domain-name">{domainToName(article.clean_url) || 'N/A'}</p>
                        {article.mbfc && (
                          <div className="bias-and-factuality">
                            <p
                              className="bias-label"
                              style={{
                                background: getBiasColor(article.mbfc.bias),
                              }}
                            >
                              {article.mbfc.bias || 'No data available'}
                            </p>
                            <p
                              className="factuality-label"
                              style={{
                                background: getFactualReportingColor(article.mbfc.factual_reporting),
                              }}
                            >
                              {article.mbfc.factual_reporting.includes('Factual')
                                ? article.mbfc.factual_reporting
                                : `${article.mbfc.factual_reporting} Factuality`}
                            </p>
                            <p
                              className="credibility-label"
                              style={{
                                background: getCredibilityColor(article.mbfc.credibility),
                              }}
                            >
                              {article.mbfc.credibility.includes('N/A')
                                ? 'N/A'
                                : article.mbfc.credibility + ' Credibility'}
                            </p>
                          </div>
                        )}
                      </div>
                      <strong>
                        {article.title || 'N/A'} <img src={article.media} alt="" />
                      </strong>
                      <p>{article.excerpt || 'No excerpt available'}</p>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="article-link"
                      >
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