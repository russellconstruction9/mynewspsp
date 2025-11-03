import React, { useState, useEffect } from 'react';
import { Report, Theme, IncidentCategory, SubscriptionTier } from '../types';
import { getThemeAnalysis } from '../services/geminiService';
import { ChartBarIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { INCIDENT_CATEGORIES } from '../constants';

interface PatternAnalysisProps {
    reports: Report[];
    subscriptionTier: SubscriptionTier;
    hasSufficientTokens: () => boolean;
    handleTokensUsed: (count: number) => void;
    promptUpgrade: (featureName: string) => void;
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ reports, hasSufficientTokens, handleTokensUsed, promptUpgrade }) => {
    const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | 'all'>('all');
    const [themes, setThemes] = useState<Theme[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const incidentCategories = INCIDENT_CATEGORIES;

    useEffect(() => {
        const analyzeThemes = async () => {
            if (selectedCategory === 'all') {
                setThemes([]);
                return;
            }

            if (!hasSufficientTokens()) {
                promptUpgrade("Pattern Analysis");
                setSelectedCategory('all');
                return;
            }

            const filteredReports = reports.filter(r => r.category === selectedCategory);
            if (filteredReports.length < 2) {
                setThemes([]);
                setError("You need at least two reports in a category to analyze patterns.");
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const result = await getThemeAnalysis(filteredReports, selectedCategory);
                handleTokensUsed(result.tokensUsed);
                setThemes(result.themes);
            } catch (err) {
                setError("An error occurred while analyzing themes.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        analyzeThemes();
    }, [selectedCategory, reports, hasSufficientTokens, handleTokensUsed, promptUpgrade]);
    
    const categoryCounts = incidentCategories.reduce((acc, category) => {
        acc[category] = reports.filter(r => r.category === category).length;
        return acc;
    }, {} as Record<IncidentCategory, number>);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pattern Analysis</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {incidentCategories.map(category => (
                     <div key={category} className={`p-4 rounded-lg border bg-white ${selectedCategory === category ? 'border-blue-300 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                        <h3 className="font-semibold text-gray-800">{category}</h3>
                        <p className="text-3xl font-bold text-blue-950">{categoryCounts[category]}</p>
                        <p className="text-xs text-gray-500">Reports</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Sub-Theme Analysis</h2>
                <div className="mb-4">
                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">Select a category to analyze:</label>
                    <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as IncidentCategory | 'all')}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="all">-- Select a Category --</option>
                        {incidentCategories.map(cat => (
                            <option key={cat} value={cat} disabled={categoryCounts[cat] < 2}>
                                {cat} ({categoryCounts[cat]} reports)
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="h-96 w-full mt-6">
                   {isLoading ? (
                       <div className="flex items-center justify-center h-full">
                           <p className="text-gray-600">Analyzing patterns...</p>
                       </div>
                   ) : error ? (
                        <div className="flex items-center justify-center h-full text-center text-red-600 bg-red-50 p-4 rounded-md">
                           <p>{error}</p>
                       </div>
                   ) : themes.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={themes} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Report Count" fill="#172554" />
                            </BarChart>
                        </ResponsiveContainer>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-50 p-4 rounded-md">
                            <ChartBarIcon className="w-12 h-12 text-gray-400 mb-3"/>
                           <p className="font-semibold">No data to display.</p>
                           <p className="text-sm">Please select a category with at least 2 reports to see an analysis.</p>
                       </div>
                   )}
                </div>
            </div>
        </div>
    );
};

export default PatternAnalysis;
