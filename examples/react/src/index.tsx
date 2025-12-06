import React from 'react'
import ReactDOM from 'react-dom/client'
import {OauthMonitorProvider} from "@dapperduckling/oauth-monitor-react";
import { Content } from './content';
import { DapperDucklingLoginChild } from './DapperDucklingLoginChild';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
  <OauthMonitorProvider config={{
      client: {
          apiServerOrigin: "http://localhost:3001",
          fastInitialAuthCheck: true,
          eagerRefreshTime: 0.5
      },
      react: {
          loginModalChildren: <DapperDucklingLoginChild />,
      }
    }}>
      <Content />
  </OauthMonitorProvider>
  </React.StrictMode>,
)
