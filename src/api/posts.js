import { api } from './http';

// 게시글 생성
export const createPost = async (gymId, postData) => {
  const response = await api.post(`/gyms/${gymId}/posts`, postData);
  return response.data;
};

// GENERAL 게시글 목록 조회
export const getGeneralPosts = async (gymId, page = 0, size = 20) => {
  const response = await api.get(`/gyms/${gymId}/general-posts`, {
    params: { page, size }
  });
  return response.data;
};

// NOTICE 게시글 목록 조회
export const getNoticePosts = async (gymId) => {
  const response = await api.get(`/gyms/${gymId}/notice-posts`);
  return response.data;
};

// 게시글 단건 조회
export const getPostById = async (gymId, postId) => {
  const response = await api.get(`/gyms/${gymId}/posts/${postId}`);
  return response.data;
};

// 게시글 수정
export const updatePost = async (gymId, postId, postData) => {
  const response = await api.patch(`/gyms/${gymId}/posts/${postId}`, postData);
  return response.data;
};

// 댓글 목록 조회
export const getComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

// 댓글/대댓글 등록
export const createComment = async (postId, { content, parentId }) => {
  const response = await api.post(`/posts/${postId}/comments`, { content, parentId });
  return response.data;
}; 