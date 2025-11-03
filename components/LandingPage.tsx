import React from 'react';
import { BookOpenIcon, SparklesIcon, DocumentTextIcon, ChartBarIcon, ScaleIcon, CheckIcon, ShieldCheckIcon } from './icons';

interface LandingPageProps {
    onGetStarted: () => void;
}

const tiers = [
    {
        name: 'Free',
        price: '$0',
        description: 'Core tools for basic incident logging and organization.',
        features: [
            'AI-Guided Incident Logging',
            'Timeline & Calendar Views',
            'Dashboard Overview',
            '50,000 AI tokens per month',
        ],
        buttonText: 'Get Started for Free',
        isPopular: false,
    },
    {
        name: 'Plus',
        price: '$19',
        description: 'For parents needing advanced analysis and document management.',
        features: [
            'All Free features, plus:',
            'Pattern & Sub-theme Analysis',
            'Full Document Library',
            'AI Legal Assistant (Q&A Only)',
            '500,000 AI tokens per month',
        ],
        buttonText: 'Choose Plus Plan',
        isPopular: true,
    },
    {
        name: 'Pro',
        price: '$39',
        description: 'The ultimate toolkit for high-conflict situations and court preparation.',
        features: [
            'All Plus features, plus:',
            'Deep Forensic Incident Analysis',
            'Evidence Package Builder',
            'AI Voice Agent',
            'Premium Document Generation (add-on, $150-$500 per package)',
            '5,000,000 AI tokens per month',
        ],
        buttonText: 'Choose Pro Plan',
        isPopular: false,
    },
];


const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="bg-white text-gray-800">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-10">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div>
                            <span className="block text-xl font-semibold text-gray-900 tracking-tight">CustodyX<span className="text-blue-600 font-medium">.ai</span></span>
                            <span className="block text-xs text-gray-600 -mt-0.5">An R² Technologies Project.</span>
                        </div>
                        <button 
                            onClick={onGetStarted}
                            className="px-6 py-2 text-sm font-semibold text-white bg-blue-950 rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                            Get Started
                        </button>
                    </div>
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-36 bg-gray-50 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                            When a Co-Parent Uses Your Child as a Weapon, Fight Back with Facts.
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600">
                           Parental alienation is devastating. Stop the manipulation and protect your rights by creating an indisputable, court-ready record of every incident. CustodyX.AI is your tool to turn chaos into clarity.
                        </p>
                        <div className="mt-10">
                            <button 
                                onClick={onGetStarted}
                                className="px-10 py-4 text-lg font-semibold text-white bg-blue-950 rounded-lg shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                            >
                                Start Documenting the Truth
                            </button>
                            <p className="mt-4 text-sm text-gray-500">Your privacy is paramount. All data is stored locally on your device.</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 sm:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-base font-semibold text-blue-700 tracking-wide uppercase">Your Arsenal</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Tools to Expose the Truth & Protect Your Child
                            </p>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                                Every feature is designed to help you document alienating behavior and build an undeniable case.
                            </p>
                        </div>
                        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="text-center">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-800 mx-auto">
                                    <SparklesIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900">AI-Guided Documentation</h3>
                                <p className="mt-2 text-base text-gray-600">Capture every detail of alienating behavior. Our AI asks neutral, clarifying questions to create a factual record that's hard to dispute.</p>
                            </div>
                             {/* Feature 2 */}
                             <div className="text-center">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-800 mx-auto">
                                    <DocumentTextIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900">Court-Ready Reports</h3>
                                <p className="mt-2 text-base text-gray-600">Transform chaotic events into professional, unbiased summaries that clearly demonstrate manipulation to judges and legal professionals.</p>
                            </div>
                             {/* Feature 3 */}
                             <div className="text-center">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-800 mx-auto">
                                    <ChartBarIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900">Pattern & Behavior Analysis</h3>
                                <p className="mt-2 text-base text-gray-600">Prove a consistent pattern of alienation. Our tools connect isolated incidents to reveal the bigger picture of manipulative tactics over time.</p>
                            </div>
                             {/* Feature 4 */}
                             <div className="text-center">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-800 mx-auto">
                                    <ScaleIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900">AI Legal Assistant</h3>
                                <p className="mt-2 text-base text-gray-600">Understand the legal context of the behaviors you're documenting and get help drafting formal communications to address them effectively.</p>
                            </div>
                             {/* Feature 5 */}
                             <div className="text-center">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-800 mx-auto">
                                    <CheckIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900">Evidence Package Builder</h3>
                                <p className="mt-2 text-base text-gray-600">Compile a powerful case. Combine incident reports and documents into a single, compelling narrative for your attorney or court.</p>
                            </div>
                             {/* Feature 6 */}
                             <div className="text-center">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-800 mx-auto">
                                    <ShieldCheckIcon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900">Private and Secure</h3>
                                <p className="mt-2 text-base text-gray-600">Your fight is personal. All your data is stored securely on your local device, not in the cloud, ensuring complete privacy.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                 {/* Pricing Section */}
                <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-base font-semibold text-blue-700 tracking-wide uppercase">Pricing</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Choose the Plan That's Right for You
                            </p>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                                Start for free and upgrade or downgrade anytime. No long-term contracts.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {tiers.map((tier) => (
                                <div key={tier.name} className={`relative flex flex-col p-8 rounded-2xl border ${tier.isPopular ? 'bg-white border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-200'}`}>
                                    {tier.isPopular && (
                                        <div className="absolute top-0 -translate-y-1/2 px-3 py-1 text-sm font-semibold tracking-wide text-white bg-blue-600 rounded-full shadow-md">
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                                    <p className="mt-2 text-sm text-gray-600 h-10">{tier.description}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                                        {tier.price !== '$0' && <span className="text-base font-medium text-gray-500">/mo</span>}
                                    </div>
                                    <ul role="list" className="mt-6 space-y-3 flex-1">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start">
                                                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-2 mt-px" />
                                                <span className="text-sm text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-8">
                                        <button
                                            onClick={onGetStarted}
                                            className={`w-full px-6 py-3 text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${tier.isPopular ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-950 text-white hover:bg-blue-800 focus:ring-blue-950'}`}
                                        >
                                            {tier.buttonText}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-white">
                    <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            <span className="block">Don't let alienation define your child's future.</span>
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-gray-600">
                            The court needs to see the pattern. Start building your evidence-based case today to protect your parental rights and your child's well-being.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-950 hover:bg-blue-800 sm:w-auto"
                        >
                            Take Action Now
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-base text-gray-500">&copy; {new Date().getFullYear()} CustodyX.AI by R² Technologies. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;