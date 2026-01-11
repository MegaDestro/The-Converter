import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-black text-ocean font-inter">
                    <div className="text-center p-8 border border-ocean/20 rounded-3xl glow-effect">
                        <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
                        <p className="text-neutral-400 mb-4">We encountered an unexpected error.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-ocean text-black rounded-lg font-medium hover:bg-white smooth-transition"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
