import React, { useState } from 'react';

interface NetlifyFormProps {
    onFormSubmit: () => void;
}

const NetlifyForm: React.FC<NetlifyFormProps> = ({ onFormSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);

        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData as any).toString(),
        })
        .then(() => {
            onFormSubmit();
        })
        .catch((error) => {
            console.error(error);
            setError('There was an error submitting the form. Please try again.');
            setIsSubmitting(false);
        });
    };

    return (
        <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-lg shadow-sm max-w-lg mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">One Last Step</h1>
            <p className="mt-2 text-base text-gray-700">Before you begin, please share a little about yourself. This helps us build a better tool for parents like you.</p>
            
            <form name="onboarding" method="POST" data-netlify="true" onSubmit={handleSubmit} className="mt-8 space-y-6">
                <input type="hidden" name="form-name" value="onboarding" />
                <div style={{ display: 'none' }}>
                    <label>Don’t fill this out if you’re human: <input name="bot-field" /></label>
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        placeholder="e.g., Jane Doe"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-gray-700">What's your primary goal?</label>
                    <select
                        name="goal"
                        id="goal"
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="">-- Please select an option --</option>
                        <option value="high-conflict">Navigating a high-conflict co-parenting situation</option>
                        <option value="alienation">Concerned about parental alienation</option>
                        <option value="court-prep">Preparing for court or mediation</option>
                        <option value="legal-pro">I am a legal professional</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-blue-950 rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                        {isSubmitting ? 'Submitting...' : 'Continue to Profile Setup'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NetlifyForm;