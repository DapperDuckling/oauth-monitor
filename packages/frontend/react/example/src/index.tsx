import React from 'react'
import ReactDOM from 'react-dom/client'
import {OauthMonitorProvider} from "@dapperduckling/oauth-monitor-react";
import { Content } from './content.js';
import { DapperDucklingLoginChild } from './DapperDucklingLoginChild.js';

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
