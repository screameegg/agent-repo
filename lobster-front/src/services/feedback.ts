import request from './request';
import { ApiResponse } from '../types';

export type FeedbackType = 'general' | 'nps';

export interface FeedbackSubmitPayload {
  feedbackType: FeedbackType;
  score?: number;
  category?: string;
  content?: string;
  pageUrl?: string;
}

export const submitFeedbackApi = (data: FeedbackSubmitPayload): Promise<ApiResponse<{ id: string }>> => {
  return request.post('/feedback', data);
};

export const getNpsStatusApi = (): Promise<ApiResponse<{ submitted: boolean }>> => {
  return request.get('/feedback/nps-status');
};
