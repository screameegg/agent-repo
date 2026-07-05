export const isRenderableImageUrl = (value?: string | null) => {
  if (!value) {
    return false;
  }
  return /^(https?:)?\/\//.test(value)
    || value.startsWith('/uploads/')
    || value.startsWith('data:image/')
    || value.startsWith('blob:');
};

export const agentAvatarFallback = (name?: string) => {
  const seed = encodeURIComponent(name || 'lobster-agent');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
};

export const skillIconFallback = (name?: string) => {
  const seed = encodeURIComponent(name || 'lobster-skill');
  return `https://api.dicebear.com/7.x/icons/svg?seed=${seed}`;
};

export const profileAvatarFallback = (name?: string) => {
  const seed = encodeURIComponent(name || 'lobster');
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;
};

export const resolveAgentAvatar = (avatar?: string | null, name?: string) => {
  return isRenderableImageUrl(avatar) ? avatar as string : agentAvatarFallback(name);
};

export const resolveSkillIcon = (icon?: string | null, name?: string) => {
  return isRenderableImageUrl(icon) ? icon as string : skillIconFallback(name);
};

export const resolveProfileAvatar = (avatar?: string | null, name?: string) => {
  return isRenderableImageUrl(avatar) ? avatar as string : profileAvatarFallback(name);
};
