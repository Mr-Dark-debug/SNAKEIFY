import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-900 text-white p-8 font-mono overflow-auto">
                    <h1 className="text-4xl font-bold mb-4">Something went wrong.</h1>
                    <h2 className="text-2xl mb-2">Error:</h2>
                    <pre className="bg-black/50 p-4 rounded mb-4 whitespace-pre-wrap">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <h2 className="text-2xl mb-2">Component Stack:</h2>
                    <pre className="bg-black/50 p-4 rounded whitespace-pre-wrap text-sm">
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
