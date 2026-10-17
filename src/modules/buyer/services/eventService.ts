import api from '../../../infrastructure/api/client';

const SESSION_ID_KEY = 'vietcraft_session_id';

function newSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

export function getSessionId(): string {
    try {
        const existing = localStorage.getItem(SESSION_ID_KEY);
        if (existing) return existing;
        const created = newSessionId();
        localStorage.setItem(SESSION_ID_KEY, created);
        return created;
    } catch {
        return newSessionId();
    }
}

// Ghi lượt xem không được làm hỏng trang sản phẩm, nên lỗi chỉ log rồi bỏ qua.
export async function recordProductViewEvent(productId: string, sessionId: string): Promise<void> {
    try {
        await api.post('/analytics/events/view', { product_id: productId, session_id: sessionId }, { timeout: 5000 });
    } catch (error) {
        console.warn('Failed to record product view event:', error);
    }
}
