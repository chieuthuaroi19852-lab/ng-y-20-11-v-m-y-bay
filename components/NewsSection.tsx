
import React, { useState, useEffect } from 'react';
import { type NewsArticle } from '../types';
import { PROXY_URL, GEMINI_API_URL } from '../services/apiConfig';
import { MOCK_NEWS } from '../data/news';

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className="block bg-[var(--card-bg-color)] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group flex flex-col h-full">
        {article.imageUrl && (
            <div className="relative w-full h-40 bg-gray-200 dark:bg-gray-700">
                <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { 
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                            parent.style.display = 'none';
                        }
                    }}
                />
            </div>
        )}
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex-grow">
                <span className="text-xs font-semibold text-white bg-red-600 px-2 py-1 rounded">{article.source}</span>
                <h3 className="font-bold text-md leading-snug group-hover:text-red-700 transition-colors mt-2">{article.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{article.summary}</p>
            </div>
            <div className="mt-3 text-right text-xs text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                Đọc thêm →
            </div>
        </div>
    </a>
);

const NewsCardSkeleton: React.FC = () => (
    <div className="bg-[var(--card-bg-color)] rounded-lg shadow-md animate-pulse overflow-hidden">
        <div className="w-full h-40 bg-gray-200 dark:bg-gray-700"></div>
        <div className="p-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            <div className="space-y-2 mt-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
        </div>
    </div>
);

const NewsSection: React.FC = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${PROXY_URL}${GEMINI_API_URL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: 'news' })
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                if (!Array.isArray(data)) {
                    throw new Error("AI has returned invalid data.");
                }
                
                setNews(data);

            } catch (err) {
                console.warn("AI news fetch failed, falling back to mock data:", err);
                // Fallback to mock news instead of showing error to keep the UI clean
                setNews(MOCK_NEWS);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (isLoading) {
        return (
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6 border-l-4 border-red-600 pl-3">Tin tức Hàng không</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <NewsCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (news.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 border-l-4 border-red-600 pl-3">Tin tức Hàng không</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {news.map((article, index) => (
                    <NewsCard key={index} article={article} />
                ))}
            </div>
        </div>
    );
};

export default NewsSection;
