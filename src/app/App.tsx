import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFrontContext } from "lib/thanos/front";
import { AppEnvironment, useAppEnvContext } from "app/env";
import PageLayout from "app/layout/PageLayout";
import ErrorBoundary from "app/ErrorBoundary";
import Page from "app/Page";

type AppProps = {
  env: AppEnvironment;
};

const App: React.FC<AppProps> = ({ env }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<AppSuspenseFallback />}>
      <AppProvider env={env}>
        <PageLayout>
          <Page />
        </PageLayout>
      </AppProvider>
    </React.Suspense>
  </ErrorBoundary>
);

export default App;

const AppProvider: React.FC<AppProps> = ({ children, env }) => (
  <Woozie.Provider>
    <useThanosFrontContext.Provider>
      <useAppEnvContext.Provider {...env}>{children}</useAppEnvContext.Provider>
    </useThanosFrontContext.Provider>
  </Woozie.Provider>
);

const AppSuspenseFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center">
    <div className="p-2 text-lg font-semibold text-gray-600">Loading...</div>
  </div>
);
