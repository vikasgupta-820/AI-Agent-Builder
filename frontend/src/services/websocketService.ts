import type { WSMessage } from '../types/execution';
import { useSettingsStore } from '../stores/useSettingsStore';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private onMessage: ((msg: WSMessage) => void) | null = null;
  private onClose: (() => void) | null = null;
  private onError: ((err: string) => void) | null = null;
  private intentionalClose = false;

  connect(
    workflowId: string,
    input: string,
    apiKey: string,
    conversationId?: string,
    handlers?: {
      onMessage?: (msg: WSMessage) => void;
      onClose?: () => void;
      onError?: (err: string) => void;
    }
  ) {
    this.disconnect();

    this.onMessage = handlers?.onMessage ?? null;
    this.onClose = handlers?.onClose ?? null;
    this.onError = handlers?.onError ?? null;
    this.intentionalClose = false;

    const backendUrl = useSettingsStore.getState().backendUrl;
    let url: string;

    if (backendUrl && backendUrl !== 'http://localhost:8000') {
      // Use configured backend URL
      const wsProtocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = new URL(backendUrl).host;
      url = `${wsProtocol}//${host}/api/v1/ws/execute/${workflowId}`;
    } else {
      // Fall back to same-origin (dev proxy)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      url = `${protocol}//${host}/api/v1/ws/execute/${workflowId}`;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          type: 'start',
          input,
          gemini_api_key: apiKey,
          conversation_id: conversationId,
        })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;
        this.onMessage?.(msg);
      } catch {
        console.error('Failed to parse WebSocket message:', event.data);
      }
    };

    this.ws.onclose = () => {
      if (!this.intentionalClose) {
        this.onClose?.();
      }
    };

    this.ws.onerror = () => {
      if (!this.intentionalClose) {
        this.onError?.('WebSocket connection failed');
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.intentionalClose = true;
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
