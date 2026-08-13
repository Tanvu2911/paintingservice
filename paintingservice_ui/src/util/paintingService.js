import AxiosConfig from './AxiosConfig';

export const paintingService = {
  getJobs: () => AxiosConfig.get('/painting/jobs'),
  createJob: (payload) => AxiosConfig.post('/painting/jobs', payload),
  updateJob: (id, payload) => AxiosConfig.put(`/painting/jobs/${id}`, payload),
  getQuote: (jobId) => AxiosConfig.get(`/painting/quotes/${jobId}`),
  createQuote: (payload) => AxiosConfig.post('/painting/quotes', payload),
  getProgress: (jobId) => AxiosConfig.get(`/painting/progress/${jobId}`),
  createProgress: (payload) => AxiosConfig.post('/painting/progress', payload),
  getInspection: (jobId) => AxiosConfig.get(`/painting/inspection/${jobId}`),
  createInspection: (payload) => AxiosConfig.post('/painting/inspection', payload),
};
