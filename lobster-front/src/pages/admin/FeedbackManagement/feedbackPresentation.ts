export function feedbackStatusText(status: string) {
  return ({ open: '待处理', reviewed: '已查看', closed: '已关闭' } as Record<string, string>)[status] || status;
}

export function feedbackTypeText(type: string) {
  return ({ general: '反馈', nps: 'NPS' } as Record<string, string>)[type] || type;
}

export function npsSegment(score: number | null | undefined) {
  if (score == null) return '-';
  if (score >= 9) return '推荐者';
  if (score >= 7) return '中立者';
  return '批评者';
}
