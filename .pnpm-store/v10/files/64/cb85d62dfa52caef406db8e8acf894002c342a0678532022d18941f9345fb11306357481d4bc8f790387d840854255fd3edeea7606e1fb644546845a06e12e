import React from 'react';
import FallbackComponent from './FallbackComponent';
class ErrorBoundary extends React.Component {
    state = { error: null };
    static defaultProps = {
        FallbackComponent: FallbackComponent,
    };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        if (typeof this.props.onError === 'function') {
            this.props.onError(error, info.componentStack);
        }
    }
    resetError = () => {
        this.setState({ error: null });
    };
    render() {
        const { FallbackComponent } = this.props;
        return this.state.error ? (<FallbackComponent error={this.state.error} resetError={this.resetError}/>) : (this.props.children);
    }
}
export default ErrorBoundary;
//# sourceMappingURL=index.js.map