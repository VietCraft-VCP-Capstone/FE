import api from '../../../infrastructure/api/interceptors';

export interface SubscribeResult {
  subscribed: boolean;
  alreadySubscribed: boolean;
}

export const newsletterService = {
  subscribe: async (email: string, source = 'landing_footer'): Promise<SubscribeResult> => {
    const res = await api.post('/newsletter/subscribe', { email, source });
    return res.data;
  },
};
