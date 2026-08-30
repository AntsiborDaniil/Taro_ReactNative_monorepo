import React, { type ComponentType, type PropsWithChildren } from 'react';
import { type Props as FallbackComponentProps } from './FallbackComponent';
export type Props = PropsWithChildren<{
    FallbackComponent: ComponentType<FallbackComponentProps>;
    onError?: (error: Error, stackTrace: string) => void;
}>;
type State = {
    error: Error | null;
};
declare class ErrorBoundary extends React.Component<Props, State> {
    state: State;
    static defaultProps: {
        FallbackComponent: ComponentType<FallbackComponentProps>;
    };
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, info: {
        componentStack: string;
    }): void;
    resetError: () => void;
    render(): string | number | bigint | boolean | React.JSX.Element | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined;
}
export default ErrorBoundary;
//# sourceMappingURL=index.d.ts.map