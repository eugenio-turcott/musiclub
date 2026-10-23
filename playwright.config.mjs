import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/browser',
  testMatch:'**/*.spec.mjs',
  timeout:60000,
  expect:{timeout:15000},
  workers:1,
  retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {}),baseURL:'http://127.0.0.1:3101',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 7']}}],
  webServer:{command:'node tests/browser/start-app.mjs',url:'http://127.0.0.1:3101',timeout:180000,reuseExistingServer:false},
});
