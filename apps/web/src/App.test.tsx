import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  try { window.localStorage.removeItem('outr-theme'); } catch {}
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themeSwitching;
});

describe('Outr application shell', () => {
  it('renders the command center and navigates to campaign studio', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Good evening/i })).toBeTruthy();
    expect(screen.getByText('Activation readiness')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Campaigns' }));
    expect(await screen.findByRole('heading', { name: 'Campaign studio' })).toBeTruthy();
    expect(screen.getByText('Default approval-bound sequence')).toBeTruthy();
  });

  it('creates a draft through the API instead of displaying a success-only toast', async () => {
    const fetch = vi.fn(async (input:RequestInfo | URL, init?:RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/campaigns') && init?.method === 'POST') {
        return { ok:true, status:201, json:async () => ({ id:'campaign_created', name:'Integration pilot', status:'DRAFT', targetDescription:'Verified operations leaders', leadIds:['lead_001'], dailyCap:25, updatedAt:'2026-08-24T12:00:00.000Z' }) };
      }
      if (url.endsWith('/v1/leads?limit=100&sortBy=fitScore&order=desc')) return { ok:true, status:200, json:async () => ({ data:[] }) };
      if (url.endsWith('/v1/agents') || url.endsWith('/v1/campaigns')) return { ok:true, status:200, json:async () => ({ data:[] }) };
      return { ok:true, status:200, json:async () => ({ sendingEnabled:false, ready:false, gates:[] }) };
    });
    vi.stubGlobal('fetch', fetch);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Campaigns' }));
    fireEvent.click((await screen.findAllByRole('button', { name: /New campaign/i })).at(-1)!);
    fireEvent.change(screen.getByRole('textbox', { name: /Campaign name/i }), { target:{ value:'Integration pilot' } });
    fireEvent.click(screen.getByRole('button', { name: /Create draft/i }));

    expect(await screen.findByText('Integration pilot')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8787/v1/campaigns', expect.objectContaining({ method:'POST' }));
  });

  it('opens the live workspace preview', async () => {
    render(<App />);
    
    fireEvent.click(screen.getByRole('button', { name: /Live preview/i }));
    expect(await screen.findByRole('dialog', { name: /Live preview/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Live Preview/i })).toBeTruthy();
  });
});
