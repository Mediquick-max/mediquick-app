const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SSEHandler = (data: any) => void;

class SSEManager {
  private es: EventSource | null = null;
  private handlers: Map<string, SSEHandler[]> = new Map();
  private token: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(token: string) {
    if (this.es) this.disconnect();
    this.token = token;
    const url = `${BASE}/api/sse/stream?token=${encodeURIComponent(token)}`;
    this.es = new EventSource(url);

    this.es.addEventListener("connected", () => {
      console.log("[SSE] Connected");
    });

    this.es.onerror = () => {
      this.disconnect();
      this.reconnectTimer = setTimeout(() => {
        if (this.token) this.connect(this.token);
      }, 5000);
    };

    this.handlers.forEach((fns, event) => {
      fns.forEach(fn => this.es?.addEventListener(event, (e: MessageEvent) => {
        try { fn(JSON.parse(e.data)); } catch {}
      }));
    });
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.es?.close();
    this.es = null;
  }

  on(event: string, handler: SSEHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
    if (this.es) {
      this.es.addEventListener(event, (e: MessageEvent) => {
        try { handler(JSON.parse(e.data)); } catch {}
      });
    }
  }

  off(event: string, handler: SSEHandler) {
    const fns = this.handlers.get(event) ?? [];
    this.handlers.set(event, fns.filter(f => f !== handler));
  }
}

export const sseManager = new SSEManager();
