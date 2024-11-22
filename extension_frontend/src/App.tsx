import { useState, useEffect } from 'react';
import './App.css';

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

const biasColors: Record<string, string> = {
  'least biased': '#1f7a1f',
  left: '#1f4f7a',
  'left-center': '#2c6a8e',
  right: '#7a1f1f',
  'right-center': '#8e2c2c',
  'pro-science': '#7a6a1f',
  questionable: '#4d4d4d',
  'conspiracy-pseudoscience': '#5a5a5a',
  pseudoscience: '#5a5a5a',
  satire: '#6a1f7a',
};

const getBiasColor = (bias: string): string => biasColors[bias.toLowerCase()] || '#ffffff';

const factualReportingColors: Record<string, string> = {
  'very high': '#296d38',
  high: '#3a7a5e',
  mixed: '#7a6d29',
  low: '#7a4b29',
  'very low': '#7a2929',
  'mostly factual': '#296d7a',
  'n/a': '#4d4d4d',
};

const getFactualReportingColor = (factualReporting: string): string =>
  factualReportingColors[factualReporting.toLowerCase()] || '#ffffff';

const credibilityColors: Record<string, string> = {
  high: '#296d38',
  medium: '#7a6d29',
  low: '#7a2929',
  'n/a': '#4d4d4d',
};

const getCredibilityColor = (credibility: string): string =>
  credibilityColors[credibility.toLowerCase()] || '#ffffff';

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
  'cnbc.com': 'CNBC',
};

const domainToName = (domain: string): string => domainMappings[domain] || domain;

const domainToLogo = (domain: string): string => 'https://' + domain + '/favicon.ico';

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
    loading: false,
  });

  const updateState = (updates: Partial<typeof state>) =>
    setState((prev) => ({ ...prev, ...updates }));

  const saveRelatedArticlesToStorage = async (url: string, articles: RelatedArticle[]) => {
    const key = `relatedArticles_${url}`;
    await chromeStorage.set(key, articles);
  };


  // const loadRelatedArticlesFromStorage = async (tabUrl: string) => {
  //   const key = `relatedArticles_${tabUrl}`;
  //   const articles = await chromeStorage.get(key);
  //   if (articles) {
  //     updateState({ relatedArticles: articles, existArticles: articles.length > 0 });
  //   }
  // };

  useEffect(() => {
    const initializeRelatedArticles = async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.url) {
          const tabUrl = activeTab.url; // Use full URL as key
          const articles = await chromeStorage.get(`relatedArticles_${tabUrl}`);
          if (articles) {
            updateState({ relatedArticles: articles, existArticles: articles.length > 0 });
          } else {
            updateState({ relatedArticles: [], existArticles: false }); // Reset if no articles found
          }
        }
      });
    };

    initializeRelatedArticles();
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
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const activeTab = tabs[0];
          if (activeTab?.url) {
            const tabUrl = activeTab.url; // Use full URL
            await saveRelatedArticlesToStorage(tabUrl, articlesArray);
            updateState({
              relatedArticles: articlesArray,
              existArticles: articlesArray.length > 0,
              loading: false,
            });
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  useEffect(() => {
    if (state.activeTab === 'articles') {
      updateState({ loading: true });

      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const activeTab = tabs[0];

        if (activeTab?.url) {
          const tabUrl = activeTab.url; // Use full URL as key
          const articles = await chromeStorage.get(`relatedArticles_${tabUrl}`);
          if (articles?.length > 0) {
            // Load cached articles if they exist
            updateState({ relatedArticles: articles, existArticles: true, loading: false });
          } else {
            // Fetch related articles if no cached articles are found
            chrome.runtime.sendMessage({ action: 'fetchRelatedArticles' });
          }
        }
      });
    }
  }, [state.activeTab]);



  const newscatcher_string = '</newscatcher>';

  return (
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
              <h2>{domainToName((state.biasData as BiasData).domain)}</h2>
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
                    {((state.biasData as BiasData).factual_reporting.includes('Factual')
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
                    {(state.biasData as BiasData).credibility.includes('N/A')
                      ? 'N/A'
                      : (state.biasData as BiasData).credibility + ' Credibility'}
                  </span>
                </li>
              </ul>
            </div>
          )
        ) : state.loading ? (
          <h3 className="loading-message">Looking for articles on the same topic...</h3>
        ) : (
          <div className="related-articles content">
            {state.existArticles ? (
              <ul className="related-articles-list">
                {state.relatedArticles.map((article, index) => (
                  <li key={index} className="related-article-item">
                    <div className="related-article-header">
                      {domainToLogo(article.clean_url) ? (
                        <img
                          src={domainToLogo(article.clean_url)}
                          alt={`${domainToName(article.clean_url)} Logo`}
                          style={{
                            width: '32px',
                            height: '32px',
                          }}
                          className="domain-name-logo"
                        />
                      ) : null}
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
                              background: getFactualReportingColor(
                                article.mbfc.factual_reporting
                              ),
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ width: '47.50%', marginRight: '5%' }}>
                        {article.title || 'N/A'}
                      </strong>
                      <img src={article.media} alt="" style={{ width: '47.50%' }} />
                    </div>
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
              <h3 className="no-articles-message">No related articles found</h3>
            )}
          </div>
        )}
      </div>
      <br />
      {state.activeTab === 'articles' ? (
        <>Powered by <a href="https://www.newscatcherapi.com/" target="_blank" rel="noopener noreferrer">{newscatcher_string}</a></>
      ) : (
        <>Powered by <a href={(state.biasData as BiasData).mbfc_url} target="_blank" rel="noopener noreferrer">Media Bias/ Fact Check</a></>
      )}
    </div>
  );
}

export default App;
